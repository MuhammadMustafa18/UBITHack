import { HAZARDS, bandOf } from './scoring.js';

const BAND_ORDER = ['low', 'moderate', 'elevated', 'high', 'insufficient_data'];

const DECIMALS = {
  sarFloodFrac: 2,
  jrcOccurrence: 1,
  handM: 1,
  lstDayC: 1,
  uhiC: 1,
  elevM: 0,
  slopeDeg: 1,
  flowAccLog10: 1,
  co: 3,
  aai: 2,
  aod: 2,
  ndvi: 2,
  ndviTrend: 3,
  pop: 0,
};

const SIG3 = new Set(['no2', 'so2']);

const isNum = (x) => typeof x === 'number' && Number.isFinite(x);

function roundDp(x, dp) {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}

function roundMetric(key, x) {
  if (!isNum(x)) return null;
  if (SIG3.has(key)) return Number(x.toPrecision(3));
  return roundDp(x, DECIMALS[key] ?? 2);
}

function roundMetrics(m) {
  const out = {};
  for (const [key, value] of Object.entries(m || {})) out[key] = roundMetric(key, value);
  return out;
}

function roundScore(x) {
  return isNum(x) ? Math.round(x) : null;
}

function roundHazards(hazards) {
  const out = {};
  for (const h of HAZARDS) out[h] = roundScore(hazards?.[h]);
  return out;
}

function popOf(cell) {
  return isNum(cell.m?.pop) ? Math.round(cell.m.pop) : null;
}

export function cellAt(grid, lat, lon) {
  if (!grid || !isNum(lat) || !isNum(lon)) return null;
  const [west, south, east, north] = grid.bbox;
  if (lon < west || lon > east || lat < south || lat > north) return null;
  const half = grid.cellDeg / 2;
  const eps = 1e-9;
  let best = null;
  let bestDist = Infinity;
  for (const cell of grid.cells) {
    const dLat = Math.abs(lat - cell.lat);
    const dLon = Math.abs(lon - cell.lon);
    if (dLat > half + eps || dLon > half + eps) continue;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < bestDist) {
      best = cell;
      bestDist = dist;
    }
  }
  return best;
}

export function rankCells(grid, { hazard = 'composite', limit = 10 } = {}) {
  const rows = [];
  for (const cell of grid.cells) {
    const raw = hazard === 'composite' ? cell.score?.score : cell.score?.hazards?.[hazard];
    if (!isNum(raw)) continue;
    rows.push({
      id: cell.id,
      lat: cell.lat,
      lon: cell.lon,
      score: roundScore(raw),
      band: bandOf(raw),
      pop: popOf(cell),
      raw,
    });
  }
  rows.sort((a, b) => b.raw - a.raw || (b.pop ?? 0) - (a.pop ?? 0) || (a.id < b.id ? -1 : 1));
  return rows.slice(0, Math.max(0, limit)).map(({ raw, ...row }) => row);
}

export function aoiSummary(grid) {
  const bandCounts = Object.fromEntries(BAND_ORDER.map((b) => [b, 0]));
  const popByBand = Object.fromEntries(BAND_ORDER.map((b) => [b, 0]));
  const sums = Object.fromEntries(HAZARDS.map((h) => [h, [0, 0]]));
  const driverCounts = Object.fromEntries(HAZARDS.map((h) => [h, 0]));
  let coverageSum = 0;
  for (const cell of grid.cells) {
    const s = cell.score;
    const band = s?.band || 'insufficient_data';
    bandCounts[band] += 1;
    popByBand[band] += popOf(cell) ?? 0;
    coverageSum += s?.coverage ?? 0;
    for (const h of HAZARDS) {
      const v = s?.hazards?.[h];
      if (isNum(v)) {
        sums[h][0] += v;
        sums[h][1] += 1;
      }
    }
    if (s?.score !== null && s?.drivers?.[0]) driverCounts[s.drivers[0]] += 1;
  }
  const hazardMeans = {};
  for (const h of HAZARDS) {
    hazardMeans[h] = sums[h][1] ? Math.round(sums[h][0] / sums[h][1]) : null;
  }
  const topDrivers = HAZARDS.filter((h) => driverCounts[h] > 0)
    .map((hazard) => ({ hazard, cells: driverCounts[hazard] }))
    .sort((a, b) => b.cells - a.cells);
  return {
    aoi: grid.aoi,
    cells: grid.cells.length,
    bandCounts,
    hazardMeans,
    popByBand,
    topDrivers,
    coverageMean: grid.cells.length ? roundDp(coverageSum / grid.cells.length, 2) : null,
    pipeline: grid.pipeline,
  };
}

export function cellExplain(grid, id) {
  const cell = grid.cells.find((c) => c.id === id);
  if (!cell) return null;
  const s = cell.score;
  return {
    id: cell.id,
    lat: cell.lat,
    lon: cell.lon,
    metrics: roundMetrics(cell.m),
    hazards: roundHazards(s?.hazards),
    composite: {
      score: roundScore(s?.score),
      band: s?.band || 'insufficient_data',
      coverage: roundDp(s?.coverage ?? 0, 2),
      drivers: s?.drivers || [],
    },
    sources: grid.sources,
    pipeline: grid.pipeline,
  };
}
