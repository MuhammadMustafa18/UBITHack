import { advisory } from './advisory.js';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);

const HAZARD_ROWS = [
  ['flood', 'Flood'],
  ['heat', 'Heat'],
  ['terrain', 'Terrain'],
  ['air', 'Air'],
  ['veg', 'Vegetation'],
];

const METRICS = [
  ['sarFloodFrac', 'SAR flood fraction', '', 2],
  ['jrcOccurrence', 'Water occurrence', '%', 0],
  ['handM', 'HAND', ' m', 1],
  ['lstDayC', 'Day land-surface temp', ' °C', 1],
  ['uhiC', 'Urban heat island', ' °C', 1],
  ['elevM', 'Elevation', ' m', 0],
  ['slopeDeg', 'Slope', '°', 1],
  ['flowAccLog10', 'Flow accumulation (log10)', '', 1],
  ['no2', 'NO₂', '', 'raw'],
  ['co', 'CO', '', 'raw'],
  ['so2', 'SO₂', '', 'raw'],
  ['aai', 'Aerosol index', '', 2],
  ['aod', 'Aerosol optical depth', '', 2],
  ['ndvi', 'NDVI', '', 2],
  ['ndviTrend', 'NDVI trend', '', 2],
  ['pop', 'Population', '', 0],
];

const bandKey = (band) => (band === 'insufficient_data' ? 'nodata' : band || 'nodata');

const bandLabel = (band) =>
  band === 'insufficient_data' || !band ? 'No data' : band.charAt(0).toUpperCase() + band.slice(1);

const formatMetric = (value, unit, digits, pipeline) => {
  if (value === null || value === undefined) return 'no data';
  if (digits === 'raw') return `${value} ${pipeline === 'openmeteo' ? 'µg/m³' : 'mol/m²'}`;
  return `${Number(value).toLocaleString('en', { maximumFractionDigits: digits })}${unit}`;
};

const sourcesList = (sources) => {
  if (Array.isArray(sources)) return sources.map((s) => (typeof s === 'string' ? s : s.dataset));
  return Object.entries(sources || {}).map(([key, s]) =>
    `${key}: ${s?.dataset ?? ''}${s?.window ? ` (${s.window})` : ''}`,
  );
};

const hazardBar = (key, label, score) => {
  const has = Number.isFinite(score);
  return `<div class="agahi-grid-bar-row">
    <span class="agahi-grid-bar-label">${label}</span>
    <span class="agahi-grid-bar"><span class="agahi-grid-bar-fill agahi-grid-bar-${has ? bandKey(bandOf(score)) : 'nodata'}" style="width:${has ? Math.round(score) : 100}%"></span></span>
    <span class="agahi-grid-bar-value">${has ? Math.round(score) : 'no data'}</span>
  </div>`;
};

const bandOf = (score) => (score >= 70 ? 'high' : score >= 45 ? 'elevated' : score >= 25 ? 'moderate' : 'low');

export function renderCellCard(explain, { lang = 'en', onAdvisory } = {}) {
  const root = document.createElement('div');
  root.className = 'agahi-grid-card';
  const composite = explain.composite || {};
  const hasScore = Number.isFinite(composite.score);
  const hazards = explain.hazards || {};
  const metrics = explain.metrics || {};
  const hasMetrics = METRICS.some(([key]) => metrics[key] !== null && metrics[key] !== undefined);
  root.innerHTML = `
    <div class="agahi-grid-card-head">
      <div>
        <div class="agahi-grid-card-id">${escapeHtml(explain.id)}</div>
        <div class="agahi-grid-card-coords">${escapeHtml(Number(explain.lat).toFixed(3))}, ${escapeHtml(Number(explain.lon).toFixed(3))}</div>
      </div>
      <div class="agahi-grid-card-score">
        <span class="agahi-grid-card-score-num">${hasScore ? Math.round(composite.score) : '—'}</span>
        <span class="agahi-grid-chip agahi-grid-chip-${bandKey(composite.band)}">${escapeHtml(bandLabel(composite.band))}</span>
      </div>
    </div>
    <div class="agahi-grid-section">${HAZARD_ROWS.map(([key, label]) => hazardBar(key, label, hazards[key])).join('')}</div>
    <div class="agahi-grid-section-title">Metrics</div>
    <div class="agahi-grid-section agahi-grid-metrics">${
      hasMetrics
        ? METRICS.map(([key, label, unit, digits]) =>
            `<div class="agahi-grid-metric"><span>${label}</span><span>${escapeHtml(formatMetric(metrics[key], unit, digits, explain.pipeline))}</span></div>`,
          ).join('')
        : '<div class="agahi-grid-muted">No data</div>'
    }</div>
    <div class="agahi-grid-note">Air values are column densities: a relative indicator, not ground concentration.</div>
    <div class="agahi-grid-section-title">Sources</div>
    <ul class="agahi-grid-sources">${sourcesList(explain.sources).map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
    <div class="agahi-grid-actions">
      <button type="button" class="agahi-grid-btn" data-lang="en">Advisory EN</button>
      <button type="button" class="agahi-grid-btn" data-lang="ur">اردو</button>
    </div>
    <div class="agahi-grid-advisory agahi-grid-hidden"></div>
  `;
  const out = root.querySelector('.agahi-grid-advisory');
  const show = (target) => {
    const result = advisory(explain, target);
    out.dir = result.dir;
    out.lang = target;
    out.innerHTML = `<div class="agahi-grid-advisory-title">${escapeHtml(result.title)}</div>${result.lines
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join('')}`;
    out.classList.remove('agahi-grid-hidden');
    onAdvisory?.(result, target);
  };
  root.querySelectorAll('.agahi-grid-btn').forEach((btn) =>
    btn.addEventListener('click', () => show(btn.dataset.lang)),
  );
  if (lang === 'ur') show('ur');
  return root;
}
