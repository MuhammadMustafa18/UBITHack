import assert from 'node:assert/strict';
import test from 'node:test';
import { check, extractNumbers } from './grounding.js';

const RESULTS = [
  {
    id: 'sukkur:12:7',
    metrics: { lstDayC: 46.2, sarFloodFrac: 0.42, pop: 18450 },
    composite: { score: 61, band: 'elevated' },
  },
];

test('extractNumbers handles separators, units and Urdu digits', () => {
  assert.deepEqual(extractNumbers('18,450 people at 46.2°C and 42%'), [18450, 46.2, 42]);
  assert.deepEqual(extractNumbers('۴۶٫۲'), [46.2]);
  assert.deepEqual(extractNumbers('٤٦٫٢'), [46.2]);
});

test('a quoted tool value passes', () => {
  assert.deepEqual(check('Peak temperature is 46.2°C here.', RESULTS), { ok: true, unknown: [] });
});

test('an invented number fails', () => {
  assert.deepEqual(check('Peak temperature is 47°C here.', RESULTS), { ok: false, unknown: [47] });
});

test('a percent of a fraction passes', () => {
  assert.equal(check('42% of the cell was flooded.', RESULTS).ok, true);
});

test('Urdu digits are grounded', () => {
  assert.equal(check('درجہ حرارت ۴۶٫۲ ہے', RESULTS).ok, true);
  assert.equal(check('درجہ حرارت ۴۷٫۲ ہے', RESULTS).ok, false);
});

test('thousands separators and coarser precision pass', () => {
  assert.equal(check('About 18,450 residents; roughly 46°C.', RESULTS).ok, true);
  assert.equal(check('46.25°C', RESULTS).ok, false);
});

test('years and small ordinals are allowed', () => {
  assert.equal(check('1. Cell in 2022 ranks 3.', RESULTS).ok, true);
  assert.equal(check('Score 61 for 2022.', RESULTS).ok, true);
  assert.equal(check('Score 62.', RESULTS).ok, false);
});
