export const HAZARDS = ['flood', 'heat', 'terrain', 'air', 'veg'];
export const WEIGHTS = { flood: 0.30, heat: 0.25, terrain: 0.15, air: 0.15, veg: 0.15 };
export const BANDS = [[70, 'high'], [45, 'elevated'], [25, 'moderate'], [0, 'low']];

const c = (x) => Math.min(1, Math.max(0, x));
const has = (x) => typeof x === 'number' && Number.isFinite(x);

function weighted(terms) {
  let sum = 0;
  let weight = 0;
  for (const [w, value] of terms) {
    if (value === null) continue;
    sum += w * value;
    weight += w;
  }
  return weight > 0 ? (sum / weight) * 100 : null;
}

function term(x, fn) {
  return has(x) ? fn(x) : null;
}

function airTerms(m, pipeline) {
  if (pipeline === 'openmeteo') {
    return [
      [1, term(m.no2, (x) => c(x / 40))],
      [1, term(m.co, (x) => c(x / 4000))],
      [1, term(m.so2, (x) => c(x / 40))],
      [1, term(m.aod, (x) => c(x / 1))],
    ];
  }
  return [
    [1, term(m.no2, (x) => c(x / 2e-4))],
    [1, term(m.co, (x) => c((x - 0.02) / 0.03))],
    [1, term(m.so2, (x) => c(x / 5e-4))],
    [1, term(m.aai, (x) => c((x + 1) / 3))],
  ];
}

export function hazardScores(m, { pipeline } = {}) {
  const v = m || {};
  return {
    flood: weighted([
      [0.5, term(v.sarFloodFrac, (x) => c(x))],
      [0.3, term(v.jrcOccurrence, (x) => c(x / 100))],
      [0.2, term(v.handM, (x) => c((15 - x) / 15))],
    ]),
    heat: weighted([
      [0.7, term(v.lstDayC, (x) => c((x - 30) / 20))],
      [0.3, term(v.uhiC, (x) => c(x / 6))],
    ]),
    terrain: weighted([
      [0.6, term(v.slopeDeg, (x) => c(x / 30))],
      [0.4, term(v.flowAccLog10, (x) => c(x / 5))],
    ]),
    air: weighted(airTerms(v, pipeline)),
    veg: weighted([
      [0.6, term(v.ndviTrend, (x) => c(-x / 0.1))],
      [0.4, term(v.ndvi, (x) => c((0.3 - x) / 0.3))],
    ]),
  };
}

export function bandOf(score) {
  if (!has(score)) return 'insufficient_data';
  for (const [min, name] of BANDS) if (score >= min) return name;
  return 'low';
}

export function compositeScore(m, opts) {
  const hazards = hazardScores(m, opts);
  let sum = 0;
  let coverage = 0;
  const contributions = [];
  for (const h of HAZARDS) {
    const s = hazards[h];
    if (s === null) continue;
    sum += WEIGHTS[h] * s;
    coverage += WEIGHTS[h];
    contributions.push([h, WEIGHTS[h] * s]);
  }
  const drivers = contributions
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([h]) => h);
  if (coverage < 0.5) {
    return { score: null, band: 'insufficient_data', coverage, drivers, hazards };
  }
  const score = sum / coverage;
  return { score, band: bandOf(score), coverage, drivers, hazards };
}
