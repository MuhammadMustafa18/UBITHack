/**
 * @module simulation/floodEngine
 * @description Real-time 3D physics-based multi-scenario flood simulation engine for CesiumJS.
 * Computes downstream flood wave propagation, lateral spillage, and floodplain inundation across Pakistan
 * for 5 flood origins (Glaciers, Indian Dam Releases, Monsoon Hill Torrents, Riverine Super Floods, Arabian Sea Cyclones)
 * with dynamic magnitudes (Moderate, High, Very High, Super Flood).
 */

import * as Cesium from 'cesium';
import {
  TIME_SCALES,
  FLOOD_MAGNITUDES,
  FLOOD_SCENARIOS,
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

    // Scenario & Magnitude State
    this.scenarioKey = 'glacier';
    this.activeScenario = FLOOD_SCENARIOS.glacier;
    this.magnitudeKey = 'high';
    this.magnitudeMultiplier = FLOOD_MAGNITUDES.high.multiplier;

    this._listeners = new Set();
    this._animationFrame = null;
    this._lastRealTime = null;

    // Cesium entity handles
    this._entities = [];
    this._corridorEntity = null;
    this._crestMarkerEntity = null;
    this._originPulseEntity = null;
    this._zoneEntities = new Map();
  }

  get waypoints() {
    return this.activeScenario.waypoints;
  }

  get origin() {
    return this.activeScenario.origin;
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

  setScenario(scenarioKey) {
    if (!FLOOD_SCENARIOS[scenarioKey]) return;
    this.scenarioKey = scenarioKey;
    this.activeScenario = FLOOD_SCENARIOS[scenarioKey];
    this.scaleUnits = 0;
    this._syncSimHoursFromUnits();

    // Smoothly fly camera to this scenario's geographical start location
    if (this.viewer && this.activeScenario.camera) {
      const cam = this.activeScenario.camera;
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(cam.lon, cam.lat, cam.height),
        orientation: {
          heading: Cesium.Math.toRadians(cam.heading || 0),
          pitch: Cesium.Math.toRadians(cam.pitch || -35),
          roll: 0,
        },
        duration: 2.2,
      });
    }

    if (this.active) {
      this._createPrimitives();
      this._updateVisuals();
      this._notify();
    }
  }

  setMagnitude(magnitudeKey) {
    if (!FLOOD_MAGNITUDES[magnitudeKey]) return;
    this.magnitudeKey = magnitudeKey;
    this.magnitudeMultiplier = FLOOD_MAGNITUDES[magnitudeKey].multiplier;
    if (this.active) {
      this._updateVisuals();
      this._notify();
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
    this.seekUnits(this.scaleUnits + scale.step);
  }

  stepBackward() {
    const scale = TIME_SCALES[this.timeScale];
    this.seekUnits(Math.max(0, this.scaleUnits - scale.step));
  }

  seekUnits(units) {
    const scale = TIME_SCALES[this.timeScale];
    this.scaleUnits = Math.max(0, Number(units) || 0);
    if (this.scaleUnits >= scale.maxUnits) {
      scale.maxUnits = Math.ceil(this.scaleUnits + scale.step * 20);
    }
    this._syncSimHoursFromUnits();
    this._updateVisuals();
    this._notify();
  }

  _syncSimHoursFromUnits() {
    if (this.timeScale === 'minute') {
      this.simHours = this.scaleUnits / 60.0;
    } else if (this.timeScale === 'hourly') {
      this.simHours = this.scaleUnits;
    } else if (this.timeScale === 'daily') {
      this.simHours = this.scaleUnits * 24.0;
    } else if (this.timeScale === 'weekly') {
      this.simHours = this.scaleUnits * 168.0;
    }
  }

  getFormattedTime() {
    if (this.timeScale === 'minute') {
      const totalMin = Math.round(this.scaleUnits);
      const days = Math.floor(totalMin / 1440);
      const rem = totalMin % 1440;
      const h = Math.floor(rem / 60);
      const m = rem % 60;
      if (days > 0) {
        return `T+${days}d ${h}h ${String(m).padStart(2, '0')}m (${totalMin}m)`;
      }
      return `T+${h}h ${String(m).padStart(2, '0')}m (${totalMin}m)`;
    } else if (this.timeScale === 'hourly') {
      const h = Math.floor(this.scaleUnits);
      const m = Math.floor((this.scaleUnits - h) * 60);
      const days = Math.floor(h / 24);
      const remH = h % 24;
      if (days > 0) {
        return `DAY ${days + 1} • T+${String(remH).padStart(2, '0')}:${String(m).padStart(2, '0')}h (${h}h)`;
      }
      return `T+${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`;
    } else if (this.timeScale === 'daily') {
      const d = Math.floor(this.scaleUnits);
      const h = Math.floor((this.scaleUnits - d) * 24);
      return `DAY ${d + 1} (+${h}h)`;
    } else if (this.timeScale === 'weekly') {
      const w = Math.floor(this.scaleUnits);
      return `WEEK ${w + 1} (Continuous Drainage)`;
    }
    return `T+${Math.round(this.simHours)}h`;
  }

  getCurrentTelemetry() {
    const waypoints = this.waypoints || [];
    if (!waypoints.length) return null;
    const scale = TIME_SCALES[this.timeScale] || TIME_SCALES.hourly;
    const lastWp = waypoints[waypoints.length - 1];
    let currentWp = waypoints[0];
    let nextWp = waypoints[1] || currentWp;

    if (this.simHours >= lastWp.timeHours) {
      currentWp = lastWp;
      nextWp = lastWp;
    } else {
      for (let i = 0; i < waypoints.length - 1; i++) {
        if (this.simHours >= waypoints[i].timeHours) {
          currentWp = waypoints[i];
          nextWp = waypoints[i + 1] || currentWp;
        }
      }
    }

    const duration = Math.max(0.1, nextWp.timeHours - currentWp.timeHours);
    const frac = currentWp === nextWp ? 1 : Math.min(
      1,
      Math.max(0, (this.simHours - currentWp.timeHours) / duration),
    );

    const overTimeHours = Math.max(0, this.simHours - lastWp.timeHours);
    const drainageFactor = Math.max(0.25, 1.0 - (overTimeHours / 96.0) * 0.75);
    const recedeMultiplier = (this.timeScale === 'weekly' && this.scaleUnits > 4
      ? Math.max(0.25, 1.0 - ((this.scaleUnits - 4) / 4.0) * 0.75)
      : 1.0) * drainageFactor;

    const baseDischarge =
      currentWp.dischargeCusecs +
      (nextWp.dischargeCusecs - currentWp.dischargeCusecs) * frac;
    const discharge = Math.round(
      baseDischarge * this.magnitudeMultiplier * recedeMultiplier,
    );

    const baseStage =
      currentWp.stageRiseM +
      (nextWp.stageRiseM - currentWp.stageRiseM) * frac;
    const stageRise = Number(
      (
        baseStage *
        Math.sqrt(this.magnitudeMultiplier) *
        recedeMultiplier
      ).toFixed(1),
    );

    const crestLat = currentWp.lat + (nextWp.lat - currentWp.lat) * frac;
    const crestLon = currentWp.lon + (nextWp.lon - currentWp.lon) * frac;
    const crestAlt = currentWp.alt + (nextWp.alt - currentWp.alt) * frac;

    const magInfo =
      FLOOD_MAGNITUDES[this.magnitudeKey] || FLOOD_MAGNITUDES.high;

    return {
      active: this.active,
      playing: this.playing,
      timeScale: this.timeScale,
      scaleUnits: this.scaleUnits,
      maxUnits: scale.maxUnits,
      unitLabel: scale.unit,
      simHours: this.simHours,
      formattedTime: this.getFormattedTime(),
      speed: this.speed,
      followCrest: this.followCrest,
      scenarioKey: this.scenarioKey,
      scenarioName: this.activeScenario.name,
      scenarioRegion: this.activeScenario.region,
      scenarioCategory: this.activeScenario.category,
      magnitudeKey: this.magnitudeKey,
      magnitudeLabel: magInfo.label,
      magnitudeSeverity: magInfo.severity,
      magnitudeColor: magInfo.color,
      locationName: currentWp.name,
      status: currentWp.status,
      dischargeCusecs: discharge,
      stageRiseM: stageRise,
      crestLat,
      crestLon,
      crestAlt,
      progressPercent: Math.min(100, (this.scaleUnits / scale.maxUnits) * 100),
    };
  }

  launch() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
    this._clearPrimitives();
    this.active = true;
    this.playing = true;
    this.scaleUnits = 0;
    this.simHours = 0;

    this._createPrimitives();

    // Fly camera only once on launch to the active scenario origin
    if (this.viewer && this.activeScenario.camera) {
      const cam = this.activeScenario.camera;
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(cam.lon, cam.lat, cam.height),
        orientation: {
          heading: Cesium.Math.toRadians(cam.heading || 0),
          pitch: Cesium.Math.toRadians(cam.pitch || -35),
          roll: 0,
        },
        duration: 2.2,
      });
    }

    this._startLoop();
    this._notify();
  }

  start() {
    this.launch();
  }

  play() {
    if (!this.active) {
      this.launch();
      return;
    }
    this.playing = true;
    this._lastRealTime = null;
    this._notify();
  }

  pause() {
    this.playing = false;
    this._notify();
  }

  togglePlay() {
    if (this.playing) this.pause();
    else this.play();
  }

  toggleFollow() {
    this.followCrest = !this.followCrest;
    this._notify();
  }

  toggleFollowCrest() {
    this.toggleFollow();
  }

  exit() {
    this.active = false;
    this.playing = false;
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
    this._clearPrimitives();
    this._notify();
  }

  _startLoop() {
    if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
    this._lastRealTime = null;

    const tick = (timestamp) => {
      if (!this.active) return;

      if (this.playing) {
        if (this._lastRealTime === null) this._lastRealTime = timestamp;
        const deltaSeconds = (timestamp - this._lastRealTime) / 1000.0;
        this._lastRealTime = timestamp;

        const scale = TIME_SCALES[this.timeScale];
        this.scaleUnits += this.speed * deltaSeconds;

        // Continuous flow: never arbitrarily stop playing!
        if (this.scaleUnits >= scale.maxUnits) {
          scale.maxUnits = Math.ceil(this.scaleUnits + scale.step * 20);
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

    const origin = this.origin;
    const waypoints = this.waypoints;

    // 1. Origin Rupture / Surge Beacon
    this._originPulseEntity = this.viewer.entities.add({
      name: `${this.activeScenario.name} - Point of Origin`,
      position: Cesium.Cartesian3.fromDegrees(
        origin.lon,
        origin.lat,
        (origin.alt || 100) + 20,
      ),
      point: {
        pixelSize: 20,
        color: Cesium.Color.fromCssColorString('#00f0ff'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      ellipse: {
        semiMajorAxis: 2400,
        semiMinorAxis: 2400,
        material: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.35),
        height: (origin.alt || 100) + 5,
      },
    });
    this._entities.push(this._originPulseEntity);

    // 2. Dynamic Flood Water Corridor (central river reach)
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
    for (const wp of waypoints) {
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
            const magScale = Math.sqrt(this.magnitudeMultiplier);
            return Math.max(
              50.0,
              wp.radialSpillRadiusM * progress * recede * magScale,
            );
          }, false),
          semiMinorAxis: new Cesium.CallbackProperty(() => {
            const elapsed = Math.max(0, this.simHours - wp.timeHours);
            const progress = Math.min(1, Math.sqrt(elapsed / 10.0));
            const recede =
              this.timeScale === 'weekly' && this.scaleUnits > 4
                ? Math.max(0.3, 1.0 - ((this.scaleUnits - 4) / 4.0) * 0.7)
                : 1.0;
            const magScale = Math.sqrt(this.magnitudeMultiplier);
            return Math.max(
              35.0,
              wp.radialSpillRadiusM * progress * 0.75 * recede * magScale,
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

      // Outer shallow flood silt watermark
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
            const magScale = Math.sqrt(this.magnitudeMultiplier);
            return Math.max(
              70.0,
              wp.radialSpillRadiusM * progress * 1.35 * recede * magScale,
            );
          }, false),
          semiMinorAxis: new Cesium.CallbackProperty(() => {
            const elapsed = Math.max(0, this.simHours - wp.timeHours);
            const progress = Math.min(1, Math.sqrt(elapsed / 10.0));
            const recede =
              this.timeScale === 'weekly' && this.scaleUnits > 4
                ? Math.max(0.3, 1.0 - ((this.scaleUnits - 4) / 4.0) * 0.7)
                : 1.0;
            const magScale = Math.sqrt(this.magnitudeMultiplier);
            return Math.max(
              50.0,
              wp.radialSpillRadiusM * progress * 1.05 * recede * magScale,
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
          (tel.crestAlt || 50) + 15,
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

    // 4. Inundation Plain Zones (for relevant scenarios)
    if (this.scenarioKey === 'glacier' || this.scenarioKey === 'riverine') {
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
    this._originPulseEntity = null;
    this._zoneEntities.clear();
  }

  _getActiveCorridorCartesians() {
    const activeCoords = [];
    const tel = this.getCurrentTelemetry();
    const waypoints = this.waypoints;

    for (const wp of waypoints) {
      if (this.simHours >= wp.timeHours) {
        activeCoords.push(Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat));
      }
    }

    activeCoords.push(
      Cesium.Cartesian3.fromDegrees(tel.crestLon, tel.crestLat),
    );

    if (activeCoords.length < 2) {
      const p1 = Cesium.Cartesian3.fromDegrees(
        waypoints[0].lon,
        waypoints[0].lat,
      );
      const p2 = Cesium.Cartesian3.fromDegrees(
        waypoints[1] ? waypoints[1].lon : waypoints[0].lon + 0.05,
        waypoints[1] ? waypoints[1].lat : waypoints[0].lat + 0.05,
      );
      return [p1, p2];
    }

    return activeCoords;
  }

  _getActiveCorridorWidth() {
    const waypoints = this.waypoints;
    let baseWidth = waypoints[0].normalWidthM || 200;
    let floodWidth = waypoints[0].floodWidthM || 800;

    for (const wp of waypoints) {
      if (this.simHours >= wp.timeHours) {
        baseWidth = wp.normalWidthM || baseWidth;
        floodWidth = wp.floodWidthM || floodWidth;
      }
    }

    const elapsed = Math.max(0, this.simHours);
    const progress = Math.min(1, elapsed / 8.0);
    const magScale = Math.sqrt(this.magnitudeMultiplier);
    const effectiveWidth =
      (baseWidth + (floodWidth - baseWidth) * progress) * magScale;

    return Math.max(50.0, effectiveWidth);
  }

  _updateVisuals() {
    if (!this.active || !this.viewer) return;

    if (this.followCrest && this.playing) {
      const tel = this.getCurrentTelemetry();
      const camera = this.viewer.camera;

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
