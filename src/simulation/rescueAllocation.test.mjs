import assert from 'node:assert/strict';
import test from 'node:test';
import { rankIncidents, allocationPlan, canDispatch } from './rescueAllocation.js';

const incident = (id, danger = 'stranded', extra = {}) => ({
  id, danger, resource: 'boat', message: 'People stranded', coords: [71.98, 34.01],
  createdAt: 1, status: 'PENDING DISPATCH', ...extra,
});
const state = () => ({ pool: { boats: 1, firetrucks: 1, manpower: 8 }, incidentAssignments: [] });

test('scarce resources go to higher urgency; planning never mutates the pool', () => {
  const resources = state();
  const ranked = rankIncidents([incident('low'), incident('high', 'life')]);
  const plan = allocationPlan(ranked, resources);
  assert.equal(plan[0].incidentId, 'high');
  assert.equal(plan[0].blocked, null);
  assert.match(plan[1].blocked, /No rescue boat/);
  assert.equal(resources.pool.boats, 1);
});

test('availability, capability, access and duplicate checks are enforced', () => {
  assert.match(canDispatch(incident('a'), { ...state(), pool: { boats: 1, manpower: 3 } }), /personnel/);
  assert.match(canDispatch(incident('a'), state(), 'crew'), /match/);
  assert.match(canDispatch(incident('a', 'life', { routeBlocked: true }), state()), /blocked/);
  assert.match(canDispatch(incident('a'), { ...state(), incidentAssignments: [{ incidentId: 'a' }] }), /already/);
  assert.match(canDispatch(incident('a', 'life', { coords: [NaN, 12] }), state()), /coordinates/);
  assert.throws(() => rankIncidents([incident('a', 'invented')]), /Invalid/);
});

test('flood proximity and reported vulnerability change rank transparently', () => {
  const ranked = rankIncidents([
    incident('far', 'stranded', { coords: [67, 25] }),
    incident('near', 'stranded', { vulnerable: true }),
  ], { active: true, crestLon: 71.98, crestLat: 34.01 });
  assert.equal(ranked[0].id, 'near');
  assert.equal(ranked[0].score, 65);
  assert.match(ranked[0].reason, /illustrative/);
});

test('assigned and completed incidents are excluded; blocked incidents do not consume stock', () => {
  const ranked = rankIncidents([
    incident('blocked', 'life', { routeBlocked: true }),
    incident('assigned'), incident('done', 'life', { status: 'COMPLETED' }), incident('ready'),
  ]);
  const plan = allocationPlan(ranked, { ...state(), incidentAssignments: [{ incidentId: 'assigned' }] });
  assert.deepEqual(plan.map((p) => p.incidentId), ['blocked', 'ready']);
  assert.equal(plan[1].blocked, null);
});
