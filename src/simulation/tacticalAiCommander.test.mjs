import assert from 'node:assert/strict';
import test from 'node:test';
import { TacticalAiCommander } from './tacticalAiCommander.js';

test('commander context uses current reviewed incidents, not the initial seed reports', () => {
  const context = TacticalAiCommander.prototype.getOperationalContext.call({
    getIncidents: () => [
      { id: 'new-report', district: 'New location', rank: 'P1 · Life threat', message: 'Children stranded', resource: 'boat', status: 'PENDING DISPATCH' },
      { id: 'done', district: 'Completed location', message: 'Resolved report', status: 'COMPLETED' },
    ],
  });
  assert.match(context.sosSummary, /new-report/);
  assert.match(context.sosSummary, /boat/);
  assert.doesNotMatch(context.sosSummary, /Completed location/);
  assert.doesNotMatch(context.sosSummary, /undefined/);
});

test('commander can initialize before the dashboard publishes incident state', () => {
  const context = TacticalAiCommander.prototype.getOperationalContext.call({});
  assert.match(context.sosSummary, /sos-101/);
  assert.doesNotMatch(context.sosSummary, /undefined/);
});
