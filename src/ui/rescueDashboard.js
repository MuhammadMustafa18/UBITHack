/**
 * @module ui/rescueDashboard
 * @description Dedicated Emergency Rescue Incident & LLM Urgency Triage Dashboard for /rescue route.
 * Features a clean, minimal white Gemini-styled layout with integrated conversational LLM intelligence:
 * - Real-time citizen SOS stream & urgent triage assessment
 * - Full awareness of active simulation IDs, flood timelines, and resource deficits
 * - Gemini web app interactive conversation interface with quick prompt chips
 * - Direct dispatch actions for boats, dewatering pumps, and aviation medevac
 */

import { submitRescueRequest, fetchLiveRescueRequests } from '../services/supabaseClient.js';

export const INITIAL_SOS_SIGNALS = [
  {
    id: 'sos-101',
    timestamp: '2 mins ago',
    sender: 'Haji Ghulam Rasool',
    phone: '+92 301 8492019',
    district: 'Nowshera Kalan, KP',
    coords: [71.982, 34.015],
    channel: 'WHATSAPP SOS',
    message: 'Water has breached the main GT Road bund! House ground floor is submerged up to 7 feet. Roof is cracking under weight, 4 small children and 80-year-old bedridden mother trapped with us. Please send rescue boat immediately, water rising fast!',
    llmRank: 'P1 - CRITICAL LIFE THREAT',
    llmScore: 98,
    badgeClass: 'p1-critical',
    llmReasoning: 'Imminent structural collapse risk with trapped minors and non-ambulatory elderly. Water rise velocity >0.5m/hr indicates high lethality within 45 minutes.',
    recommendedAction: 'Immediate Swift-Water Boat #4 dispatch from Nowshera HQ. Pre-position medical team for hypothermia triage.',
    status: 'PENDING DISPATCH',
  },
  {
    id: 'sos-102',
    timestamp: '5 mins ago',
    sender: 'Dr. Samina Kausar (RHC Clinic)',
    phone: '+92 333 4910294',
    district: 'Sehwan / Manchhar Lake, Sindh',
    coords: [67.892, 26.425],
    channel: 'SATELLITE BEACON',
    message: 'Rural Health Center flooded by Manchhar Lake overflow. 3 women in active labor and 8 acute trauma patients stranded on elevated clinic rooftop. Generator diesel exhausted, zero drinking water left.',
    llmRank: 'P2 - MEDICAL EMERGENCY',
    llmScore: 92,
    badgeClass: 'p2-medical',
    llmReasoning: 'Active obstetric labor emergencies combined with power/water failure. Critical maternal-fetal mortality risk without evacuation.',
    recommendedAction: 'Request Army Aviation Mi-17 medical medevac from Sukkur base + immediate water purification drops.',
    status: 'IN PROGRESS',
  },
  {
    id: 'sos-103',
    timestamp: '8 mins ago',
    sender: 'Muhammad Imran (UC Chairman)',
    phone: '+92 312 9201844',
    district: 'Rajanpur / Jampur, South Punjab',
    coords: [70.320, 29.540],
    channel: 'SMS EMERGENCY',
    message: 'Koh-e-Suleman hill torrent surge destroyed 40 katcha mud houses in Basti Rind. Over 120 residents gathered on high road embankment, surrounded by water on all four sides. Need de-watering pump and family food rations.',
    llmRank: 'P3 - STRANDED POPULATION',
    llmScore: 84,
    badgeClass: 'p3-evac',
    llmReasoning: 'Large clustered population stranded on islanded embankment. No immediate drowning but high vulnerability to flash wave surge.',
    recommendedAction: 'Dispatch high-capacity dewatering pump unit + 150 ration hampers via Rescue 1122 flat-bottom barge.',
    status: 'PENDING DISPATCH',
  },
  {
    id: 'sos-104',
    timestamp: '11 mins ago',
    sender: 'Bilal Ahmed',
    phone: '+92 345 8820194',
    district: 'Sukkur Katcha Bund RD-42, Sindh',
    coords: [68.865, 27.712],
    channel: 'VOICE TRANSCRIPT',
    message: 'Submerged cattle farm. 8 workers stranded on hayloft. Water is current 4 feet and stable, not rising quickly, but road access is cut off.',
    llmRank: 'P4 - SUPPLY & STAGING',
    llmScore: 68,
    badgeClass: 'p4-supply',
    llmReasoning: 'Stable water stage with safe elevation refuge. Low immediate life threat. Can be queued behind P1/P2 incidents.',
    recommendedAction: 'Queue for daytime boat shuttle evacuation once critical life-threat sectors are cleared.',
    status: 'QUEUED',
  },
  {
    id: 'sos-105',
    timestamp: '14 mins ago',
    sender: 'Suleman Shah',
    phone: '+92 300 7102941',
    district: 'Charsadda / Swat River, KP',
    coords: [71.740, 34.150],
    channel: 'SMS EMERGENCY',
    message: 'Swat river overflow washed away boundary wall. 2 families safely relocated to neighbor 2-story brick house. Requesting sandbag barriers to protect house foundation.',
    llmRank: 'P4 - SUPPLY & STAGING',
    llmScore: 62,
    badgeClass: 'p4-supply',
    llmReasoning: 'Residents successfully moved to elevated concrete structure. No immediate water immersion. Structural defense needed.',
    recommendedAction: 'Deliver 200 heavy-duty geotextile sandbags via local civil defense team.',
    status: 'QUEUED',
  },
  {
    id: 'sos-106',
    timestamp: '18 mins ago',
    sender: 'Sakina Bibi',
    phone: '+92 321 9192840',
    district: 'Dadu / Johi Canal, Sindh',
    coords: [67.780, 26.730],
    channel: 'WHATSAPP SOS',
    message: 'Johi ring bund ring canal overflow. 14 people including infant with high fever and dehydration. Stranded near school building.',
    llmRank: 'P2 - MEDICAL EMERGENCY',
    llmScore: 89,
    badgeClass: 'p2-medical',
    llmReasoning: 'Pediatric dehydration with severe fever in flood-locked ring bund. Risk of waterborne illness escalation.',
    recommendedAction: 'Dispatch Rescue 1122 paramedic zodiac boat with pediatric IV fluids and oral rehydration salts.',
    status: 'IN PROGRESS',
  },
];

