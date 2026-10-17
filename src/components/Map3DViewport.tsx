import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { ViewMode, LayerState, DroneTelemetry, ResourceUnit, FloodProbeData } from '../types';
import { Compass, Maximize2, RotateCcw, Map, Eye, Layers, ShieldAlert, AlertTriangle } from 'lucide-react';

interface Map3DViewportProps {
  currentMode: ViewMode;
  layers: LayerState[];
  timelineProgress: number; // 0 to 100
  selectedDrone: DroneTelemetry | null;
  onSelectDrone: (drone: DroneTelemetry) => void;
  selectedResource: ResourceUnit | null;
  onSelectResource: (res: ResourceUnit) => void;
  drones: DroneTelemetry[];
  resources: ResourceUnit[];
  rideAlongActive: boolean;
  onExitRideAlong: () => void;
  selectedIncident: string;
}

// Major Pakistani River Barrages & Dams with real GPS coordinates
export const PAKISTAN_BARRAGES = [
  { name: 'Tarbela Dam', lat: 34.088, lng: 72.698, discharge: '265,000 cusecs', status: 'High Inflow' },
  { name: 'Warsak Dam', lat: 34.168, lng: 71.358, discharge: '142,000 cusecs', status: 'Spillways Open' },
  { name: 'Nowshera Gauge', lat: 34.015, lng: 71.975, discharge: '285,000 cusecs', status: 'Super Flood Crest' },
  { name: 'Mangla Dam', lat: 33.146, lng: 73.647, discharge: '120,000 cusecs', status: 'Normal Regulated' },
  { name: 'Chashma Barrage', lat: 32.435, lng: 71.378, discharge: '310,000 cusecs', status: 'High Flood' },
  { name: 'Taunsa Barrage', lat: 30.706, lng: 70.849, discharge: '345,000 cusecs', status: 'High Flood Warning' },
  { name: 'Guddu Barrage', lat: 28.421, lng: 69.704, discharge: '510,000 cusecs', status: 'Very High Flood' },
  { name: 'Sukkur Barrage', lat: 27.697, lng: 68.854, discharge: '490,000 cusecs', status: 'Critical Surge' },
  { name: 'Kotri Barrage', lat: 25.434, lng: 68.318, discharge: '280,000 cusecs', status: 'Moderate Flood' },
];

