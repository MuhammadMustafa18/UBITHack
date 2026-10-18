import { loadAois, loadGrid } from './gridStore.js';
import { aoiSummary, rankCells } from './queries.js';
import { HAZARDS, bandOf } from './scoring.js';
import { advisory } from './advisory.js';

const HAZARD_LABELS = {
  composite: 'Composite',
  flood: 'Flood',
  heat: 'Heat',
  terrain: 'Terrain',
  air: 'Air',
  veg: 'Vegetation',
};
const BAND_LABELS = {
  high: 'High',
  elevated: 'Elevated',
  moderate: 'Moderate',
  low: 'Low',
  insufficient_data: 'No data',
};
const PIPELINE_LABELS = { gee: 'GEE', openmeteo: 'Open-Meteo fallback' };
const URDU_FONTS = '"Noto Nastaliq Urdu","Jameel Noori Nastaleeq",serif';
const NO_DATA = 'no data';
const TOP_N = 10;

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const isNum = (x) => typeof x === 'number' && Number.isFinite(x);
const fmtInt = (x) => (isNum(x) ? Math.round(x).toLocaleString('en-US') : NO_DATA);
const fmtPct = (x) => (isNum(x) ? `${Math.round(x * 100)}%` : NO_DATA);

function kpisOf(summary, grid) {
  const counts = summary.bandCounts || {};
  const highElev = (counts.high || 0) + (counts.elevated || 0);
  const cellKm = isNum(grid?.cellDeg) ? (grid.cellDeg * 111).toFixed(1) : null;
  return [
    ['Cells', fmtInt(summary.cells), cellKm ? `(${cellKm} km cells)` : ''],
    ['High + elevated', summary.cells ? `${Math.round((highElev / summary.cells) * 100)}%` : NO_DATA, `(${fmtInt(highElev)} cells)`],
    ['Population in high band', fmtInt(summary.popByBand?.high), '(est.)'],
    ['Mean coverage', fmtPct(summary.coverageMean), '(valid data)'],
  ];
}

const ICON_RISK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2 3 6v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V6l-9-4zm0 2.2 7 3.1V12c0 4-2.9 7.9-7 9-4.1-1.1-7-5-7-9V7.3l7-3.1zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg>';
const ICON_DOWNLOAD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg>';
const ICON_PRINT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>';
const ICON_CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 6 8.6 7.4 13.2 12l-4.6 4.6L10 18l6-6z"/></svg>';
const LEGEND_BANDS = ['high', 'elevated', 'moderate', 'low', 'insufficient_data'];