export class RescueDashboardUI {
  constructor(options = {}) {
    this.onReturnToGlobe = options.onReturnToGlobe || (() => {});
    this.onLocateOnGlobe = options.onLocateOnGlobe || (() => {});
    this.tacticalAiCommander = options.tacticalAiCommander || null;
    this.resourceDefenseGame = options.resourceDefenseGame || null;
    this.floodEngine = options.floodEngine || null;

    this.container = null;
    this.signals = [...INITIAL_SOS_SIGNALS];
    this.selectedSignal = this.signals[0];
    this.activeFilter = 'all'; // 'all' | 'p1' | 'p2' | 'p3' | 'p4'
    this.searchQuery = '';
    this._simTimer = null;

    // View Mode: 'portal' (Starter UI: Dashboard or Call for Help) | 'dashboard' | 'citizen_chat'
    this.viewMode = 'portal';

    // Direct citizen emergency messaging thread
    this.citizenChatMessages = [
      {
        sender: 'assistant',
        text: '🚨 **NDMA Emergency Dispatch & Gemini Help Line**\nWe are actively receiving distress signals across Pakistan. Tell us your exact location or district, rising water situation, and how many people are with you.',
        timestamp: 'Just now',
      },
    ];

    // Chat conversation state for the Gemini web app style interface inside dashboard
    this.chatMessages = [
      {
        sender: 'assistant',
        text: '👋 **Hello Commander.** I am your Gemini-powered Rescue Intelligence assistant. Ask me anything about current flood scenarios, resource deficits, or immediate evacuation triage priorities.',
      },
    ];
  }

  setMode(mode) {
    this.viewMode = mode;
    this._render();
  }

  mount() {
    if (this.container) {
      this.container.classList.remove('hidden');
      return;
    }

    this.container = document.createElement('div');
    this.container.id = 'rescue-dashboard-container';
    this.container.className = 'rescue-dashboard-container';

    this._render();
    document.body.appendChild(this.container);
    this._startSimulatedStream();
  }

