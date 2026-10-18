export const RESCUE_RESOURCES = {
  boat: { label: 'Rescue boat', pool: 'boats', crew: 4 },
  firetruck: { label: 'Dewatering pump', pool: 'firetrucks', crew: 8 },
  crew: { label: 'Response crew', pool: null, crew: 25 },
};

const PRIORITIES = {
  life: { score: 90, rank: 'P1 · Life threat', badge: 'p1-critical' },
  medical: { score: 75, rank: 'P2 · Medical', badge: 'p2-medical' },
  stranded: { score: 55, rank: 'P3 · Stranded', badge: 'p3-evac' },
  supply: { score: 30, rank: 'P4 · Support', badge: 'p4-supply' },
};

export function distanceKm(a, b) {
  const rad = (n) => n * Math.PI / 180;
  const dLat = rad(a[1] - b[1]);
  const dLon = rad(a[0] - b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) *
    Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function validateIncident(incident) {
  return typeof incident.id === 'string' && incident.id.length > 0 &&
    Object.hasOwn(PRIORITIES, incident.danger) &&
    Object.hasOwn(RESCUE_RESOURCES, incident.resource) &&
    typeof incident.message === 'string' && incident.message.trim().length > 0 &&
    Array.isArray(incident.coords) && incident.coords.length === 2 &&
    incident.coords.every(Number.isFinite) &&
    Math.abs(incident.coords[0]) <= 180 && Math.abs(incident.coords[1]) <= 90;
}

export function rankIncidents(incidents, telemetry) {
  return incidents.map((incident) => {
    const priority = PRIORITIES[incident.danger];
    if (!validateIncident(incident)) throw new Error('Invalid incident details.');
    const nearCrest = telemetry?.active && Number.isFinite(telemetry.crestLon) &&
      Number.isFinite(telemetry.crestLat) && distanceKm(incident.coords,
        [telemetry.crestLon, telemetry.crestLat]) <= 25;
    const score = Math.min(100, priority.score + (incident.vulnerable ? 5 : 0) +
      (nearCrest ? 5 : 0));
    return { ...incident, score, rank: priority.rank, badgeClass: priority.badge,
      reason: `${priority.rank.split(' · ')[1]} reported${incident.vulnerable ? '; vulnerable people reported' : ''}.${nearCrest ? ' Within 25 km of the simulated flood crest (+5). Proximity is illustrative, not a flood exposure forecast.' : ''}` };
  }).sort((a, b) => b.score - a.score || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export function canDispatch(incident, state, type = incident.resource) {
  if (!validateIncident(incident)) return 'Valid incident details and coordinates are required.';
  if (incident.status === 'COMPLETED') return 'Incident is already completed.';
  if (state.incidentAssignments?.some((a) => a.incidentId === incident.id)) return 'Incident already has an assignment.';
  if (incident.routeBlocked) return 'Access is blocked. Review access before dispatch.';
  if (type !== incident.resource) return 'This resource does not match the reviewed incident need.';
  const resource = RESCUE_RESOURCES[type];
  if (resource.pool && !(state.pool[resource.pool] > 0)) return `No ${resource.label.toLowerCase()} available.`;
  if (!(state.pool.manpower >= resource.crew)) return 'Insufficient available personnel.';
  return null;
}

export function allocationPlan(ranked, state) {
  const remaining = { ...state, pool: { ...state.pool } };
  return ranked.filter((incident) => incident.status !== 'COMPLETED' &&
    !state.incidentAssignments?.some((a) => a.incidentId === incident.id)).map((incident) => {
    const blocked = canDispatch(incident, remaining);
    const resource = RESCUE_RESOURCES[incident.resource];
    if (!blocked) {
      if (resource.pool) remaining.pool[resource.pool] -= 1;
      remaining.pool.manpower -= resource.crew;
    }
    return { incidentId: incident.id, type: incident.resource, blocked,
      reason: blocked || `${incident.reason} Allocate one ${resource.label.toLowerCase()} with ${resource.crew} personnel. Higher-ranked needs receive resources first.` };
  });
}
