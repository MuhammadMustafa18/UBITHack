/**
 * @module simulation/resourceDefenseGame
 * @description Interactive Resource Defense & Emergency Logistics Simulation Game.
 * Models nationwide resource dispatching (Firetrucks, Swift-Water Rescue Boats, Manpower Crews)
 * against incoming flood crest wavefronts:
 *  - Calculates safeguard requirements and deficit for the next affected downstream zone.
 *  - Deducts from nationwide pool (currency & manpower constraints).
 *  - Dispatches animated Uber-like vehicles (moving cars / firetrucks / boats) driving along road
 *    routes across Cesium terrain towards the target hotspot.
 *  - Increases safeguard defense percentage upon arrival.
 */

import * as Cesium from 'cesium';

export const NATIONAL_DEPOTS = [
  { id: 'depot_pindi', name: 'Rawalpindi / Islamabad 101 Logistics Depot', lat: 33.60, lon: 73.04 },
  { id: 'depot_peshawar', name: 'Peshawar Valley Rescue 1122 HQ', lat: 34.01, lon: 71.54 },
  { id: 'depot_lahore', name: 'Lahore Central NDMA Relief Reserve', lat: 31.52, lon: 74.35 },
  { id: 'depot_multan', name: 'Multan Southern Punjab Staging Base', lat: 30.20, lon: 71.48 },
  { id: 'depot_sukkur', name: 'Sukkur Barrage Emergency Marine Depot', lat: 27.70, lon: 68.85 },
  { id: 'depot_karachi', name: 'Karachi Port & Coastal Relief Command', lat: 24.86, lon: 67.02 },
];

