import assert from 'node:assert/strict';
import test from 'node:test';
import { HAZARDS, WEIGHTS, bandOf, compositeScore, hazardScores } from './scoring.js';

const FULL = {
  sarFloodFrac: 0.4,
  jrcOccurrence: 20,
  handM: 5,
  lstDayC: 45,
  uhiC: 3,
  slopeDeg: 3,
  flowAccLog10: 3,
  no2: 1e-4,
  co: 0.035,
  so2: 2e-4,
  aai: 0.5,
  ndvi: 0.2,
  ndviTrend: -0.04,
};

test('a null metric never scores as zero risk', () => {
  const result = compositeScore({ lstDayC: 46 });
  assert.ok(result.hazards.heat > 0);
  assert.equal(result.hazards.flood, null);
  assert.equal(result.hazards.air, null);
  assert.equal(result.score, null);
  assert.equal(result.band, 'insufficient_data');
  assert.equal(result.coverage, WEIGHTS.heat);
});

test('a fully null cell has no hazard scores', () => {
  const result = compositeScore({});
  assert.deepEqual(Object.values(result.hazards), [null, null, null, null, null]);
  assert.equal(result.band, 'insufficient_data');
});

test('composite renormalises over non-null hazards', () => {
  const full = hazardScores(FULL);
  const noAir = compositeScore({ ...FULL, no2: null, co: null, so2: null, aai: null });
  const rest = HAZARDS.filter((h) => h !== 'air');
  const expected =
    rest.reduce((sum, h) => sum + WEIGHTS[h] * full[h], 0) /
    rest.reduce((sum, h) => sum + WEIGHTS[h], 0);
  assert.equal(noAir.hazards.air, null);
  assert.ok(Math.abs(noAir.score - expected) < 1e-9);
  assert.ok(Math.abs(noAir.coverage - 0.85) < 1e-9);
});

test('a missing term is dropped within its hazard', () => {
  const scores = hazardScores({ lstDayC: 40, uhiC: null });
  assert.ok(Math.abs(scores.heat - 50) < 1e-9);
});

test('band edges are 70 / 45 / 25', () => {
  assert.equal(bandOf(70), 'high');
  assert.equal(bandOf(69.99), 'elevated');
  assert.equal(bandOf(45), 'elevated');
  assert.equal(bandOf(44.99), 'moderate');
  assert.equal(bandOf(25), 'moderate');
  assert.equal(bandOf(24.99), 'low');
  assert.equal(bandOf(0), 'low');
  assert.equal(bandOf(null), 'insufficient_data');
});

test('drivers are the top two hazards by weighted score', () => {
  const result = compositeScore(FULL);
  assert.equal(result.drivers.length, 2);
  const weighted = HAZARDS.map((h) => [h, WEIGHTS[h] * result.hazards[h]]).sort((a, b) => b[1] - a[1]);
  assert.deepEqual(result.drivers, [weighted[0][0], weighted[1][0]]);
});

test('openmeteo pipeline uses ug/m3 air thresholds', () => {
  const m = { no2: 20, co: 2000, so2: 20, aod: 0.5 };
  assert.ok(Math.abs(hazardScores(m, { pipeline: 'openmeteo' }).air - 50) < 1e-9);
});
