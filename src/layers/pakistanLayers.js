/**
 * @module layers/pakistanLayers
 * @description Manages 3D Map Labels, Population Density Heatmaps,
 * and Emergency Resource & Relief Asset Overlays for Pakistan across CesiumJS.
 */

import * as Cesium from 'cesium';

// Key national landmarks & infrastructure across Pakistan
export const MAP_LANDMARKS = [
  // Glaciers
  { id: 'shisper', name: 'Shisper Glacier (GLOF Hazard)', lat: 36.452, lon: 74.886, type: 'glacier', color: '#00e5ff' },
  { id: 'passu', name: 'Passu Glacier', lat: 36.478, lon: 74.898, type: 'glacier', color: '#00e5ff' },
  { id: 'baltoro', name: 'Baltoro Glacier (K2)', lat: 35.735, lon: 76.388, type: 'glacier', color: '#00e5ff' },
  { id: 'siachen', name: 'Siachen Glacier', lat: 35.421, lon: 77.108, type: 'glacier', color: '#00e5ff' },

  // Dams & Barrages
  { id: 'tarbela', name: 'Tarbela Dam (Hydel & Flood Choke)', lat: 34.144, lon: 72.701, type: 'dam', color: '#1a73e8' },
  { id: 'mangla', name: 'Mangla Dam (Jhelum River)', lat: 33.146, lon: 73.645, type: 'dam', color: '#1a73e8' },
  { id: 'warsak', name: 'Warsak Dam (Kabul River)', lat: 34.167, lon: 71.350, type: 'dam', color: '#1a73e8' },
  { id: 'marala', name: 'Head Marala (Chenab Border Entry)', lat: 32.671, lon: 74.468, type: 'barrage', color: '#1a73e8' },
  { id: 'chashma', name: 'Chashma Barrage', lat: 32.434, lon: 71.379, type: 'barrage', color: '#1a73e8' },
  { id: 'taunsa', name: 'Taunsa Barrage (DG Khan / Punjab)', lat: 30.704, lon: 70.848, type: 'barrage', color: '#1a73e8' },
  { id: 'guddu', name: 'Guddu Barrage (Upper Sindh Entry)', lat: 28.424, lon: 69.703, type: 'barrage', color: '#1a73e8' },
  { id: 'sukkur', name: 'Sukkur Barrage (Indus Central)', lat: 27.705, lon: 68.857, type: 'barrage', color: '#1a73e8' },
  { id: 'kotri', name: 'Kotri Barrage (Delta Discharge)', lat: 25.439, lon: 68.314, type: 'barrage', color: '#1a73e8' },

  // Major Cities & Flood Hotspots
  { id: 'isb', name: 'Islamabad / Rawalpindi', lat: 33.684, lon: 73.047, type: 'city', color: '#ffffff' },
  { id: 'peshawar', name: 'Peshawar Valley', lat: 34.015, lon: 71.524, type: 'city', color: '#ffffff' },
  { id: 'nowshera', name: 'Nowshera Flood Funnel', lat: 34.015, lon: 71.985, type: 'hotspot', color: '#ea4335' },
  { id: 'lahore', name: 'Lahore (Ravi Basin)', lat: 31.520, lon: 74.358, type: 'city', color: '#ffffff' },
  { id: 'multan', name: 'Multan (Chenab Corridor)', lat: 30.157, lon: 71.524, type: 'city', color: '#ffffff' },
  { id: 'dgkhan', name: 'DG Khan (Koh-e-Suleman)', lat: 30.056, lon: 70.634, type: 'hotspot', color: '#ea4335' },
  { id: 'rajanpur', name: 'Rajanpur Hill Torrent Belt', lat: 29.104, lon: 70.325, type: 'hotspot', color: '#ea4335' },
  { id: 'larkana', name: 'Larkana / Mohenjo-daro', lat: 27.559, lon: 68.212, type: 'hotspot', color: '#ea4335' },
  { id: 'dadu', name: 'Dadu & Lake Manchar Basin', lat: 26.734, lon: 67.779, type: 'hotspot', color: '#ea4335' },
  { id: 'hyderabad', name: 'Hyderabad & Gidu Bund', lat: 25.396, lon: 68.357, type: 'city', color: '#ffffff' },
  { id: 'karachi', name: 'Karachi & Indus Delta', lat: 24.860, lon: 67.001, type: 'city', color: '#ffffff' },

  // Rivers
  { id: 'indus_river', name: 'River Indus (Sindhu)', lat: 31.5, lon: 71.0, type: 'river', color: '#4fc3f7' },
  { id: 'chenab_river', name: 'River Chenab', lat: 31.8, lon: 72.8, type: 'river', color: '#4fc3f7' },
  { id: 'kabul_river', name: 'River Kabul', lat: 34.12, lon: 71.85, type: 'river', color: '#4fc3f7' },
];

