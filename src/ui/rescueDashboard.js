import { rankIncidents, allocationPlan, canDispatch, RESCUE_RESOURCES } from '../simulation/rescueAllocation.js';

// Fictional exercise reports. Needs and vulnerability are reviewed inputs, not LLM predictions.
export const INITIAL_SOS_SIGNALS = [
  { id: 'sos-101', sender: 'Demo family', district: 'Nowshera, KP', coords: [71.982, 34.015], danger: 'life', vulnerable: true, resource: 'boat', message: 'Ground floor submerged; roof is cracking. Four children and a bedridden elderly resident are trapped. Requesting a rescue boat.' },
  { id: 'sos-102', sender: 'Demo clinic', district: 'Sehwan, Sindh', coords: [67.892, 26.425], danger: 'medical', vulnerable: true, resource: 'boat', message: 'Patients stranded on the clinic rooftop after flooding. Evacuation transport needed; medical support must be coordinated separately.' },
  { id: 'sos-103', sender: 'Demo community lead', district: 'Rajanpur, Punjab', coords: [70.32, 29.54], danger: 'stranded', resource: 'boat', message: 'Residents are stranded on a raised road surrounded by water. Boat access needed; group size requires further assessment.' },
  { id: 'sos-104', sender: 'Demo farm workers', district: 'Sukkur, Sindh', coords: [68.865, 27.712], danger: 'stranded', resource: 'boat', message: 'Eight workers stranded on a hayloft. Water currently stable; road access is cut off.' },
  { id: 'sos-105', sender: 'Demo neighbourhood', district: 'Charsadda, KP', coords: [71.74, 34.15], danger: 'supply', resource: 'crew', message: 'Families moved to a raised brick house. Requesting a response crew to assess and reinforce protection.' },
  { id: 'sos-106', sender: 'Demo school camp', district: 'Dadu, Sindh', coords: [67.78, 26.73], danger: 'medical', vulnerable: true, resource: 'boat', message: 'Fourteen people stranded near a school, including an infant with fever and dehydration. Boat evacuation and separate medical assessment requested.' },
];

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const statusClass = (status) => status.toLowerCase().replaceAll(' ', '-');

export class RescueDashboardUI {
  constructor(options = {}) {
    this.onReturnToMap = options.onReturnToMap || (() => {});
    this.onLocateOnGlobe = options.onLocateOnGlobe || (() => {});
    this.game = options.resourceDefenseGame;
    this.floodEngine = options.floodEngine;
    this.signals = INITIAL_SOS_SIGNALS.map((s, i) => ({ ...s, createdAt: i, status: 'PENDING DISPATCH' }));
    this.selectedId = this.signals[0].id;
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.activity = [];
    this.notice = '';
    this.container = null;
    this.visible = false;
    this._unsubGame = this.game?.subscribe((state) => {
      const key = JSON.stringify([state.pool, state.incidentAssignments]);
      if (key === this._lastState) return;
      this._lastState = key;
      for (const assignment of state.incidentAssignments) {
        const incident = this.signals.find((s) => s.id === assignment.incidentId);
        if (incident && incident.status !== assignment.status) {
          incident.status = assignment.status;
          this._log(`${incident.district}: ${assignment.status.toLowerCase()}.`);
        }
      }
      if (this.visible) this._render();
    });
    this._unsubFlood = this.floodEngine?.subscribe((tel) => {
      const key = `${tel?.active}:${tel?.scenarioKey}:${Math.floor(tel?.simHours || 0)}`;
      if (key === this._lastFlood) return;
      this._lastFlood = key;
      if (this.visible) this._render();
    });
  }

