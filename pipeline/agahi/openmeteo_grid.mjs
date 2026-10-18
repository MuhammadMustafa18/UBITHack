import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE_DIR = path.join(ROOT, '.gev-cache', 'agahi');
const OUT_DIR = path.join(ROOT, 'public', 'data', 'agahi', 'grid');
const COMMUNITIES = path.join(ROOT, 'public', 'data', 'agaahi', 'communities.geojson');

const AOIS = {
  sukkur: {
    name: 'Sukkur',
    nameUr: 'سکھر',
    bbox: [68.70, 27.55, 69.00, 27.85],
    cellDeg: 0.02,
    airSnap: 0.1,
    tempSnap: 0.1,
  },
  karachi: {
    name: 'Karachi',
    nameUr: 'کراچی',
    bbox: [66.85, 24.75, 67.35, 25.10],
    cellDeg: 0.02,
    airSnap: 0.1,
    tempSnap: 0.1,
  },
  swat_kabul: {
    name: 'Swat–Kabul corridor',
    nameUr: 'سوات–کابل راہداری',
    bbox: [68.88, 32.83, 72.87, 36.61],
    cellDeg: 0.11,
    airSnap: 0.4,
    tempSnap: 0.25,
    flood: true,
    forwardSlope: true,
  },
};

const SLOPE_OFFSET_DEG = 0.01;
const MIN_GAP_MS = 220;
const ELEVATION_GAP_MS = 10500;
const YEARS = [2023, 2024, 2025];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round = (x, dp) => (x === null ? null : Number(x.toFixed(dp)));
const r4 = (x) => Number(x.toFixed(4));

let lastCall = 0;

async function getJson(url, gapMs = MIN_GAP_MS) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `${crypto.createHash('sha1').update(url).digest('hex')}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  let lastErr;
  for (let attempt = 0; attempt < 12; attempt++) {
    const wait = lastCall + gapMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        console.log('429, waiting 65s');
        await sleep(65000);
        lastErr = new Error('HTTP 429');
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      fs.writeFileSync(file, JSON.stringify(body));
      return body;
    } catch (err) {
      lastErr = err;
      await sleep(1500 * (attempt + 1));
    }
  }
  throw new Error(`${url.split('?')[0]} failed: ${lastErr.message}`);
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function snapKey(lat, lon, snap) {
  const la = r4(Math.round(lat / snap) * snap);
  const lo = r4(Math.round(lon / snap) * snap);
  return `${la},${lo}`;
}

function buildGrid(aoi, cfg) {
  const [w, s, e, n] = cfg.bbox;
  const cols = Math.ceil((e - w) / cfg.cellDeg - 1e-9);
  const rows = Math.ceil((n - s) / cfg.cellDeg - 1e-9);
  const cells = [];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      cells.push({
        id: `${aoi}:${col}:${row}`,
        col,
        row,
        lat: r4(s + (row + 0.5) * cfg.cellDeg),
        lon: r4(w + (col + 0.5) * cfg.cellDeg),
      });
    }
  }
  return { cells, cols, rows };
}

async function fetchElevations(coords) {
  const unique = [...new Set(coords.map(([la, lo]) => `${r4(la)},${r4(lo)}`))];
  const map = new Map();
  for (const part of chunk(unique, 100)) {
    const lats = part.map((k) => k.split(',')[0]).join(',');
    const lons = part.map((k) => k.split(',')[1]).join(',');
    const body = await getJson(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`, ELEVATION_GAP_MS);
    part.forEach((k, i) => map.set(k, Number.isFinite(body.elevation?.[i]) ? body.elevation[i] : null));
  }
  return map;
}

function applyElevation(cells, elevMap, forward) {
  const d = SLOPE_OFFSET_DEG;
  for (const c of cells) {
    const z = (la, lo) => elevMap.get(`${r4(la)},${r4(lo)}`) ?? null;
    const centre = z(c.lat, c.lon);
    const north = z(c.lat + d, c.lon);
    const south = forward ? centre : z(c.lat - d, c.lon);
    const east = z(c.lat, c.lon + d);
    const west = forward ? centre : z(c.lat, c.lon - d);
    c.elevM = centre === null ? null : Math.round(centre);
    if ([north, south, east, west].some((v) => v === null)) {
      c.slopeDeg = null;
      continue;
    }
    const span = forward ? d : 2 * d;
    const dy = span * 111320;
    const dx = span * 111320 * Math.cos((c.lat * Math.PI) / 180);
    const gx = (east - west) / dx;
    const gy = (north - south) / dy;
    c.slopeDeg = round((Math.atan(Math.hypot(gx, gy)) * 180) / Math.PI, 2);
  }
}