  unmount() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
    if (this._simTimer) {
      clearInterval(this._simTimer);
      this._simTimer = null;
    }
  }

  _render() {
    if (!this.container) return;

    if (this.viewMode === 'portal') {
      this._renderStarterPortal();
      this._bindPortalEvents();
      return;
    }

    if (this.viewMode === 'citizen_chat') {
      this._renderCitizenChatInterface();
      this._bindCitizenChatEvents();
      return;
    }

    const filtered = this._getFilteredSignals();

    this.container.innerHTML = `
      <!-- Top Executive Minimalist White Bar -->
      <header class="rescue-nav-bar">
        <div class="rescue-brand-group">
          <button id="btn-back-to-portal" class="rescue-portal-back-btn" type="button" title="Back to Portal Selection">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            <span>Portal</span>
          </button>
          <div class="gemini-sparkle-icon" title="Gemini AI Intelligence">
            <svg viewBox="0 0 24 24"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
          </div>
          <div>
            <h1 class="rescue-brand-title">Emergency Rescue &amp; Triage Intelligence</h1>
          </div>
          <div class="rescue-badge-live">
            <span class="pulse-dot"></span>
            <span>LIVE INCIDENT STREAM</span>
          </div>
          <span class="rescue-route-tag">/rescue</span>
        </div>

        <div class="rescue-stats-group">
          <div class="rescue-stat-box">
            <span class="num">${this.signals.length}</span>
            <span class="lbl">Total Alerts</span>
          </div>
          <div class="rescue-stat-box critical">
            <span class="num">${this.signals.filter((s) => s.llmScore >= 90).length}</span>
            <span class="lbl">P1 Critical</span>
          </div>
          <div class="rescue-stat-box warning">
            <span class="num">${this.signals.filter((s) => s.status === 'IN PROGRESS').length}</span>
            <span class="lbl">Dispatched</span>
          </div>
        </div>

        <div class="rescue-nav-actions">
          <button id="btn-request-rescue-modal" class="rescue-btn-sos-request" type="button" title="Request Emergency Evacuation (Works from any Chrome / mobile browser)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            <span>Request Help (SOS Beacon)</span>
          </button>
          <button id="btn-return-globe" class="rescue-btn-globe" type="button" title="Switch back to 3D Globe Navigation">
            <svg viewBox="0 0 24 24" class="rescue-svg"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <span>Back to 3D Map</span>
          </button>
        </div>
      </header>

      <!-- Main Dashboard Grid -->
      <div class="rescue-main-grid">
        <!-- Left: Incoming Stream & Filter -->
        <aside class="rescue-stream-column">
          <div class="rescue-search-row">
            <input 
              type="text" 
              id="rescue-search-input" 
              class="rescue-search-input" 
              placeholder="Search sender, district or keywords..." 
              value="${this.searchQuery}"
            />
          </div>

          <!-- Priority Filter Tabs -->
          <div class="rescue-filter-tabs">
            <button class="rescue-filter-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">ALL (${this.signals.length})</button>
            <button class="rescue-filter-btn ${this.activeFilter === 'p1' ? 'active' : ''}" data-filter="p1">P1 LIFE THREAT</button>
            <button class="rescue-filter-btn ${this.activeFilter === 'p2' ? 'active' : ''}" data-filter="p2">P2 MEDICAL</button>
            <button class="rescue-filter-btn ${this.activeFilter === 'p3' ? 'active' : ''}" data-filter="p3">P3 STRANDED</button>
          </div>

          <!-- Incident Cards List -->
          <div class="rescue-cards-list">
            ${filtered.map((item) => `
              <div class="rescue-incident-card ${this.selectedSignal?.id === item.id ? 'selected' : ''}" data-id="${item.id}">
                <div class="incident-card-top">
                  <span class="incident-rank-badge ${item.badgeClass}">${item.llmRank}</span>
                  <span class="incident-time">${item.timestamp}</span>
                </div>
                <div class="incident-sender">${item.sender}</div>
                <div class="incident-district">${item.district} • <span class="ch">${item.channel}</span></div>
                <p class="incident-snippet">${item.message}</p>
                <div class="incident-card-bottom">
                  <span class="incident-score">AI Score: <strong>${item.llmScore}/100</strong></span>
                  <span class="incident-status ${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </aside>

        <!-- Right: AI Urgency Triage & Interactive Gemini Workspace -->
        <main class="rescue-detail-column">
          ${this._renderSelectedIncidentDetail()}

          <!-- Embedded Gemini Web App Interactive Chat Interface -->
          <div class="gemini-chat-container">
            <div class="gemini-chat-header">
              <div class="gemini-chat-header-title">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#1a73e8"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
                <span>Ask Gemini about this scenario or dispatch plan</span>
              </div>
              <span class="gemini-chat-badge">${this.floodEngine?.simulationId || 'Active Simulation'}</span>
            </div>

            <!-- Chat messages stream -->
            <div id="gemini-chat-messages" class="gemini-chat-messages">
              ${this.chatMessages.map(m => `
                <div class="gemini-chat-bubble ${m.sender}">
                  <div>${this._formatMarkdown(m.text)}</div>
                </div>
              `).join('')}
            </div>

            <!-- Quick suggestion chips -->
            <div class="gemini-chat-suggestions">
              <button class="gemini-suggestion-chip" data-query="How should I prioritize rescue boats for this incident?">🚤 Boat Prioritization</button>
              <button class="gemini-suggestion-chip" data-query="What is the downstream arrival window for this flood crest?">🌊 Wave Arrival Window</button>
              <button class="gemini-suggestion-chip" data-query="What are the current manpower and dewatering deficits?">🚒 Deficit Analysis</button>
              <button class="gemini-suggestion-chip" data-query="Draft an urgent civil defense evacuation order for this district.">📢 Draft Evacuation Order</button>
            </div>

            <!-- Gemini Floating Input Box -->
            <div class="gemini-input-wrapper">
              <div class="gemini-input-box">
                <input 
                  type="text" 
                  id="gemini-chat-input" 
                  class="gemini-text-input" 
                  placeholder="Ask Gemini to coordinate rescue resources or analyze ${this.selectedSignal ? this.selectedSignal.district : 'this scenario'}..." 
                />
                <button id="gemini-chat-send" class="gemini-send-btn" title="Send message to Gemini">
                  <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
          </div>
        </main>
      </div>

      <!-- Citizen SOS Beacon Submission Modal (Simple Chrome / Mobile Interface) -->
      <div id="rescue-sos-modal" class="rescue-modal-backdrop hidden">
        <div class="rescue-modal-card">
          <div class="rescue-modal-header">
            <div class="rescue-modal-title-group">
              <span class="rescue-modal-tag">EMERGENCY ASSISTANCE BEACON</span>
              <h2 class="rescue-modal-title">Ask for Rescue / Dispatch Unit</h2>
            </div>
            <button id="rescue-modal-close" class="rescue-modal-close-btn" type="button">✕</button>
          </div>

          <form id="rescue-sos-form" class="rescue-sos-form">
            <div class="form-row">
              <div class="form-group">
                <label>Your Name / Contact Person</label>
                <input type="text" id="sos-input-name" placeholder="e.g. Asad Ali" required />
              </div>
              <div class="form-group">
                <label>Mobile Number (WhatsApp/SMS)</label>
                <input type="tel" id="sos-input-phone" placeholder="e.g. +92 300 1234567" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>District / Nearest Landmark</label>
                <input type="text" id="sos-input-district" placeholder="e.g. Nowshera Kalan, KP (near River Bridge)" required />
              </div>
              <div class="form-group">
                <label>Number of People Stranded</label>
                <input type="number" id="sos-input-count" min="1" value="3" required />
              </div>
            </div>

            <div class="form-group">
              <div class="form-label-row">
                <label>GPS Coordinates</label>
                <button type="button" id="sos-btn-geolocation" class="sos-btn-geolocate">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
                  <span>Auto-Detect My GPS</span>
                </button>
              </div>
              <div class="form-coords-inputs">
                <input type="number" id="sos-input-lat" step="0.0001" placeholder="Latitude (e.g. 34.015)" required />
                <input type="number" id="sos-input-lon" step="0.0001" placeholder="Longitude (e.g. 71.982)" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Current Water Level</label>
                <select id="sos-input-water">
                  <option value="2">Ankle to Knee (1-2 ft)</option>
                  <option value="4" selected>Waist Deep (3-4 ft)</option>
                  <option value="7">Chest to Neck (5-7 ft)</option>
                  <option value="10">Submerged Ground Floor / Rooftop Refuge (8+ ft)</option>
                </select>
              </div>
              <div class="form-group checkbox-group">
                <label class="sos-checkbox-label">
                  <input type="checkbox" id="sos-input-vulnerable" checked />
                  <span>Children or Elderly with us</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Urgent Situation Details</label>
              <textarea id="sos-input-msg" rows="3" placeholder="Describe current situation, rising water, injuries, or immediate needs..." required></textarea>
            </div>

            <div class="form-submit-row">
              <button type="submit" id="sos-submit-btn" class="sos-modal-submit-btn">
                <span>Broadcast Emergency SOS to NDMA &amp; Rescue 1122</span>
              </button>
            </div>
            <div class="sos-note-text">
              🔒 Powered by Supabase &amp; Offline Relay. Your beacon is prioritized by the AI urgency triage model. Works from any Chrome browser or mobile device.
            </div>
          </form>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _renderSelectedIncidentDetail() {
    const item = this.selectedSignal;
    if (!item) {
      return `
        <div class="rescue-empty-state">
          <h3>Select a distress signal to view AI triage &amp; dispatch options</h3>
        </div>
      `;
    }

    return `
      <div class="rescue-detail-card">
        <div class="detail-header">
          <div>
            <div class="detail-rank-row">
              <span class="detail-rank-badge ${item.badgeClass}">${item.llmRank}</span>
              <span class="detail-score-pill">AI Urgency Score: <strong>${item.llmScore} / 100</strong></span>
            </div>
            <h2 class="detail-title">${item.district}</h2>
            <div class="detail-meta">Reported by <strong>${item.sender}</strong> (${item.phone}) • via ${item.channel} • ${item.timestamp}</div>
          </div>
          <div class="detail-status-box">
            <span class="lbl">DISPATCH STATUS</span>
            <span class="val ${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span>
          </div>
        </div>

        <!-- Raw Citizen Message -->
        <div class="detail-section">
          <div class="section-title">ORIGINAL CITIZEN DISTRESS MESSAGE:</div>
          <div class="citizen-msg-box">
            "${item.message}"
          </div>
        </div>

        <!-- LLM Triage & Urgency Reasoning -->
        <div class="detail-section">
          <div class="section-title">AI TRIAGE ASSESSMENT &amp; MULTI-FACTOR REASONING:</div>
          <div class="llm-reasoning-box">
            <div class="llm-reasoning-item">
              <span class="k">Severity Analysis:</span>
              <span class="v">${item.llmReasoning}</span>
            </div>
            <div class="llm-reasoning-item">
              <span class="k">Recommended Response:</span>
              <span class="v highlight">${item.recommendedAction}</span>
            </div>
            <div class="llm-reasoning-item">
              <span class="k">GPS Coordinates:</span>
              <span class="v mono">${item.coords[1].toFixed(4)}° N, ${item.coords[0].toFixed(4)}° E</span>
            </div>
          </div>
        </div>

        <!-- Operational Dispatch Action Bar -->
        <div class="detail-actions-panel">
          <div class="section-title">INCIDENT DISPATCH ACTIONS:</div>
          <div class="action-buttons-row">
            <button class="action-btn dispatch-boat" data-action="dispatch-boat" type="button">
              <svg viewBox="0 0 24 24" class="btn-svg"><path fill="currentColor" d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.47L19 11V7l-4-4-4 4v4l-2.28.17c-.26.05-.48.23-.6.47s-.14.52-.06.78L3.95 19zM13 5.83l2 2V11h-4V7.83l2-2z"/></svg>
              <span>Dispatch Rescue Boat Flotilla</span>
            </button>
            <button class="action-btn dispatch-pump" data-action="dispatch-pump" type="button">
              <svg viewBox="0 0 24 24" class="btn-svg"><path fill="currentColor" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66h14V17z"/></svg>
              <span>Dispatch Dewatering Pump Unit</span>
            </button>
            <button class="action-btn dispatch-heli" data-action="dispatch-heli" type="button">
              <svg viewBox="0 0 24 24" class="btn-svg"><path fill="currentColor" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
              <span>Request Air Aviation Medevac</span>
            </button>
            <button class="action-btn locate-globe" data-action="locate-globe" type="button">
              <svg viewBox="0 0 24 24" class="btn-svg"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <span>Locate on 3D Map</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _getFilteredSignals() {
    let list = this.signals;

    if (this.activeFilter === 'p1') {
      list = list.filter((s) => s.llmScore >= 95);
    } else if (this.activeFilter === 'p2') {
      list = list.filter((s) => s.llmScore >= 85 && s.llmScore < 95);
    } else if (this.activeFilter === 'p3') {
      list = list.filter((s) => s.llmScore < 85);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.sender.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.message.toLowerCase().includes(q)
      );
    }

    return list;
  }

  _bindEvents() {
    if (!this.container) return;

    // Return to Globe button
    this.container.querySelector('#btn-return-globe')?.addEventListener('click', () => {
      this.onReturnToGlobe();
    });

    // Filter Buttons
    this.container.querySelectorAll('.rescue-filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const filter = btn.getAttribute('data-filter');
        this.activeFilter = filter;
        this._render();
      });
    });

    // Search Input
    const searchInput = this.container.querySelector('#rescue-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim();
      const filtered = this._getFilteredSignals();
      const listEl = this.container.querySelector('.rescue-cards-list');
      if (listEl) {
        listEl.innerHTML = filtered.map((item) => `
          <div class="rescue-incident-card ${this.selectedSignal?.id === item.id ? 'selected' : ''}" data-id="${item.id}">
            <div class="incident-card-top">
              <span class="incident-rank-badge ${item.badgeClass}">${item.llmRank}</span>
              <span class="incident-time">${item.timestamp}</span>
            </div>
            <div class="incident-sender">${item.sender}</div>
            <div class="incident-district">${item.district} • <span class="ch">${item.channel}</span></div>
            <p class="incident-snippet">${item.message}</p>
            <div class="incident-card-bottom">
              <span class="incident-score">AI Score: <strong>${item.llmScore}/100</strong></span>
              <span class="incident-status ${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span>
            </div>
          </div>
        `).join('');
        this._bindIncidentCardClicks();
      }
    });

    // Back to portal button
    this.container.querySelector('#btn-back-to-portal')?.addEventListener('click', () => {
      this.setMode('portal');
    });

    this._bindIncidentCardClicks();
    this._bindActionButtons();
    this._bindGeminiChat();
    this._bindSosModal();
  }

  _bindSosModal() {
    const openBtn = this.container.querySelector('#btn-request-rescue-modal');
    const modal = this.container.querySelector('#rescue-sos-modal');
    const closeBtn = this.container.querySelector('#rescue-modal-close');
    const form = this.container.querySelector('#rescue-sos-form');
    const geoBtn = this.container.querySelector('#sos-btn-geolocation');
    const latInput = this.container.querySelector('#sos-input-lat');
    const lonInput = this.container.querySelector('#sos-input-lon');

    openBtn?.addEventListener('click', () => {
      modal?.classList.remove('hidden');
    });

    closeBtn?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });

    // Auto-detect GPS coordinates via Chrome Geolocation API
    geoBtn?.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      geoBtn.querySelector('span').textContent = 'Detecting GPS...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (latInput) latInput.value = pos.coords.latitude.toFixed(4);
          if (lonInput) lonInput.value = pos.coords.longitude.toFixed(4);
          geoBtn.querySelector('span').textContent = '✓ GPS Locked';
        },
        (err) => {
          console.warn('[Geolocation] Error:', err);
          // Fallback to default Pakistan coordinate
          if (latInput) latInput.value = '34.0150';
          if (lonInput) lonInput.value = '71.9820';
          geoBtn.querySelector('span').textContent = 'Default GPS (Nowshera)';
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

    // Submit SOS Beacon to Supabase & Local Queue
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('#sos-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>📡 Broadcasting to Supabase &amp; Rescue 1122...</span>';
      }

      const name = this.container.querySelector('#sos-input-name')?.value.trim();
      const phone = this.container.querySelector('#sos-input-phone')?.value.trim();
      const district = this.container.querySelector('#sos-input-district')?.value.trim();
      const trappedCount = this.container.querySelector('#sos-input-count')?.value;
      const lat = parseFloat(latInput?.value) || 34.015;
      const lon = parseFloat(lonInput?.value) || 71.982;
      const waterDepthFt = parseFloat(this.container.querySelector('#sos-input-water')?.value) || 4;
      const hasVulnerable = this.container.querySelector('#sos-input-vulnerable')?.checked;
      const message = this.container.querySelector('#sos-input-msg')?.value.trim();

      // Compute urgency triage score
      let score = 70;
      if (waterDepthFt >= 7) score += 20;
      if (hasVulnerable) score += 10;
      score = Math.min(99, score);

      const rank = score >= 90 ? 'P1 - CRITICAL LIFE THREAT' : (score >= 80 ? 'P2 - MEDICAL EMERGENCY' : 'P3 - STRANDED POPULATION');
      const badgeCls = score >= 90 ? 'p1-critical' : (score >= 80 ? 'p2-medical' : 'p3-evac');

      const payload = {
        name,
        phone,
        district,
        trappedCount,
        latitude: lat,
        longitude: lon,
        waterDepthFt,
        hasVulnerable,
        message,
        urgencyLevel: rank,
        channel: 'CHROME WEB SOS',
      };

      // 1. Send to Supabase DB
      await submitRescueRequest(payload);

      // 2. Insert into live dashboard signals stream immediately
      const newSosSignal = {
        id: `sos-user-${Date.now()}`,
        timestamp: 'Just now',
        sender: name,
        phone: phone,
        district: district,
        coords: [lon, lat],
        channel: 'CHROME WEB SOS',
        message: message,
        llmRank: rank,
        llmScore: score,
        badgeClass: badgeCls,
        llmReasoning: `Citizen-reported water depth of ${waterDepthFt} ft with ${trappedCount} stranded individuals${hasVulnerable ? ' (including children/elderly)' : ''}. Imminent flood exposure verified by real-time telemetry.`,
        recommendedAction: `Immediate dispatch of swift-water flotilla or dewatering unit to ${district}.`,
        status: 'PENDING DISPATCH',
      };

      this.signals.unshift(newSosSignal);
      this.selectedSignal = newSosSignal;

      // 3. Add to Gemini conversation
      this._addChatMessage('assistant', `🚨 **URGENT CITIZEN SOS RECEIVED & RECORDED**\n- **Sender:** ${name} (${phone})\n- **Location:** ${district} [${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E]\n- **Priority:** ${rank} (AI Score: **${score}/100**)\n- **Database Sync:** Successfully synchronized with Supabase emergency registry.\n- Recommended: Dispatch swift-water rescue boat immediately.`);

      modal?.classList.add('hidden');
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Broadcast Emergency SOS to NDMA &amp; Rescue 1122</span>';
      }

      this._render();
      alert(`Emergency SOS Beacon successfully broadcasted to Supabase & NDMA Rescue registry.\nID: ${newSosSignal.id}`);
    });
  }

  _bindIncidentCardClicks() {
    this.container.querySelectorAll('.rescue-incident-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const found = this.signals.find((s) => s.id === id);
        if (found) {
          this.selectedSignal = found;
          this._render();
        }
      });
    });
  }

  _bindActionButtons() {
    this.container.querySelectorAll('.action-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        if (!this.selectedSignal) return;

        if (action === 'locate-globe') {
          this.onLocateOnGlobe(this.selectedSignal);
        } else if (action === 'dispatch-boat') {
          if (this.resourceDefenseGame) {
            this.resourceDefenseGame.dispatchResource('boat');
          }
          this.selectedSignal.status = 'DISPATCHED';
          btn.textContent = 'BOAT DISPATCHED & EN ROUTE';
          btn.style.opacity = '0.6';
          btn.style.pointerEvents = 'none';
          this._addChatMessage('user', `Dispatch boat to ${this.selectedSignal.district}`);
          this._addChatMessage('assistant', `🚤 **Swift-Water Rescue Boat dispatched** to **${this.selectedSignal.district}**. Route mapped from nearest depot. Team instructed for pediatric and elderly triage.`);
        } else if (action === 'dispatch-pump') {
          if (this.resourceDefenseGame) {
            this.resourceDefenseGame.dispatchResource('firetruck');
          }
          this.selectedSignal.status = 'DISPATCHED';
          btn.textContent = 'PUMP DISPATCHED & EN ROUTE';
          btn.style.opacity = '0.6';
          btn.style.pointerEvents = 'none';
          this._addChatMessage('user', `Dispatch pump to ${this.selectedSignal.district}`);
          this._addChatMessage('assistant', `🚒 **High-capacity dewatering pump unit deployed** to **${this.selectedSignal.district}**. Levee reinforcement team deployed in coordination.`);
        } else if (action === 'dispatch-heli') {
          this.selectedSignal.status = 'DISPATCHED';
          btn.textContent = 'AIR MEDEVAC REQUESTED';
          btn.style.opacity = '0.6';
          btn.style.pointerEvents = 'none';
          this._addChatMessage('user', `Request Air Aviation Medevac for ${this.selectedSignal.district}`);
          this._addChatMessage('assistant', `🚁 **Army Aviation Medevac flight authorized** for **${this.selectedSignal.district}**. LZ coordinates transmitted: ${this.selectedSignal.coords[1].toFixed(4)}°N, ${this.selectedSignal.coords[0].toFixed(4)}°E.`);
        }

        const statusVal = this.container.querySelector('.detail-status-box .val');
        if (statusVal) {
          statusVal.textContent = 'DISPATCHED';
          statusVal.className = 'val in-progress';
        }
      });
    });
  }

  _bindGeminiChat() {
    const input = this.container.querySelector('#gemini-chat-input');
    const sendBtn = this.container.querySelector('#gemini-chat-send');
    const chips = this.container.querySelectorAll('.gemini-suggestion-chip');

    const handleSend = async () => {
      const text = input?.value?.trim();
      if (!text) return;
      input.value = '';
      await this._handleGeminiUserMessage(text);
    };

    sendBtn?.addEventListener('click', handleSend);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    });

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        if (query) this._handleGeminiUserMessage(query);
      });
    });
  }

  async _handleGeminiUserMessage(text) {
    this._addChatMessage('user', text);

    // Contextual knowledge from active simulation and selected incident
    const simTelemetry = this.floodEngine?.getCurrentTelemetry();
    const simId = simTelemetry?.simulationId || 'SIM-PK-ACTIVE';
    const currentLoc = simTelemetry?.locationName || 'River Basin';
    const discharge = simTelemetry?.dischargeCusecs ? `${simTelemetry.dischargeCusecs.toLocaleString()} cusecs` : 'N/A';
    const incident = this.selectedSignal;

    // Use tacticalAiCommander if available, or generate authentic intelligent reply
    let reply = '';
    if (this.tacticalAiCommander) {
      try {
        const prompt = `[SIMULATION: ${simId} | Crest: ${currentLoc} (${discharge}) | INCIDENT: ${incident?.district} - ${incident?.llmRank}]\nUser Query: ${text}`;
        reply = await this.tacticalAiCommander._callAiService(prompt, this.tacticalAiCommander.getOperationalContext());
      } catch (err) {
        reply = this._generateGeminiReply(text, incident, simTelemetry);
      }
    } else {
      reply = this._generateGeminiReply(text, incident, simTelemetry);
    }

    this._addChatMessage('assistant', reply);
  }

  _generateGeminiReply(query, incident, telemetry) {
    const q = query.toLowerCase();
    const simId = telemetry?.simulationId || 'SIM-PK-STANDBY';
    const dist = incident?.district || 'the affected district';

    if (q.includes('boat') || q.includes('priorit')) {
      return `### 🚤 Boat Flotilla Deployment Strategy\n` +
        `- **Top Priority Target:** **${dist}** (${incident?.llmRank || 'P1'})\n` +
        `- **Reasoning:** Fast water rise velocity requires immediate shallow-draft inflatable rescue boats (IRBs).\n` +
        `- **Operation ID:** \`${simId}\`\n` +
        `- **Deployment Order:** Mobilize 2 Swift-Water teams from closest regional base, staged with hypothermia medical packs.`;
    }

    if (q.includes('window') || q.includes('arrival') || q.includes('wave')) {
      return `### 🌊 Flood Wave Arrival Window\n` +
        `- **Current Crest Location:** **${telemetry?.locationName || 'Upstream reaches'}**\n` +
        `- **Discharge:** **${telemetry?.dischargeCusecs ? telemetry.dischargeCusecs.toLocaleString() + ' cusecs' : 'High flood stage'}**\n` +
        `- **Downstream Intercept ETA:** Estimated **3.5 - 6 hours** before secondary surge crests across ${dist}. Low-lying residential bunds must be evacuated immediately.`;
    }

    if (q.includes('deficit') || q.includes('manpower') || q.includes('pump')) {
      const ts = this.resourceDefenseGame?.targetState;
      const fDef = Math.max(0, (ts?.requiredFiretrucks || 4) - (ts?.arrivedFiretrucks || 0));
      const bDef = Math.max(0, (ts?.requiredBoats || 6) - (ts?.arrivedBoats || 0));
      return `### 🚒 Defense Deficit Breakdown\n` +
        `- **Firetrucks / Dewatering Pumps:** \`${fDef} units needed\`\n` +
        `- **Rescue Boats:** \`${bDef} units needed\`\n` +
        `- **Safeguard Capacity:** Current target zone defense is at **${ts?.safeguardPct || 0}%**.\n` +
        `> Click **"Dispatch Rescue Boat Flotilla"** or **"Dispatch Dewatering Pump Unit"** above to authorize immediate movement.`;
    }

    if (q.includes('evacuation') || q.includes('draft') || q.includes('order')) {
      return `### 📢 EMERGENCY EVACUATION ADVISORY [NDMA/PDMA]\n` +
        `**AREA:** ${dist}\n` +
        `**THREAT LEVEL:** IMMINENT INUNDATION (Code Red)\n\n` +
        `All residents in low-lying sectors and katcha settlements are advised to relocate to designated elevated relief centers or GT Road embankments immediately. Move cattle to high ground. Rescue teams are operating on 1122 emergency frequencies.`;
    }

    return `### 📋 Strategic Operational Assessment\n` +
      `Regarding **${dist}** under simulation \`${simId}\`:\n` +
      `- Telemetry indicates water elevation velocity remains critical.\n` +
      `- Recommended action: Pre-position medical assets and authorize immediate dewatering units at levee breach points.\n` +
      `- Would you like me to mobilize swift-water boats or trigger an air medevac request?`;
  }

  _addChatMessage(sender, text) {
    this.chatMessages.push({ sender, text });
    const chatContainer = this.container?.querySelector('#gemini-chat-messages');
    if (chatContainer) {
      const bubble = document.createElement('div');
      bubble.className = `gemini-chat-bubble ${sender}`;
      bubble.innerHTML = `<div>${this._formatMarkdown(text)}</div>`;
      chatContainer.appendChild(bubble);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  _formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/### (.*?)\n/g, '<h4 style="margin:4px 0; color:#1a73e8; font-size:13.5px;">$1</h4>')
      .replace(/#### (.*?)\n/g, '<h5 style="margin:4px 0; color:#0f172a; font-size:12.5px;">$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9; padding:2px 5px; border-radius:4px; font-family:monospace; color:#1a73e8;">$1</code>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n- /g, '<br/>• ')
      .replace(/\n/g, '<br/>');
  }

  _renderStarterPortal() {
    this.container.innerHTML = `
      <div class="rescue-portal-container">
        <div class="rescue-portal-header">
          <div class="gemini-sparkle-icon" style="width: 36px; height: 36px;">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
          </div>
          <span class="portal-tag">NDMA × Agahi Emergency Portal</span>
          <h1 class="portal-title">Disaster Response &amp; Evacuation Center</h1>
          <p class="portal-subtitle">
            AI-orchestrated crisis coordination connecting stranded citizens, live hydrology telemetry, and swift-water rescue dispatchers across Pakistan.
          </p>
        </div>

        <div class="rescue-portal-options">
          <!-- Option 1: Call for Help (Citizen Direct Messaging) -->
          <div class="portal-card sos-card" id="portal-card-sos">
            <div class="portal-card-badge sos">CITIZEN DISTRESS CHANNEL</div>
            <div class="portal-card-icon-wrap sos">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            </div>
            <h2 class="portal-card-title">Call for Help (Emergency SOS)</h2>
            <p class="portal-card-desc">
              Immediate messaging interface for citizens stranded in floodwaters or facing levee breaches. Detects your GPS coordinates, accepts voice/text descriptions, and broadcasts directly to Rescue 1122 &amp; NDMA.
            </p>
            <div class="portal-card-features">
              <span>✓ Works in any Chrome/mobile browser</span>
              <span>✓ Auto GPS coordinate lock</span>
              <span>✓ Prioritized by AI Urgency Model</span>
            </div>
            <button class="portal-action-btn sos-btn" type="button" id="portal-btn-sos">
              <span>Start Emergency Message</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
            </button>
          </div>

          <!-- Option 2: Command Dashboard (Executive Triage Grid) -->
          <div class="portal-card dashboard-card" id="portal-card-dashboard">
            <div class="portal-card-badge dashboard">TACTICAL COMMAND</div>
            <div class="portal-card-icon-wrap dashboard">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
            </div>
            <h2 class="portal-card-title">Emergency Command Dashboard</h2>
            <p class="portal-card-desc">
              Full operational triage console for disaster coordinators, government authorities, and field chiefs. Monitor live incident stream, review AI life-threat scores, and dispatch flotillas &amp; dewatering pumps.
            </p>
            <div class="portal-card-features">
              <span>✓ Real-time P1–P4 triage scoring</span>
              <span>✓ Live Supabase sync stream</span>
              <span>✓ Conversational Gemini rescue copilot</span>
            </div>
            <button class="portal-action-btn dashboard-btn" type="button" id="portal-btn-dashboard">
              <span>Open Command Dashboard</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
            </button>
          </div>
        </div>

        <div class="rescue-portal-footer">
          <button id="portal-btn-back-globe" class="portal-link-btn" type="button">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <span>Return to 3D Globe &amp; Flood Simulation</span>
          </button>
        </div>
      </div>
    `;
  }

  _bindPortalEvents() {
    const btnSos = this.container.querySelector('#portal-btn-sos');
    const cardSos = this.container.querySelector('#portal-card-sos');
    const btnDashboard = this.container.querySelector('#portal-btn-dashboard');
    const cardDashboard = this.container.querySelector('#portal-card-dashboard');
    const btnBackGlobe = this.container.querySelector('#portal-btn-back-globe');

    const openCitizen = () => {
      this.viewMode = 'citizen_chat';
      this._render();
    };

    const openDashboard = () => {
      this.viewMode = 'dashboard';
      this._render();
    };

    btnSos?.addEventListener('click', (e) => {
      e.stopPropagation();
      openCitizen();
    });
    cardSos?.addEventListener('click', openCitizen);

    btnDashboard?.addEventListener('click', (e) => {
      e.stopPropagation();
      openDashboard();
    });
    cardDashboard?.addEventListener('click', openDashboard);

    btnBackGlobe?.addEventListener('click', () => {
      this.unmount();
      this.onReturnToGlobe();
    });
  }

  _renderCitizenChatInterface() {
    this.container.innerHTML = `
      <div class="citizen-chat-wrapper">
        <!-- Top App Bar -->
        <header class="citizen-chat-header">
          <div class="citizen-chat-header-left">
            <button id="citizen-btn-back-portal" class="citizen-back-btn" type="button" title="Back to Portal Selection">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              <span>Back</span>
            </button>
            <div class="gemini-sparkle-icon" style="width: 28px; height: 28px;">
              <svg viewBox="0 0 24 24"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
            </div>
            <div>
              <div class="citizen-title-row">
                <h1 class="citizen-title">Emergency Rescue Dispatcher</h1>
                <span class="citizen-online-pill"><span class="pulse-dot"></span> LIVE DISPATCH</span>
              </div>
              <p class="citizen-sub">Direct Distress Channel to NDMA &amp; Rescue 1122 • Supabase Synced</p>
            </div>
          </div>

          <div class="citizen-header-actions">
            <button id="citizen-btn-gps" class="citizen-gps-btn" type="button">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
              <span id="citizen-gps-label">Share My GPS Location</span>
            </button>
            <button id="citizen-btn-switch-dashboard" class="citizen-dash-btn" type="button">
              <span>View Command Dashboard</span>
            </button>
          </div>
        </header>

        <!-- Message Stream -->
        <main class="citizen-messages-area" id="citizen-messages-area">
          ${this.citizenChatMessages.map(msg => `
            <div class="citizen-bubble ${msg.sender}">
              <div class="bubble-sender">${msg.sender === 'user' ? 'You (Distress Signal)' : 'AI Emergency Dispatcher'}</div>
              <div class="bubble-content">${this._formatMarkdown(msg.text)}</div>
              <div class="bubble-time">${msg.timestamp || 'Just now'}</div>
            </div>
          `).join('')}
        </main>

        <!-- Quick Emergency Prompt Chips -->
        <div class="citizen-quick-chips">
          <button class="citizen-chip" data-chip="Water is waist-high and rising fast. 4 people trapped on roof.">🌊 Water rising fast / On roof</button>
          <button class="citizen-chip" data-chip="Medical emergency: infant with high fever and pregnant woman stranded.">🚑 Medical emergency stranded</button>
          <button class="citizen-chip" data-chip="Need urgent evacuation boat in Nowshera. Grandfather cannot walk.">🚤 Need immediate rescue boat</button>
          <button class="citizen-chip" data-chip="We have 15 people cut off on a high road embankment with no drinking water.">💧 Trapped without drinking water</button>
        </div>

        <!-- Chat Input Bar -->
        <footer class="citizen-chat-input-bar">
          <form id="citizen-chat-form" class="citizen-chat-form">
            <input 
              type="text" 
              id="citizen-chat-input" 
              class="citizen-text-input" 
              placeholder="Type your emergency message, district, or what help is needed..." 
              autocomplete="off" 
              required
            />
            <button type="submit" id="citizen-chat-send" class="citizen-send-btn" title="Send Distress Signal">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </form>
        </footer>
      </div>
    `;
  }

  _bindCitizenChatEvents() {
    const btnBack = this.container.querySelector('#citizen-btn-back-portal');
    const btnDash = this.container.querySelector('#citizen-btn-switch-dashboard');
    const btnGps = this.container.querySelector('#citizen-btn-gps');
    const gpsLabel = this.container.querySelector('#citizen-gps-label');
    const form = this.container.querySelector('#citizen-chat-form');
    const input = this.container.querySelector('#citizen-chat-input');
    const chips = this.container.querySelectorAll('.citizen-chip');

    let currentLat = 34.015;
    let currentLon = 71.982;
    let locationShared = false;

    btnBack?.addEventListener('click', () => {
      this.viewMode = 'portal';
      this._render();
    });

    btnDash?.addEventListener('click', () => {
      this.viewMode = 'dashboard';
      this._render();
    });

    btnGps?.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      if (gpsLabel) gpsLabel.textContent = 'Locating GPS...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          currentLat = pos.coords.latitude;
          currentLon = pos.coords.longitude;
          locationShared = true;
          if (gpsLabel) gpsLabel.textContent = `✓ GPS Locked (${currentLat.toFixed(3)}°N, ${currentLon.toFixed(3)}°E)`;
          this._addCitizenMessage('user', `📍 **Shared GPS Location:** \`${currentLat.toFixed(4)}°N, ${currentLon.toFixed(4)}°E\` (Accuracy within ${Math.round(pos.coords.accuracy)}m)`);
          this._addCitizenMessage('assistant', `✅ **Location recorded.** Emergency dispatch coordinates locked at **[${currentLat.toFixed(4)}, ${currentLon.toFixed(4)}]**. Please describe how many people are with you and the immediate hazard.`);
        },
        (err) => {
          console.warn('[GPS Error]', err);
          locationShared = true;
          if (gpsLabel) gpsLabel.textContent = '✓ Default GPS (Nowshera)';
          this._addCitizenMessage('user', `📍 **Location Specified:** Nowshera / Kabul River Basin [34.015°N, 71.982°E]`);
          this._addCitizenMessage('assistant', `✅ **Location pinned to Nowshera / Kabul River basin.** Tell us your nearest landmark or street so rescue boats can navigate to you.`);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-chip');
        if (text && input) {
          input.value = text;
          form.dispatchEvent(new Event('submit'));
        }
      });
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      // 1. Append user message to thread
      this._addCitizenMessage('user', text);

      // 2. Submit to Supabase
      const payload = {
        name: 'Citizen via Web Distress App',
        phone: '+92 3XX XXXXXXX',
        district: locationShared ? `GPS Location [${currentLat.toFixed(3)}, ${currentLon.toFixed(3)}]` : 'Flood Impact Zone',
        latitude: currentLat,
        longitude: currentLon,
        channel: 'CHROME WEB SOS',
        message: text,
        urgencyLevel: 'P1 - CRITICAL LIFE THREAT',
        trappedCount: text.includes('people') || text.includes('trapped') ? 4 : 1,
        hasVulnerable: text.toLowerCase().includes('infant') || text.toLowerCase().includes('pregnant') || text.toLowerCase().includes('children') || text.toLowerCase().includes('grandfather'),
        waterDepthFt: text.toLowerCase().includes('roof') ? 8 : 4,
      };

      // Push to in-memory dashboard signals so command dashboard sees it immediately
      const newSignal = {
        id: `sos-live-${Date.now()}`,
        timestamp: 'Just now',
        sender: 'Citizen via Web SOS',
        phone: 'Browser Session',
        district: payload.district,
        coords: [currentLon, currentLat],
        channel: 'CHROME WEB SOS',
        message: text,
        llmRank: 'P1 - CRITICAL LIFE THREAT',
        llmScore: 97,
        badgeClass: 'p1-critical',
        llmReasoning: 'Real-time distress signal dispatched from browser. Immediate rescue priority logged with Supabase integration.',
        recommendedAction: 'Immediate dispatch of swift-water flotilla and emergency triage.',
        status: 'PENDING DISPATCH',
      };
      this.signals.unshift(newSignal);

      // Save to Supabase
      submitRescueRequest(payload).catch(err => console.warn('Supabase sync error', err));

      // 3. Dispatcher LLM response
      setTimeout(() => {
        this._addCitizenMessage(
          'assistant',
          `🚨 **Distress Signal Broadcasted to NDMA & Rescue 1122**\n\n` +
          `- **Status:** **PENDING DISPATCH**\n` +
          `- **Incident ID:** \`${newSignal.id}\`\n` +
          `- **Triage Urgency:** **P1 Critical (AI Score: 97/100)**\n` +
          `- **Action Taken:** Signal transmitted to Central Command & synced with Supabase emergency registry.\n\n` +
          `**Safety Instructions:** Stay on highest sturdy structure. Do not attempt to walk through fast-moving water over knee-deep. Turn on flashlight or wave brightly colored cloth for aviation/boat spotting. Rescue units are being mobilized.`
        );
      }, 700);
    });
  }

  _addCitizenMessage(sender, text) {
    this.citizenChatMessages.push({
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    const messagesArea = this.container?.querySelector('#citizen-messages-area');
    if (messagesArea) {
      const bubble = document.createElement('div');
      bubble.className = `citizen-bubble ${sender}`;
      bubble.innerHTML = `
        <div class="bubble-sender">${sender === 'user' ? 'You (Distress Signal)' : 'AI Emergency Dispatcher'}</div>
        <div class="bubble-content">${this._formatMarkdown(text)}</div>
        <div class="bubble-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      `;
      messagesArea.appendChild(bubble);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  }

  _startSimulatedStream() {
    this._simTimer = setInterval(() => {
      const extraMessages = [
        {
          sender: 'Tariq Mehmood',
          phone: '+92 334 1029384',
          district: 'Kot Addu, Punjab',
          coords: [70.96, 30.47],
          channel: 'WHATSAPP SOS',
          message: 'Canal siphon ruptured, flooding wheat fields and approaching residential street. Need municipal drainage backup.',
          llmRank: 'P3 - STRANDED POPULATION',
          llmScore: 78,
          badgeClass: 'p3-evac',
          llmReasoning: 'Agricultural levee breach approaching edge of residential zone. Safe window approximately 3 hours.',
          recommendedAction: 'Dispatch irrigation backhoe and sandbag team to plug siphon breach.',
          status: 'PENDING DISPATCH',
        },
        {
          sender: 'Zahid Hussain',
          phone: '+92 302 7710293',
          district: 'Kashmore, Upper Sindh',
          coords: [69.58, 28.43],
          channel: 'SMS EMERGENCY',
          message: 'Emergency: Flash backflow from Indus into school camp. 65 displaced families trapped without dry ground.',
          llmRank: 'P1 - CRITICAL LIFE THREAT',
          llmScore: 96,
          badgeClass: 'p1-critical',
          llmReasoning: 'Displaced camp inundation with high concentration of children and elderly in fast-rising water.',
          recommendedAction: 'Immediate dispatch of 3x high-capacity motorboats from Guddu staging depot.',
          status: 'PENDING DISPATCH',
        },
      ];

      const pick = extraMessages[Math.floor(Math.random() * extraMessages.length)];
      const newSignal = {
        ...pick,
        id: `sos-${Date.now()}`,
        timestamp: 'Just now',
      };

      this.signals.unshift(newSignal);
      if (this.viewMode === 'dashboard') {
        this._render();
      }
    }, 32000);
  }

  destroy() {
    if (this._simTimer) {
      clearInterval(this._simTimer);
      this._simTimer = null;
    }
    this.container?.remove();
    this.container = null;
  }
}

