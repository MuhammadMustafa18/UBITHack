/**
 * @module simulation/demographicHeatmapEngine
 * @description Dynamic Demographic & Risk Heatmap Engine for Pakistan.
 * Visualizes 4 thematic data dimensions across all 19 administrative regions of Pakistan:
 *  - 1. Population: Population density & total headcount (2023 Digital Census best estimates).
 *  - 2. Age Demographics: Vulnerable dependents (Children under 5, Elderly 65+, Infants & Expectant Mothers).
 *  - 3. Critical Resources: Live disaster relief inventory (Boats, Camps, Heli Air-Drops, Medical Teams, Rations).
 *  - 4. Composite Risk: Multi-hazard flood and climate exposure index.
 */

import * as Cesium from 'cesium';
import { PAKISTAN_REGIONS } from './countryThreatPolygons.js';

export const HEATMAP_MODES = {
  population: {
    id: 'population',
    name: 'Population Density',
    icon: '👥',
    unit: 'Total Inhabitants',
    scaleLabel: 'Low (1.8M) → High (21.5M)',
    description: 'Grid-level census population density & high-exposure urban clusters',
  },
  age: {
    id: 'age',
    name: 'Age Demographics',
    icon: '👶',
    unit: '% Vulnerable (Children <5 & Elderly >65)',
    scaleLabel: '38% → 46.2% Dependent Ratio',
    description: 'Vulnerable demographic clusters requiring priority evacuation assistance',
  },
  resources: {
    id: 'resources',
    name: 'Critical Resources',
    icon: '🏥',
    unit: 'Relief Staging Capacity Score',
    scaleLabel: 'Scattered Logistics → High Staging Hubs',
    description: 'Pre-positioned swift-water rescue craft, shelter camps, medical & air assets',
  },
  risk: {
    id: 'risk',
    name: 'Composite Risk Index',
    icon: '⚠️',
    unit: 'Vulnerability Score (0 - 100)',
    scaleLabel: 'Low Advisory → Critical Inundation Alert',
    description: 'Multi-hazard climate, floodway rupture & historical inundation probability',
  },
};

export class DemographicHeatmapEngine {
  constructor(viewer) {
    this.viewer = viewer;
    this.active = false;
    this.currentMode = 'population'; // 'population' | 'age' | 'resources' | 'risk'
    this._entities = new Map();
    this._hoverHandler = null;
    this.selectedRegion = null;
    this._tooltipEl = null;
  }

  enable(mode = 'population') {
    this.active = true;
    this.currentMode = mode;
    this._buildTooltipDOM();
    this._renderHeatmap();
    this._bindEvents();
  }

  disable() {
    this.active = false;
    this._unbindEvents();
    this._clearEntities();
    this._hideTooltip();
  }

  toggle(mode) {
    if (this.active && (!mode || mode === this.currentMode)) {
      this.disable();
    } else {
      this.enable(mode || this.currentMode);
    }
    return this.active;
  }

  setMode(mode) {
    if (HEATMAP_MODES[mode]) {
      this.currentMode = mode;
      if (this.active) {
        this._renderHeatmap();
      }
    }
  }

  _buildTooltipDOM() {
    if (!this._tooltipEl) {
      this._tooltipEl = document.createElement('div');
      this._tooltipEl.id = 'demographic-heatmap-tooltip';
      this._tooltipEl.className = 'demographic-heatmap-tooltip hidden';
      document.body.appendChild(this._tooltipEl);
    }
  }

