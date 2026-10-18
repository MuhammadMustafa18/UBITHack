import * as Cesium from 'cesium';
import { loadGrid } from './gridStore.js';
import { cellExplain } from './queries.js';

const BAND_COLORS = [
  { max: 25, hex: '#2e7d32', label: 'Low' },
  { max: 45, hex: '#f9a825', label: 'Moderate' },
  { max: 70, hex: '#ef6c00', label: 'Elevated' },
  { max: Infinity, hex: '#c62828', label: 'High' },
];
const NO_DATA_HEX = '#9e9e9e';
const FILL_ALPHA = 0.55;
const NO_DATA_ALPHA = 0.25;
const HIGHLIGHT_ALPHA = 0.9;
const HAZARD_LABELS = {
  composite: 'Composite risk',
  flood: 'Flood',
  heat: 'Heat',
  terrain: 'Terrain',
  air: 'Air quality',
  veg: 'Vegetation',
};

const cesiumColor = (hex, alpha) => Cesium.Color.fromCssColorString(hex).withAlpha(alpha);

export const bandForScore = (score) => {
  if (!Number.isFinite(score)) return null;
  return BAND_COLORS.find((b) => score < b.max);
};

const scoreFor = (cell, hazard) => {
  if (hazard === 'composite') return cell.score?.score ?? null;
  return cell.score?.hazards?.[hazard] ?? null;
};

const colorFor = (score) => {
  const band = bandForScore(score);
  return band ? cesiumColor(band.hex, FILL_ALPHA) : cesiumColor(NO_DATA_HEX, NO_DATA_ALPHA);
};

export class RiskGridLayer {
  constructor(viewer, { onCellClick } = {}) {
    this.viewer = viewer;
    this.onCellClick = onCellClick;
    this.hazard = 'composite';
    this.grid = null;
    this.primitive = null;
    this.handler = null;
    this.legendEl = null;
    this.tooltipEl = null;
    this.highlighted = null;
    this.pendingApply = false;
    this.readyListener = null;
    this.token = 0;
  }

  async show(aoi) {
    this.hide();
    const token = ++this.token;
    const grid = await loadGrid(aoi);
    if (token !== this.token) return;
    this.grid = grid;
    this.buildPrimitive();
    this.bindEvents();
    this.renderLegend();
  }

  hide() {
    this.token += 1;
    this.unbindReady();
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
    if (this.primitive) {
      if (!this.viewer.isDestroyed?.()) this.viewer.scene.primitives.remove(this.primitive);
      this.primitive = null;
    }
    this.legendEl?.remove();
    this.tooltipEl?.remove();
    this.legendEl = null;
    this.tooltipEl = null;
    this.highlighted = null;
    this.pendingApply = false;
    this.grid = null;
  }

  destroy() {
    this.hide();
  }

  buildPrimitive() {
    const half = this.grid.cellDeg / 2;
    const instances = this.grid.cells.map(
      (cell) =>
        new Cesium.GeometryInstance({
          id: cell.id,
          geometry: new Cesium.RectangleGeometry({
            rectangle: Cesium.Rectangle.fromDegrees(
              cell.lon - half,
              cell.lat - half,
              cell.lon + half,
              cell.lat + half,
            ),
          }),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
              colorFor(scoreFor(cell, this.hazard)),
            ),
          },
        }),
    );
    const scene = this.viewer.scene;
    const Ctor = Cesium.GroundPrimitive.isSupported(scene) ? Cesium.GroundPrimitive : Cesium.Primitive;
    const options = { geometryInstances: instances, asynchronous: false };
    if (Ctor === Cesium.Primitive) {
      options.appearance = new Cesium.PerInstanceColorAppearance({ translucent: true, flat: true });
    }
    this.primitive = scene.primitives.add(new Ctor(options));
  }

  setHazard(hazard) {
    this.hazard = hazard;
    this.renderLegend();
    if (!this.primitive) return;
    if (!this.primitive.ready) {
      this.deferApply();
      return;
    }
    this.applyColors();
  }

  deferApply() {
    if (this.readyListener) return;
    this.readyListener = () => {
      if (!this.primitive?.ready) return;
      this.unbindReady();
      this.applyColors();
    };
    this.viewer.scene.postRender.addEventListener(this.readyListener);
  }

  unbindReady() {
    if (this.readyListener) {
      this.viewer.scene.postRender.removeEventListener(this.readyListener);
      this.readyListener = null;
    }
  }

  applyColors() {
    for (const cell of this.grid.cells) {
      const attrs = this.primitive.getGeometryInstanceAttributes(cell.id);
      if (!attrs) continue;
      const color = cell.id === this.highlighted
        ? colorFor(scoreFor(cell, this.hazard)).withAlpha(HIGHLIGHT_ALPHA)
        : colorFor(scoreFor(cell, this.hazard));
      attrs.color = Cesium.ColorGeometryInstanceAttribute.toValue(color);
    }
  }

  highlight(cellId) {
    this.highlighted = cellId ?? null;
    if (!this.primitive) return;
    if (!this.primitive.ready) {
      this.deferApply();
      return;
    }
    this.applyColors();
  }

  flyTo() {
    if (!this.grid) return;
    const [west, south, east, north] = this.grid.bbox;
    this.viewer.camera.flyTo({ destination: Cesium.Rectangle.fromDegrees(west, south, east, north) });
  }

  bindEvents() {
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'agahi-grid-tooltip agahi-grid-hidden';
    document.body.appendChild(this.tooltipEl);
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.handler.setInputAction((movement) => {
      const id = this.pickCellId(movement.position);
      if (!id) return;
      this.highlight(id);
      this.onCellClick?.(cellExplain(this.grid, id));
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.setInputAction((movement) => {
      this.updateTooltip(this.pickCellId(movement.endPosition), movement.endPosition);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  pickCellId(position) {
    if (!this.grid || !this.primitive) return null;
    const picked = this.viewer.scene.pick(position);
    if (!picked || picked.primitive !== this.primitive) return null;
    return typeof picked.id === 'string' ? picked.id : null;
  }

  updateTooltip(id, position) {
    const el = this.tooltipEl;
    if (!el) return;
    const cell = id ? this.grid.cells.find((c) => c.id === id) : null;
    if (!cell) {
      el.classList.add('agahi-grid-hidden');
      return;
    }
    const score = scoreFor(cell, this.hazard);
    const band = bandForScore(score);
    el.textContent = band ? `${Math.round(score)} · ${band.label}` : 'No data';
    const rect = this.viewer.scene.canvas.getBoundingClientRect();
    el.style.left = `${rect.left + position.x + 14}px`;
    el.style.top = `${rect.top + position.y + 14}px`;
    el.classList.remove('agahi-grid-hidden');
  }

  renderLegend() {
    if (!this.grid) return;
    if (!this.legendEl) {
      this.legendEl = document.createElement('div');
      this.legendEl.className = 'agahi-grid-legend';
      document.body.appendChild(this.legendEl);
    }
    const swatch = (hex, alpha, label) =>
      `<div class="agahi-grid-legend-row"><span class="agahi-grid-swatch" style="background:${hex};opacity:${alpha}"></span>${label}</div>`;
    this.legendEl.innerHTML =
      `<div class="agahi-grid-legend-title">${HAZARD_LABELS[this.hazard] ?? this.hazard}</div>` +
      BAND_COLORS.map((b) => swatch(b.hex, FILL_ALPHA + 0.2, b.label)).join('') +
      swatch(NO_DATA_HEX, 0.6, 'No data');
  }
}