  mount() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'rescue-dashboard-container';
      this.container.className = 'rescue-dashboard-container';
      document.body.appendChild(this.container);
    }
    this.visible = true;
    this.container.classList.remove('hidden');
    this._render();
  }

  unmount() {
    this.visible = false;
    this.container?.classList.add('hidden');
  }

  destroy() {
    this._unsubGame?.();
    this._unsubFlood?.();
    this.container?.remove();
    this.container = null;
  }

  _log(message) {
    this.activity.unshift({ time: new Date().toLocaleTimeString(), message });
    this.activity.length = Math.min(100, this.activity.length);
  }

  _ranked() {
    return rankIncidents(this.signals, this.floodEngine?.getCurrentTelemetry());
  }

  _render() {
    if (!this.container || this._extracting) return;
    const oldForm = this.container.querySelector('#rescue-report-form');
    const draft = oldForm && !this._clearDraft ? Object.fromEntries(new FormData(oldForm)) : null;
    const formOpen = !this._clearDraft && this.container.querySelector('.rescue-report-form')?.open;
    this._clearDraft = false;
    const focus = this.container.contains(document.activeElement) ? document.activeElement : null;
    const focusId = focus?.id;
    const selection = focus?.selectionStart;
    const state = this.game?.getState() || { pool: { boats: 0, firetrucks: 0, manpower: 0 }, incidentAssignments: [] };
    const ranked = this._ranked();
    const plan = allocationPlan(ranked, state);
    const selected = ranked.find((s) => s.id === this.selectedId);
    const filtered = ranked.filter((s) => (this.activeFilter === 'all' || s.danger === this.activeFilter) &&
      `${s.sender} ${s.district} ${s.message}`.toLowerCase().includes(this.searchQuery.toLowerCase()));
    const top = plan.find((p) => !p.blocked);
    this.container.innerHTML = `
      <header class="rescue-nav-bar">
        <div class="rescue-brand-group"><h1 class="rescue-brand-title">Rescue coordination</h1><span class="rescue-route-tag">SIMULATION</span></div>
        <div class="rescue-stats-group">
          <div class="rescue-stat-box"><span class="num">${state.pool.boats}</span><span class="lbl">BOATS FREE</span></div>
          <div class="rescue-stat-box"><span class="num">${state.pool.firetrucks}</span><span class="lbl">PUMPS FREE</span></div>
          <div class="rescue-stat-box"><span class="num">${state.pool.manpower}</span><span class="lbl">PERSONNEL FREE</span></div>
        </div>
        <button id="btn-return-globe" class="rescue-btn-globe" type="button">Back to 3D map</button>
      </header>
      <div class="rescue-exercise-note">Fictional reports · shared demo resource pool · rule-based priorities · session-only state. One assignment is one unit, not a guarantee of full evacuation.</div>
      <div class="rescue-main-grid">
        <aside class="rescue-stream-column" aria-label="Prioritized incidents">
          <div class="rescue-search-row"><label for="rescue-search-input">Search incidents</label><input id="rescue-search-input" class="rescue-search-input" value="${escape(this.searchQuery)}" placeholder="District, sender or message"></div>
          <div class="rescue-filter-tabs" aria-label="Filter priority">${[['all','All'],['life','P1'],['medical','P2'],['stranded','P3'],['supply','P4']].map(([key,label]) => `<button type="button" class="rescue-filter-btn ${key === this.activeFilter ? 'active' : ''}" data-filter="${key}" aria-pressed="${key === this.activeFilter}">${label}</button>`).join('')}</div>
          <div class="rescue-cards-list">${filtered.map((s) => `<button type="button" class="rescue-incident-card ${s.id === this.selectedId ? 'selected' : ''}" data-id="${escape(s.id)}" aria-pressed="${s.id === this.selectedId}">
            <div class="incident-card-top"><span class="incident-rank-badge ${s.badgeClass}">${s.rank}</span><span class="incident-score">${s.score}/100</span></div>
            <div class="incident-sender">${escape(s.district)}</div><p class="incident-snippet">${escape(s.message)}</p>
            <span class="incident-status ${statusClass(s.status)}">${s.status}</span>${s.routeBlocked ? '<span class="rescue-blocked">Access blocked</span>' : ''}
          </button>`).join('') || '<p class="rescue-empty-copy">No matching incidents. Change the filter or search.</p>'}</div>
          <div class="rescue-demo-controls"><button type="button" id="rescue-inject" class="rescue-btn-globe">Inject urgent demo report</button><span>Recalculates recommendations; active assignments stay assigned.</span></div>
        </aside>
        <main class="rescue-detail-column">
          <div class="rescue-recommendation" aria-live="polite"><strong>Next recommended assignment</strong><p>${top ? `${escape(ranked.find((s) => s.id === top.incidentId).district)} · ${RESCUE_RESOURCES[top.type].label}` : 'No dispatchable unassigned incident. Review access and resources.'}</p>${top ? `<button type="button" id="rescue-review-next" class="rescue-btn-globe">Review recommendation</button>` : ''}<span>Computed from current needs and availability. Dispatch always requires your approval.</span></div>
          <p class="rescue-notice" role="status">${escape(this.notice)}</p>
          ${selected ? this._detail(selected, state, plan.find((p) => p.incidentId === selected.id)) : ''}
          <details class="rescue-report-form"><summary>Add a distress report</summary>${this._reportForm()}</details>
          <section class="rescue-activity" aria-label="Activity log"><h2>Activity</h2>${this.activity.slice(0, 8).map((entry) => `<p><time>${escape(entry.time)}</time> ${escape(entry.message)}</p>`).join('') || '<p>No actions yet. Review a recommendation or add a report.</p>'}</section>
        </main>
      </div>`;
    this._bindEvents(top);
    if (draft) {
      const form = this.container.querySelector('#rescue-report-form');
      for (const [key, value] of Object.entries(draft)) {
        if (form.elements[key]?.type === 'checkbox') form.elements[key].checked = true;
        else if (form.elements[key]) form.elements[key].value = value;
      }
      this.container.querySelector('.rescue-report-form').open = formOpen;
    }
    if (focusId) {
      const nextFocus = this.container.querySelector(`#${focusId}`);
      nextFocus?.focus({ preventScroll: true });
      if (typeof selection === 'number' && nextFocus?.type === 'text') nextFocus.setSelectionRange(selection, selection);
    }
  }

  _detail(incident, state, suggestion) {
    const assignment = state.incidentAssignments.find((a) => a.incidentId === incident.id);
    const blocked = canDispatch(incident, state);
    return `<section class="rescue-detail-card" aria-label="Selected incident">
      <div class="detail-header"><div><span class="detail-rank-badge ${incident.badgeClass}">${incident.rank}</span><h2 class="detail-title">${escape(incident.district)}</h2><p class="detail-meta">${escape(incident.sender)} · ${incident.coords[1].toFixed(4)}° N, ${incident.coords[0].toFixed(4)}° E</p></div><strong class="rescue-assignment-status">${incident.status}</strong></div>
      <p class="citizen-msg-box">${escape(incident.message)}</p>
      <div class="rescue-reason"><h3>Why this priority?</h3><p>${escape(incident.reason)} Score: ${incident.score}/100, from fixed exercise rules.</p><p>Reviewed need: ${RESCUE_RESOURCES[incident.resource].label}. ${incident.danger === 'medical' ? 'Medical specialists are not modelled in this pool; coordinate medical support separately.' : ''}</p></div>
      ${assignment ? `<p>Assigned: ${RESCUE_RESOURCES[assignment.type].label} from ${escape(assignment.depotName)}. Illustrative travel estimate: ${assignment.etaMin} min.</p>
        <button type="button" id="rescue-complete" class="rescue-btn-globe" ${assignment.status !== 'ON SCENE' ? 'disabled' : ''}>Confirm rescue complete &amp; release unit</button>` : `<p>${escape(suggestion?.reason || blocked || '')}</p>
        <div class="action-buttons-row"><button type="button" id="rescue-dispatch" class="action-btn dispatch-boat" ${blocked || !this.game ? 'disabled' : ''}>Approve &amp; dispatch one ${RESCUE_RESOURCES[incident.resource].label.toLowerCase()}</button>
        <button type="button" id="rescue-access" class="rescue-btn-globe">${incident.routeBlocked ? 'Mark access reviewed / reopen' : 'Simulate access blocked'}</button></div>`}
      <button type="button" id="rescue-locate" class="rescue-btn-globe">Locate on 3D map</button>
      <p class="rescue-limit">Map movement is accelerated to 14 seconds along a straight line. Roads, water routes, arrival times and unit capabilities are illustrative; access is not independently verified.</p>
    </section>`;
  }

  _reportForm() {
    return `<form id="rescue-report-form">
      <label for="report-message">Message (English or Roman Urdu)</label><textarea id="report-message" name="message" required maxlength="2000"></textarea>
      <button type="button" id="rescue-ai-extract" class="rescue-btn-globe">Use AI to suggest triage fields</button><p id="rescue-ai-status" role="status">${escape(this.aiNotice || 'Optional AI extraction. Review the fields before adding; allocation remains rule-based.')}</p>
      <label for="report-district">Location label</label><input id="report-district" name="district" required maxlength="100">
      <div class="rescue-form-grid"><label for="report-lon">Longitude<input id="report-lon" name="lon" type="number" min="-180" max="180" step="any" required></label><label for="report-lat">Latitude<input id="report-lat" name="lat" type="number" min="-90" max="90" step="any" required></label></div>
      <label for="report-danger">Reviewed urgency</label><select id="report-danger" name="danger"><option value="life">P1 · Life threat</option><option value="medical">P2 · Medical</option><option value="stranded" selected>P3 · Stranded</option><option value="supply">P4 · Support</option></select>
      <label for="report-resource">Required unit</label><select id="report-resource" name="resource">${Object.entries(RESCUE_RESOURCES).map(([id,r]) => `<option value="${id}">${r.label}</option>`).join('')}</select>
      <label class="rescue-checkbox"><input name="vulnerable" type="checkbox">Vulnerable people explicitly reported</label><button type="submit" class="rescue-btn-globe">Confirm reviewed report &amp; add</button>
    </form>`;
  }

  _bindEvents(top) {
    const on = (selector, event, fn) => this.container.querySelector(selector)?.addEventListener(event, fn);
    on('#btn-return-globe', 'click', () => this.onReturnToMap());
    on('#rescue-search-input', 'input', (e) => { this.searchQuery = e.target.value; this._render(); });
    this.container.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
      this.activeFilter = button.dataset.filter;
      this.selectedId = this._ranked().find((s) => this.activeFilter === 'all' || s.danger === this.activeFilter)?.id;
      this._render();
    }));
    this.container.querySelectorAll('[data-id]').forEach((button) => button.addEventListener('click', () => { this.selectedId = button.dataset.id; this.notice = ''; this._render(); }));
    on('#rescue-review-next', 'click', () => { this.selectedId = top.incidentId; this._render(); });
    on('#rescue-locate', 'click', () => this.onLocateOnGlobe(this._ranked().find((s) => s.id === this.selectedId)));
    on('#rescue-dispatch', 'click', () => this._dispatch());
    on('#rescue-complete', 'click', () => { const result = this.game.completeIncident(this.selectedId); this.notice = result.success ? 'Rescue confirmed complete; demo unit returned to the available pool.' : result.reason; this._render(); });
    on('#rescue-access', 'click', () => {
      const incident = this.signals.find((s) => s.id === this.selectedId);
      incident.routeBlocked = !incident.routeBlocked;
      this._log(`${incident.district}: access ${incident.routeBlocked ? 'blocked; recommendation withdrawn' : 'reviewed and reopened'}.`);
      this._render();
    });
    on('#rescue-inject', 'click', () => {
      this._addIncident({ sender: 'Demo school', district: 'Nowshera school emergency', coords: [71.984, 34.019], danger: 'life', vulnerable: true, resource: 'boat', message: 'Exercise: water rising inside a school. Children cannot leave the upper floor. Rescue boat requested.' });
    });
    on('#rescue-report-form', 'submit', (e) => {
      e.preventDefault();
      const data = new FormData(e.target);
      this._addIncident({ sender: 'Operator-reviewed report', district: String(data.get('district')).trim(), coords: [Number(data.get('lon')), Number(data.get('lat'))], message: String(data.get('message')).trim(), danger: data.get('danger'), resource: data.get('resource'), vulnerable: data.get('vulnerable') === 'on' }, true);
    });
    on('#rescue-ai-extract', 'click', () => this._extractTriage());
  }

  _addIncident(fields, clearDraft = false) {
    const duplicate = this.signals.find((s) => s.message.trim().toLowerCase() === fields.message.trim().toLowerCase() &&
      s.coords[0] === fields.coords[0] && s.coords[1] === fields.coords[1]);
    if (duplicate) {
      this.selectedId = duplicate.id;
      this.notice = 'This report already exists. No duplicate incident was created.';
      this._render();
      return;
    }
    const incident = { ...fields, id: `sos-${crypto.randomUUID()}`, createdAt: Date.now(), status: 'PENDING DISPATCH' };
    try { rankIncidents([incident]); } catch { this.notice = 'Check the message, urgency, resource and coordinates.'; this._render(); return; }
    this.signals.push(incident);
    this._clearDraft = clearDraft;
    this.selectedId = incident.id;
    this._log(`${incident.district}: report added; recommendations recalculated.`);
    this.notice = 'Report added. Existing assignments have not changed.';
    this._render();
  }

  _dispatch() {
    const incident = this._ranked().find((s) => s.id === this.selectedId);
    if (!this.game || !incident) return;
    const blocked = canDispatch(incident, this.game.getState());
    if (blocked) { this.notice = blocked; this._render(); return; }
    const result = this.game.dispatchResource(incident.resource, { incidentId: incident.id,
      target: { id: incident.id, name: incident.district, lon: incident.coords[0], lat: incident.coords[1] } });
    this.notice = result.success ? 'Assignment approved. Unit and personnel reserved in the shared pool. Return to the map to watch its movement.' : result.reason;
    this._render();
  }

  async _extractTriage() {
    const button = this.container.querySelector('#rescue-ai-extract');
    const form = this.container.querySelector('#rescue-report-form');
    const status = this.container.querySelector('#rescue-ai-status');
    const message = form.elements.message.value.trim();
    if (!message) { status.textContent = 'Enter a distress message first.'; return; }
    button.disabled = true;
    this._extracting = true;
    status.textContent = 'Extracting suggested fields…';
    try {
      const response = await fetch('/api/openai/rescue-triage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }), signal: AbortSignal.timeout(25000) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'AI unavailable. Review and set the fields manually.');
      if (!['life','medical','stranded','supply'].includes(data.danger) || !Object.hasOwn(RESCUE_RESOURCES, data.resource) || typeof data.vulnerable !== 'boolean') throw new Error('Invalid AI response. Set the fields manually.');
      if (form.elements.message.value.trim() !== message) throw new Error('The message changed during extraction. Run it again or set the fields manually.');
      form.elements.danger.value = data.danger;
      form.elements.resource.value = data.resource;
      form.elements.vulnerable.checked = data.vulnerable;
      status.textContent = 'AI suggested these fields. Verify urgency, unit type and vulnerability; enter coordinates yourself, then confirm the report.';
    } catch (error) { status.textContent = error.name === 'TimeoutError' ? 'AI timed out. Set the fields manually.' : error.message; }
    finally {
      button.disabled = false;
      this.aiNotice = status.textContent;
      this._extracting = false;
      this._render();
    }
  }
}