  _renderHeatmap() {
    this._clearEntities();
    if (!this.viewer || !this.viewer.entities) return;

    PAKISTAN_REGIONS.forEach((reg) => {
      const metric = this._calculateRegionMetric(reg, this.currentMode);
      const hierarchy = Cesium.Cartesian3.fromDegreesArray(reg.polygon);

      // Polygon entity
      const poly = this.viewer.entities.add({
        name: `${reg.name} [${metric.label}]`,
        polygon: {
          hierarchy,
          material: new Cesium.ColorMaterialProperty(metric.fillColor),
          outline: true,
          outlineColor: metric.outlineColor,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });

      poly.demographicData = {
        region: reg,
        metric: metric,
      };

      this._entities.set(`poly_${reg.id}`, poly);

      // Center Pin / Value Label
      const [cLat, cLon] = reg.center;
      const label = this.viewer.entities.add({
        name: `Label: ${reg.name}`,
        position: Cesium.Cartesian3.fromDegrees(cLon, cLat, 450),
        point: {
          pixelSize: 8,
          color: metric.outlineColor,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${reg.name}\n${metric.badgeText}`,
          font: '600 11.5px "Space Grotesk", sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#17171c'),
          outlineWidth: 3,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#17171c').withAlpha(0.88),
          backgroundPadding: new Cesium.Cartesian2(8, 5),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 5.0e6, 0.4),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 4.5e6),
        },
      });

      label.demographicData = {
        region: reg,
        metric: metric,
      };

      this._entities.set(`label_${reg.id}`, label);
    });
  }

  _calculateRegionMetric(reg, mode) {
    if (mode === 'population') {
      // Scale: 1.8M to 21.5M
      const pop = reg.population || 3000000;
      const norm = Math.min(1.0, Math.max(0.0, (pop - 1800000) / (21500000 - 1800000)));

      // Color ramp: Soft Stone / Steel Blue -> Indigo -> Deep Violet / Near Black
      let fillColor;
      let outlineColor;
      let grade;

      if (norm > 0.7) {
        // High density (Central Punjab, Karachi)
        fillColor = Cesium.Color.fromCssColorString('#7c3aed').withAlpha(0.38);
        outlineColor = Cesium.Color.fromCssColorString('#a78bfa');
        grade = 'VERY HIGH DENSITY';
      } else if (norm > 0.35) {
        // Moderate density (Potohar, North Punjab, Sukkur)
        fillColor = Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.32);
        outlineColor = Cesium.Color.fromCssColorString('#38bdf8');
        grade = 'MODERATE DENSITY';
      } else {
        // Lower density (GB, Balochistan, Cholistan)
        fillColor = Cesium.Color.fromCssColorString('#0f766e').withAlpha(0.24);
        outlineColor = Cesium.Color.fromCssColorString('#2dd4bf');
        grade = 'SPARSE DENSITY';
      }

      return {
        fillColor,
        outlineColor,
        label: `${(pop / 1000000).toFixed(1)}M People`,
        badgeText: `👥 ${(pop / 1000000).toFixed(1)}M (${grade})`,
        value: pop,
        formattedValue: pop.toLocaleString(),
      };
    }

    if (mode === 'age') {
      // Age Demographics: Children % + Elderly %
      const demo = reg.demographics || {};
      const childPct = demo.childrenPct || 38.0;
      const elderPct = demo.elderlyPct || 4.5;
      const totalVulnerablePct = childPct + elderPct;

      // Color ramp: Soft Amber -> Coral -> Crimson Red
      let fillColor;
      let outlineColor;
      let grade;

      if (totalVulnerablePct >= 45.0) {
        fillColor = Cesium.Color.fromCssColorString('#ea580c').withAlpha(0.40);
        outlineColor = Cesium.Color.fromCssColorString('#fb923c');
        grade = 'CRITICAL DEPENDENCY';
      } else if (totalVulnerablePct >= 42.0) {
        fillColor = Cesium.Color.fromCssColorString('#d97706').withAlpha(0.32);
        outlineColor = Cesium.Color.fromCssColorString('#fcd34d');
        grade = 'HIGH DEPENDENCY';
      } else {
        fillColor = Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.25);
        outlineColor = Cesium.Color.fromCssColorString('#7dd3fc');
        grade = 'BALANCED DEMOGRAPHIC';
      }

      return {
        fillColor,
        outlineColor,
        label: `${totalVulnerablePct.toFixed(1)}% Vulnerable`,
        badgeText: `👶 ${totalVulnerablePct.toFixed(1)}% (<5 & >65)`,
        value: totalVulnerablePct,
        formattedValue: `${totalVulnerablePct.toFixed(1)}% (Children: ${childPct}% | Elderly: ${elderPct}%)`,
      };
    }

    if (mode === 'resources') {
      // Logistics & Relief Resources
      const res = reg.resources || {};
      const boatsCount = parseInt(res.boats || '20', 10) || 20;
      const campsCount = parseInt(res.camps || '15', 10) || 15;
      const resourceScore = boatsCount + campsCount * 1.5;

      let fillColor;
      let outlineColor;
      let grade;

      if (resourceScore > 100) {
        // High Logistics Hub (Rawalpindi/ICT, Karachi, Central Punjab)
        fillColor = Cesium.Color.fromCssColorString('#059669').withAlpha(0.36);
        outlineColor = Cesium.Color.fromCssColorString('#34d399');
        grade = 'MAJOR RELIEF HUB';
      } else if (resourceScore > 50) {
        fillColor = Cesium.Color.fromCssColorString('#0d9488').withAlpha(0.28);
        outlineColor = Cesium.Color.fromCssColorString('#2dd4bf');
        grade = 'ACTIVE SECTOR BASE';
      } else {
        fillColor = Cesium.Color.fromCssColorString('#d97706').withAlpha(0.24);
        outlineColor = Cesium.Color.fromCssColorString('#fde047');
        grade = 'LOGISTICS DEFICIT';
      }

      return {
        fillColor,
        outlineColor,
        label: grade,
        badgeText: `🏥 ${grade}`,
        value: resourceScore,
        formattedValue: `${res.boats} | ${res.camps}`,
      };
    }

    // Default: 'risk' (Composite multi-hazard risk index)
    const riskByRegion = {
      hunza_diamer_gb: 88,
      swat_hazara_kp: 82,
      peshawar_valley_kp: 89,
      southern_kp: 76,
      potohar_islamabad: 55,
      north_punjab_border: 84,
      central_punjab: 78,
      chashma_thal_punjab: 68,
      south_punjab: 92,
      multan_cholistan: 64,
      upper_sindh_guddu: 95,
      sukkur_khairpur: 94,
      right_bank_dadu_manchhar: 96,
      central_sindh_nawabshah: 81,
      lower_indus_delta_kotri: 87,
      karachi_megacity: 85,
      eastern_balochistan_kacchi: 91,
      northern_balochistan_quetta: 62,
      makran_coast_gwadar: 58,
    };

    const riskScore = riskByRegion[reg.id] || 75;
    let fillColor;
    let outlineColor;
    let grade;

    if (riskScore >= 90) {
      fillColor = Cesium.Color.fromCssColorString('#dc2626').withAlpha(0.42);
      outlineColor = Cesium.Color.fromCssColorString('#ef4444');
      grade = 'CRITICAL INUNDATION';
    } else if (riskScore >= 80) {
      fillColor = Cesium.Color.fromCssColorString('#ea580c').withAlpha(0.34);
      outlineColor = Cesium.Color.fromCssColorString('#f97316');
      grade = 'HIGH RISK';
    } else if (riskScore >= 65) {
      fillColor = Cesium.Color.fromCssColorString('#d97706').withAlpha(0.28);
      outlineColor = Cesium.Color.fromCssColorString('#f59e0b');
      grade = 'MODERATE WATCH';
    } else {
      fillColor = Cesium.Color.fromCssColorString('#16a34a').withAlpha(0.22);
      outlineColor = Cesium.Color.fromCssColorString('#22c55e');
      grade = 'LOW RISK';
    }

    return {
      fillColor,
      outlineColor,
      label: `${riskScore}/100 [${grade}]`,
      badgeText: `⚠️ ${riskScore}/100 (${grade})`,
      value: riskScore,
      formattedValue: `${riskScore} / 100 Multi-Hazard Score`,
    };
  }

  _bindEvents() {
    this._unbindEvents();
    if (!this.viewer || !this.viewer.scene) return;

    this._hoverHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    this._hoverHandler.setInputAction((movement) => {
      const picked = this.viewer.scene.pick(movement.endPosition);
      if (Cesium.defined(picked) && picked.id && picked.id.demographicData) {
        this._showTooltip(picked.id.demographicData, movement.endPosition);
      } else {
        this._hideTooltip();
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this._hoverHandler.setInputAction((click) => {
      const picked = this.viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id && picked.id.demographicData) {
        const { region } = picked.id.demographicData;
        const [cLat, cLon] = region.center;
        this.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(cLon, cLat, 120000),
          duration: 1.4,
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  _unbindEvents() {
    if (this._hoverHandler) {
      this._hoverHandler.destroy();
      this._hoverHandler = null;
    }
  }

  _showTooltip(data, screenPos) {
    if (!this._tooltipEl) return;
    const { region, metric } = data;
    const demo = region.demographics || {};
    const res = region.resources || {};

    this._tooltipEl.innerHTML = `
      <div class="demo-tooltip-header">
        <div class="demo-tooltip-title">${region.name}</div>
        <div class="demo-tooltip-sub">${region.province} • Active Metric: ${HEATMAP_MODES[this.currentMode].name}</div>
      </div>
      <div class="demo-tooltip-grid">
        <div class="demo-tooltip-item highlight">
          <span class="label">CURRENT METRIC</span>
          <span class="value">${metric.badgeText}</span>
        </div>
        <div class="demo-tooltip-item">
          <span class="label">TOTAL POPULATION</span>
          <span class="value">${(region.population || 0).toLocaleString()}</span>
        </div>
        <div class="demo-tooltip-item">
          <span class="label">AGE BREAKDOWN</span>
          <span class="value">Under 5: ${demo.childrenPct}% | 65+: ${demo.elderlyPct}%</span>
        </div>
        <div class="demo-tooltip-item">
          <span class="label">INFANTS &amp; PREGNANT</span>
          <span class="value">${demo.infantsPregnant || 'N/A'}</span>
        </div>
        <div class="demo-tooltip-item full">
          <span class="label">RELIEF INVENTORY</span>
          <span class="value">${res.boats || ''} • ${res.camps || ''}</span>
        </div>
      </div>
    `;

    this._tooltipEl.style.left = `${Math.min(window.innerWidth - 330, screenPos.x + 16)}px`;
    this._tooltipEl.style.top = `${Math.min(window.innerHeight - 280, screenPos.y + 16)}px`;
    this._tooltipEl.classList.remove('hidden');
  }

  _hideTooltip() {
    if (this._tooltipEl) {
      this._tooltipEl.classList.add('hidden');
    }
  }

  _clearEntities() {
    if (this.viewer && this.viewer.entities) {
      for (const ent of this._entities.values()) {
        this.viewer.entities.remove(ent);
      }
    }
    this._entities.clear();
  }

  destroy() {
    this.disable();
    if (this._tooltipEl && this._tooltipEl.parentNode) {
      this._tooltipEl.parentNode.removeChild(this._tooltipEl);
      this._tooltipEl = null;
    }
  }
}
