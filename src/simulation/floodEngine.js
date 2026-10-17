/**
 * @module simulation/floodEngine
 * @description Real-time 3D physics-based flood & GLOF simulation engine for CesiumJS.
 * Computes downstream flood wave propagation, river corridor expansion,
 * and floodplain inundation across Pakistan.
 */

import * as Cesium from 'cesium';
import {
  GLOF_ORIGIN,
  INDUS_FLOW_WAYPOINTS,
  INUNDATION_ZONES,
} from './flowData.js';

export class FloodSimulationEngine {
  constructor(viewer) {
    this.viewer = viewer;
    this.active = false;
    this.playing = false;
    this.simHours = 0;
    this.maxHours = 72;
    this.speed = 5; // hours per real second = 5x
    this.followCrest = true;

    this._listeners = new Set();
    this._animationFrame = null;
    this._lastRealTime = null;

    // Cesium entity handles
    this._entities = [];
    this._corridorEntity = null;
    this._crestMarkerEntity = null;
    this._glacierPulseEntity = null;
    this._zoneEntities = new Map();
  }

  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notify() {
    const telemetry = this.getCurrentTelemetry();
    for (const listener of this._listeners) {
      try {
        listener(telemetry);
      } catch (err) {
        console.error('[FloodEngine] Listener error:', err);
      }
    }
  }

  getCurrentTelemetry() {
    // Find active waypoint reach
    let currentWp = INDUS_FLOW_WAYPOINTS[0];
    let nextWp = INDUS_FLOW_WAYPOINTS[1];

    for (let i = 0; i < INDUS_FLOW_WAYPOINTS.length - 1; i++) {
      if (this.simHours >= INDUS_FLOW_WAYPOINTS[i].timeHours) {
        currentWp = INDUS_FLOW_WAYPOINTS[i];
        nextWp = INDUS_FLOW_WAYPOINTS[i + 1] || currentWp;
      }
    }

    // Interpolation fraction between waypoints
    const duration = Math.max(0.1, nextWp.timeHours - currentWp.timeHours);
    const frac = Math.min(
      1,
      Math.max(0, (this.simHours - currentWp.timeHours) / duration),
    );

    const discharge = Math.round(
      currentWp.dischargeCusecs +
        (nextWp.dischargeCusecs - currentWp.dischargeCusecs) * frac,
    );
    const stageRise = Number(
      (
        currentWp.stageRiseM +
        (nextWp.stageRiseM - currentWp.stageRiseM) * frac
      ).toFixed(1),
    );

    // Interpolated crest coordinates
    const crestLat = currentWp.lat + (nextWp.lat - currentWp.lat) * frac;
    const crestLon = currentWp.lon + (nextWp.lon - currentWp.lon) * frac;
    const crestAlt = currentWp.alt + (nextWp.alt - currentWp.alt) * frac;

    return {
      active: this.active,
      playing: this.playing,
      simHours: this.simHours,
      speed: this.speed,
      followCrest: this.followCrest,
      locationName: currentWp.name,
      nextLocationName: nextWp.name,
      status: currentWp.status,
      dischargeCusecs: discharge,
      stageRiseM: stageRise,
      crestLat,
      crestLon,
      crestAlt,
      percentComplete: Math.min(100, (this.simHours / this.maxHours) * 100),
    };
  }

