/**
 * @module simulation/predictiveHeatmaps
 * @description Predictive downstream affected-area polygon heatmaps for CesiumJS.
 * Projects upcoming flood inundation zones ahead of the active crest in real time,
 * highlighting immediate next-impact zones (high danger) and downstream forecast watches.
 */

import * as Cesium from 'cesium';

/**
 * Creates an organic polygonal boundary around a center point
 * aligned along a simulated river floodplain.
 */
function createFloodplainPolygon(lat, lon, radiusM, elongationAngleRad = 0.5) {
  const numPoints = 10;
  const coords = [];
  const latDegPerM = 1 / 111139;
  const lonDegPerM = 1 / (111139 * Math.cos(lat * (Math.PI / 180)));

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    // Stretch along river flow angle and apply gentle natural variation
    const stretch = 1.0 + 0.5 * Math.cos(angle - elongationAngleRad);
    const jitter = 0.85 + 0.25 * Math.sin(angle * 3);
    const r = radiusM * stretch * jitter;

    const pLat = lat + r * Math.sin(angle) * latDegPerM;
    const pLon = lon + r * Math.cos(angle) * lonDegPerM;
    coords.push(pLon, pLat);
  }

  return coords;
}

export class PredictiveHeatmaps {
  constructor(viewer, floodEngine) {
    this.viewer = viewer;
    this.floodEngine = floodEngine;
    this.visible = true;
    this._entities = [];
    this._unsubscribe = null;

    this._init();
  }

  _init() {
    if (this.floodEngine) {
      this._unsubscribe = this.floodEngine.subscribe((tel) => {
        this._onTelemetry(tel);
      });
    }
  }

  setVisible(visible) {
    this.visible = !!visible;
    for (const ent of this._entities) {
      ent.show = this.visible;
    }
  }

  toggle() {
    this.setVisible(!this.visible);
    return this.visible;
  }

  _onTelemetry(tel) {
    if (!this.visible || !this.viewer || !tel || !tel.active) {
      this._clear();
      return;
    }

    const waypoints = this.floodEngine.waypoints || [];
    const simHours = tel.simHours || 0;

    // Find waypoints downstream of the current crest (upcoming impact zones)
    const upcoming = [];
    for (const wp of waypoints) {
      if (wp.timeHours > simHours) {
        upcoming.push(wp);
      }
    }

    // If no upcoming waypoints or scenario ended, clear
    if (upcoming.length === 0) {
      this._clear();
      return;
    }

    // Immediate next waypoint is primary high-danger projected impact zone
    const nextWp = upcoming[0];
    const secondaryWp = upcoming[1] || null;
    const tertiaryWp = upcoming[2] || null;

    const targetList = [
      {
        wp: nextWp,
        tier: 'critical',
        etaHours: Math.max(0.1, nextWp.timeHours - simHours),
      },
    ];
    if (secondaryWp) {
      targetList.push({
        wp: secondaryWp,
        tier: 'warning',
        etaHours: Math.max(0.5, secondaryWp.timeHours - simHours),
      });
    }
    if (tertiaryWp) {
      targetList.push({
        wp: tertiaryWp,
        tier: 'watch',
        etaHours: Math.max(1.0, tertiaryWp.timeHours - simHours),
      });
    }

    this._renderPredictiveZones(targetList, tel);
  }

  _renderPredictiveZones(targets, tel) {
    this._clear();

    const magScale = Math.sqrt(this.floodEngine.magnitudeMultiplier || 1.0);

    targets.forEach((item, index) => {
      const { wp, tier, etaHours } = item;
      const baseRadius = wp.radialSpillRadiusM || 5000;
      const radiusM = Math.max(2500, baseRadius * magScale * 1.15);
      const coords =
        wp.polygon || createFloodplainPolygon(wp.lat, wp.lon, radiusM, 0.6);
      const hierarchy = Cesium.Cartesian3.fromDegreesArray(coords);

      let fillColor;
      let outlineColor;
      let labelPrefix;

      if (tier === 'critical') {
        fillColor = Cesium.Color.fromCssColorString('#ea4335').withAlpha(0.42);
        outlineColor = Cesium.Color.fromCssColorString('#ff1744');
        labelPrefix = '⚠️ NEXT IMPACT ZONE';
      } else if (tier === 'warning') {
        fillColor = Cesium.Color.fromCssColorString('#f57c00').withAlpha(0.32);
        outlineColor = Cesium.Color.fromCssColorString('#ff9800');
        labelPrefix = '⏱️ PROJECTED REACH';
      } else {
        fillColor = Cesium.Color.fromCssColorString('#fbc02d').withAlpha(0.22);
        outlineColor = Cesium.Color.fromCssColorString('#ffeb3b');
        labelPrefix = '🔍 DOWNSTREAM WATCH';
      }
      if (wp.windowH) {
        labelPrefix =
          tier === 'critical'
            ? 'NEXT COMMUNITY TO WATCH'
            : 'COMMUNITY TO WATCH';
      }

      const etaFormatted =
        etaHours < 1
          ? `${Math.round(etaHours * 60)} min`
          : `${etaHours.toFixed(1)} hrs`;

      const estDischarge = Math.round(
        (wp.dischargeCusecs || 300000) *
          (this.floodEngine.magnitudeMultiplier || 1.0),
      );

      // 1. Polygon Entity
      const polyEntity = this.viewer.entities.add({
        name: `${labelPrefix} - ${wp.name}`,
        polygon: {
          hierarchy,
          material: new Cesium.ColorMaterialProperty(fillColor),
          outline: true,
          outlineColor: outlineColor,
          outlineWidth: tier === 'critical' ? 3 : 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      this._entities.push(polyEntity);

      // 2. Central Pin & Floating Label Entity
      const labelText = wp.windowH
        ? `${labelPrefix}\n${wp.name}\nWindow: ${Math.max(0, wp.windowH[0] - tel.simHours).toFixed(1)}–${Math.max(0, wp.windowH[1] - tel.simHours).toFixed(1)} h (illustrative)\n≈${Math.round(wp.population).toLocaleString()} people (WorldPop)`
        : `${labelPrefix}\n${wp.name}\nETA: T+${etaFormatted} | Est: ${estDischarge.toLocaleString()} Cfs`;

      const labelEntity = this.viewer.entities.add({
        name: `Label - ${wp.name}`,
        position: Cesium.Cartesian3.fromDegrees(
          wp.lon,
          wp.lat,
          (wp.alt || 50) + 40,
        ),
        point: {
          pixelSize: tier === 'critical' ? 12 : 9,
          color: outlineColor,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: labelText,
          font: 'bold 12.5px "Google Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#1e2124'),
          outlineWidth: 3,
          showBackground: true,
          backgroundColor:
            tier === 'critical'
              ? Cesium.Color.fromCssColorString('#b71c1c').withAlpha(0.88)
              : Cesium.Color.fromCssColorString('#e65100').withAlpha(0.85),
          backgroundPadding: new Cesium.Cartesian2(8, 5),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 4.5e6, 0.45),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0.0,
            4.5e6,
          ),
        },
      });
      this._entities.push(labelEntity);
    });
  }

  _clear() {
    if (this.viewer && this.viewer.entities) {
      for (const ent of this._entities) {
        this.viewer.entities.remove(ent);
      }
    }
    this._entities = [];
  }

  destroy() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    this._clear();
  }
}