function sourcesOf(grid) {
  return Object.entries(grid.sources || {}).map(([key, src]) => {
    const detail = Object.entries(src || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
    return `${key.toUpperCase()} — ${detail}`;
  });
}

function advisoryHtml(adv, lang) {
  const attrs = lang === 'ur' ? ` dir="rtl" lang="ur" style="font-family:${URDU_FONTS}"` : ' dir="ltr" lang="en"';
  return `<section class="adv"${attrs}><h3>${esc(adv.title)}</h3><ul>${adv.lines
    .map((l) => `<li>${esc(l)}</li>`)
    .join('')}</ul>${adv.note ? `<p class="note">${esc(adv.note)}</p>` : ''}</section>`;
}

function buildBriefing({ entry, grid, summary, top, today }) {
  const input = { ...summary, name: entry?.name, nameUr: entry?.nameUr };
  const rows = top
    .map(
      (r, i) =>
        `<tr><td>${i + 1}</td><td>${esc(r.id)}</td><td>${esc(r.score)}</td><td>${esc(BAND_LABELS[r.band] || r.band)}</td><td>${esc(fmtInt(r.pop))}</td></tr>`,
    )
    .join('');
  const hazardRows = HAZARDS.map(
    (h) => `<tr><td>${esc(HAZARD_LABELS[h])}</td><td>${esc(isNum(summary.hazardMeans?.[h]) ? summary.hazardMeans[h] : NO_DATA)}</td></tr>`,
  ).join('');
  const kpiRows = kpisOf(summary, grid)
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join('');
  const sources = sourcesOf(grid)
    .map((s) => `<li>${esc(s)}</li>`)
    .join('');
  const name = entry?.name || summary.aoi;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Agaahi briefing — ${esc(name)} — ${esc(today)}</title><style>
body{font-family:-apple-system,"Segoe UI",Roboto,sans-serif;max-width:820px;margin:24px auto;padding:0 16px;color:#202124;line-height:1.5}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:24px 0 8px;border-bottom:1px solid #dadce0;padding-bottom:4px}h3{font-size:15px;margin:0 0 6px}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #dadce0;padding:4px 8px;text-align:left}th{background:#f1f3f4}
.meta{color:#5f6368;font-size:12px}.adv{border:1px solid #dadce0;border-radius:8px;padding:10px 14px;margin:10px 0}.adv ul{margin:6px 0;padding-inline-start:20px}.note{color:#b06000;font-size:12px;margin:6px 0 0}
</style></head><body>
<h1>Agaahi Climate Intelligence — ${esc(name)}</h1>
<p class="meta">Pipeline: ${esc(PIPELINE_LABELS[grid.pipeline] || grid.pipeline || NO_DATA)} · Data generated: ${esc(grid.generatedAt || NO_DATA)} · Briefing date: ${esc(today)}</p>
<h2>Summary</h2><table><tbody>${kpiRows}</tbody></table>
<h2>Mean hazard score (0–100)</h2><table><tbody>${hazardRows}</tbody></table>
<h2>Top ${top.length} cells by composite score</h2><table><thead><tr><th>#</th><th>Cell</th><th>Score</th><th>Band</th><th>Population</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Advisory</h2>${advisoryHtml(advisory(input, 'en'), 'en')}${advisoryHtml(advisory(input, 'ur'), 'ur')}
<h2>Sources</h2><ul>${sources}</ul>
<p class="meta">Scores are relative indicators computed from satellite- and model-derived data; air values are not ground concentrations. Missing data is shown as "${NO_DATA}", never as low risk.</p>
</body></html>`;
}

export class RiskDashboardPanel {
  constructor({ onSelectCell, onAoiChange } = {}) {
    this.onSelectCell = onSelectCell;
    this.onAoiChange = onAoiChange;
    this.visible = false;
    this._aoi = null;
    this._aois = [];
    this._grid = null;
    this._summary = null;
    this._hazard = 'composite';
    this._lang = 'en';
    this._error = null;
    this._token = 0;
    this._buildDOM();
  }

  get aoi() {
    return this._aoi;
  }

  _buildDOM() {
    this.container = document.createElement('div');
    this.container.id = 'agahi-dashboard-panel';
    this.container.className = 'agahi-dash hidden';
    this.container.innerHTML = `
      <div class="agahi-dash-header">
        <span class="agahi-dash-icon">${ICON_RISK}</span>
        <span class="agahi-dash-title">Risk Intelligence</span>
        <span class="agahi-dash-badge" data-slot="badge"></span>
        <button class="agahi-dash-close" type="button" data-act="close" aria-label="Close Risk Intelligence">✕</button>
      </div>
      <div class="agahi-dash-body" data-slot="body"></div>
    `;
    document.body.appendChild(this.container);
    this.body = this.container.querySelector('[data-slot="body"]');
    this.badge = this.container.querySelector('[data-slot="badge"]');
    this.container.addEventListener('click', (e) => this._onClick(e));
    this.container.addEventListener('change', (e) => {
      if (e.target.dataset?.act === 'aoi') this._changeAoi(e.target.value);
    });
  }

  show(aoi) {
    this.visible = true;
    this.container.classList.remove('hidden', 'agahi-collapsed');
    this._load(aoi || this._aoi || 'sukkur');
  }

  hide() {
    this.visible = false;
    this.container.classList.add(this.docked ? 'agahi-collapsed' : 'hidden');
  }

  dock(slot, aoi) {
    this.docked = true;
    this.container.classList.add('agahi-docked');
    slot.appendChild(this.container);
    this.show(aoi);
  }

  setLanguage(lang) {
    if (lang !== 'en' && lang !== 'ur') return;
    this._lang = lang;
    this._render();
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
    return this.visible;
  }

  async _load(aoi) {
    const token = ++this._token;
    this._aoi = aoi;
    this._error = null;
    this._grid = null;
    this._summary = null;
    this._render();
    try {
      const [aois, grid] = await Promise.all([loadAois(), loadGrid(aoi)]);
      if (token !== this._token) return;
      this._aois = aois;
      this._grid = grid;
      this._summary = aoiSummary(grid);
    } catch (error) {
      if (token !== this._token) return;
      this._error = String(error?.message || error);
    }
    this._render();
  }

  _changeAoi(aoi) {
    this._load(aoi);
    this.onAoiChange?.(aoi);
  }

  _entry() {
    return this._aois.find((a) => a.aoi === this._aoi) || null;
  }

  _onClick(e) {
    const row = e.target.closest('[data-cell]');
    if (row) {
      this.onSelectCell?.(row.dataset.cell);
      return;
    }
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'close') {
      if (this.docked && !this.visible) this.show();
      else this.hide();
    }
    else if (act === 'hazard') {
      this._hazard = el.dataset.value;
      this._render();
    } else if (act === 'lang') {
      this._lang = el.dataset.value;
      this._render();
    } else if (act === 'download') this._download();
    else if (act === 'print') window.print();
  }

  _download() {
    if (!this._grid || !this._summary) return;
    const today = new Date().toISOString().slice(0, 10);
    const html = buildBriefing({
      entry: this._entry(),
      grid: this._grid,
      summary: this._summary,
      top: rankCells(this._grid, { hazard: 'composite', limit: TOP_N }),
      today,
    });
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `agahi-${this._aoi}-${today}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  _render() {
    const scrollTop = this.body.scrollTop;
    const pipeline = this._grid?.pipeline;
    this.badge.textContent = pipeline ? PIPELINE_LABELS[pipeline] || pipeline : '';
    this.badge.classList.toggle('agahi-dash-badge-fallback', pipeline === 'openmeteo');
    this.badge.hidden = !pipeline;

    const select = `<label class="agahi-dash-aoi"><span>Area of interest</span><select class="agahi-dash-select" data-act="aoi">${
      (this._aois.length ? this._aois : [{ aoi: this._aoi, name: this._aoi }])
        .map((a) => `<option value="${esc(a.aoi)}"${a.aoi === this._aoi ? ' selected' : ''}>${esc(a.name || a.aoi)}</option>`)
        .join('')
    }</select></label>`;

    let content;
    if (this._error) {
      content = `<div class="agahi-dash-msg">Could not load risk data: ${esc(this._error)}</div>`;
    } else if (!this._summary) {
      content = '<div class="agahi-dash-msg">Loading…</div>';
    } else {
      content = this._renderLoaded();
    }
    this.body.innerHTML = `${select}${content}`;
    this.body.scrollTop = scrollTop;
  }

  _renderLoaded() {
    const s = this._summary;
    const kpis = kpisOf(s, this._grid)
      .map(
        ([k, v, sub]) =>
          `<div class="agahi-dash-kpi"><div class="agahi-dash-kpi-value">${esc(v)}</div><div class="agahi-dash-kpi-label">${esc(k)}</div>${sub ? `<div class="agahi-dash-kpi-sub">${esc(sub)}</div>` : ''}</div>`,
      )
      .join('');

    const legend = LEGEND_BANDS.map(
      (b) => `<span class="agahi-dash-legend-item"><i class="agahi-dash-swatch agahi-dash-band-${b}"></i>${esc(BAND_LABELS[b])}</span>`,
    ).join('');

    const bars = HAZARDS.map((h) => {
      const v = s.hazardMeans?.[h];
      const band = bandOf(v);
      return `<div class="agahi-dash-bar-row">
        <span class="agahi-dash-bar-label">${esc(HAZARD_LABELS[h])}</span>
        <span class="agahi-dash-bar-value">${isNum(v) ? esc(v) : NO_DATA}</span>
        <span class="agahi-dash-bar-track"><span class="agahi-dash-bar-fill agahi-dash-band-${band}" style="width:${isNum(v) ? Math.max(0, Math.min(100, v)) : 0}%"></span></span>
      </div>`;
    }).join('');

    const tabs = ['composite', ...HAZARDS]
      .map(
        (h) =>
          `<button type="button" role="tab" aria-selected="${h === this._hazard}" class="agahi-dash-chip${h === this._hazard ? ' active' : ''}" data-act="hazard" data-value="${h}">${esc(h === 'composite' ? 'All' : HAZARD_LABELS[h])}</button>`,
      )
      .join('');
    const top = rankCells(this._grid, { hazard: this._hazard, limit: TOP_N });
    const rows = top.length
      ? top
          .map(
            (r, i) => `<tr data-cell="${esc(r.id)}" tabindex="0">
              <td class="agahi-dash-rank">${i + 1}</td><td class="agahi-dash-cell-id">${esc(r.id)}</td><td class="agahi-dash-num">${esc(r.score)}</td>
              <td><span class="agahi-dash-pill agahi-dash-band-${esc(r.band)}">${esc(BAND_LABELS[r.band] || r.band)}</span></td>
              <td class="agahi-dash-num">${esc(fmtInt(r.pop))}</td><td class="agahi-dash-chev">${ICON_CHEVRON}</td></tr>`,
          )
          .join('')
      : `<tr><td colspan="6" class="agahi-dash-empty">${NO_DATA}</td></tr>`;

    const entry = this._entry();
    const input = { ...s, name: entry?.name, nameUr: entry?.nameUr };
    const en = advisory(input, 'en');
    const ur = advisory(input, 'ur');
    const langBtn = (l, label) =>
      `<button type="button" aria-pressed="${this._lang === l}" class="agahi-dash-seg${this._lang === l ? ' active' : ''}" data-act="lang" data-value="${l}">${label}</button>`;
    const col = (adv, l) =>
      `<div class="agahi-dash-adv-col${this._lang === l ? ' is-primary' : ''}${l === 'ur' ? ' agahi-dash-adv-ur' : ''}" dir="${l === 'ur' ? 'rtl' : 'ltr'}" lang="${l}"><ul>${adv.lines.map((line) => `<li>${esc(line)}</li>`).join('')}</ul></div>`;
    const note = this._lang === 'ur' ? ur.note : en.note;
    const hazardName = this._hazard === 'composite' ? 'composite' : HAZARD_LABELS[this._hazard].toLowerCase();

    return `
      <div class="agahi-dash-kpis">${kpis}</div>
      <div class="agahi-dash-section-head">
        <h4 class="agahi-dash-h">Mean hazard score <span>(selected area)</span></h4>
        <div class="agahi-dash-legend">${legend}</div>
      </div>
      <div class="agahi-dash-bars">${bars}</div>
      <div class="agahi-dash-section-head">
        <h4 class="agahi-dash-h">Top ${TOP_N} cells <span>(by ${esc(hazardName)} hazard score)</span></h4>
      </div>
      <div class="agahi-dash-chips" role="tablist" aria-label="Hazard">${tabs}</div>
      <table class="agahi-dash-table"><thead><tr><th>#</th><th>Cell ID</th><th>Score</th><th>Band</th><th>Population</th><th><span class="agahi-dash-sr">Open</span></th></tr></thead><tbody>${rows}</tbody></table>
      <div class="agahi-dash-adv">
        <div class="agahi-dash-section-head">
          <h4 class="agahi-dash-h agahi-dash-adv-title">Area advisory — ${esc(entry?.name || s.aoi)}</h4>
          <div class="agahi-dash-segs" role="group" aria-label="Advisory language">${langBtn('en', 'EN')}${langBtn('ur', 'اردو')}</div>
        </div>
        <div class="agahi-dash-adv-cols">${col(en, 'en')}${col(ur, 'ur')}</div>
        ${note ? `<p class="agahi-dash-note" dir="${this._lang === 'ur' ? 'rtl' : 'ltr'}">${esc(note)}</p>` : ''}
      </div>
      <div class="agahi-dash-actions">
        <button type="button" class="agahi-dash-btn" data-act="download">${ICON_DOWNLOAD}<span>Download briefing</span></button>
        <button type="button" class="agahi-dash-btn agahi-dash-btn-outline" data-act="print">${ICON_PRINT}<span>Print</span></button>
      </div>
      <p class="agahi-dash-foot">Missing data is shown as <em>no data</em>, never as low risk.</p>`;
  }
}
