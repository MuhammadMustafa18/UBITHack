import {
  FLOOD_SCENARIOS,
  FLOOD_MAGNITUDES,
  TIME_SCALES,
} from '../simulation/flowData.js';
import { NATIONAL_DEPOTS } from '../simulation/resourceDefenseGame.js';
import { INITIAL_SOS_SIGNALS } from './rescueDashboard.js';

const PATHS = {
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  play: 'M8 5v14l11-7z',
  pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
  stop: 'M6 6h12v12H6z',
  prev: 'M6 6h2v12H6zm3.5 6 8.5 6V6z',
  next: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z',
  minus: 'M19 13H5v-2h14v2z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  more: 'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  layers:
    'm11.99 18.54-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9.07l-9-7-9 7 1.63 1.27L12 16z',
  hex: 'M17 3H7L2 12l5 9h10l5-9-5-9zm-1.15 16h-7.7L4.3 12l3.85-7h7.7l3.85 7-3.85 7z',
  bolt: 'M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z',
  pin: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
};

const icon = (name) =>
  `<svg class="cd-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="${PATHS[name]}"/></svg>`;

const LOGO = `<svg class="cd-logo" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect x="1" y="1" width="30" height="30" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/><path fill="currentColor" d="M16 6.5s5.5 5.6 5.5 9.6a5.5 5.5 0 0 1-11 0C10.5 12.1 16 6.5 16 6.5z"/><path d="M7 23.5c2.2 0 2.2-1.5 4.5-1.5s2.3 1.5 4.5 1.5 2.3-1.5 4.5-1.5 2.3 1.5 4.5 1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const SCENARIO_TILES = [
  {
    key: 'glacier',
    title: 'Glacier GLOF',
    region: 'Hunza / Shisper',
    desc: 'Moraine ice-dam breach sends a torrent down the Hunza gorge.',
  },
  {
    key: 'dam_breach',
    title: 'Transboundary Dam Release',
    region: 'Chenab / Sutlej',
    desc: 'Upstream release surges through Marala into the Punjab plains.',
  },
  {
    key: 'rain',
    title: 'Monsoon Hill Torrents',
    region: 'Koh-e-Suleman',
    desc: 'Cloudburst flash floods spill across the piedmont plain.',
  },
  {
    key: 'riverine',
    title: 'Riverine Super Flood',
    region: FLOOD_SCENARIOS.riverine?.region || 'Swat / Kabul / Indus',
    desc: 'Surge routed down the real Swat–Kabul river network.',
  },
  {
    key: 'cyclone',
    title: 'Arabian Sea Cyclone',
    region: 'Thatta / Karachi',
    desc: 'Storm surge overwashes the Indus delta coast.',
  },
];

const TILE_BY_KEY = Object.fromEntries(SCENARIO_TILES.map((t) => [t.key, t]));
const MAGNITUDE_KEYS = ['moderate', 'high', 'very_high', 'super_flood'];
const TIME_SCALE_BUTTONS = [
  ['minute', 'Minute'],
  ['hourly', 'Hour'],
  ['daily', 'Day'],
  ['weekly', 'Week'],
];
const STYLE_BUTTONS = [
  ['1', 'normal', 'Normal'],
  ['3', 'surveillance', 'Night Vision'],
  ['4', 'thermal', 'FLIR'],
];
const HAZARDS = [
  ['composite', 'Composite risk'],
  ['flood', 'Flood'],
  ['heat', 'Heat'],
  ['terrain', 'Terrain'],
  ['air', 'Air quality'],
  ['veg', 'Vegetation'],
];
const FLEET_TOTALS = { boats: 40, firetrucks: 24, manpower: 500, rations: 10000 };
const SOS_CATEGORY = {
  'p1-critical': 'Rescue',
  'p2-medical': 'Medical',
  'p3-evac': 'Evac',
  'p4-supply': 'Supply',
};
const PRIMARY_PILLS = [
  '#gmaps-pill-risk',
  '#gmaps-pill-copilot',
  '#gmaps-pill-weather',
  '.gmaps-pill[data-category="dams"]',
  '#gmaps-pill-planes',
  '#gmaps-pill-cctv',
  '#gmaps-pill-rescue',
];
const PILL_LABELS = {
  'gmaps-pill-weather': 'Weather',
  'gmaps-pill-cctv': 'CCTV',
  'gmaps-pill-rescue': 'Rescue',
};
const LIVE_THROTTLE_MS = 250;
const STATION_COUNT = 8;
const SPARK_SAMPLES = 16;
const ARRIVAL_LEAD_HOURS = 12;

const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );

const trimNum = (n, digits = 1) => String(Number(n.toFixed(digits)));

const fmtCompact = (v) => {
  if (!Number.isFinite(v)) return '—';
  if (v >= 1e6) return `${trimNum(v / 1e6, 2)}M`;
  if (v >= 1e3) return `${trimNum(v / 1e3, v >= 1e5 ? 0 : 1)}K`;
  return String(Math.round(v));
};

const fmtKm = (m) => {
  if (!Number.isFinite(m)) return '—';
  const km = m / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
};

const shortName = (name, max = 16) => {
  let s = String(name || '').split(/ - | – |\(/)[0].trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  s = /\s/.test(s[max]) ? cut : cut.replace(/\s+\S*$/, '') || cut;
  return `${s.replace(/\s*&$/, '').trim()}…`;
};

const niceCeil = (v) => {
  if (!(v > 0)) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const f = v / mag;
  return [1, 1.5, 2, 3, 4, 5, 6, 8, 10].find((s) => f <= s) * mag;
};

const hoursLabel = (h) =>
  h < 48 ? `+${Math.round(h)}h` : `+${trimNum(h / 24, 1)} days`;

const peakWaypoint = (wps) =>
  wps.reduce(
    (best, w) =>
      !best || w.dischargeCusecs > best.dischargeCusecs ? w : best,
    null,
  );

const stationValue = (wp, simHours, mult) => {
  const full = wp.dischargeCusecs * mult;
  if (simHours >= wp.timeHours) return full;
  return (
    full *
    Math.max(0.1, 1 - (wp.timeHours - simHours) / ARRIVAL_LEAD_HOURS)
  );
};

const pickStations = (wps, n) => {
  if (wps.length <= n) return wps;
  return Array.from(
    { length: n },
    (_, i) => wps[Math.round((i * (wps.length - 1)) / (n - 1))],
  );
};

const hazardScore = (cell, hazard) =>
  hazard === 'composite'
    ? (cell.score?.score ?? null)
    : (cell.score?.hazards?.[hazard] ?? null);

const smoothPath = (pts) =>
  pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x.toFixed(1)} ${y.toFixed(1)}`;
    const [px, py] = pts[i - 1];
    const mx = ((px + x) / 2).toFixed(1);
    return `${d}C${mx} ${py.toFixed(1)} ${mx} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

const localStamp = () =>
  new Date().toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const pktStamp = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return `${parts.day} ${parts.month} ${parts.year} ${parts.hour}:${parts.minute} PKT`;
};

export class CommandDashboard {
  constructor(ui) {
    this.ui = ui;
    this.r = {};
    this.roots = [];
    this.cleanups = [];
    this.timers = [];
    this.moved = null;
    this.destroyed = false;
    this.loadedAt = Date.now();
    this.lastNetAt = null;
    this.frames = 0;
    this.frameMark = performance.now();
    this.markersOn = true;
    this.lowBandwidth = false;
    this.prevResolutionScale = null;
    this.gridOn = true;
    this.gridLoading = false;
    this.gridUserOff = false;
    this.seeking = false;
    this.busy = false;
    this.lang = 'en';
    this.dirty = new Set();
    this.flushTimer = null;
    this.lastFlush = 0;
    this.sosSignature = '';
    this.hz = null;
    this.hzSelected = null;
    this.clockMinute = '';
    this.wasActive = null;
    this.markerKey = '';
    this.acts = this.buildActions();
    this.mount();
  }

  buildActions() {
    const ui = this.ui;
    return {
      scenario: (el) => this.selectScenario(el.dataset.key),
      mag: (el) => this.selectMagnitude(el.dataset.key),
      collapse: (el) => this.toggleCollapse(el),
      'pick-origin': () => ui._enterOriginPickerMode(),
      launch: (el) => this.launch(el),
      stop: () => this.stop(),
      'sos-all': () => ui._showRescueDashboard(),
      sos: (el) => {
        const sos = this.signals().find((s) => s.id === el.dataset.id);
        if (sos) ui._locateSosOnGlobe(sos);
      },
      dispatch: (el) => this.dispatch(el.dataset.type),
      'tl-play': () => this.togglePlay(),
      'tl-stop': () => this.stop(),
      'tl-back': () => ui.floodEngine?.stepBackward(),
      'tl-fwd': () => ui.floodEngine?.stepForward(),
      'tl-scale': (el) => this.setTimeScale(el.dataset.scale),
      'tl-markers': () => {
        this.markersOn = !this.markersOn;
        this.r.timeline.classList.toggle('cd-markers-off', !this.markersOn);
        this.r['tl-markers-switch'].setAttribute(
          'aria-checked',
          String(this.markersOn),
        );
      },
      style: (el) => {
        ui.styleManager?.setStyle?.(el.dataset.style, { userInitiated: true });
        this.syncModes(el.dataset.style);
      },
      'mode-labels': () => {
        document.getElementById('gmaps-check-labels')?.click();
        this.syncModes();
      },
      'mode-grid': () => this.toggleGrid(),
      'mode-gray': () => this.toggleBodyMode('map-grayscale'),
      'mode-full': () => this.toggleBodyMode('cd-fullmap'),
      lowbw: () => this.setLowBandwidth(!this.lowBandwidth),
      lang: (el) => this.setLanguage(el.dataset.lang),
      hamburger: (el, e) => this.toggleLayersMenu(e),
      layers: (el, e) => this.toggleLayersMenu(e),
      threat: (el, e) => {
        e.stopPropagation();
        document.getElementById('gmaps-check-country-threat')?.click();
        this.syncState();
      },
      more: (el, e) => {
        e.stopPropagation();
        this.toggleMore();
      },
    };
  }

  listen(target, type, fn, options) {
    if (!target) return;
    target.addEventListener(type, fn, options);
    this.cleanups.push(() => target.removeEventListener(type, fn, options));
  }

  every(fn, ms) {
    const id = setInterval(fn, ms);
    this.timers.push(id);
    return id;
  }

  root(tag, className, html, label) {
    const el = document.createElement(tag);
    el.className = className;
    if (label) el.setAttribute('aria-label', label);
    el.innerHTML = html;
    this.listen(el, 'click', (e) => {
      const target = e.target.closest('[data-act]');
      if (!target || target.disabled || !el.contains(target)) return;
      this.acts[target.dataset.act]?.(target, e);
    });
    this.listen(el, 'change', (e) => {
      const target = e.target.closest('[data-change]');
      if (!target) return;
      if (target.dataset.change === 'hazard') this.setHazard(target.value);
      if (target.dataset.change === 'tl-scenario') {
        this.selectScenario(target.value);
      }
    });
    this.listen(el, 'input', (e) => {
      if (e.target.dataset.input === 'seek') {
        this.ui.floodEngine?.seekUnits(Number(e.target.value));
      }
    });
    document.body.appendChild(el);
    this.roots.push(el);
    el.querySelectorAll('[data-r]').forEach((n) => {
      this.r[n.dataset.r] = n;
    });
    return el;
  }

  mount() {
    document.body.classList.add('cd-active');
    this.buildHeader();
    this.buildLeft();
    this.buildRight();
    this.buildStrip();
    this.buildTimeline();
    this.buildSystem();
    this.buildModeBar();
    this.bindRuntime();
    this.refresh();
    this.every(() => this.tickSlow(), 1500);
    this.every(() => this.tickClock(), 30000);
    this.every(() => this.tickFps(), 1000);
  }

  buildHeader() {
    const search = document.getElementById('gmaps-search-box');
    const bar = document.getElementById('gmaps-filter-bar');
    const share = document.getElementById('gmaps-share-btn');
    const header = this.root(
      'header',
      'cd-header',
      `
      <div class="cd-brand">
        ${LOGO}
        <div class="cd-brand-text">
          <div class="cd-brand-name">Agaahi</div>
          <div class="cd-brand-sub">River · People · Infrastructure · Ahead of risk</div>
        </div>
      </div>
      <div class="cd-search-slot"></div>
      <nav class="cd-nav-slot" aria-label="Primary"></nav>
      <div class="cd-live" title="Time since this page loaded">
        <span class="cd-live-dot" aria-hidden="true"></span>
        <div class="cd-live-text">
          <span class="cd-live-label">LIVE</span>
          <span class="cd-live-time" data-r="live-time"></span>
        </div>
      </div>
      <div class="cd-lang" role="group" aria-label="Language">
        <button type="button" data-act="lang" data-lang="en" aria-pressed="true">EN</button>
        <button type="button" data-act="lang" data-lang="ur" aria-pressed="false" lang="ur">اردو</button>
      </div>
      <div class="cd-header-actions">
        <button type="button" class="cd-icon-btn cd-hamburger" data-act="hamburger" aria-label="Map layers menu" aria-pressed="false" title="Map layers">${icon('menu')}</button>
      </div>
      <div class="cd-more-menu" role="group" aria-label="More tools" hidden></div>`,
      'Agaahi header',
    );
    const searchSlot = header.querySelector('.cd-search-slot');
    const navSlot = header.querySelector('.cd-nav-slot');
    const actions = header.querySelector('.cd-header-actions');
    const menu = header.querySelector('.cd-more-menu');
    this.r.header = header;
    this.r['more-menu'] = menu;
    this.moved = { search, bar, share, top: search?.parentElement || null };

    if (search) {
      searchSlot.appendChild(search);
      search
        .querySelectorAll('.gmaps-search-divider, #gmaps-directions-btn, #gmaps-menu-btn')
        .forEach((n) => n.setAttribute('data-cd-hidden', ''));
    }
    if (share) actions.insertBefore(share, actions.firstChild);
    if (!bar) return;

    navSlot.appendChild(bar);
    const primary = PRIMARY_PILLS.map((sel) => bar.querySelector(sel)).filter(
      Boolean,
    );
    primary.forEach((pill) => bar.appendChild(pill));
    bar.querySelectorAll('.gmaps-pill').forEach((pill) => {
      if (!primary.includes(pill)) menu.appendChild(pill);
    });
    primary.forEach((pill) => {
      const label = PILL_LABELS[pill.id];
      const span = pill.querySelector('span:not(.gmaps-pill-icon)');
      if (label && span) span.textContent = label;
      if (pill.dataset.category === 'dams' && span) {
        span.textContent = 'Gauges & Barrages';
      }
    });
    bar.insertAdjacentHTML(
      'beforeend',
      `<button type="button" id="cd-tab-threat" class="cd-tab" data-act="threat" aria-pressed="false" title="Toggle country threat polygons"><span class="cd-tab-icon">${icon('hex')}</span><span class="cd-tab-label">Threat Polygons</span></button>
       <button type="button" id="cd-tab-layers" class="cd-tab" data-act="layers" aria-pressed="false" title="Map layers and details"><span class="cd-tab-icon">${icon('layers')}</span><span class="cd-tab-label">Layers</span></button>
       <button type="button" id="cd-tab-more" class="cd-tab" data-act="more" aria-haspopup="true" aria-expanded="false" title="More tools"><span class="cd-tab-icon">${icon('more')}</span><span class="cd-tab-label">More</span></button>`,
    );
    this.r['tab-more'] = bar.querySelector('#cd-tab-more');
    this.r['tab-threat'] = bar.querySelector('#cd-tab-threat');
    this.r['tab-layers'] = bar.querySelector('#cd-tab-layers');

    const rd = this.ui.riskDashboard;
    if (typeof rd?.setLanguage !== 'function') {
      header.querySelectorAll('.cd-lang button').forEach((b) => {
        b.disabled = true;
        b.title = 'Language switch unavailable';
      });
    }

    const syncPills = () => {
      header
        .querySelectorAll('.gmaps-pill')
        .forEach((p) =>
          p.setAttribute('aria-pressed', String(p.classList.contains('active'))),
        );
      this.r['tab-more'].classList.toggle(
        'is-on',
        Boolean(menu.querySelector('.gmaps-pill.active')),
      );
    };
    const observer = new MutationObserver(syncPills);
    observer.observe(header, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
    this.cleanups.push(() => observer.disconnect());
    syncPills();

    this.listen(menu, 'click', () => this.toggleMore(false));
    this.listen(document, 'click', (e) => {
      if (menu.hidden) return;
      if (!menu.contains(e.target) && !this.r['tab-more'].contains(e.target)) {
        this.toggleMore(false);
      }
    });
    this.listen(document, 'keydown', (e) => {
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.target?.matches?.('input, textarea, select, [contenteditable]')) {
        const k = e.key.toLowerCase();
        if (k === 'g') this.toggleBodyMode('map-grayscale');
        if (k === 'm') this.toggleBodyMode('cd-fullmap');
      }
      if (e.key === 'Escape' && !menu.hidden) {
        this.toggleMore(false);
        this.r['tab-more'].focus();
      }
    });
  }

  buildLeft() {
    const tiles = SCENARIO_TILES.map(
      (t, i) => `
      <button type="button" class="cd-tile" data-act="scenario" data-key="${t.key}" aria-pressed="false">
        <span class="cd-tile-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="cd-tile-title">${esc(t.title)}</span>
        <span class="cd-tile-region">${esc(t.region)}</span>
        <span class="cd-tile-desc">${esc(t.desc)}</span>
      </button>`,
    ).join('');
    const mags = MAGNITUDE_KEYS.map((k) => {
      const m = FLOOD_MAGNITUDES[k];
      return `<button type="button" data-act="mag" data-key="${k}" aria-pressed="false"><span>${esc(m.label)}</span><small>${Number(m.multiplier).toFixed(1)}x</small></button>`;
    }).join('');
    const col = this.root(
      'aside',
      'cd-col cd-col-left',
      `
      <section class="cd-card cd-forecast" data-r="forecast" aria-labelledby="cd-fc-title">
        <header class="cd-card-head">
          <span class="cd-card-icon">${icon('bolt')}</span>
          <div class="cd-card-titles">
            <h2 id="cd-fc-title">Disaster Forecast Engine</h2>
            <p>Select a scenario and run predictive simulation</p>
          </div>
          <button type="button" class="cd-icon-btn" data-act="collapse" aria-expanded="true" aria-label="Collapse Disaster Forecast Engine">${icon('minus')}</button>
        </header>
        <div class="cd-card-body">
          <div class="cd-tiles" role="group" aria-label="Scenario">${tiles}</div>
          <div class="cd-label">Scenario magnitude (relative to baseline)</div>
          <div class="cd-seg cd-seg-mag" role="group" aria-label="Scenario magnitude">${mags}</div>
          <div class="cd-preview-title">Live hydrological preview — <b data-r="scname"></b></div>
          <div class="cd-kpis">
            <div class="cd-kpi"><span class="cd-kpi-label">Discharge (cfs)</span><span class="cd-kpi-val" data-r="k-discharge">—</span><span class="cd-kpi-sub" data-r="k-discharge-sub"></span></div>
            <div class="cd-kpi"><span class="cd-kpi-label">Stage rise</span><span class="cd-kpi-val" data-r="k-stage">—</span><span class="cd-kpi-sub" data-r="k-where"></span></div>
            <div class="cd-kpi"><span class="cd-kpi-label">Corridor width</span><span class="cd-kpi-val" data-r="k-width">—</span></div>
            <div class="cd-kpi"><span class="cd-kpi-label">Spill radius</span><span class="cd-kpi-val" data-r="k-spill">—</span></div>
          </div>
          <div class="cd-chart" data-r="chart"></div>
          <div class="cd-actions" data-r="actions"></div>
        </div>
      </section>
      <section class="cd-card cd-copilot" aria-label="Agaahi Copilot">
        <div class="cd-slot" data-r="copilot-slot"></div>
      </section>`,
      'Forecast and copilot',
    );
    this.r.left = col;
    const slot = this.r['copilot-slot'];
    const copilot = this.ui.copilot;
    if (typeof copilot?.dock === 'function') {
      copilot.dock(slot);
    } else {
      slot.innerHTML = `<div class="cd-slot-fallback"><p>Ask the grounded Agaahi climate copilot.</p><button type="button" class="cd-btn cd-btn-primary cd-btn-block" data-act="open-copilot">Open Agaahi Copilot</button></div>`;
      slot.querySelector('[data-act]').addEventListener('click', () => {
        document.getElementById('gmaps-pill-copilot')?.click();
      });
    }
  }

  buildRight() {
    const rd = this.ui.riskDashboard;
    if (typeof rd?.dock !== 'function') {
      document.body.classList.add('cd-no-right');
      return;
    }
    const col = this.root(
      'aside',
      'cd-col cd-col-right',
      '<div class="cd-slot" data-r="risk-slot"></div>',
      'Risk intelligence',
    );
    this.r.right = col;
    rd.dock(this.r['risk-slot'], 'sukkur');
    document.getElementById('gmaps-pill-risk')?.classList.add('active');
    this.gridLoading = true;
    Promise.resolve(this.ui._showRiskLayer('sukkur'))
      .catch(() => {})
      .finally(() => {
        this.gridLoading = false;
        if (!this.destroyed) {
          this.syncModes();
          this.drawHazard();
        }
      });
  }

  buildStrip() {
    const hazardOptions = HAZARDS.map(
      ([k, label]) => `<option value="${k}">${esc(label)}</option>`,
    ).join('');
    const strip = this.root(
      'section',
      'cd-strip',
      `
      <article class="cd-card cd-ops cd-sos">
        <header class="cd-ops-head">
          <h3>SOS Inbox <span class="cd-count" data-r="sos-count"></span></h3>
          <button type="button" class="cd-btn cd-btn-outline cd-btn-sm" data-act="sos-all">View all</button>
        </header>
        <ul class="cd-sos-list" data-r="sos-list"></ul>
      </article>
      <article class="cd-card cd-ops cd-gauges">
        <header class="cd-ops-head">
          <h3>River Gauges &amp; Barrages</h3>
          <span class="cd-tag" title="Values derive from the scenario model, not live gauges">Simulated</span>
        </header>
        <ul class="cd-gauge-grid" data-r="gauges"></ul>
      </article>
      <article class="cd-card cd-ops cd-fleet">
        <header class="cd-ops-head">
          <h3>Relief Fleet Status</h3>
          <div class="cd-fleet-actions" data-r="fleet-actions" hidden>
            <button type="button" class="cd-btn cd-btn-outline cd-btn-sm" data-act="dispatch" data-type="boat">Boat</button>
            <button type="button" class="cd-btn cd-btn-outline cd-btn-sm" data-act="dispatch" data-type="firetruck">Pump</button>
            <button type="button" class="cd-btn cd-btn-outline cd-btn-sm" data-act="dispatch" data-type="crew">Crew</button>
          </div>
        </header>
        <ul class="cd-fleet-list" data-r="fleet"></ul>
      </article>
      <article class="cd-card cd-ops cd-hazard">
        <header class="cd-ops-head"><h3>Hazard Map (AOI)</h3></header>
        <select class="cd-select cd-select-sm" data-change="hazard" data-r="hz-select" aria-label="Hazard layer">${hazardOptions}</select>
        <div class="cd-hz-body">
          <div class="cd-hz-map" data-r="hz-map">
            <canvas data-r="hz-canvas" role="img" aria-label="Hazard heat grid. Click a cell to inspect it." hidden></canvas>
            <span class="cd-hz-empty" data-r="hz-empty">Loading grid…</span>
          </div>
          <div class="cd-hz-scale" aria-hidden="true"><span>100</span><i></i><span>0</span></div>
        </div>
      </article>`,
      'Operations',
    );
    this.r.strip = strip;
    const canvas = this.r['hz-canvas'];
    this.listen(canvas, 'click', (e) => this.pickHazardCell(e));
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(() => this.drawHazard());
      ro.observe(this.r['hz-map']);
      this.cleanups.push(() => ro.disconnect());
    }
  }

  buildTimeline() {
    const scaleButtons = TIME_SCALE_BUTTONS.map(
      ([k, label]) =>
        `<button type="button" data-act="tl-scale" data-scale="${k}" aria-pressed="false">${label}</button>`,
    ).join('');
    const options = SCENARIO_TILES.map(
      (t) => `<option value="${t.key}">${esc(t.title)}</option>`,
    ).join('');
    const tl = this.root(
      'section',
      'cd-card cd-timeline',
      `
      <div class="cd-tl-head">
        <h3 class="cd-tl-title">Simulation Timeline</h3>
        <span class="cd-tl-sub" data-r="tl-sub"></span>
        <div class="cd-tl-tools">
          <div class="cd-seg cd-seg-sm" role="group" aria-label="Time scale">${scaleButtons}</div>
          <button type="button" class="cd-switch-row" role="switch" aria-checked="true" data-act="tl-markers" data-r="tl-markers-switch"><span class="cd-switch" aria-hidden="true"></span>Event markers</button>
          <select class="cd-select cd-select-sm" data-change="tl-scenario" data-r="tl-scenario" aria-label="Scenario">${options}</select>
        </div>
      </div>
      <div class="cd-tl-body">
        <div class="cd-tl-transport" role="group" aria-label="Playback">
          <button type="button" class="cd-tbtn" data-act="tl-back" data-r="tl-back" aria-label="Step back">${icon('prev')}</button>
          <button type="button" class="cd-tbtn cd-tbtn-main" data-act="tl-play" data-r="tl-play" aria-label="Launch simulation">${icon('play')}</button>
          <button type="button" class="cd-tbtn" data-act="tl-stop" data-r="tl-stop" aria-label="Stop simulation">${icon('stop')}</button>
          <button type="button" class="cd-tbtn" data-act="tl-fwd" data-r="tl-fwd" aria-label="Step forward">${icon('next')}</button>
        </div>
        <div class="cd-tl-track" data-r="tl-track">
          <span class="cd-tl-now" data-r="tl-now"></span>
          <input type="range" class="cd-range" data-r="tl-range" data-input="seek" min="0" max="168" step="any" value="0" aria-label="Simulation time" />
          <div class="cd-tl-markers" data-r="tl-markers"></div>
        </div>
      </div>`,
      'Simulation timeline',
    );
    this.r.timeline = tl;
    const range = this.r['tl-range'];
    this.listen(range, 'pointerdown', () => {
      this.seeking = true;
    });
    this.listen(window, 'pointerup', () => {
      this.seeking = false;
    });
  }

  buildSystem() {
    this.root(
      'section',
      'cd-card cd-system',
      `
      <div class="cd-sys-head"><h3>System</h3><span class="cd-sys-net" data-r="sys-net"><i aria-hidden="true"></i><span data-r="sys-net-text">Online</span></span></div>
      <div class="cd-sys-stats">
        <div><span>FPS</span><b data-r="sys-fps">—</b></div>
        <div><span>Latency</span><b data-r="sys-latency">—</b></div>
        <div><span>Data</span><b data-r="sys-fresh">—</b></div>
      </div>
      <button type="button" class="cd-switch-row" role="switch" aria-checked="false" data-act="lowbw" data-r="sys-lowbw"><span class="cd-switch" aria-hidden="true"></span>Low-bandwidth mode</button>`,
      'System status',
    );
  }

  buildModeBar() {
    const styles = STYLE_BUTTONS.map(
      ([num, key, label]) =>
        `<button type="button" class="cd-mode" data-act="style" data-style="${key}" aria-pressed="false"><kbd>${num}</kbd>${label}</button>`,
    ).join('');
    this.root(
      'div',
      'cd-modebar',
      `
      <div class="cd-mode-group" role="group" aria-label="Visual style">${styles}</div>
      <div class="cd-mode-group" role="group" aria-label="Map overlays">
        <button type="button" class="cd-mode" data-act="mode-labels" data-r="mode-labels" aria-pressed="false">Labels</button>
        <button type="button" class="cd-mode" data-act="mode-grid" data-r="mode-grid" aria-pressed="false">Grid</button>
        <button type="button" class="cd-mode" data-act="mode-gray" data-r="mode-gray" aria-pressed="false"><kbd>G</kbd>Grayscale</button>
        <button type="button" class="cd-mode cd-mode-full" data-act="mode-full" data-r="mode-full" aria-pressed="false"><kbd>M</kbd>Full map</button>
      </div>`,
      'Map modes',
    );
  }

  bindRuntime() {
    const { ui } = this;
    const engine = ui.floodEngine;
    if (engine?.subscribe) {
      const off = engine.subscribe(() => this.queue('live'));
      this.cleanups.push(() => off?.());
    }
    const game = ui.resourceDefenseGame;
    if (game?.subscribe) {
      const off = game.subscribe(() => this.queue('fleet'));
      this.cleanups.push(() => off?.());
    }
    const postRender = ui.viewer?.scene?.postRender;
    if (postRender) {
      const onFrame = () => {
        this.frames += 1;
      };
      postRender.addEventListener(onFrame);
      this.cleanups.push(() => postRender.removeEventListener(onFrame));
    }
    this.listen(window, 'online', () => this.syncNet());
    this.listen(window, 'offline', () => this.syncNet());
    const conn = navigator.connection;
    if (conn?.addEventListener) {
      this.listen(conn, 'change', () => this.syncNet());
    }
    if (typeof PerformanceObserver === 'function') {
      try {
        const po = new PerformanceObserver(() => {
          this.lastNetAt = Date.now();
        });
        po.observe({ type: 'resource', buffered: true });
        this.cleanups.push(() => po.disconnect());
      } catch {
        this.lastNetAt = null;
      }
    }
    const styleObserver = new MutationObserver(() => this.syncModes());
    styleObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-gev-style'],
    });
    this.cleanups.push(() => styleObserver.disconnect());
    this.listen(document.getElementById('gmaps-check-country-threat'), 'change', () =>
      this.syncState(),
    );
  }

  queue(part) {
    this.dirty.add(part);
    if (this.flushTimer || this.destroyed) return;
    const wait = Math.max(0, LIVE_THROTTLE_MS - (performance.now() - this.lastFlush));
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.lastFlush = performance.now();
      const parts = [...this.dirty];
      this.dirty.clear();
      if (this.destroyed) return;
      if (parts.includes('live')) this.renderLive();
      if (parts.includes('fleet')) this.renderFleet();
    }, wait);
  }

  scenario() {
    return FLOOD_SCENARIOS[this.ui.selectedScenarioKey] || FLOOD_SCENARIOS.glacier;
  }

  multiplier() {
    return (
      FLOOD_MAGNITUDES[this.ui.selectedMagnitudeKey] || FLOOD_MAGNITUDES.high
    ).multiplier || 1;
  }

  engineActive() {
    return Boolean(this.ui.floodEngine?.active);
  }

  live() {
    const e = this.ui.floodEngine;
    return Boolean(e?.active) && e.scenarioKey === this.ui.selectedScenarioKey;
  }

  telemetry() {
    return this.live() ? this.ui.floodEngine.getCurrentTelemetry() : null;
  }

  signals() {
    return this.ui.rescueDashboard?.signals || INITIAL_SOS_SIGNALS;
  }

  refresh() {
    if (this.destroyed) return;
    this.syncForecast();
    this.renderLive();
    this.renderFleet();
    this.renderSos();
    this.syncState();
    this.syncNet();
    this.tickClock();
    this.drawHazard();
  }

  renderLive() {
    if (this.destroyed) return;
    const active = this.engineActive();
    if (this.wasActive !== active) {
      this.wasActive = active;
      this.renderActions();
    }
    this.renderKpis();
    this.renderChart();
    this.renderGauges();
    this.renderTimeline();
  }

  syncForecast() {
    const { ui, r } = this;
    r.left?.querySelectorAll('.cd-tile').forEach((el) => {
      const on = el.dataset.key === ui.selectedScenarioKey;
      el.classList.toggle('active', on);
      el.setAttribute('aria-pressed', String(on));
    });
    r.left?.querySelectorAll('[data-act="mag"]').forEach((el) => {
      const on = el.dataset.key === ui.selectedMagnitudeKey;
      el.classList.toggle('active', on);
      el.setAttribute('aria-pressed', String(on));
    });
    if (r.scname) {
      r.scname.textContent =
        TILE_BY_KEY[ui.selectedScenarioKey]?.title || this.scenario().name;
    }
    if (r['tl-scenario']) r['tl-scenario'].value = ui.selectedScenarioKey;
    this.renderActions();
    this.renderKpis();
    this.renderChart();
    this.renderGauges();
    this.renderTimeline();
  }

  selectScenario(key) {
    if (!FLOOD_SCENARIOS[key]) return;
    this.ui.selectedScenarioKey = key;
    this.ui.selectedOriginPoint = null;
    this.syncForecast();
  }

  selectMagnitude(key) {
    if (!FLOOD_MAGNITUDES[key]) return;
    this.ui.selectedMagnitudeKey = key;
    if (this.engineActive()) this.ui.floodEngine.setMagnitude(key);
    this.syncForecast();
  }

  toggleCollapse(btn) {
    const card = this.r.forecast;
    const collapsed = card.classList.toggle('is-collapsed');
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.setAttribute(
      'aria-label',
      `${collapsed ? 'Expand' : 'Collapse'} Disaster Forecast Engine`,
    );
    btn.innerHTML = icon(collapsed ? 'plus' : 'minus');
  }

  focusForecast() {
    const col = this.r.left;
    const card = this.r.forecast;
    if (!col || !card || getComputedStyle(col).display === 'none') return false;
    if (card.classList.contains('is-collapsed')) {
      this.toggleCollapse(card.querySelector('[data-act="collapse"]'));
    }
    card.classList.remove('cd-flash');
    void card.offsetWidth;
    card.classList.add('cd-flash');
    const timer = setTimeout(() => card.classList.remove('cd-flash'), 1400);
    this.timers.push(timer);
    card.querySelector('.cd-tile.active')?.focus({ preventScroll: false });
    return true;
  }

  metrics() {
    const sc = this.scenario();
    const mult = this.multiplier();
    const wps = sc.waypoints || [];
    if (sc.dataBasis === 'real' || !wps.length) return { noData: true, mult };
    const tel = this.telemetry();
    const wp = tel
      ? wps.find((w) => w.name === tel.locationName) || wps[0]
      : peakWaypoint(wps);
    return {
      noData: false,
      mult,
      discharge: tel ? tel.dischargeCusecs : wp.dischargeCusecs * mult,
      stage: tel ? tel.stageRiseM : Number(wp.stageRiseM || 0) * Math.sqrt(mult),
      width: wp.floodWidthM,
      spill: wp.radialSpillRadiusM,
      where: tel ? shortName(tel.locationName) : `Peak: ${shortName(wp.name)}`,
    };
  }

  renderKpis() {
    const { r } = this;
    if (!r['k-discharge']) return;
    const m = this.metrics();
    const delta = Math.round((m.mult - 1) * 100);
    r['k-discharge'].textContent = m.noData ? 'No gauge data' : fmtCompact(m.discharge);
    r['k-stage'].textContent = m.noData
      ? 'No gauge data'
      : `+${Number(m.stage).toFixed(1)} m`;
    r['k-discharge'].classList.toggle('is-nodata', m.noData);
    r['k-stage'].classList.toggle('is-nodata', m.noData);
    r['k-discharge-sub'].textContent = m.noData
      ? ''
      : delta === 0
        ? '(baseline)'
        : `(${delta > 0 ? '+' : ''}${delta}%)`;
    r['k-where'].textContent = m.noData ? '' : m.where;
    r['k-width'].textContent = m.noData ? '—' : fmtKm(m.width);
    r['k-spill'].textContent = m.noData ? '—' : fmtKm(m.spill);
  }

  renderChart() {
    const { r } = this;
    if (!r.chart) return;
    const sc = this.scenario();
    const mult = this.multiplier();
    const wps = sc.waypoints || [];
    const multText = `${mult.toFixed(1)}x`;
    const legend = `<span class="cd-legend"><i class="cd-lg cd-lg-solid"></i>Simulated (${multText})<i class="cd-lg cd-lg-dash"></i>Baseline (1.0x)</span>`;
    if (sc.dataBasis === 'real' || !wps.length) {
      r.chart.innerHTML = `<div class="cd-chart-head"><span class="cd-chart-title">Simulated hydrograph</span></div><div class="cd-chart-empty">No gauge data</div>`;
      return;
    }
    const W = 396;
    const H = 128;
    const L = 38;
    const Rt = 8;
    const T = 16;
    const B = 18;
    const pw = W - L - Rt;
    const ph = H - T - B;
    const tmax = Math.max(wps[wps.length - 1].timeHours, 1);
    const peak = peakWaypoint(wps);
    const yMax = niceCeil(peak.dischargeCusecs * Math.max(mult, 1) * 1.1);
    const X = (t) => L + (t / tmax) * pw;
    const Y = (q) => T + (1 - q / yMax) * ph;
    const series = (k) =>
      wps.map((w) => [X(w.timeHours), Y(w.dischargeCusecs * k)]);
    const sim = series(mult);
    const base = series(1);
    const baseY = T + ph;
    const grid = [1, 2, 3, 4]
      .map((i) => {
        const v = (yMax * i) / 4;
        const y = Y(v);
        return `<line class="cd-c-grid" x1="${L}" x2="${W - Rt}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text class="cd-c-tick" x="${L - 5}" y="${(y + 3).toFixed(1)}" text-anchor="end">${fmtCompact(v)}</text>`;
      })
      .join('');
    const xTicks = [0, 0.5, 1]
      .map((f, i) => {
        const anchor = i === 0 ? 'start' : i === 2 ? 'end' : 'middle';
        return `<text class="cd-c-tick" x="${(L + f * pw).toFixed(1)}" y="${H - 4}" text-anchor="${anchor}">T+${Math.round(f * tmax)}h</text>`;
      })
      .join('');
    const area = `${smoothPath(sim)}L${sim[sim.length - 1][0].toFixed(1)} ${baseY}L${sim[0][0].toFixed(1)} ${baseY}Z`;
    const crestQ = peak.dischargeCusecs * mult;
    const cx = X(peak.timeHours);
    const cy = Y(crestQ);
    const anchor = cx > W * 0.65 ? 'end' : cx < W * 0.35 ? 'start' : 'middle';
    const crestLabel = `Crest: ${fmtCompact(crestQ)} cfs · T+${Math.round(peak.timeHours)}h`;
    const tel = this.telemetry();
    const now = tel
      ? `<line class="cd-c-now" x1="${X(Math.min(tel.simHours, tmax)).toFixed(1)}" x2="${X(Math.min(tel.simHours, tmax)).toFixed(1)}" y1="${T}" y2="${baseY}"/><text class="cd-c-tick" x="${X(Math.min(tel.simHours, tmax)).toFixed(1)}" y="${T - 4}" text-anchor="middle">now</text>`
      : '';
    r.chart.innerHTML = `
      <div class="cd-chart-head"><span class="cd-chart-title">${esc(shortName(peak.name, 22))} — Simulated hydrograph</span>${legend}</div>
      <svg class="cd-chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Simulated hydrograph, crest ${fmtCompact(crestQ)} cubic feet per second at ${Math.round(peak.timeHours)} hours">
        ${grid}
        <line class="cd-c-axis" x1="${L}" x2="${W - Rt}" y1="${baseY}" y2="${baseY}"/>
        ${xTicks}
        <path class="cd-c-area" d="${area}"/>
        <path class="cd-c-base" d="${smoothPath(base)}"/>
        <path class="cd-c-line" d="${smoothPath(sim)}"/>
        ${now}
        <circle class="cd-c-crest" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.5"/>
        <text class="cd-c-label" x="${cx.toFixed(1)}" y="${Math.max(cy - 8, 9).toFixed(1)}" text-anchor="${anchor}">${crestLabel}</text>
      </svg>`;
  }

  renderActions() {
    const { r } = this;
    if (!r.actions) return;
    const origin = this.ui.selectedOriginPoint;
    const originLine = origin
      ? `<span class="cd-origin" title="${esc(origin.name)}">Origin: ${esc(origin.name)}</span>`
      : '';
    const cta = this.engineActive()
      ? `<div class="cd-btn-row"><button type="button" class="cd-btn cd-btn-outline" data-act="stop">Stop simulation</button><button type="button" class="cd-btn cd-btn-primary" data-act="launch">Relaunch</button></div>`
      : `<button type="button" class="cd-btn cd-btn-primary cd-btn-block" data-act="launch">▶ Launch Simulation</button>`;
    r.actions.innerHTML = `<div class="cd-actions-top"><button type="button" class="cd-btn cd-btn-link" data-act="pick-origin">${icon('pin')}Pick origin on map</button>${originLine}</div>${cta}`;
  }

  async launch(btn) {
    if (this.busy) return;
    this.busy = true;
    btn.disabled = true;
    if (btn.dataset.act === 'launch') btn.textContent = 'Launching…';
    try {
      await this.ui._launchSimulation();
    } catch (error) {
      console.warn('[CommandDashboard] launch failed:', error);
      this.ui._showToast('Simulation could not start');
    } finally {
      this.busy = false;
      btn.disabled = false;
      this.refresh();
    }
  }

  async stop() {
    if (!this.engineActive()) return;
    try {
      await this.ui._exitSimulation();
    } finally {
      this.refresh();
    }
  }

  togglePlay() {
    const engine = this.ui.floodEngine;
    if (engine?.active) engine.togglePlay();
    else this.launch(this.r['tl-play']);
  }

  setTimeScale(key) {
    if (!TIME_SCALES[key]) return;
    this.ui.selectedTimeScale = key;
    this.ui.floodEngine?.setTimeScale(key);
    this.renderTimeline();
  }

  renderGauges() {
    const { r } = this;
    if (!r.gauges) return;
    const sc = this.scenario();
    const wps = sc.waypoints || [];
    if (sc.dataBasis === 'real' || !wps.length) {
      r.gauges.innerHTML = '<li class="cd-empty">No gauge data for this scenario</li>';
      return;
    }
    const mult = this.multiplier();
    const tel = this.telemetry();
    const simNow = tel ? tel.simHours : null;
    const tmax = Math.max(wps[wps.length - 1].timeHours, 1);
    const maxQ = peakWaypoint(wps).dischargeCusecs * mult;
    r.gauges.innerHTML = pickStations(wps, STATION_COUNT)
      .map((w) => {
        const value = simNow === null ? w.dischargeCusecs * mult : stationValue(w, simNow, mult);
        const points = Array.from({ length: SPARK_SAMPLES }, (_, i) => {
          const t = (i / (SPARK_SAMPLES - 1)) * tmax;
          const y = 9 - (8 * stationValue(w, t, mult)) / maxQ;
          return `${((i / (SPARK_SAMPLES - 1)) * 100).toFixed(1)},${y.toFixed(2)}`;
        }).join(' ');
        const nowLine =
          simNow === null
            ? ''
            : `<line class="cd-spark-now" x1="${((Math.min(simNow, tmax) / tmax) * 100).toFixed(1)}" x2="${((Math.min(simNow, tmax) / tmax) * 100).toFixed(1)}" y1="0" y2="10"/>`;
        return `<li class="cd-gauge" title="${esc(w.name)}"><span class="cd-g-name">${esc(shortName(w.name, 14))}</span><span class="cd-g-val">${Math.round(value).toLocaleString('en-US')}</span><svg class="cd-spark" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><polyline class="cd-spark-line" points="${points}"/>${nowLine}</svg></li>`;
      })
      .join('');
  }

  renderSos() {
    const { r } = this;
    if (!r['sos-list']) return;
    const signals = this.signals();
    const signature = signals.map((s) => `${s.id}:${s.status}`).join('|');
    if (signature === this.sosSignature) return;
    this.sosSignature = signature;
    const fresh = signals.filter((s) => s.status === 'PENDING DISPATCH').length;
    r['sos-count'].textContent = `(${fresh} new)`;
    r['sos-list'].innerHTML = signals
      .map((s) => {
        const [lon, lat] = s.coords || [];
        const level = s.llmScore >= 95 ? 'critical' : s.llmScore >= 85 ? 'high' : 'medium';
        const levelText = level[0].toUpperCase() + level.slice(1);
        const category = SOS_CATEGORY[s.badgeClass] || 'Rescue';
        return `<li><button type="button" class="cd-sos-row" data-act="sos" data-id="${esc(s.id)}" aria-label="Locate SOS: ${esc(levelText)}, ${esc(category)}, ${esc(s.district)}" title="${esc(category)} · ${esc(s.district)}">
          <span class="cd-sos-time">${esc(s.timestamp)}</span>
          <span class="cd-sos-coord">${Number(lat).toFixed(3)}, ${Number(lon).toFixed(3)}</span>
          <span class="cd-badge cd-${level}">${levelText}</span>
          <span class="cd-sos-cat">${esc(category)}</span>
          <span class="cd-sos-district">${esc(s.district)}</span>
        </button></li>`;
      })
      .join('');
  }

  renderFleet() {
    const { r } = this;
    if (!r.fleet) return;
    const game = this.ui.resourceDefenseGame;
    if (!game) {
      r.fleet.innerHTML = '<li class="cd-empty">Fleet data unavailable</li>';
      return;
    }
    const status = (n, total) => {
      const ratio = n / total;
      return ratio > 0.5 ? 'Ready' : ratio > 0.2 ? 'Low' : 'Critical';
    };
    const pooled = (label, n, total) => ({
      label,
      value: `${fmtCompact(n)} / ${fmtCompact(total)}`,
      tag: status(n, total),
    });
    const dispatches = game.dispatches?.length || 0;
    const rows = [
      pooled('Rescue boats', game.pool.boats, FLEET_TOTALS.boats),
      pooled('Pumps / firetrucks', game.pool.firetrucks, FLEET_TOTALS.firetrucks),
      pooled('Manpower', game.pool.manpower, FLEET_TOTALS.manpower),
      pooled('Rations', game.pool.rations, FLEET_TOTALS.rations),
      { label: 'Active dispatches', value: String(dispatches), tag: dispatches ? 'Active' : 'Idle' },
      { label: 'Depots', value: String(NATIONAL_DEPOTS.length), tag: 'Mapped' },
    ];
    r.fleet.innerHTML = rows
      .map(
        (row) =>
          `<li class="cd-fleet-row"><span class="cd-f-label" title="${esc(row.label)}">${esc(row.label)}</span><b class="cd-f-val">${esc(row.value)}</b><span class="cd-pill cd-pill-${row.tag.toLowerCase()}">${row.tag}</span></li>`,
      )
      .join('');
    r['fleet-actions'].hidden = !(game.active || this.engineActive());
  }

  dispatch(type) {
    const result = this.ui.resourceDefenseGame?.dispatchResource(type);
    if (result && !result.success && result.reason) this.ui._showToast(result.reason);
    this.renderFleet();
  }

  renderMarkers() {
    const { r } = this;
    if (!r['tl-markers']) return;
    const sc = this.scenario();
    const wps = sc.waypoints || [];
    const engine = this.ui.floodEngine;
    const scaleKey = engine?.active ? engine.timeScale : this.ui.selectedTimeScale;
    const scale = TIME_SCALES[scaleKey] || TIME_SCALES.hourly;
    if (sc.dataBasis === 'real' || !wps.length) {
      r['tl-markers'].innerHTML = '';
      return;
    }
    const toUnits = { minute: 60, hourly: 1, daily: 1 / 24, weekly: 1 / 168 }[scale.id] ?? 1;
    const peak = peakWaypoint(wps);
    const items = wps
      .map((w) => ({ w, f: (w.timeHours * toUnits) / scale.maxUnits }))
      .filter((it) => it.f <= 1);
    const labeled = [];
    [...items]
      .sort((a, b) => (a.w === peak ? -1 : b.w === peak ? 1 : a.f - b.f))
      .forEach((it) => {
        if (it.f > 0 && labeled.every((o) => Math.abs(o.f - it.f) >= 0.17)) labeled.push(it);
      });
    r['tl-markers'].innerHTML = items
      .map((it) => {
        const pos = `left:${(it.f * 100).toFixed(2)}%`;
        const showLabel = labeled.includes(it);
        const edge = it.f > 0.88 ? ' cd-lbl-end' : it.f < 0.08 ? ' cd-lbl-start' : '';
        const text = `${shortName(it.w.name, 14)}${it.w === peak ? ' crest' : ''} ${hoursLabel(it.w.timeHours)}`;
        return `<span class="cd-marker${it.w === peak ? ' is-peak' : ''}" style="${pos}" title="${esc(it.w.name)} ${hoursLabel(it.w.timeHours)}"></span>${showLabel ? `<span class="cd-marker-label${edge}" style="${pos}">${esc(text)}</span>` : ''}`;
      })
      .join('');
  }

  renderTimeline() {
    const { r, ui } = this;
    if (!r['tl-range']) return;
    const engine = ui.floodEngine;
    const active = Boolean(engine?.active);
    const tel = active ? engine.getCurrentTelemetry() : null;
    const scaleKey = active ? engine.timeScale : ui.selectedTimeScale;
    const scale = TIME_SCALES[scaleKey] || TIME_SCALES.hourly;
    const playing = active && engine.playing;
    const playBtn = r['tl-play'];
    playBtn.innerHTML = icon(playing ? 'pause' : 'play');
    playBtn.setAttribute(
      'aria-label',
      playing ? 'Pause simulation' : active ? 'Play simulation' : 'Launch simulation',
    );
    ['tl-back', 'tl-stop', 'tl-fwd'].forEach((k) => {
      r[k].disabled = !active;
    });
    const range = r['tl-range'];
    range.disabled = !active;
    range.max = String(tel?.maxUnits ?? scale.maxUnits);
    if (!this.seeking) range.value = String(active ? engine.scaleUnits : 0);
    range.setAttribute('aria-valuetext', tel?.formattedTime || 'Simulation not running');
    const frac = active ? Math.min(1, engine.scaleUnits / Number(range.max)) : 0;
    r['tl-track'].style.setProperty('--cd-now', frac.toFixed(4));
    r['tl-now'].textContent = `Now ${localStamp()}`;
    const title = TILE_BY_KEY[ui.selectedScenarioKey]?.title || this.scenario().name;
    r['tl-sub'].textContent = `${title} — ${this.multiplier().toFixed(1)}x${tel ? ` · ${tel.formattedTime}` : ''}`;
    r.timeline.querySelectorAll('[data-act="tl-scale"]').forEach((b) => {
      const on = b.dataset.scale === scaleKey;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (r['tl-scenario'] && r['tl-scenario'].value !== ui.selectedScenarioKey) {
      r['tl-scenario'].value = ui.selectedScenarioKey;
    }
    const markerKey = `${ui.selectedScenarioKey}|${scaleKey}|${scale.maxUnits}|${this.scenario().waypoints?.length || 0}`;
    if (markerKey !== this.markerKey) {
      this.markerKey = markerKey;
      this.renderMarkers();
    }
  }

  setHazard(hazard) {
    this.ui.riskHazard = hazard;
    this.ui.riskLayer?.setHazard(hazard);
    this.drawHazard();
  }

  drawHazard() {
    const { r, ui } = this;
    const canvas = r['hz-canvas'];
    const wrap = r['hz-map'];
    if (!canvas || !wrap) return;
    const grid = ui.riskLayer?.grid;
    if (!grid?.cells?.length) {
      this.hz = null;
      canvas.hidden = true;
      r['hz-empty'].hidden = false;
      r['hz-empty'].textContent =
        this.gridUserOff && !this.gridLoading ? 'Grid hidden' : 'Loading grid…';
      return;
    }
    if (!this.hz || this.hz.grid !== grid) {
      const deg = grid.cellDeg;
      const lons = grid.cells.map((c) => c.lon);
      const lats = grid.cells.map((c) => c.lat);
      const west = Math.min(...lons);
      const north = Math.max(...lats);
      const cols = Math.round((Math.max(...lons) - west) / deg) + 1;
      const rows = Math.round((north - Math.min(...lats)) / deg) + 1;
      const index = new Map();
      grid.cells.forEach((cell) => {
        const col = Math.round((cell.lon - west) / deg);
        const row = Math.round((north - cell.lat) / deg);
        index.set(row * cols + col, cell);
      });
      this.hz = { grid, cols, rows, index };
    }
    const { cols, rows, index } = this.hz;
    const availW = wrap.clientWidth;
    const availH = wrap.clientHeight;
    if (!availW || !availH) return;
    r['hz-empty'].hidden = true;
    canvas.hidden = false;
    const scale = Math.min(availW / cols, availH / rows);
    canvas.style.width = `${Math.floor(cols * scale)}px`;
    canvas.style.height = `${Math.floor(rows * scale)}px`;
    const px = Math.max(1, Math.min(8, Math.round(scale * (window.devicePixelRatio || 1))));
    canvas.width = cols * px;
    canvas.height = rows * px;
    const ctx = canvas.getContext('2d');
    const hazard = ui.riskHazard || 'composite';
    const css = getComputedStyle(document.documentElement);
    const empty = css.getPropertyValue('--sc-muted').trim() || '#18181b';
    ctx.fillStyle = empty;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let selected = null;
    index.forEach((cell, key) => {
      const score = hazardScore(cell, hazard);
      const row = Math.floor(key / cols);
      const col = key % cols;
      if (Number.isFinite(score)) {
        const v = Math.round(40 + (Math.max(0, Math.min(100, score)) / 100) * 200);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(col * px, row * px, px, px);
      }
      if (cell.id === ui.selectedCellId) selected = [col, row];
    });
    this.hzSelected = ui.selectedCellId;
    if (selected) {
      ctx.strokeStyle = '#fafafa';
      ctx.lineWidth = Math.max(1, px / 3);
      ctx.strokeRect(selected[0] * px + 0.5, selected[1] * px + 0.5, px - 1, px - 1);
    }
    if (r['hz-select'].value !== hazard) r['hz-select'].value = hazard;
  }

  pickHazardCell(e) {
    if (!this.hz) return;
    const rect = this.r['hz-canvas'].getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * this.hz.cols);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * this.hz.rows);
    const cell = this.hz.index.get(row * this.hz.cols + col);
    if (cell) this.ui._selectRiskCell(cell.id);
    this.drawHazard();
  }

  toggleGrid() {
    const { ui } = this;
    const on = Boolean(ui.riskLayer?.grid) || this.gridLoading;
    if (on) {
      this.gridUserOff = true;
      ui.riskLayer?.hide();
      this.syncModes();
      this.drawHazard();
      return;
    }
    this.gridUserOff = false;
    this.gridLoading = true;
    this.syncModes();
    Promise.resolve(ui._showRiskLayer(ui.riskDashboard?.aoi || 'sukkur'))
      .catch(() => {})
      .finally(() => {
        this.gridLoading = false;
        if (!this.destroyed) {
          this.syncModes();
          this.drawHazard();
        }
      });
  }

  syncModes(forcedStyle) {
    const { r, ui } = this;
    const style =
      forcedStyle ||
      ui.styleManager?.activeStyle ||
      document.documentElement.dataset.gevStyle ||
      'normal';
    document.querySelectorAll('.cd-modebar [data-act="style"]').forEach((b) => {
      const on = b.dataset.style === style;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const set = (el, on) => {
      if (!el) return;
      el.classList.toggle('active', on);
      el.setAttribute('aria-pressed', String(on));
    };
    set(r['mode-labels'], Boolean(document.getElementById('gmaps-check-labels')?.checked));
    set(r['mode-grid'], Boolean(ui.riskLayer?.grid) || this.gridLoading);
    set(r['mode-gray'], document.body.classList.contains('map-grayscale'));
    set(r['mode-full'], document.body.classList.contains('cd-fullmap'));
  }

  toggleBodyMode(cls) {
    document.body.classList.toggle(cls);
    this.syncModes();
  }

  syncState() {
    const { r, ui } = this;
    const threat = Boolean(document.getElementById('gmaps-check-country-threat')?.checked);
    const setTab = (el, on) => {
      if (!el) return;
      el.classList.toggle('is-on', on);
      el.setAttribute('aria-pressed', String(on));
    };
    setTab(r['tab-threat'], threat);
    setTab(r['tab-layers'], Boolean(ui.layersMenuOpen));
    r.header
      ?.querySelector('.cd-hamburger')
      ?.setAttribute('aria-pressed', String(Boolean(ui.layersMenuOpen)));
    r.header
      ?.querySelector('.cd-hamburger')
      ?.classList.toggle('is-on', Boolean(ui.layersMenuOpen));
    this.syncModes();
    if (r['hz-select'] && r['hz-select'].value !== (ui.riskHazard || 'composite')) {
      r['hz-select'].value = ui.riskHazard || 'composite';
    }
  }

  toggleLayersMenu(e) {
    e.stopPropagation();
    this.toggleMore(false);
    document.getElementById('gmaps-layers-card')?.click();
    this.syncState();
  }

  toggleMore(force) {
    const menu = this.r['more-menu'];
    const tab = this.r['tab-more'];
    if (!menu || !tab) return;
    const open = typeof force === 'boolean' ? force : menu.hidden;
    menu.hidden = !open;
    tab.setAttribute('aria-expanded', String(open));
    if (open) {
      const rect = tab.getBoundingClientRect();
      const width = menu.offsetWidth || 220;
      menu.style.top = `${Math.round(rect.bottom + 4)}px`;
      menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    }
  }

  setLanguage(lang) {
    const rd = this.ui.riskDashboard;
    if (lang !== 'en' && lang !== 'ur') return;
    if (typeof rd?.setLanguage !== 'function') return;
    rd.setLanguage(lang);
    this.lang = lang;
    this.r.header.querySelectorAll('.cd-lang button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
  }

  setLowBandwidth(on) {
    const viewer = this.ui.viewer;
    this.lowBandwidth = on;
    document.body.classList.toggle('cd-low-bandwidth', on);
    if (viewer && !viewer.isDestroyed?.()) {
      if (on && this.prevResolutionScale === null) {
        this.prevResolutionScale = viewer.resolutionScale;
        viewer.resolutionScale = 0.6;
      } else if (!on && this.prevResolutionScale !== null) {
        viewer.resolutionScale = this.prevResolutionScale;
        this.prevResolutionScale = null;
      }
    }
    this.r['sys-lowbw']?.setAttribute('aria-checked', String(on));
  }

  syncNet() {
    const { r } = this;
    if (!r['sys-net']) return;
    const online = navigator.onLine;
    r['sys-net'].classList.toggle('is-offline', !online);
    r['sys-net-text'].textContent = online ? 'Online' : 'Offline';
    const rtt = navigator.connection?.rtt;
    r['sys-latency'].textContent = rtt > 0 ? `${rtt} ms` : '—';
  }

  tickFps() {
    const now = performance.now();
    const fps = Math.round((this.frames * 1000) / Math.max(1, now - this.frameMark));
    this.frames = 0;
    this.frameMark = now;
    if (this.r['sys-fps']) this.r['sys-fps'].textContent = fps > 0 ? String(fps) : '—';
  }

  tickClock() {
    const { r } = this;
    if (!r['live-time']) return;
    const mins = Math.floor((Date.now() - this.loadedAt) / 60000);
    r['live-time'].textContent = `${pktStamp()} (${mins < 1 ? 'just now' : `${mins} min ago`})`;
  }

  tickSlow() {
    if (this.destroyed) return;
    this.renderSos();
    this.syncState();
    this.syncNet();
    const grid = this.ui.riskLayer?.grid;
    if (
      (grid && this.hz?.grid !== grid) ||
      (!grid && this.hz) ||
      this.hzSelected !== this.ui.selectedCellId
    ) {
      this.drawHazard();
    }
    if (this.r['sys-fresh']) {
      const age = this.lastNetAt === null ? null : (Date.now() - this.lastNetAt) / 1000;
      this.r['sys-fresh'].textContent =
        age === null ? '—' : age < 60 ? 'Live' : `${Math.floor(age / 60)}m ago`;
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.timers.forEach((id) => {
      clearInterval(id);
      clearTimeout(id);
    });
    clearTimeout(this.flushTimer);
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    if (this.lowBandwidth) this.setLowBandwidth(false);
    const m = this.moved;
    if (m?.top) {
      const menu = this.r['more-menu'];
      menu?.querySelectorAll('.gmaps-pill').forEach((p) => m.bar?.appendChild(p));
      m.bar?.querySelectorAll('.cd-tab').forEach((t) => t.remove());
      [m.search, m.bar, m.share].forEach((el) => el && m.top.appendChild(el));
    }
    this.roots.forEach((el) => el.remove());
    this.roots = [];
    document.body.classList.remove('cd-active', 'cd-no-right', 'cd-low-bandwidth', 'cd-fullmap', 'map-grayscale');
  }
}