// Population exposure density polygons along the vulnerable Indus Basin
export const POPULATION_ZONES = [
  {
    id: 'karachi_coastal',
    name: 'Karachi Coastal & Delta Megacity',
    population: '17.5M Exposed',
    colorHex: '#d90429',
    center: [24.95, 67.1],
    polygon: [66.8, 24.7, 66.8, 25.2, 67.45, 25.25, 67.5, 24.75],
  },
  {
    id: 'punjab_riverine',
    name: 'Lahore - Kasur - Gujranwala Urban Belt',
    population: '14.2M Exposed',
    colorHex: '#ef233c',
    center: [31.6, 74.3],
    polygon: [73.8, 31.2, 74.1, 32.4, 74.8, 32.3, 74.6, 31.3],
  },
  {
    id: 'peshawar_basin',
    name: 'Peshawar - Nowshera - Charsadda Valley',
    population: '4.8M Exposed',
    colorHex: '#d90429',
    center: [34.05, 71.8],
    polygon: [71.3, 33.85, 71.3, 34.35, 72.25, 34.3, 72.2, 33.8],
  },
  {
    id: 'multan_muzaffargarh',
    name: 'Multan & Muzaffargarh Confluence Corridor',
    population: '5.2M Exposed',
    colorHex: '#f77f00',
    center: [30.1, 71.3],
    polygon: [70.9, 29.8, 70.9, 30.55, 71.8, 30.5, 71.7, 29.75],
  },
  {
    id: 'sukkur_larkana_basin',
    name: 'Sukkur - Larkana - Jacobabad Flood Basin',
    population: '6.8M Exposed (High Inundation Risk)',
    colorHex: '#d90429',
    center: [27.7, 68.5],
    polygon: [67.9, 27.25, 68.1, 28.3, 69.2, 28.25, 69.0, 27.35],
  },
  {
    id: 'dadu_manchar_plain',
    name: 'Dadu & Lake Manchar Depressed Plain',
    population: '3.1M Exposed (Severe Pooling)',
    colorHex: '#ef233c',
    center: [26.6, 67.9],
    polygon: [67.4, 26.2, 67.5, 27.1, 68.3, 27.0, 68.2, 26.15],
  },
  {
    id: 'rajanpur_derajat',
    name: 'Koh-e-Suleman & Rajanpur Hill Torrent Belt',
    population: '3.4M Exposed',
    colorHex: '#f77f00',
    center: [29.6, 70.4],
    polygon: [69.9, 28.9, 70.1, 30.5, 70.8, 30.4, 70.5, 28.85],
  },
];

