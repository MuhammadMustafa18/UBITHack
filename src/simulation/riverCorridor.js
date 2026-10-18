import { distanceKm } from '../tools/area.js';

const DATA_ROOT = `${import.meta.env?.BASE_URL || '/'}data/agaahi/`;
const V_MIN_MPS = 1.0;
const V_MAX_MPS = 3.0;
const MAX_KM = 400.0;
const PATH_STEP_KM = 2.0;
const PROXIMITY_M = 3000.0;
const HIST_WEIGHT = 0.6;
const PROXIMITY_WEIGHT = 0.4;
const HIGH_SHARE = 0.15;
const MEDIUM_SHARE = 0.35;
const STATUS_WEIGHT = {
  observed_exceed: 1.0,
  propagated_watch: 0.6,
  no_data: 0.3,
};

let _datasets = null;

async function fetchGeoJson(name) {
  const response = await fetch(`${DATA_ROOT}${name}`);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${name}`);
  return response.json();
}

const round1 = (value) => Math.round(value * 10) / 10;

export function arrivalWindowH(cumKm) {
  return [round1(cumKm / (V_MAX_MPS * 3.6)), round1(cumKm / (V_MIN_MPS * 3.6))];
}

export function downstreamChain(reaches, startId) {
  const byId = new Map(reaches.map((f) => [f.properties.reach_id, f]));
  const chain = [];
  let cumKm = 0;
  let id = byId.get(startId)?.properties.next_down;
  while (byId.has(id)) {
    const reach = byId.get(id);
    cumKm += reach.properties.length_km;
    chain.push({ reach, cumKm });
    id = reach.properties.next_down;
  }
  return chain;
}

function buildPath(chain) {
  const path = [];
  let lastKm = -Infinity;
  for (const { reach, cumKm } of chain) {
    const points = reach.geometry.coordinates.map(([lon, lat]) => ({
      lon,
      lat,
    }));
    const legs = points.slice(1).map((p, i) => distanceKm(points[i], p));
    const scale =
      reach.properties.length_km / (legs.reduce((a, b) => a + b, 0) || 1);
    let km = cumKm - reach.properties.length_km;
    points.forEach((point, i) => {
      if (i > 0) km += legs[i - 1] * scale;
      if (km - lastKm < PATH_STEP_KM) return;
      path.push({ ...point, timeHours: km / (V_MAX_MPS * 3.6) });
      lastKm = km;
    });
  }
  return path;
}

export function pathPosition(path, hours) {
  const i = path.findIndex((p) => p.timeHours > hours);
  if (i === -1) return path[path.length - 1];
  if (i === 0) return path[0];
  const a = path[i - 1];
  const b = path[i];
  const f = (hours - a.timeHours) / (b.timeHours - a.timeHours);
  return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
}

function outerRing(geometry) {
  const polygons =
    geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [geometry.coordinates];
  return polygons.map((p) => p[0]).sort((a, b) => b.length - a.length)[0];
}

export function rankCommunities(features, statusOf, windowOf) {
  const scored = features.map(({ properties: p, geometry }) => {
    const status = statusOf(p.reach_id);
    const hist = p.hist_flood_frac_2022;
    const usesHist = hist != null;
    const proximity = Math.max(0, 1 - p.distance_to_river_m / PROXIMITY_M);
    const exposure =
      p.population_est *
      (usesHist
        ? HIST_WEIGHT * hist + PROXIMITY_WEIGHT * proximity
        : proximity);
    const ring = outerRing(geometry);
    const center = ring.reduce(
      ([lat, lon], [x, y]) => [lat + y / ring.length, lon + x / ring.length],
      [0, 0],
    );
    return {
      id: `community-${p.community_id}`,
      name: p.name,
      placeType: p.place_type,
      population: p.population_est,
      popSourceId: p.pop_source_id,
      histFlood2022: usesHist ? hist : null,
      distanceToRiverM: p.distance_to_river_m,
      facilities: {
        health: p.n_health,
        school: p.n_school,
        shelter: p.n_shelter_candidate,
      },
      reachId: p.reach_id,
      status,
      windowH: windowOf(p.reach_id),
      priority: exposure * STATUS_WEIGHT[status],
      band: null,
      center,
      polygon: ring.flat(),
    };
  });
  scored.sort(
    (a, b) => b.priority - a.priority || a.name.localeCompare(b.name),
  );
  const positive = scored.filter((c) => c.priority > 0);
  const nHigh = Math.ceil(positive.length * HIGH_SHARE);
  const nMedium = Math.ceil(positive.length * (HIGH_SHARE + MEDIUM_SHARE));
  positive.forEach((c, i) => {
    c.band = i < nHigh ? 'high' : i < nMedium ? 'medium' : 'low';
  });
  return scored;
}

function buildCorridor(reaches, communities, scenario) {
  const trigger = communities.find(
    (f) => f.properties.name === scenario.triggerCommunity,
  );
  if (!trigger)
    throw new Error(`No community named ${scenario.triggerCommunity}`);
  const triggerReach = trigger.properties.reach_id;
  const chain = downstreamChain(reaches, triggerReach);
  const windows = new Map([
    [triggerReach, [0, 0]],
    ...chain.map(({ reach, cumKm }) => [
      reach.properties.reach_id,
      arrivalWindowH(cumKm),
    ]),
  ]);
  const ranked = rankCommunities(
    communities,
    (reachId) =>
      reachId === triggerReach
        ? 'observed_exceed'
        : windows.has(reachId)
          ? 'propagated_watch'
          : 'no_data',
    (reachId) => windows.get(reachId) || null,
  );
  const path = buildPath(chain);
  const lastPathPoint = path[path.length - 1] || { lat: 33.5, lon: 71.95, timeHours: 40 };

  // Indus River Mainstem downstream continuation across the 168h (7-day) timeline
  const indusMainstemWaypoints = [
    {
      id: 'indus_kalabagh',
      name: 'Kalabagh Gorge (Plains Entry)',
      lat: 32.96,
      lon: 71.55,
      timeHours: Math.max(lastPathPoint.timeHours + 4, 46),
      dischargeCusecs: 680000,
      stageRiseM: 6.2,
      normalWidthM: 450,
      floodWidthM: 4800,
      radialSpillRadiusM: 16000,
      status: 'PLAINS ENTRY SURGE',
    },
    {
      id: 'indus_chashma',
      name: 'Chashma Barrage',
      lat: 32.434,
      lon: 71.379,
      timeHours: Math.max(lastPathPoint.timeHours + 16, 64),
      dischargeCusecs: 780000,
      stageRiseM: 5.8,
      normalWidthM: 850,
      floodWidthM: 7500,
      radialSpillRadiusM: 26000,
      status: 'HIGH FLOOD PULL',
    },
    {
      id: 'indus_taunsa',
      name: 'Taunsa Barrage (DG Khan)',
      lat: 30.704,
      lon: 70.848,
      timeHours: Math.max(lastPathPoint.timeHours + 36, 88),
      dischargeCusecs: 890000,
      stageRiseM: 5.5,
      normalWidthM: 900,
      floodWidthM: 9200,
      radialSpillRadiusM: 36000,
      status: 'VERY HIGH FLOOD CREST',
    },
    {
      id: 'indus_guddu',
      name: 'Guddu Barrage (Upper Sindh)',
      lat: 28.424,
      lon: 69.703,
      timeHours: Math.max(lastPathPoint.timeHours + 62, 114),
      dischargeCusecs: 980000,
      stageRiseM: 5.0,
      normalWidthM: 1100,
      floodWidthM: 12500,
      radialSpillRadiusM: 52000,
      status: 'SUPER FLOOD ALERT',
    },
    {
      id: 'indus_sukkur',
      name: 'Sukkur Barrage & Indus Basin',
      lat: 27.705,
      lon: 68.857,
      timeHours: Math.max(lastPathPoint.timeHours + 86, 138),
      dischargeCusecs: 1120000,
      stageRiseM: 4.8,
      normalWidthM: 1200,
      floodWidthM: 18000,
      radialSpillRadiusM: 72000,
      status: 'CATASTROPHIC POOLING',
    },
    {
      id: 'indus_kotri',
      name: 'Kotri Barrage (Delta Head)',
      lat: 25.439,
      lon: 68.314,
      timeHours: Math.max(lastPathPoint.timeHours + 110, 160),
      dischargeCusecs: 950000,
      stageRiseM: 4.2,
      normalWidthM: 950,
      floodWidthM: 12000,
      radialSpillRadiusM: 45000,
      status: 'DELTA SURGE DISCHARGE',
    },
    {
      id: 'indus_delta',
      name: 'Indus Delta / Arabian Sea Outflow',
      lat: 24.12,
      lon: 67.82,
      timeHours: Math.max(lastPathPoint.timeHours + 120, 168),
      dischargeCusecs: 800000,
      stageRiseM: 3.5,
      normalWidthM: 1800,
      floodWidthM: 22000,
      radialSpillRadiusM: 60000,
      status: 'OCEANIC DISCHARGE',
    },
  ];

  // Interpolate smooth path points connecting from lastPathPoint down through the Indus mainstem
  let prevPt = lastPathPoint;
  for (const stop of indusMainstemWaypoints) {
    const steps = 8;
    for (let s = 1; s <= steps; s++) {
      const f = s / steps;
      path.push({
        lat: prevPt.lat + (stop.lat - prevPt.lat) * f,
        lon: prevPt.lon + (stop.lon - prevPt.lon) * f,
        timeHours: prevPt.timeHours + (stop.timeHours - prevPt.timeHours) * f,
      });
    }
    prevPt = stop;
  }

  const origin = { ...scenario.origin, lat: path[0].lat, lon: path[0].lon };
  const stops = ranked
    .filter((c) => c.windowH && (c.band === 'high' || c.band === 'medium'))
    .sort((a, b) => a.windowH[0] - b.windowH[0])
    .map((c) => ({
      id: c.id,
      name: c.name,
      lat: c.center[0],
      lon: c.center[1],
      timeHours: c.windowH[0],
      windowH: c.windowH,
      population: c.population,
      polygon: c.polygon,
      dischargeCusecs: 450000,
      stageRiseM: 4.5,
      status:
        c.status === 'observed_exceed'
          ? 'EXERCISE TRIGGER REACH'
          : 'PROPAGATED WATCH',
    }));
  return {
    origin,
    camera: {
      lat: origin.lat,
      lon: origin.lon,
      height: 45000,
      pitch: -40,
      heading: 160,
    },
    path,
    communities: ranked,
    waypoints: [
      {
        id: 'exercise-trigger',
        name: origin.name,
        lat: origin.lat,
        lon: origin.lon,
        timeHours: 0,
        dischargeCusecs: 380000,
        stageRiseM: 5.2,
        status: 'EXERCISE TRIGGER',
      },
      ...stops,
      ...indusMainstemWaypoints,
    ],
  };
}

export async function loadCorridorScenario(scenario) {
  _datasets ??= Promise.all([
    fetchGeoJson('reaches.geojson'),
    fetchGeoJson('communities.geojson'),
  ]).catch((error) => {
    _datasets = null;
    throw error;
  });
  const [reaches, communities] = await _datasets;
  return Object.assign(
    scenario,
    buildCorridor(reaches.features, communities.features, scenario),
  );
}