export const RESOURCE_TYPES = {
  firetruck: {
    id: 'firetruck',
    name: 'Firetruck / Dewatering Pump',
    shortName: 'Firetruck',
    manpowerCost: 8,
    defenseValue: 20,
    speedKmH: 75,
    color: '#ef4444',
    iconSvg: `<svg viewBox="0 0 24 24" class="res-game-svg"><path fill="currentColor" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66h14V17z"/><circle cx="7.5" cy="14.5" r="1.5" fill="currentColor"/><circle cx="16.5" cy="14.5" r="1.5" fill="currentColor"/></svg>`,
  },
  boat: {
    id: 'boat',
    name: 'Swift-Water Rescue Flotilla',
    shortName: 'Rescue Boat',
    manpowerCost: 4,
    defenseValue: 15,
    speedKmH: 55,
    color: '#0284c7',
    iconSvg: `<svg viewBox="0 0 24 24" class="res-game-svg"><path fill="currentColor" d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.47L19 11V7l-4-4-4 4v4l-2.28.17c-.26.05-.48.23-.6.47s-.14.52-.06.78L3.95 19zM13 5.83l2 2V11h-4V7.83l2-2z"/></svg>`,
  },
  crew: {
    id: 'crew',
    name: 'Rapid Disaster Manpower Crew',
    shortName: 'Manpower Crew (25x)',
    manpowerCost: 25,
    defenseValue: 25,
    speedKmH: 80,
    color: '#16a34a',
    iconSvg: `<svg viewBox="0 0 24 24" class="res-game-svg"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
  },
};

export class ResourceDefenseGame {
  constructor(viewer, floodEngine) {
    this.viewer = viewer;
    this.floodEngine = floodEngine;
    this.active = false;

    // Nationwide Resource Pool (Current budget / currency)
    this.pool = {
      firetrucks: 24,
      boats: 40,
      manpower: 500,
      rations: 10000,
    };

    // Active Dispatches (Moving vehicles on 3D globe)
    this.dispatches = [];
    this.incidentAssignments = new Map();
    this._dispatchCounter = 0;
    this._entities = [];
    this._animFrame = null;
    this._unsubscribe = null;

    // Target Safeguard State for current upcoming waypoint
    this.targetState = {
      targetWp: null,
      etaHours: 3.5,
      requiredDefense: 100,
      currentDefense: 0,
      safeguardPct: 0,
      requiredFiretrucks: 4,
      requiredBoats: 6,
      requiredManpower: 120,
      arrivedFiretrucks: 0,
      arrivedBoats: 0,
      arrivedManpower: 0,
      status: 'DEFICIT (VULNERABLE)',
    };

    this._listeners = new Set();
    this._init();
  }

  _init() {
    if (this.floodEngine) {
      this._unsubscribe = this.floodEngine.subscribe((tel) => {
        this._onTelemetry(tel);
      });
    }
    this._startLoop();
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    for (const fn of this._listeners) {
      try {
        fn(this.getState());
      } catch (e) {
        console.warn('[ResourceDefenseGame] listener error:', e);
      }
    }
  }

  getState() {
    return {
      pool: { ...this.pool },
      targetState: { ...this.targetState },
      activeDispatchesCount: this.dispatches.length,
      dispatches: this.dispatches.map((d) => ({
        id: d.id,
        type: d.type.id,
        typeName: d.type.name,
        progress: d.progress,
        etaMin: Math.max(1, Math.round((1 - d.progress) * d.simDurationMin)),
      })),
      incidentAssignments: [...this.incidentAssignments.values()].map((a) => ({ ...a })),
    };
  }

  _onTelemetry(tel) {
    if (!tel || !tel.active) return;

    const waypoints = this.floodEngine.waypoints || [];
    const simHours = tel.simHours || 0;

    // Find immediate upcoming impact waypoint
    let nextWp = null;
    for (const wp of waypoints) {
      if (wp.timeHours > simHours) {
        nextWp = wp;
        break;
      }
    }

    if (!nextWp) {
      // Last waypoint or scenario complete
      nextWp = waypoints[waypoints.length - 1] || null;
    }

    if (nextWp && (!this.targetState.targetWp || this.targetState.targetWp.id !== nextWp.id)) {
      // Switched to a new downstream target
      this.targetState.targetWp = nextWp;
      this.targetState.etaHours = Math.max(0.2, nextWp.timeHours - simHours);

      // Scale requirements based on waypoint flood discharge
      const mult = this.floodEngine.magnitudeMultiplier || 1.0;
      const discharge = (nextWp.dischargeCusecs || 350000) * mult;

      if (discharge > 800000) {
        this.targetState.requiredFiretrucks = 6;
        this.targetState.requiredBoats = 10;
        this.targetState.requiredManpower = 180;
      } else if (discharge > 400000) {
        this.targetState.requiredFiretrucks = 4;
        this.targetState.requiredBoats = 6;
        this.targetState.requiredManpower = 120;
      } else {
        this.targetState.requiredFiretrucks = 2;
        this.targetState.requiredBoats = 4;
        this.targetState.requiredManpower = 60;
      }

      this.targetState.arrivedFiretrucks = 0;
      this.targetState.arrivedBoats = 0;
      this.targetState.arrivedManpower = 0;
      this.targetState.currentDefense = 0;
      this.targetState.safeguardPct = 0;
      this.targetState.status = 'DEFICIT (HIGH RISK)';
    } else if (nextWp) {
      this.targetState.etaHours = Math.max(0.1, nextWp.timeHours - simHours);
    }

    this._notify();
  }

  /**
   * Dispatch a resource to the active downstream target
   */
  dispatchResource(resourceTypeId, { target, incidentId } = {}) {
    const resType = RESOURCE_TYPES[resourceTypeId];
    if (!resType) return { success: false, reason: 'Invalid resource type' };
    if (incidentId && this.incidentAssignments.has(incidentId)) {
      return { success: false, reason: 'This incident already has an assignment.' };
    }
    if (target && (!Number.isFinite(target.lat) || !Number.isFinite(target.lon) ||
      Math.abs(target.lat) > 90 || Math.abs(target.lon) > 180)) {
      return { success: false, reason: 'Valid incident coordinates are required.' };
    }

    // Check pool limits
    if (resourceTypeId === 'firetruck' && this.pool.firetrucks <= 0) {
      return { success: false, reason: 'No Firetrucks available nationwide!' };
    }
    if (resourceTypeId === 'boat' && this.pool.boats <= 0) {
      return { success: false, reason: 'No Rescue Boats available nationwide!' };
    }
    if (this.pool.manpower < resType.manpowerCost) {
      return { success: false, reason: 'Insufficient manpower reserve!' };
    }

    const targetWp = target || this.targetState.targetWp;
    if (!targetWp) {
      return { success: false, reason: 'No active flood target to safeguard!' };
    }

    // Deduct from pool
    if (resourceTypeId === 'firetruck') this.pool.firetrucks -= 1;
    if (resourceTypeId === 'boat') this.pool.boats -= 1;
    this.pool.manpower -= resType.manpowerCost;

    // Pick nearest depot
    const depot = this._findNearestDepot(targetWp.lat, targetWp.lon);

    // Calculate distance & travel time
    const distKm = this._haversineKm(depot.lat, depot.lon, targetWp.lat, targetWp.lon);
    const simDurationMin = Math.max(15, Math.round((distKm / resType.speedKmH) * 60));

    this._dispatchCounter++;
    const dispatchId = `dispatch_${this._dispatchCounter}`;

    const dispatchObj = {
      id: dispatchId,
      incidentId,
      type: resType,
      depot: depot,
      target: targetWp,
      startTime: Date.now(),
      simDurationMs: 14000, // 14 real-time seconds for animated travel across terrain
      simDurationMin: simDurationMin,
      progress: 0,
      carEntity: null,
      lineEntity: null,
    };

    // Create moving Uber-like car entity in Cesium
    if (this.viewer && this.viewer.entities) {
      // 1. Transit Route Dashed Line
      const lineEntity = this.viewer.entities.add({
        name: `Transit Route: ${resType.shortName} -> ${targetWp.name}`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            depot.lon, depot.lat,
            targetWp.lon, targetWp.lat,
          ]),
          width: 2.5,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString(resType.color).withAlpha(0.75),
            dashLength: 14.0,
          }),
        },
      });
      dispatchObj.lineEntity = lineEntity;
      this._entities.push(lineEntity);

      // 2. Animated Moving Car / Vehicle Marker
      const carEntity = this.viewer.entities.add({
        name: `${resType.name} Unit #${this._dispatchCounter}`,
        position: Cesium.Cartesian3.fromDegrees(depot.lon, depot.lat, 250),
        point: {
          pixelSize: 12,
          color: Cesium.Color.fromCssColorString(resType.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${resType.shortName} #${this._dispatchCounter}\nETA: ${simDurationMin}m`,
          font: 'bold 11px "Space Grotesk", sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#17171c'),
          outlineWidth: 3,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#17171c').withAlpha(0.85),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 5.0e6, 0.4),
        },
      });
      dispatchObj.carEntity = carEntity;
      this._entities.push(carEntity);
    }

    this.dispatches.push(dispatchObj);
    if (incidentId) {
      this.incidentAssignments.set(incidentId, {
        incidentId, dispatchId, type: resourceTypeId, status: 'EN ROUTE',
        depotName: depot.name, etaMin: simDurationMin,
      });
    }
    this._notify();

    return {
      success: true,
      dispatchId,
      depotName: depot.name,
      simDurationMin: simDurationMin,
    };
  }

  _startLoop() {
    const tick = () => {
      this._updateDispatches();
      this._animFrame = requestAnimationFrame(tick);
    };
    this._animFrame = requestAnimationFrame(tick);
  }

  _updateDispatches() {
    if (this.dispatches.length === 0) return;

    const now = Date.now();
    const remaining = [];

    for (const d of this.dispatches) {
      const elapsed = now - d.startTime;
      const t = Math.min(1.0, elapsed / d.simDurationMs);
      d.progress = t;

      // Interpolate coordinates along route
      const curLon = d.depot.lon + (d.target.lon - d.depot.lon) * t;
      const curLat = d.depot.lat + (d.target.lat - d.depot.lat) * t;

      if (d.carEntity && d.carEntity.position) {
        d.carEntity.position.setValue(
          Cesium.Cartesian3.fromDegrees(curLon, curLat, 250)
        );
        const remMin = Math.max(1, Math.round((1 - t) * d.simDurationMin));
        if (d.carEntity.label) {
          d.carEntity.label.text = `${d.type.shortName} #${d.id.split('_')[1]}\nETA: ${remMin}m`;
        }
      }

      if (t >= 1.0) {
        // Vehicle arrived at target hotspot!
        this._onVehicleArrival(d);
      } else {
        remaining.push(d);
      }
    }

    if (remaining.length !== this.dispatches.length) {
      this.dispatches = remaining;
      this._notify();
    }
  }

  _onVehicleArrival(dispatchObj) {
    const resType = dispatchObj.type;

    // Remove Cesium entities
    if (this.viewer && this.viewer.entities) {
      if (dispatchObj.carEntity) this.viewer.entities.remove(dispatchObj.carEntity);
      if (dispatchObj.lineEntity) this.viewer.entities.remove(dispatchObj.lineEntity);
    }
    this._entities = this._entities.filter((entity) =>
      entity !== dispatchObj.carEntity && entity !== dispatchObj.lineEntity);

    if (dispatchObj.incidentId) {
      const assignment = this.incidentAssignments.get(dispatchObj.incidentId);
      if (assignment) assignment.status = 'ON SCENE';
      this._notify();
      return;
    }

    // A delivery to an earlier target must not defend a different downstream town.
    if (dispatchObj.target !== this.targetState.targetWp) return;

    // Apply defense boost
    this.targetState.currentDefense += resType.defenseValue;
    if (resType.id === 'firetruck') this.targetState.arrivedFiretrucks += 1;
    if (resType.id === 'boat') this.targetState.arrivedBoats += 1;
    if (resType.id === 'crew') this.targetState.arrivedManpower += 25;

    this.targetState.safeguardPct = Math.min(100, Math.round(
      (this.targetState.currentDefense / this.targetState.requiredDefense) * 100
    ));

    if (this.targetState.safeguardPct >= 100) {
      this.targetState.status = 'SECURED (LEVEES DEFENDED)';
    } else if (this.targetState.safeguardPct >= 60) {
      this.targetState.status = 'PARTIAL DEFENSE (60%+)';
    } else {
      this.targetState.status = 'DEFICIT (CRITICAL)';
    }

    // Ping effect at destination
    this._triggerArrivalPing(dispatchObj.target.lon, dispatchObj.target.lat, resType.color);
    this._notify();
  }

  _triggerArrivalPing(lon, lat, colorHex) {
    if (!this.viewer || !this.viewer.entities) return;

    const ping = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      ellipse: {
        semiMinorAxis: 1800,
        semiMajorAxis: 1800,
        material: new Cesium.ColorMaterialProperty(
          Cesium.Color.fromCssColorString(colorHex).withAlpha(0.4)
        ),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });

    setTimeout(() => {
      if (this.viewer && this.viewer.entities) {
        this.viewer.entities.remove(ping);
      }
    }, 2500);
  }

  _findNearestDepot(lat, lon) {
    let nearest = NATIONAL_DEPOTS[0];
    let minDist = Number.POSITIVE_INFINITY;

    for (const d of NATIONAL_DEPOTS) {
      const dist = this._haversineKm(lat, lon, d.lat, d.lon);
      if (dist < minDist) {
        minDist = dist;
        nearest = d;
      }
    }
    return nearest;
  }

  _haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  completeIncident(incidentId) {
    const assignment = this.incidentAssignments.get(incidentId);
    if (!assignment || assignment.status !== 'ON SCENE') {
      return { success: false, reason: 'Confirm completion after the unit arrives.' };
    }
    const type = RESOURCE_TYPES[assignment.type];
    if (type.id === 'boat') this.pool.boats += 1;
    if (type.id === 'firetruck') this.pool.firetrucks += 1;
    this.pool.manpower += type.manpowerCost;
    assignment.status = 'COMPLETED';
    this._notify();
    return { success: true };
  }

  resetPool() {
    // Active incident reservations cannot be erased by the map's reset control.
    if ([...this.incidentAssignments.values()].some((a) => a.status !== 'COMPLETED')) {
      return false;
    }
    this.pool = {
      firetrucks: 24,
      boats: 40,
      manpower: 500,
      rations: 10000,
    };
    this._clearEntities();
    this.dispatches = [];
    this.incidentAssignments.clear();
    this._notify();
    return true;
  }

  _clearEntities() {
    if (this.viewer && this.viewer.entities) {
      for (const ent of this._entities) {
        this.viewer.entities.remove(ent);
      }
    }
    this._entities = [];
  }

  destroy() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    this._clearEntities();
  }
}
