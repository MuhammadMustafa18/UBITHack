import assert from 'node:assert/strict';
import test from 'node:test';
import { ResourceDefenseGame } from './resourceDefenseGame.js';

globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
const target = { id: 'town', name: 'Demo town', lat: 34.01, lon: 71.98 };

test('incident dispatch reserves the shared pool, arrives and releases only once', () => {
  const game = new ResourceDefenseGame(null, null);
  const before = { ...game.pool };
  assert.equal(game.dispatchResource('boat', { target, incidentId: 'sos-1' }).success, true);
  assert.equal(game.pool.boats, before.boats - 1);
  assert.equal(game.pool.manpower, before.manpower - 4);
  assert.equal(game.dispatchResource('boat', { target, incidentId: 'sos-1' }).success, false);
  assert.equal(game.completeIncident('sos-1').success, false);
  assert.equal(game.resetPool(), false);
  game.dispatches[0].startTime -= 15000;
  game._updateDispatches();
  assert.equal(game.getState().incidentAssignments[0].status, 'ON SCENE');
  assert.equal(game.targetState.currentDefense, 0);
  assert.equal(game.completeIncident('sos-1').success, true);
  assert.deepEqual(game.pool, before);
  assert.equal(game.completeIncident('sos-1').success, false);
  game.destroy();
});

test('map dispatches and incident assignments cannot spend the same last unit', () => {
  const game = new ResourceDefenseGame(null, null);
  game.pool.boats = 1;
  game.targetState.targetWp = target;
  assert.equal(game.dispatchResource('boat').success, true);
  assert.equal(game.dispatchResource('boat', { target, incidentId: 'sos-2' }).success, false);
  assert.equal(game.pool.boats, 0);
  assert.equal(game.dispatchResource('crew', { target: { lat: NaN, lon: 2 }, incidentId: 'bad' }).success, false);
  game.destroy();
});

test('delivery to an old map target does not defend the current target', () => {
  const game = new ResourceDefenseGame(null, null);
  game.targetState.targetWp = target;
  game.dispatchResource('boat');
  game.targetState.targetWp = { ...target, id: 'other-town' };
  game.dispatches[0].startTime -= 15000;
  game._updateDispatches();
  assert.equal(game.targetState.currentDefense, 0);
  game.destroy();
});