// Resource and emergency relief allocation hubs across Pakistan
export const RELIEF_RESOURCES = [
  {
    id: 'dhamial_aviation',
    name: 'Army Aviation Qasim Base (Dhamial)',
    type: 'airbase',
    lat: 33.56,
    lon: 73.08,
    radiusM: 28000,
    assets: '24x Mi-17 Heavy Lift & Bell 412 Rescue Squadrons',
    status: 'ACTIVE AIR BRIDGE',
    color: '#00e676',
  },
  {
    id: 'multan_air_hub',
    name: 'Multan Relief Aviation Wing & NDMA Hub',
    type: 'depot',
    lat: 30.19,
    lon: 71.42,
    radiusM: 32000,
    assets: '60 Rescue Flotillas, 40k Food Rations, 18 Aircraft',
    status: 'FORWARD LOGISTICS CENTER',
    color: '#00e676',
  },
  {
    id: 'shahbaz_base',
    name: 'PAF Base Shahbaz (Jacobabad Staging)',
    type: 'airbase',
    lat: 28.28,
    lon: 68.45,
    radiusM: 35000,
    assets: 'C-130 Hercules Staging & High-Water Amphibious Force',
    status: 'SUPER-FLOOD STAGING',
    color: '#00e676',
  },
  {
    id: 'sukkur_marine',
    name: 'Rescue 1122 Marine Command (Sukkur Barrage)',
    type: 'marine',
    lat: 27.71,
    lon: 68.86,
    radiusM: 25000,
    assets: '140 Evacuation Boats, Dive Teams, Water Ambulances',
    status: 'WATER SURFACE COMMAND',
    color: '#00e5ff',
  },
  {
    id: 'hyderabad_pdma',
    name: 'PDMA Central Stockpile (Hyderabad)',
    type: 'depot',
    lat: 25.40,
    lon: 68.36,
    radiusM: 28000,
    assets: '55,000 Emergency Tents, Mobile Water Filtration Rigs',
    status: 'LOWER SINDH STOCKPILE',
    color: '#00e676',
  },
  {
    id: 'nowshera_field_hospital',
    name: 'Nowshera Emergency Mobile Medical Hub',
    type: 'medical',
    lat: 34.02,
    lon: 71.99,
    radiusM: 20000,
    assets: '350 Bed Field Hospital & Epidemic Control Unit',
    status: 'EMERGENCY MEDICAL',
    color: '#ff9100',
  },
  {
    id: 'quetta_coordination',
    name: 'Balochistan Emergency Operations Center (Quetta)',
    type: 'command',
    lat: 30.18,
    lon: 66.97,
    radiusM: 30000,
    assets: 'Torrent Rapid Assessment & Satellite Uplink Post',
    status: 'PROVINCIAL COMMAND',
    color: '#00e676',
  },
];

export class PakistanLayersManager {
  constructor(viewer) {
    this.viewer = viewer;

    this.labelsVisible = true;
    this.populationVisible = false;
    this.resourcesVisible = false;

    this._labelEntities = [];
    this._populationEntities = [];
    this._resourceEntities = [];

    this._init();
  }

  _init() {
    this._createLabels();
    this._createPopulationHeatmap();
    this._createResourceHeatmap();
  }

