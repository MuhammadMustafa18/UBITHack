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

test('questions and negated commands never dispatch resources', () => {
  let calls = 0;
  const commander = { resourceDefenseGame: { dispatchResource() { calls += 1; return { success: false, reason: 'Test' }; } } };
  for (const question of ['How much manpower is left?', 'Do not deploy boat', 'Should I dispatch firetruck?', 'Explain how to send crew']) {
    assert.equal(TacticalAiCommander.prototype._handleDirectCommand.call(commander, question), null);
  }
  assert.equal(calls, 0);
  assert.match(TacticalAiCommander.prototype._handleDirectCommand.call(commander, 'Deploy Boat'), /DISPATCH FAILED/);
  assert.equal(calls, 1);
});