  /**
   * Start the flood simulation from T+0h at Shisper Glacier
   */
  start() {
    if (this.active) return;
    this.active = true;
    this.playing = true;
    this.simHours = 0;
    this._lastRealTime = performance.now();

    this._createPrimitives();

    // Fly camera initially to Shisper Glacier breach point
    if (this.viewer && this.viewer.camera) {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          GLOF_ORIGIN.lon,
          GLOF_ORIGIN.lat - 0.08,
          GLOF_ORIGIN.alt + 4500,
        ),
        orientation: {
          heading: Cesium.Math.toRadians(15),
          pitch: Cesium.Math.toRadians(-35),
          roll: 0,
        },
        duration: 2.5,
      });
    }

    this._startLoop();
    this._notify();
  }

  pause() {
    this.playing = false;
    this._lastRealTime = null;
    this._notify();
  }

  resume() {
    if (!this.active) {
      this.start();
      return;
    }
    this.playing = true;
    this._lastRealTime = performance.now();
    this._notify();
  }

  togglePlay() {
    if (this.playing) {
      this.pause();
    } else {
      this.resume();
    }
  }

  setSpeed(multiplier) {
    this.speed = Math.max(0.5, Math.min(120, Number(multiplier) || 5));
    this._notify();
  }

  seek(hours) {
    this.simHours = Math.max(0, Math.min(this.maxHours, Number(hours) || 0));
    this._updateVisuals();
    this._notify();
  }

  toggleFollowCrest() {
    this.followCrest = !this.followCrest;
    this._notify();
  }

  exit() {
    this.active = false;
    this.playing = false;
    this.simHours = 0;
    this._lastRealTime = null;

    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }

    this._clearPrimitives();
    this._notify();
  }

  _startLoop() {
    const tick = (now) => {
      if (!this.active) return;

      if (this.playing) {
        if (!this._lastRealTime) this._lastRealTime = now;
        const deltaSec = (now - this._lastRealTime) / 1000;
        this._lastRealTime = now;

        // Advance simulation clock
        // e.g. at 5x speed, 1 real second = 5 simulation hours
        this.simHours += (deltaSec * this.speed) / 2.0;

        if (this.simHours >= this.maxHours) {
          this.simHours = this.maxHours;
          this.playing = false;
        }

        this._updateVisuals();
        this._notify();
      }

      this._animationFrame = requestAnimationFrame(tick);
    };

    this._animationFrame = requestAnimationFrame(tick);
  }

  _createPrimitives() {
    this._clearPrimitives();
    if (!this.viewer || !this.viewer.entities) return;

    // 1. Glacier Rupture Beacon at Shisper Glacier
    this._glacierPulseEntity = this.viewer.entities.add({
      name: 'GLOF Glacier Moraine Rupture Point',
      position: Cesium.Cartesian3.fromDegrees(
        GLOF_ORIGIN.lon,
        GLOF_ORIGIN.lat,
        GLOF_ORIGIN.alt + 20,
      ),
      point: {
        pixelSize: 18,
        color: Cesium.Color.fromCssColorString('#00f0ff'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      ellipse: {
        semiMajorAxis: 1800,
        semiMinorAxis: 1800,
        material: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.35),
        height: GLOF_ORIGIN.alt + 5,
      },
    });
    this._entities.push(this._glacierPulseEntity);

    // 2. Dynamic Flood Water Corridor (central river torrent)
    this._corridorEntity = this.viewer.entities.add({
      name: 'Dynamic Flood Wave Inundation Corridor',
      corridor: {
        positions: new Cesium.CallbackProperty(() => {
          return this._getActiveCorridorCartesians();
        }, false),
        width: new Cesium.CallbackProperty(() => {
          return this._getActiveCorridorWidth();
        }, false),
        material: new Cesium.ColorMaterialProperty(
          Cesium.Color.fromCssColorString('#0077b6').withAlpha(0.72),
        ),
        cornerType: Cesium.CornerType.ROUNDED,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
    this._entities.push(this._corridorEntity);

    // 2b. Dynamic Radial Lateral Spillover Pools (Water grows outwards laterally)
    for (const wp of INDUS_FLOW_WAYPOINTS) {
      // Core deep floodwater expanding outward
      const poolEntity = this.viewer.entities.add({
        name: `${wp.name} - Lateral Inundation Pool`,
        position: Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat),
        show: new Cesium.CallbackProperty(() => {
          return this.simHours > wp.timeHours;
        }, false),
        ellipse: {
          semiMajorAxis: new Cesium.CallbackProperty(() => {
            const elapsed = Math.max(0, this.simHours - wp.timeHours);
            const progress = Math.min(1, Math.sqrt(elapsed / 10.0));
            return Math.max(50.0, wp.radialSpillRadiusM * progress);
          }, false),
          semiMinorAxis: new Cesium.CallbackProperty(() => {
            const elapsed = Math.max(0, this.simHours - wp.timeHours);
            const progress = Math.min(1, Math.sqrt(elapsed / 10.0));
            return Math.max(35.0, wp.radialSpillRadiusM * progress * 0.75);
          }, false),
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty(() => {
              const elapsed = Math.max(0, this.simHours - wp.timeHours);
              const alpha = Math.min(0.68, 0.2 + (elapsed / 14.0) * 0.48);
              return Cesium.Color.fromCssColorString('#0077b6').withAlpha(alpha);
            }, false),
          ),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      this._entities.push(poolEntity);

      // Outer shallow flood silt watermark expanding even wider
      const edgeEntity = this.viewer.entities.add({
        name: `${wp.name} - Shallow Inundation Edge`,
        position: Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat),
        show: new Cesium.CallbackProperty(() => {
          return this.simHours > wp.timeHours;
        }, false),
        ellipse: {
          semiMajorAxis: new Cesium.CallbackProperty(() => {
            const elapsed = Math.max(0, this.simHours - wp.timeHours);
            const progress = Math.min(1, Math.sqrt(elapsed / 10.0));
            return Math.max(70.0, wp.radialSpillRadiusM * progress * 1.35);
          }, false),
          semiMinorAxis: new Cesium.CallbackProperty(() => {
            const elapsed = Math.max(0, this.simHours - wp.timeHours);
            const progress = Math.min(1, Math.sqrt(elapsed / 10.0));
            return Math.max(50.0, wp.radialSpillRadiusM * progress * 1.05);
          }, false),
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString('#00b4d8').withAlpha(0.25),
          ),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      this._entities.push(edgeEntity);
    }

    // 3. Flood Wave Leading Crest Marker
    this._crestMarkerEntity = this.viewer.entities.add({
      name: 'Flood Surge Leading Crest',
      position: new Cesium.CallbackProperty(() => {
        const tel = this.getCurrentTelemetry();
        return Cesium.Cartesian3.fromDegrees(
          tel.crestLon,
          tel.crestLat,
          tel.crestAlt + 15,
        );
      }, false),
      point: {
        pixelSize: 22,
        color: Cesium.Color.fromCssColorString('#ff0055'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      cylinder: {
        length: 800,
        topRadius: 150,
        bottomRadius: 0,
        material: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.6),
      },
    });
    this._entities.push(this._crestMarkerEntity);

    // 4. Inundation Plain Zones
    for (const zone of INUNDATION_ZONES) {
      const hierarchy = Cesium.Cartesian3.fromDegreesArray(
        zone.coordinates.flat(),
      );
      const zoneEntity = this.viewer.entities.add({
        name: zone.name,
        polygon: {
          hierarchy,
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty(() => {
              if (this.simHours < zone.minHours) {
                return Cesium.Color.fromCssColorString('#0096c7').withAlpha(0);
              }
              const progress = Math.min(
                1,
                (this.simHours - zone.minHours) /
                  (zone.peakHours - zone.minHours),
              );
              return Cesium.Color.fromCssColorString('#0096c7').withAlpha(
                0.2 + progress * 0.55,
              );
            }, false),
          ),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      this._zoneEntities.set(zone.id, zoneEntity);
      this._entities.push(zoneEntity);
    }
  }

  _clearPrimitives() {
    if (this.viewer && this.viewer.entities) {
      for (const ent of this._entities) {
        this.viewer.entities.remove(ent);
      }
    }
    this._entities = [];
    this._corridorEntity = null;
    this._crestMarkerEntity = null;
    this._glacierPulseEntity = null;
    this._zoneEntities.clear();
  }

  _getActiveCorridorCartesians() {
    const activeCoords = [];
    const tel = this.getCurrentTelemetry();

    // Include waypoints already passed by the flood wave
    for (const wp of INDUS_FLOW_WAYPOINTS) {
      if (this.simHours >= wp.timeHours) {
        activeCoords.push(Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat));
      }
    }

    // Add current dynamic leading crest tip
    activeCoords.push(
      Cesium.Cartesian3.fromDegrees(tel.crestLon, tel.crestLat),
    );

    // Cesium corridor requires at least 2 distinct positions
    if (activeCoords.length < 2) {
      const p1 = Cesium.Cartesian3.fromDegrees(
        INDUS_FLOW_WAYPOINTS[0].lon,
        INDUS_FLOW_WAYPOINTS[0].lat,
      );
      const p2 = Cesium.Cartesian3.fromDegrees(
        INDUS_FLOW_WAYPOINTS[1].lon,
        INDUS_FLOW_WAYPOINTS[1].lat,
      );
      return [p1, p2];
    }

    return activeCoords;
  }

  _getActiveCorridorWidth() {
    const tel = this.getCurrentTelemetry();
    let currentWp = INDUS_FLOW_WAYPOINTS[0];
    for (const wp of INDUS_FLOW_WAYPOINTS) {
      if (this.simHours >= wp.timeHours) {
        currentWp = wp;
      }
    }
    return currentWp.floodWidthM || 800;
  }

  _updateVisuals() {
    if (!this.active || !this.viewer) return;

    // Follow camera if enabled
    if (this.followCrest && this.playing) {
      const tel = this.getCurrentTelemetry();
      const camera = this.viewer.camera;

      // Adjust camera distance based on mountain gorge vs wide plain
      const rangeM = tel.crestAlt > 1000 ? 12000 : 35000;
      const pitchDeg = tel.crestAlt > 1000 ? -38 : -45;

      camera.lookAt(
        Cesium.Cartesian3.fromDegrees(tel.crestLon, tel.crestLat),
        new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(180), // Looking South down the Indus Basin
          Cesium.Math.toRadians(pitchDeg),
          rangeM,
        ),
      );
      // Unlock transform so user can still pan/tilt freely
      camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }
  }
}