  // 1. Labels
  _createLabels() {
    for (const lm of MAP_LANDMARKS) {
      const isDamOrBarrage = lm.type === 'dam' || lm.type === 'barrage';
      const isGlacier = lm.type === 'glacier';
      const isHotspot = lm.type === 'hotspot';

      const pointColor = isGlacier
        ? Cesium.Color.fromCssColorString('#00f0ff')
        : isDamOrBarrage
        ? Cesium.Color.fromCssColorString('#1a73e8')
        : isHotspot
        ? Cesium.Color.fromCssColorString('#ea4335')
        : Cesium.Color.WHITE;

      const ent = this.viewer.entities.add({
        name: `Label: ${lm.name}`,
        position: Cesium.Cartesian3.fromDegrees(lm.lon, lm.lat, 25),
        show: this.labelsVisible,
        point: {
          pixelSize: isDamOrBarrage || isHotspot ? 9 : 7,
          color: pointColor,
          outlineColor: Cesium.Color.fromCssColorString('#202124'),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 5.0e6, 0.4),
        },
        label: {
          text: lm.name,
          font: isDamOrBarrage || isGlacier || isHotspot
            ? '600 12.5px "Google Sans", "Segoe UI", Roboto, sans-serif'
            : '500 11.5px "Google Sans", "Segoe UI", Roboto, sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#202124'),
          outlineWidth: 3,
          showBackground: true,
          backgroundColor: isHotspot
            ? Cesium.Color.fromCssColorString('#c62828').withAlpha(0.82)
            : isGlacier
            ? Cesium.Color.fromCssColorString('#00838f').withAlpha(0.82)
            : isDamOrBarrage
            ? Cesium.Color.fromCssColorString('#0d47a1').withAlpha(0.82)
            : Cesium.Color.fromCssColorString('#212121').withAlpha(0.75),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -11),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 5.0e6, 0.45),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 5.0e6),
        },
      });

      this._labelEntities.push(ent);
    }
  }

  // 2. Population Density Heatmap
  _createPopulationHeatmap() {
    for (const zone of POPULATION_ZONES) {
      const hierarchy = Cesium.Cartesian3.fromDegreesArray(zone.polygon);

      // Area density polygon
      const polyEnt = this.viewer.entities.add({
        name: `Population Heatmap: ${zone.name}`,
        show: this.populationVisible,
        polygon: {
          hierarchy,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString(zone.colorHex).withAlpha(0.38)
          ),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(zone.colorHex),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      this._populationEntities.push(polyEnt);

      // Metric center pin label
      const [cLat, cLon] = zone.center;
      const labelEnt = this.viewer.entities.add({
        name: `Pop Metric: ${zone.name}`,
        position: Cesium.Cartesian3.fromDegrees(cLon, cLat, 80),
        show: this.populationVisible,
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString(zone.colorHex),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `👥 ${zone.name}\n${zone.population}`,
          font: 'bold 12px "Google Sans", sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#202124'),
          outlineWidth: 3,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#212121').withAlpha(0.85),
          backgroundPadding: new Cesium.Cartesian2(7, 4),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 4.5e6, 0.45),
        },
      });
      this._populationEntities.push(labelEnt);
    }
  }

  // 3. Resource & Relief Assets Heatmap
  _createResourceHeatmap() {
    for (const res of RELIEF_RESOURCES) {
      // Resource coverage zone circle / ellipse
      const zoneEnt = this.viewer.entities.add({
        name: `Resource Zone: ${res.name}`,
        position: Cesium.Cartesian3.fromDegrees(res.lon, res.lat),
        show: this.resourcesVisible,
        ellipse: {
          semiMajorAxis: res.radiusM,
          semiMinorAxis: res.radiusM,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString(res.color).withAlpha(0.22)
          ),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(res.color),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      this._resourceEntities.push(zoneEnt);

      // Central depot marker
      const markerEnt = this.viewer.entities.add({
        name: `Asset Marker: ${res.name}`,
        position: Cesium.Cartesian3.fromDegrees(res.lon, res.lat, 60),
        show: this.resourcesVisible,
        point: {
          pixelSize: 12,
          color: Cesium.Color.fromCssColorString(res.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `🛡️ ${res.name}\n${res.assets}\n[${res.status}]`,
          font: 'bold 11.5px "Google Sans", sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#1b5e20'),
          outlineWidth: 3,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#0a3614').withAlpha(0.88),
          backgroundPadding: new Cesium.Cartesian2(8, 5),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 4.5e6, 0.45),
        },
      });
      this._resourceEntities.push(markerEnt);
    }
  }

  setLabelsVisible(visible) {
    this.labelsVisible = !!visible;
    for (const ent of this._labelEntities) {
      ent.show = this.labelsVisible;
    }
  }

  setPopulationVisible(visible) {
    this.populationVisible = !!visible;
    for (const ent of this._populationEntities) {
      ent.show = this.populationVisible;
    }
  }

  setResourcesVisible(visible) {
    this.resourcesVisible = !!visible;
    for (const ent of this._resourceEntities) {
      ent.show = this.resourcesVisible;
    }
  }

  destroy() {
    if (this.viewer && this.viewer.entities) {
      for (const ent of [...this._labelEntities, ...this._populationEntities, ...this._resourceEntities]) {
        this.viewer.entities.remove(ent);
      }
    }
    this._labelEntities = [];
    this._populationEntities = [];
    this._resourceEntities = [];
  }
}