function mean(values) {
  const v = values.filter((x) => Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

async function fetchMultiLocation(points, buildUrl, batchSize) {
  const results = [];
  for (const part of chunk(points, batchSize)) {
    const body = await getJson(buildUrl(part));
    const arr = Array.isArray(body) ? body : [body];
    arr.forEach((entry, i) => results.push([part[i], entry]));
  }
  return results;
}

async function fetchAir(points) {
  const out = new Map();
  const url = (part) =>
    'https://air-quality-api.open-meteo.com/v1/air-quality?' +
    `latitude=${part.map((p) => p[0]).join(',')}&longitude=${part.map((p) => p[1]).join(',')}` +
    '&hourly=nitrogen_dioxide,carbon_monoxide,sulphur_dioxide,aerosol_optical_depth' +
    '&past_days=30&forecast_days=0&timezone=GMT';
  for (const [p, entry] of await fetchMultiLocation(points, url, 10)) {
    const h = entry.hourly || {};
    out.set(`${p[0]},${p[1]}`, {
      no2: mean(h.nitrogen_dioxide || []),
      co: mean(h.carbon_monoxide || []),
      so2: mean(h.sulphur_dioxide || []),
      aod: mean(h.aerosol_optical_depth || []),
    });
  }
  return out;
}

async function fetchTemp(points) {
  const out = new Map();
  for (const year of YEARS) {
    const url = (part) =>
      'https://archive-api.open-meteo.com/v1/archive?' +
      `latitude=${part.map((p) => p[0]).join(',')}&longitude=${part.map((p) => p[1]).join(',')}` +
      `&start_date=${year}-05-01&end_date=${year}-07-31&daily=temperature_2m_max&timezone=GMT`;
    for (const [p, entry] of await fetchMultiLocation(points, url, 10)) {
      const key = `${p[0]},${p[1]}`;
      const list = out.get(key) || [];
      list.push(...(entry.daily?.temperature_2m_max || []));
      out.set(key, list);
    }
  }
  for (const [key, list] of out) out.set(key, mean(list));
  return out;
}

function pointInRings(lon, lat, rings) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

function floodFractions(cells, cfg) {
  const geo = JSON.parse(fs.readFileSync(COMMUNITIES, 'utf8'));
  const [w, s] = cfg.bbox;
  const acc = new Map();
  const add = (c, v) => {
    const a = acc.get(c.id) || [];
    a.push(v);
    acc.set(c.id, a);
  };
  const byIndex = new Map(cells.map((c) => [`${c.col}:${c.row}`, c]));
  for (const f of geo.features) {
    const v = f.properties?.hist_flood_frac_2022;
    if (!Number.isFinite(v)) continue;
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const hit = new Set();
    for (const poly of polys) {
      let minLon = Infinity;
      let minLat = Infinity;
      let maxLon = -Infinity;
      let maxLat = -Infinity;
      for (const ring of poly) {
        for (const [lo, la] of ring) {
          minLon = Math.min(minLon, lo);
          maxLon = Math.max(maxLon, lo);
          minLat = Math.min(minLat, la);
          maxLat = Math.max(maxLat, la);
          const col = Math.floor((lo - w) / cfg.cellDeg);
          const row = Math.floor((la - s) / cfg.cellDeg);
          if (byIndex.has(`${col}:${row}`)) hit.add(`${col}:${row}`);
        }
      }
      const c0 = Math.floor((minLon - w) / cfg.cellDeg);
      const c1 = Math.floor((maxLon - w) / cfg.cellDeg);
      const r0 = Math.floor((minLat - s) / cfg.cellDeg);
      const r1 = Math.floor((maxLat - s) / cfg.cellDeg);
      for (let col = c0; col <= c1; col++) {
        for (let row = r0; row <= r1; row++) {
          const c = byIndex.get(`${col}:${row}`);
          if (c && pointInRings(c.lon, c.lat, poly)) hit.add(`${col}:${row}`);
        }
      }
    }
    for (const k of hit) add(byIndex.get(k), v);
  }
  const out = new Map();
  for (const [id, list] of acc) out.set(id, round(mean(list), 3));
  return out;
}

function sourcesFor(cfg) {
  const sources = {
    lst: {
      dataset: 'Open-Meteo Historical Weather API (ERA5 reanalysis) temperature_2m_max',
      window: 'May–Jul 2023–2025',
      unit: '°C',
      note: `ERA5 2 m air temperature, not LST; sampled at ${cfg.tempSnap}° resolution`,
    },
    dem: {
      dataset: 'Open-Meteo Elevation API (Copernicus DEM GLO-90)',
      note: cfg.forwardSlope
        ? 'slope = forward difference over 0.01° north and east of cell centre'
        : 'slope = central difference over ±0.01° around cell centre',
    },
    s5p: {
      dataset: 'Open-Meteo Air Quality API (CAMS global atmospheric composition forecasts)',
      window: 'past 30 days',
      unit: 'µg/m³ (no2, co, so2); aod dimensionless',
      note: `CAMS model output, not Sentinel-5P; sampled at ${cfg.airSnap}° resolution; aod used instead of aai`,
    },
  };
  if (cfg.flood) {
    sources.sar = {
      dataset: 'UNOSAT 2022 flood extent via public/data/agaahi/communities.geojson hist_flood_frac_2022',
      window: '2022 monsoon',
      method: 'mean flooded fraction of community polygons overlapping the cell; null where no community overlaps',
    };
  }
  return sources;
}

async function run(aoi) {
  const cfg = AOIS[aoi];
  if (!cfg) throw new Error(`unknown aoi "${aoi}"; choose one of ${Object.keys(AOIS).join(', ')}`);
  const started = Date.now();
  const { cells, cols, rows } = buildGrid(aoi, cfg);
  console.log(`[${aoi}] ${cols}x${rows} = ${cells.length} cells @ ${cfg.cellDeg}°`);

  const d = SLOPE_OFFSET_DEG;
  const coords = [];
  for (const c of cells) {
    coords.push([c.lat, c.lon], [c.lat + d, c.lon], [c.lat, c.lon + d]);
    if (!cfg.forwardSlope) coords.push([c.lat - d, c.lon], [c.lat, c.lon - d]);
  }
  console.log(`[${aoi}] elevation: ${coords.length} coords`);
  applyElevation(cells, await fetchElevations(coords), Boolean(cfg.forwardSlope));

  const airPts = [...new Set(cells.map((c) => snapKey(c.lat, c.lon, cfg.airSnap)))].map((k) => k.split(','));
  console.log(`[${aoi}] air quality: ${airPts.length} points`);
  const air = await fetchAir(airPts);

  const tempPts = [...new Set(cells.map((c) => snapKey(c.lat, c.lon, cfg.tempSnap)))].map((k) => k.split(','));
  console.log(`[${aoi}] ERA5 temperature: ${tempPts.length} points x ${YEARS.length} years`);
  const temp = await fetchTemp(tempPts);

  const flood = cfg.flood ? floodFractions(cells, cfg) : null;

  const outCells = cells.map((c) => {
    const a = air.get(snapKey(c.lat, c.lon, cfg.airSnap)) || {};
    const t = temp.get(snapKey(c.lat, c.lon, cfg.tempSnap));
    return {
      id: c.id,
      lat: c.lat,
      lon: c.lon,
      m: {
        sarFloodFrac: flood ? (flood.get(c.id) ?? null) : null,
        jrcOccurrence: null,
        handM: null,
        lstDayC: round(t ?? null, 2),
        uhiC: null,
        elevM: c.elevM,
        slopeDeg: c.slopeDeg,
        flowAccLog10: null,
        no2: round(a.no2 ?? null, 2),
        co: round(a.co ?? null, 1),
        so2: round(a.so2 ?? null, 2),
        aod: round(a.aod ?? null, 3),
        aai: null,
        ndvi: null,
        ndviTrend: null,
        pop: null,
      },
    };
  });

  const grid = {
    aoi,
    name: cfg.name,
    nameUr: cfg.nameUr,
    bbox: cfg.bbox,
    cellDeg: cfg.cellDeg,
    generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    pipeline: 'openmeteo',
    sources: sourcesFor(cfg),
    cells: outCells,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, `${aoi}.json`);
  const text = JSON.stringify(grid);
  fs.writeFileSync(outFile, text);
  const count = (k) => outCells.filter((c) => c.m[k] !== null).length;
  console.log(
    `[${aoi}] wrote ${outFile} (${(text.length / 1024).toFixed(0)} KB, ${outCells.length} cells) in ${((Date.now() - started) / 1000).toFixed(0)}s`,
  );
  console.log(
    `[${aoi}] non-null: ` +
      ['elevM', 'slopeDeg', 'lstDayC', 'no2', 'co', 'so2', 'aod', 'sarFloodFrac'].map((k) => `${k}=${count(k)}`).join(' '),
  );
}

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('usage: node pipeline/agahi/openmeteo_grid.mjs <sukkur|karachi|swat_kabul> [...]');
  process.exit(1);
}
for (const aoi of targets) await run(aoi);
