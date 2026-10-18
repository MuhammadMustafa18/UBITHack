import * as Cesium from 'cesium';
import { escapeHtml } from './countryThreatPolygons.js';
import {
  REQUIRED_CONFIRMATIONS,
  VERIFY_CAVEATS,
  buildFacts,
  demoAssets,
  draftTexts,
  loadFacilities,
  runChecks,
  suggestStaging,
  verify2022,
} from './corridorResponse.js';

const CANDIDATE_LIMIT = 12;
const fmtH = (h) => h.toFixed(1);
const fmtPop = (n) => `≈${Math.round(n).toLocaleString()}`;

export class CorridorResponsePanel {
  constructor(viewer, floodEngine) {
    this.viewer = viewer;
    this.floodEngine = floodEngine;
    this.visible = false;
    this.tab = 'staging';
    this.selected = new Set();
    this.draft = null;
    this._facilities = null;
    this._facilitiesError = null;
    this._loading = null;
    this._scenarioKey = null;
    this._hour = null;
    this._entities = [];
    this._buildDOM();
    this._unsubscribe = floodEngine?.subscribe((tel) => this._onTelemetry(tel));
  }

  _buildDOM() {
    this.container = document.createElement('div');
    this.container.id = 'corridor-response-panel';
    this.container.className = 'corridor-panel hidden';
    this.container.innerHTML = `
      <div class="corridor-panel-header">
        <span class="corridor-panel-title">Response · Swat–Kabul corridor</span>
        <button class="corridor-panel-close" type="button" aria-label="Close">✕</button>
      </div>
      <div class="corridor-panel-tabs" role="tablist">
        <button type="button" data-tab="staging">Staging</button>
        <button type="button" data-tab="alert">Alert</button>
        <button type="button" data-tab="verify">2022 check</button>
      </div>
      <div class="corridor-panel-body"></div>
      <div class="corridor-panel-foot">Exercise prototype · nothing is sent</div>
    `;
    document.body.appendChild(this.container);
    this.body = this.container.querySelector('.corridor-panel-body');

    this.container
      .querySelector('.corridor-panel-close')
      .addEventListener('click', () => this.hide());
    this.container.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.tab = btn.dataset.tab;
        this._render();
      });
    });
    this.body.addEventListener('click', (e) => this._onClick(e));
    this.body.addEventListener('change', (e) => this._onChange(e));
    this.body.addEventListener('input', (e) => this._onInput(e));
  }

  show() {
    this.visible = true;
    this.container.classList.remove('hidden');
    this._render();
  }

  hide() {
    this.visible = false;
    this.container.classList.add('hidden');
    this._clearMarkers();
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
    return this.visible;
  }

  _scenario() {
    const scenario = this.floodEngine?.activeScenario;
    return scenario?.dataBasis === 'real' && scenario.communities
      ? scenario
      : null;
  }

  _simHours() {
    return this.floodEngine?.simHours || 0;
  }

  _onTelemetry(tel) {
    if (!this.visible) return;
    const hour = Math.floor(tel.simHours || 0);
    if (tel.scenarioKey !== this._scenarioKey) {
      this._scenarioKey = tel.scenarioKey;
      this.selected.clear();
      this.draft = null;
      this._render();
    } else if (hour !== this._hour && !(this.tab === 'alert' && this.draft)) {
      this._render();
    }
    this._hour = hour;
  }

  _ensureFacilities() {
    if (this._facilities || this._facilitiesError || this._loading) return;
    this._loading = loadFacilities().then(
      (facilities) => {
        this._facilities = facilities;
        this._loading = null;
        if (this.visible) this._render();
      },
      (error) => {
        this._facilitiesError = String(error?.message || error);
        this._loading = null;
        if (this.visible) this._render();
      },
    );
  }

  _staging(scenario) {
    if (!this._facilities) return [];
    return suggestStaging(
      scenario,
      this._facilities,
      demoAssets(scenario.communities),
      this._simHours(),
    );
  }

  _render() {
    this.container.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === this.tab);
    });
    const scenario = this._scenario();
    if (!scenario) {
      this._clearMarkers();
      this.body.innerHTML = `<p class="corridor-muted">Select the <strong>Swat–Kabul (Real)</strong> scenario to use staging, alerts and the 2022 check.</p>`;
      return;
    }
    this._ensureFacilities();
    if (this.tab === 'staging') this._renderStaging(scenario);
    else if (this.tab === 'alert') this._renderAlert(scenario);
    else this._renderVerify(scenario);
  }

  _facilitiesNotice() {
    if (this._facilitiesError)
      return `<p class="corridor-warn">Facility data unavailable: ${escapeHtml(this._facilitiesError)}</p>`;
    if (!this._facilities)
      return `<p class="corridor-muted">Loading facilities…</p>`;
    return '';
  }

  _renderStaging(scenario) {
    const staging = this._staging(scenario);
    this._showMarkers(staging);
    const notice = this._facilitiesNotice();
    if (notice) {
      this.body.innerHTML = notice;
      return;
    }
    const items = staging
      .map(
        (s) => `
        <div class="corridor-card">
          <div class="corridor-card-title">${escapeHtml(s.site.name)} <span class="corridor-tag">${escapeHtml(s.site.kind)}</span></div>
          <ul class="corridor-list">
            ${s.assets.map((a) => `<li>${escapeHtml(a.asset.name)} · ${a.distanceKm.toFixed(1)} km straight line</li>`).join('')}
          </ul>
          <div class="corridor-meta">Covers ${s.covers.length} communities · ${fmtPop(s.coveredPopulation)} people (WorldPop, modelled)</div>
          <div class="corridor-meta">${s.covers
            .slice(0, 6)
            .map(
              (c) =>
                `${escapeHtml(c.name)} (${fmtH(Math.max(0, c.windowRemainingH[0]))}–${fmtH(c.windowRemainingH[1])} h)`,
            )
            .join(', ')}${s.covers.length > 6 ? ', …' : ''}</div>
          <div class="corridor-reason">${escapeHtml(s.reason)}</div>
        </div>`,
      )
      .join('');
    this.body.innerHTML = `
      <p class="corridor-muted">Suggestions only. Assets are synthetic DEMO units; roads and bridges not confirmed passable.</p>
      ${items || '<p class="corridor-muted">No high-band community has an open arrival window of 2 h or more, or no asset is available.</p>'}
    `;
  }

  _candidates(scenario) {
    const t = this._simHours();
    return scenario.communities
      .filter(
        (c) =>
          c.windowH &&
          (c.band === 'high' || c.band === 'medium') &&
          c.windowH[1] - t >= 0,
      )
      .sort((a, b) => b.priority - a.priority)
      .slice(0, CANDIDATE_LIMIT);
  }

  _renderAlert(scenario) {
    this._clearMarkers();
    if (this.draft) {
      this._renderDraft();
      return;
    }
    const t = this._simHours();
    const rows = this._candidates(scenario)
      .map(
        (c) => `
        <label class="corridor-check">
          <input type="checkbox" data-community="${escapeHtml(c.id)}" ${this.selected.has(c.id) ? 'checked' : ''} />
          <span>${escapeHtml(c.name)} <span class="corridor-tag">${c.band}</span>
            <span class="corridor-meta">${fmtPop(c.population)} · window ${fmtH(Math.max(0, c.windowH[0] - t))}–${fmtH(c.windowH[1] - t)} h</span>
          </span>
        </label>`,
      )
      .join('');
    this.body.innerHTML = `
      <p class="corridor-muted">Pick communities to watch, then draft a warning. Drafts are built from reviewed templates; nothing is sent.</p>
      ${rows || '<p class="corridor-muted">No high or medium band community has an open window.</p>'}
      <button type="button" class="corridor-btn primary" data-action="draft" ${this.selected.size ? '' : 'disabled'}>Draft warning (${this.selected.size})</button>
      ${this._facilities ? '' : this._facilitiesNotice()}
    `;
  }

  _renderDraft() {
    const draft = this.draft;
    const decided = draft.status !== 'draft';
    const langs = Object.entries(draft.texts)
      .map(
        ([lang, entry]) => `
        <div class="corridor-card">
          <div class="corridor-card-title">${lang.toUpperCase()} ${entry.reviewed ? '<span class="corridor-tag">reviewed template</span>' : '<span class="corridor-tag warn">template not yet reviewed by a native speaker</span>'}</div>
          <label class="corridor-field">SMS
            <textarea data-lang="${lang}" data-channel="sms" rows="4" ${decided ? 'readonly' : ''} dir="${lang === 'ur' ? 'rtl' : 'ltr'}"></textarea>
          </label>
          <label class="corridor-field">Voice
            <textarea data-lang="${lang}" data-channel="voice" rows="7" ${decided ? 'readonly' : ''} dir="${lang === 'ur' ? 'rtl' : 'ltr'}"></textarea>
          </label>
        </div>`,
      )
      .join('');
    const confirmations = REQUIRED_CONFIRMATIONS.map(
      (c) => `
        <label class="corridor-check">
          <input type="checkbox" data-confirm="${c.id}" ${draft.confirmations.has(c.id) ? 'checked' : ''} ${decided ? 'disabled' : ''} />
          <span>${escapeHtml(c.label)}</span>
        </label>`,
    ).join('');
    this.body.innerHTML = `
      <div class="corridor-status">Status: <strong>${draft.status.toUpperCase()}</strong> · drafted at T+${fmtH(draft.draftedAtH)} h${draft.decidedAtH != null ? ` · decided at T+${fmtH(draft.decidedAtH)} h` : ''}</div>
      <div class="corridor-meta">Targets: ${draft.facts.communities.map(escapeHtml).join(', ')}${draft.facts.stagingSite ? ` · staging site: ${escapeHtml(draft.facts.stagingSite)}` : ''}</div>
      ${langs}
      <div class="corridor-card" data-checks></div>
      <div class="corridor-card">
        <div class="corridor-card-title">Reviewer confirmations</div>
        ${confirmations}
      </div>
      <div class="corridor-actions">
        ${decided ? '' : '<button type="button" class="corridor-btn primary" data-action="approve">Approve</button><button type="button" class="corridor-btn" data-action="reject">Reject</button>'}
        <button type="button" class="corridor-btn" data-action="discard">${decided ? 'New draft' : 'Discard'}</button>
      </div>
      <p class="corridor-muted">Approval needs every blocking check passed and all confirmations. Separate drafter and approver accounts are not enforced in this single-user console.</p>
    `;
    this.body.querySelectorAll('textarea[data-lang]').forEach((area) => {
      area.value = draft.texts[area.dataset.lang][area.dataset.channel];
    });
    this._renderChecks();
  }

  _renderChecks() {
    const box = this.body.querySelector('[data-checks]');
    if (!box || !this.draft) return;
    this.draft.checks = runChecks(this.draft.facts, this.draft.texts);
    box.innerHTML = `
      <div class="corridor-card-title">Guardrail checks</div>
      <ul class="corridor-list">
        ${this.draft.checks
          .map(
            (c) =>
              `<li class="${c.passed ? 'ok' : c.blocking ? 'fail' : 'warn'}">${c.passed ? '✓' : '✗'} ${escapeHtml(c.id)}${c.blocking ? ' (blocking)' : ''}${c.detail ? ` — ${escapeHtml(c.detail)}` : ''}</li>`,
          )
          .join('')}
      </ul>
    `;
    const approve = this.body.querySelector('[data-action="approve"]');
    if (approve) approve.disabled = !this._canApprove();
  }

  _canApprove() {
    const draft = this.draft;
    return (
      draft?.status === 'draft' &&
      draft.checks.every((c) => c.passed || !c.blocking) &&
      REQUIRED_CONFIRMATIONS.every((c) => draft.confirmations.has(c.id))
    );
  }

  _renderVerify(scenario) {
    this._clearMarkers();
    const v = verify2022(scenario);
    const topMisses = [...v.misses]
      .sort((a, b) => b.population - a.population)
      .slice(0, 5);
    this.body.innerHTML = `
      <div class="corridor-stats">
        <div><span class="corridor-stat">${v.hits.length}</span>Hits</div>
        <div><span class="corridor-stat">${v.misses.length}</span>Misses</div>
        <div><span class="corridor-stat">${v.falseAlarms.length}</span>False alarms</div>
      </div>
      <div class="corridor-meta">Flagged by the exercise trigger: ${v.flagged.length} · inside the UNOSAT 2022 extent: ${v.observed.length}</div>
      ${
        topMisses.length
          ? `<div class="corridor-card"><div class="corridor-card-title">Largest misses (2022 water, not flagged)</div><ul class="corridor-list">${topMisses
              .map(
                (c) =>
                  `<li>${escapeHtml(c.name)} · ${fmtPop(c.population)} · ${Math.round(c.histFlood2022 * 100)}% of area in 2022 extent</li>`,
              )
              .join('')}</ul></div>`
          : ''
      }
      <div class="corridor-card">
        <div class="corridor-card-title">Caveats</div>
        <ul class="corridor-list">${VERIFY_CAVEATS.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
      </div>
    `;
  }

  _onClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    const scenario = this._scenario();
    if (!action || !scenario) return;
    if (action === 'draft' && this.selected.size) {
      const facts = buildFacts(
        scenario,
        [...this.selected],
        this._simHours(),
        this._staging(scenario),
      );
      this.draft = {
        facts,
        texts: draftTexts(facts),
        checks: [],
        confirmations: new Set(),
        status: 'draft',
        draftedAtH: this._simHours(),
        decidedAtH: null,
      };
    } else if (action === 'approve' && this._canApprove()) {
      this.draft.status = 'approved';
      this.draft.decidedAtH = this._simHours();
    } else if (action === 'reject' && this.draft?.status === 'draft') {
      this.draft.status = 'rejected';
      this.draft.decidedAtH = this._simHours();
    } else if (action === 'discard') {
      this.draft = null;
      this.selected.clear();
    } else {
      return;
    }
    this._render();
  }

  _onChange(e) {
    const { community, confirm } = e.target.dataset;
    if (community) {
      if (e.target.checked) this.selected.add(community);
      else this.selected.delete(community);
      const btn = this.body.querySelector('[data-action="draft"]');
      if (btn) {
        btn.disabled = this.selected.size === 0;
        btn.textContent = `Draft warning (${this.selected.size})`;
      }
    } else if (confirm && this.draft?.status === 'draft') {
      if (e.target.checked) this.draft.confirmations.add(confirm);
      else this.draft.confirmations.delete(confirm);
      this._renderChecks();
    }
  }

  _onInput(e) {
    const { lang, channel } = e.target.dataset;
    if (!lang || !channel || this.draft?.status !== 'draft') return;
    this.draft.texts[lang][channel] = e.target.value;
    this.draft.confirmations.clear();
    this.body
      .querySelectorAll('[data-confirm]')
      .forEach((box) => (box.checked = false));
    this._renderChecks();
  }

  _showMarkers(staging) {
    this._clearMarkers();
    if (!this.viewer?.entities) return;
    for (const s of staging) {
      this._entities.push(
        this.viewer.entities.add({
          name: `Staging suggestion - ${s.site.name}`,
          position: Cesium.Cartesian3.fromDegrees(s.site.lon, s.site.lat),
          point: {
            pixelSize: 14,
            color: Cesium.Color.fromCssColorString('#fbbc04'),
            outlineColor: Cesium.Color.fromCssColorString('#202124'),
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: `STAGING · ${s.site.name}\n${s.assets.length} assets · ${s.covers.length} communities`,
            font: '600 12px "Google Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromCssColorString('#1e2124'),
            outlineWidth: 3,
            showBackground: true,
            backgroundColor:
              Cesium.Color.fromCssColorString('#5f4b00').withAlpha(0.85),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -16),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        }),
      );
    }
  }

  _clearMarkers() {
    if (this.viewer?.entities) {
      for (const ent of this._entities) this.viewer.entities.remove(ent);
    }
    this._entities = [];
  }

  destroy() {
    this._unsubscribe?.();
    this._clearMarkers();
    this.container?.remove();
  }
}
