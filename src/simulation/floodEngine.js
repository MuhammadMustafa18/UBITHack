/**
 * @module simulation/floodEngine
 * @description Real-time 3D physics-based flood & GLOF simulation engine for CesiumJS.
 * Computes downstream flood wave propagation, river corridor expansion,
 * and floodplain inundation across Pakistan with Minute, Hourly, Daily, and Weekly time scales.
 */

import * as Cesium from 'cesium';
import {
  TIME_SCALES,
  GLOF_ORIGIN,
  INDUS_FLOW_WAYPOINTS,
  INUNDATION_ZONES,
} from './flowData.js';

export class FloodSimulationEngine {
  constructor(viewer) {
    this.viewer = viewer;
    this.active = false;
    this.playing = false;

    // Temporal Scale Management
    this.timeScale = 'hourly'; // 'minute' | 'hourly' | 'daily' | 'weekly'
    this.scaleUnits = 0; // Value in current scale units (min, hr, day, week)
    this.simHours = 0; // Normalized equivalent hours for physical river propagation (0 - 72)
    this.speed = TIME_SCALES.hourly.defaultSpeed;
    this.followCrest = false;

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

  setTimeScale(scaleKey) {
    if (!TIME_SCALES[scaleKey]) return;
    this.timeScale = scaleKey;
    this.speed = TIME_SCALES[scaleKey].defaultSpeed;
    this.scaleUnits = 0;
    this._syncSimHoursFromUnits();
    this._updateVisuals();
    this._notify();
  }

  stepForward() {
    const scale = TIME_SCALES[this.timeScale];
    this.seekUnits(Math.min(scale.maxUnits, this.scaleUnits + scale.step));
  }

  stepBackward() {
    const scale = TIME_SCALES[this.timeScale];
    this.seekUnits(Math.max(0, this.scaleUnits - scale.step));
  }

  seekUnits(units) {
    const scale = TIME_SCALES[this.timeScale];
    this.scaleUnits = Math.max(0, Math.min(scale.maxUnits, Number(units) || 0));
    this._syncSimHoursFromUnits();
    this._updateVisuals();
    this._notify();
  }

  _syncSimHoursFromUnits() {
    if (this.timeScale === 'minute') {
      // 0 to 180 min maps to first 3 hours of mountain breach & Hunza gorge
      this.simHours = (this.scaleUnits / 180) * 3.0;
    } else if (this.timeScale === 'hourly') {
      this.simHours = this.scaleUnits;
    } else if (this.timeScale === 'daily') {
      // 14 days maps across the 72-hour national river transit
      this.simHours = (this.scaleUnits / 14) * 72.0;
    } else if (this.timeScale === 'weekly') {
      // Weeks 1-3 fill up the basin (0 to 70 hrs); Weeks 4-8 peak & drain
      if (this.scaleUnits <= 3) {
        this.simHours = (this.scaleUnits / 3) * 70.0;
      } else {
        this.simHours = 70.0;
      }
    }
  }

  getFormattedTime() {
    if (this.timeScale === 'minute') {
      const totalMin = Math.round(this.scaleUnits);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `T+${h}h ${String(m).padStart(2, '0')}m (${totalMin}m)`;
    } else if (this.timeScale === 'hourly') {
      const h = Math.floor(this.scaleUnits);
      const m = Math.floor((this.scaleUnits - h) * 60);
      return `T+${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`;
    } else if (this.timeScale === 'daily') {
      const d = Math.floor(this.scaleUnits);
      const h = Math.floor((this.scaleUnits - d) * 24);
      return `DAY ${String(d + 1).padStart(2, '0')} / 14 (+${h}h)`;
    } else if (this.timeScale === 'weekly') {
      const w = Math.floor(this.scaleUnits);
      if (w <= 2) return `WEEK ${w + 1} of 8 (Surge Inflow)`;
      if (w <= 4) return `WEEK ${w + 1} of 8 (Peak Inundation)`;
      return `WEEK ${w + 1} of 8 (Receding Waters)`;
    }
    return `T+${Math.round(this.simHours)}h`;
  }

  getCurrentTelemetry() {
    const scale = TIME_SCALES[this.timeScale];

    // Find active waypoint reach along the flow path
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

    // Receding factor for weekly mode
    const recedeMultiplier =
      this.timeScale === 'weekly' && this.scaleUnits > 4
        ? Math.max(0.3, 1.0 - ((this.scaleUnits - 4) / 4.0) * 0.7)
        : 1.0;

    const discharge = Math.round(
      (currentWp.dischargeCusecs +
        (nextWp.dischargeCusecs - currentWp.dischargeCusecs) * frac) *
        recedeMultiplier,
    );
    const stageRise = Number(
      (
        (currentWp.stageRiseM +
          (nextWp.stageRiseM - currentWp.stageRiseM) * frac) *
        recedeMultiplier
      ).toFixed(1),
    );

    // Interpolated crest coordinates
    const crestLat = currentWp.lat + (nextWp.lat - currentWp.lat) * frac;
    const crestLon = currentWp.lon + (nextWp.lon - currentWp.lon) * frac;
    const crestAlt = currentWp.alt + (nextWp.alt - currentWp.alt) * frac;

    return {
      active: this.active,
      playing: this.playing,
      timeScale: this.timeScale,
      scaleUnits: this.scaleUnits,
      maxUnits: scale.maxUnits,
      step: scale.step,
      unitLabel: scale.unit,
      speed: this.speed,
      speedOptions: scale.speedOptions,
      formattedTime: this.getFormattedTime(),
      scaleFullName: scale.fullName,
      scaleDescription: scale.description,
      followCrest: this.followCrest,
      locationName: currentWp.name,
      nextLocationName: nextWp.name,
      status:
        this.timeScale === 'weekly' && this.scaleUnits > 4
          ? 'RECEDING / BASIN DRAINAGE'
          : currentWp.status,
      dischargeCusecs: discharge,
      stageRiseM: stageRise,
      crestLat,
      crestLon,
      crestAlt,
      percentComplete: Math.min(100, (this.scaleUnits / scale.maxUnits) * 100),
    };
  }

  /**
   * Start the flood simulation
   */
  start() {
    if (this.active) return;
    this.active = true;
    this.playing = true;
    this.scaleUnits = 0;
    this._syncSimHoursFromUnits();
    this._lastRealTime = performance.now();

    this._createPrimitives();

    // Fly camera initially to Shisper Glacier breach point once
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
        duration: 2.2,
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
    this.speed = Math.max(0.1, Math.min(120, Number(multiplier) || 1));
    this._notify();
  }

  toggleFollowCrest() {
    this.followCrest = !this.followCrest;
    this._notify();
  }

  exit() {
    this.active = false;
    this.playing = false;
    this.scaleUnits = 0;
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

        const scale = TIME_SCALES[this.timeScale];
        this.scaleUnits += deltaSec * (scale.defaultSpeed || 1.0);

        if (this.scaleUnits >= scale.maxUnits) {
          this.scaleUnits = scale.maxUnits;
          this.playing = false;
        }

        this._syncSimHoursFromUnits();
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
            const recede =
              this.timeScale === 'weekly' && this.scaleUnits > 4
                ? Math.max(0.3, 1.0 - ((this.scaleUnits - 4) / 4.0) * 0.7)
                : 1.0;
            return Math.max(
              50.0,
              wp.radialSpillRadiusM * progress * recede,
            );
          }, false),
          semiMinorAxis: new Cesium.CallbackProperty(() => {
            const elapsed = Math.max(0, this.simHours - wp.timeHours);
            const progress = Math.min(1, Math.sqrt(elapsed / 10.0));
            const recede =
              this.timeScale === 'weekly' && this.scaleUnits > 4
                ? Math.max(0.3, 1.0 - ((this.scaleUnits - 4) / 4.0) * 0.7)
                : 1.0;
            return Math.max(
              35.0,
              wp.radialSpillRadiusM * progress * 0.75 * recede,
            );
          }, false),
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty(() => {
              const elapsed = Math.max(0, this.simHours - wp.timeHours);
              const recede =
                this.timeScale === 'weekly' && this.scaleUnits > 4
                  ? Math.max(0.3, 1.0 - ((this.scaleUnits - 4) / 4.0) * 0.7)
                  : 1.0;
              const alpha =
                Math.min(0.68, 0.2 + (elapsed / 14.0) * 0.48) * recede;
              return Cesium.Color.fromCssColorString('#0077b6').withAlpha(
                alpha,
              );
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
            const recede =
              this.timeScale === 'weekly' && this.scaleUnits > 4
                ? Math.max(0.3, 1.0 - ((this.scaleUnits - 4) / 4.0) * 0.7)
                : 1.0;
            return Math.max(
              70.0,
              wp.radialSpillRadiusM * progress * 1.35 * recede,
            );
          }, false),
          semiMinorAxis: new Cesium.CallbackProperty(() => {
            const elapsed = Math.max(0, this.simHours - wp.timeHours);
            const progress = Math.min(1, Math.sqrt(elapsed / 10.0));
            const recede =
              this.timeScale === 'weekly' && this.scaleUnits > 4
                ? Math.max(0.3, 1.0 - ((this.scaleUnits - 4) / 4.0) * 0.7)
                : 1.0;
            return Math.max(
              50.0,
              wp.radialSpillRadiusM * progress * 1.05 * recede,
            );
          }, false),
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty(() => {
              const recede =
                this.timeScale === 'weekly' && this.scaleUnits > 4
                  ? Math.max(0.3, 1.0 - ((this.scaleUnits - 4) / 4.0) * 0.7)
                  : 1.0;
              return Cesium.Color.fromCssColorString('#00b4d8').withAlpha(
                0.25 * recede,
              );
            }, false),
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
              const recede =
                this.timeScale === 'weekly' && this.scaleUnits > 4
                  ? Math.max(0.3, 1.0 - ((this.scaleUnits - 4) / 4.0) * 0.7)
                  : 1.0;
              return Cesium.Color.fromCssColorString('#0096c7').withAlpha(
                (0.2 + progress * 0.55) * recede,
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

    // Follow camera only if explicitly enabled by user
    if (this.followCrest && this.playing) {
      const tel = this.getCurrentTelemetry();
      const camera = this.viewer.camera;

      // Preserve user's orientation and altitude
      const currentHeading = camera.heading;
      const currentPitch = camera.pitch;
      const currentHeight = camera.positionCartographic?.height || 25000;

      camera.lookAt(
        Cesium.Cartesian3.fromDegrees(tel.crestLon, tel.crestLat),
        new Cesium.HeadingPitchRange(
          currentHeading,
          currentPitch,
          Math.max(5000, currentHeight),
        ),
      );
      camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }
  }
}