export const Map3DViewport: React.FC<Map3DViewportProps> = ({
  currentMode,
  layers,
  timelineProgress,
  selectedDrone,
  onSelectDrone,
  selectedResource,
  onSelectResource,
  drones,
  resources,
  rideAlongActive,
  onExitRideAlong,
  selectedIncident,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const droneMarkersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const resourceMarkersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const barrageMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [basemapStyle, setBasemapStyle] = useState<'satellite' | 'dark' | 'topo'>('satellite');
  const [zoomLevel, setZoomLevel] = useState('12.5x');
  const [floodProbe, setFloodProbe] = useState<FloodProbeData | null>(null);
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Basemap style definitions (free, high-performance tiles covering entire Pakistan)
  const getMapStyle = (type: 'satellite' | 'dark' | 'topo'): maplibregl.StyleSpecification => {
    if (type === 'satellite') {
      return {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: 'Esri World Imagery, NASA, USGS',
            maxzoom: 19,
          },
          'carto-labels': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [
          { id: 'esri-satellite-layer', type: 'raster', source: 'esri-satellite' },
          { id: 'carto-labels-layer', type: 'raster', source: 'carto-labels', minzoom: 4 },
        ],
      };
    } else if (type === 'dark') {
      return {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap, © CARTO',
            maxzoom: 19,
          },
        },
        layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }],
      };
    } else {
      return {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            maxzoom: 19,
          },
        },
        layers: [{ id: 'osm-layer', type: 'raster', source: 'osm-tiles' }],
      };
    }
  };

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(basemapStyle),
      center: [71.975, 34.015], // Nowshera & Swat Confluence initial center
      zoom: 12.0,
      pitch: 52, // 3D oblique tilt perspective
      bearing: -24,
      attributionControl: false,
      maxBounds: [
        [60.0, 23.0], // Southwest boundary (Balochistan / Arabian Sea coast)
        [78.0, 37.5], // Northeast boundary (K2 / Gilgit-Baltistan)
      ],
    });

    mapRef.current = map;

    map.on('zoom', () => {
      setZoomLevel(`${map.getZoom().toFixed(1)}x`);
    });

    map.on('load', () => {
      // 1. Add Pakistani Major Rivers GeoJSON Source (Indus, Kabul, Swat, Chenab, Jhelum)
      map.addSource('pakistan-rivers', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            // Kabul & Swat River Path (KP)
            {
              type: 'Feature',
              properties: { name: 'Kabul River', danger: 'Critical' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [71.358, 34.168], // Warsak
                  [71.742, 34.150], // Charsadda
                  [71.975, 34.015], // Nowshera
                  [72.245, 33.892], // Confluence with Indus at Attock
                ],
              },
            },
            // Main Indus River Spine across all Pakistan
            {
              type: 'Feature',
              properties: { name: 'Indus River', danger: 'Super Flood Surge' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [75.635, 35.297], // Skardu (Gilgit-Baltistan)
                  [74.341, 35.920], // Gilgit
                  [72.698, 34.088], // Tarbela Dam
                  [72.245, 33.892], // Attock Gorge
                  [71.685, 32.932], // Kalabagh
                  [71.378, 32.435], // Chashma Barrage
                  [70.849, 30.706], // Taunsa Barrage
                  [70.435, 29.112], // Mithankot (Panjnad confluence)
                  [69.704, 28.421], // Guddu Barrage (Sindh)
                  [68.854, 27.697], // Sukkur Barrage
                  [68.318, 25.434], // Kotri Barrage
                  [68.185, 24.520], // Indus Delta / Arabian Sea
                ],
              },
            },
          ],
        },
      });

      // Render River Polylines
      map.addLayer({
        id: 'pakistan-rivers-layer',
        type: 'line',
        source: 'pakistan-rivers',
        paint: {
          'line-color': '#38bdf8',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 2, 12, 8],
          'line-opacity': 0.85,
        },
      });

      // 2. Add Dynamic Inundation Flood Zone GeoJSON Source
      map.addSource('flood-inundation', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            // Nowshera Basin Inundated Zone
            {
              type: 'Feature',
              properties: { zone: 'Nowshera Floodplain', depth: '3.8m' },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [71.935, 34.035],
                    [72.015, 34.040],
                    [72.030, 33.995],
                    [71.955, 33.980],
                    [71.935, 34.035],
                  ],
                ],
              },
            },
            // Charsadda Basin
            {
              type: 'Feature',
              properties: { zone: 'Charsadda Inundation', depth: '2.5m' },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [71.710, 34.170],
                    [71.780, 34.165],
                    [71.770, 34.120],
                    [71.715, 34.130],
                    [71.710, 34.170],
                  ],
                ],
              },
            },
            // Sukkur / Dadu Inundation Zone
            {
              type: 'Feature',
              properties: { zone: 'Sukkur-Dadu Spill', depth: '4.2m' },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [68.780, 27.750],
                    [68.950, 27.740],
                    [68.920, 27.620],
                    [68.750, 27.650],
                    [68.780, 27.750],
                  ],
                ],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: 'flood-inundation-fill',
        type: 'fill',
        source: 'flood-inundation',
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': 0.65,
        },
      });

      map.addLayer({
        id: 'flood-inundation-outline',
        type: 'line',
        source: 'flood-inundation',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 2.5,
          'line-dasharray': [2, 2],
        },
      });

      // 3. Add Barrage & Dam HTML Markers across Pakistan
      PAKISTAN_BARRAGES.forEach((barrage) => {
        const el = document.createElement('div');
        el.className = 'flex flex-col items-center cursor-pointer group';
        el.innerHTML = `
          <div class="px-2 py-0.5 rounded bg-black/85 border border-cyan-400/60 text-[10px] font-bold text-white shadow-xl whitespace-nowrap flex items-center space-x-1 group-hover:scale-110 transition">
            <span class="w-2 h-2 rounded-full ${barrage.status.includes('Super') ? 'bg-red-500 animate-ping' : 'bg-cyan-400'}"></span>
            <span>${barrage.name}</span>
          </div>
          <div class="text-[8px] font-mono text-cyan-300 bg-black/70 px-1 rounded mt-0.5">${barrage.discharge}</div>
        `;

        el.addEventListener('click', () => {
          map.flyTo({ center: [barrage.lng, barrage.lat], zoom: 13, pitch: 50, duration: 1500 });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([barrage.lng, barrage.lat])
          .addTo(map);

        barrageMarkersRef.current.push(marker);
      });
    });

    // Mouse Move Probe on real coordinates
    map.on('mousemove', (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const zoom = map.getZoom();

      // Estimate depth based on proximity to Nowshera river center and timeline
      const distToNowshera = Math.sqrt((lng - 71.975) ** 2 + (lat - 34.015) ** 2);
      const isWet = distToNowshera < 0.08 && timelineProgress > 15;
      const calcDepth = isWet ? Number(((timelineProgress / 100) * 5.8).toFixed(1)) : 0;

      let status: FloodProbeData['inundationStatus'] = 'Safe (Dry)';
      let evac = 'Normal Monitoring';
      let risk = 'High Ground / Inland';

      if (calcDepth > 3.5) {
        status = 'Critical Torrent';
        evac = 'MANDATORY AIR-EVAC (Red Zone)';
        risk = 'Nowshera Sector B (Rooftops submerged)';
      } else if (calcDepth > 1.0) {
        status = 'Severe Submergence';
        evac = 'RESCUE 1122 BOAT EVAC';
        risk = 'GT Road Corridor & Farmland';
      } else if (calcDepth > 0) {
        status = 'Moderate Inundation';
        evac = 'Roadway Waterlogged';
        risk = 'Embankment Perimeter';
      }

      setFloodProbe({
        groundElevationM: Math.round(275 + (lat - 33) * 120),
        waterDepthM: calcDepth,
        waterVelocityMs: calcDepth > 0 ? Number((1.2 + calcDepth * 0.4).toFixed(1)) : 0,
        inundationStatus: status,
        infrastructureRisk: risk,
        evacuationStatus: evac,
        coords: `${lat.toFixed(4)}°N ${lng.toFixed(4)}°E`,
      });
      setHoverScreenPos({ x: e.point.x, y: e.point.y });
    });

    return () => {
      map.remove();
    };
  }, [basemapStyle]);

  // Synchronize dynamic flood depth layer opacity and scale with timelineProgress
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.getLayer('flood-inundation-fill')) {
      const opacity = 0.2 + (timelineProgress / 100) * 0.65;
      map.setPaintProperty('flood-inundation-fill', 'fill-opacity', opacity);
    }
  }, [timelineProgress]);

  // Fly to incident basin when top dropdown changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (selectedIncident.includes('Nowshera')) {
      map.flyTo({ center: [71.975, 34.015], zoom: 12.2, pitch: 52, bearing: -24, duration: 1800 });
    } else if (selectedIncident.includes('Sukkur')) {
      map.flyTo({ center: [68.854, 27.697], zoom: 12.0, pitch: 48, bearing: -15, duration: 1800 });
    } else if (selectedIncident.includes('Taunsa') || selectedIncident.includes('Rajanpur')) {
      map.flyTo({ center: [70.849, 30.706], zoom: 11.5, pitch: 45, bearing: 0, duration: 1800 });
    } else if (selectedIncident.includes('Charsadda')) {
      map.flyTo({ center: [71.742, 34.150], zoom: 12.0, pitch: 50, bearing: -20, duration: 1800 });
    }
  }, [selectedIncident]);

  // Render & Animate Rescue 1122 & NDMA Drones on Real Map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    drones.forEach((drone) => {
      let marker = droneMarkersRef.current[drone.id];

      if (!marker) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer flex flex-col items-center group';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 animate-ping absolute"></div>
            <div class="w-6 h-6 rounded-full bg-[#0b1320] border-2 border-cyan-400 flex items-center justify-center shadow-lg group-hover:scale-125 transition">
              <span class="text-[9px] font-bold text-white">🚁</span>
            </div>
          </div>
          <div class="px-1.5 py-0.2 rounded bg-black/90 text-[9px] font-mono text-cyan-300 font-bold border border-cyan-500/40 mt-1 whitespace-nowrap shadow-md">
            ${drone.callsign} (${drone.altitude}ft)
          </div>
        `;

        el.addEventListener('click', () => {
          onSelectDrone(drone);
          map.flyTo({ center: [drone.position.lng, drone.position.lat], zoom: 13.5, pitch: 55, duration: 1200 });
        });

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([drone.position.lng, drone.position.lat])
          .addTo(map);

        droneMarkersRef.current[drone.id] = marker;
      } else {
        marker.setLngLat([drone.position.lng, drone.position.lat]);
      }
    });
  }, [drones]);

  // Render Rescue Units (Mi-17, Navy Zodiacs)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    resources.forEach((res) => {
      let marker = resourceMarkersRef.current[res.id];

      if (!marker) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer flex flex-col items-center group';
        el.innerHTML = `
          <div class="px-1.5 py-0.5 rounded ${res.category === 'AIRCRAFT' ? 'bg-amber-600' : 'bg-emerald-600'} text-white text-[9px] font-bold shadow-lg border border-white/30 whitespace-nowrap group-hover:scale-110 transition flex items-center space-x-1">
            <span>${res.category === 'AIRCRAFT' ? '✈' : '🚤'}</span>
            <span>${res.name}</span>
          </div>
        `;

        el.addEventListener('click', () => {
          onSelectResource(res);
          map.flyTo({ center: [res.position.lng, res.position.lat], zoom: 13, pitch: 45, duration: 1200 });
        });

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([res.position.lng, res.position.lat])
          .addTo(map);

        resourceMarkersRef.current[res.id] = marker;
      }
    });
  }, [resources]);

  // Handle Ride-Along Follow Camera
  useEffect(() => {
    if (!mapRef.current || !rideAlongActive) return;
    const map = mapRef.current;

    if (selectedDrone) {
      map.flyTo({
        center: [selectedDrone.position.lng, selectedDrone.position.lat],
        zoom: 14.5,
        pitch: 65,
        bearing: selectedDrone.heading,
        duration: 1000,
      });
    } else if (selectedResource) {
      map.flyTo({
        center: [selectedResource.position.lng, selectedResource.position.lat],
        zoom: 14,
        pitch: 60,
        duration: 1000,
      });
    }
  }, [rideAlongActive, selectedDrone, selectedResource]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070d16]">
      {/* Real Full Pakistan WebGL Map Container */}
      <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Compass Rose */}
      <div className="absolute top-4 left-4 z-10 flex flex-col items-center pointer-events-none">
        <div className="w-10 h-10 rounded-full border border-cyan-500/40 bg-[#0b1320]/90 backdrop-blur-md flex items-center justify-center shadow-2xl">
          <Compass className="w-6 h-6 text-cyan-400" />
        </div>
      </div>

      {/* Ride-Along Active Banner */}
      {rideAlongActive && (
        <div className="absolute top-4 left-20 z-20 bg-[#0284c7] text-white px-3 py-1.5 rounded-md shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-pulse border border-cyan-300/40">
          <span>CHASE CAM ACTIVE: {selectedDrone?.name || selectedResource?.name}</span>
          <button
            onClick={onExitRideAlong}
            className="bg-black/40 hover:bg-black/60 px-2 py-0.5 rounded text-[11px] ml-2"
          >
            Exit Cam
          </button>
        </div>
      )}

      {/* Top Center Quick National Zoom Buttons */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 bg-[#0b1320]/90 border border-cyan-500/30 p-1 rounded-lg shadow-2xl backdrop-blur-md text-xs">
        <button
          onClick={() => mapRef.current?.flyTo({ center: [69.345, 30.375], zoom: 5.8, pitch: 20, bearing: 0, duration: 1800 })}
          className="px-2.5 py-1 rounded bg-[#162334] hover:bg-[#0284c7] text-gray-200 hover:text-white transition font-medium"
        >
          🇵🇰 All Pakistan
        </button>
        <button
          onClick={() => mapRef.current?.flyTo({ center: [71.975, 34.015], zoom: 12.2, pitch: 52, bearing: -24, duration: 1500 })}
          className="px-2.5 py-1 rounded bg-[#162334] hover:bg-[#0284c7] text-gray-200 hover:text-white transition font-medium"
        >
          Nowshera (KP)
        </button>
        <button
          onClick={() => mapRef.current?.flyTo({ center: [68.854, 27.697], zoom: 12.0, pitch: 48, bearing: -15, duration: 1500 })}
          className="px-2.5 py-1 rounded bg-[#162334] hover:bg-[#0284c7] text-gray-200 hover:text-white transition font-medium"
        >
          Sukkur (Sindh)
        </button>
        <button
          onClick={() => mapRef.current?.flyTo({ center: [70.849, 30.706], zoom: 11.5, pitch: 45, bearing: 0, duration: 1500 })}
          className="px-2.5 py-1 rounded bg-[#162334] hover:bg-[#0284c7] text-gray-200 hover:text-white transition font-medium"
        >
          Taunsa (Punjab)
        </button>
      </div>

      {/* Real Coordinates & Inundation Hover Probe Tooltip */}
      {floodProbe && hoverScreenPos && (
        <div
          style={{
            left: `${hoverScreenPos.x + 18}px`,
            top: `${hoverScreenPos.y - 40}px`,
          }}
          className="absolute z-30 pointer-events-none bg-[#070d16]/95 text-white p-3 rounded-lg text-[11px] shadow-2xl border border-cyan-500/40 max-w-[280px] backdrop-blur-md"
        >
          <div className="font-bold text-cyan-400 flex items-center justify-between pb-1 border-b border-gray-700/60">
            <span>{floodProbe.inundationStatus}</span>
            <span className="font-mono text-white text-[10px]">
              {floodProbe.waterDepthM > 0 ? `${floodProbe.waterDepthM}m Depth` : 'Dry Ground'}
            </span>
          </div>

          <div className="space-y-1 mt-1.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-gray-400">Ground Elevation</span>
              <span className="font-mono text-white font-semibold">{floodProbe.groundElevationM} m MSL</span>
            </div>
            {floodProbe.waterDepthM > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Flow Velocity</span>
                <span className="font-mono text-amber-400 font-semibold">{floodProbe.waterVelocityMs} m/s</span>
              </div>
            )}
            <div className="text-gray-300 text-[10px] pt-1">
              {floodProbe.infrastructureRisk}
            </div>
            <div className={`font-semibold pt-1 ${floodProbe.waterDepthM > 1.2 ? 'text-red-400' : 'text-emerald-400'}`}>
              {floodProbe.evacuationStatus}
            </div>
          </div>

          <div className="text-gray-400 text-[9px] font-mono mt-1.5 border-t border-gray-700/60 pt-1">
            GPS: {floodProbe.coords} (Pakistan)
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Tactical Map Controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-3 bg-[#0b1320]/95 border border-[#23354a] px-3 py-1.5 rounded-lg shadow-2xl text-xs font-medium text-white backdrop-blur-md">
        {/* Basemap Switcher (Satellite vs Dark vs Topo) */}
        <div className="flex bg-[#162232] rounded p-0.5 text-[11px] border border-[#2b3e57]">
          <button
            onClick={() => setBasemapStyle('satellite')}
            className={`px-2 py-0.5 rounded font-bold transition ${
              basemapStyle === 'satellite' ? 'bg-[#0284c7] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setBasemapStyle('dark')}
            className={`px-2 py-0.5 rounded font-bold transition ${
              basemapStyle === 'dark' ? 'bg-[#0284c7] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Dark HUD
          </button>
          <button
            onClick={() => setBasemapStyle('topo')}
            className={`px-2 py-0.5 rounded font-bold transition ${
              basemapStyle === 'topo' ? 'bg-[#0284c7] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            OpenStreetMap
          </button>
        </div>

        {/* Zoom */}
        <div className="font-mono text-xs px-1 text-cyan-400 font-semibold">
          {zoomLevel}
        </div>

        {/* Reset Camera to Pakistan Overview */}
        <button
          onClick={() => {
            mapRef.current?.flyTo({ center: [69.345, 30.375], zoom: 5.8, pitch: 20, bearing: 0, duration: 1500 });
          }}
          className="p-1 hover:bg-[#162232] rounded text-gray-300 hover:text-white transition"
          title="Reset to Pakistan Overview"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              mapContainerRef.current?.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}
          className="p-1 hover:bg-[#162232] rounded text-gray-300 hover:text-white transition"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
