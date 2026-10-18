/**
 * @module ui/rescueDashboard
 * @description Dedicated Emergency Rescue Incident & LLM Urgency Triage Dashboard for /rescue route.
 * Ingests simulated incoming citizen distress signals (SMS, WhatsApp, Satellite SOS, Voice calls)
 * and ranks them in real-time using an LLM triage scoring engine.
 */

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
    this.onReturnToMap = options.onReturnToMap || (() => {});
    this.onLocateOnGlobe = options.onLocateOnGlobe || (() => {});
    this.container = null;
    this.signals = [...INITIAL_SOS_SIGNALS];
    this.selectedSignal = this.signals[0];
    this.activeFilter = 'all'; // 'all' | 'p1' | 'p2' | 'p3' | 'p4'
    this.searchQuery = '';
    this._simTimer = null;
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

    const filtered = this._getFilteredSignals();

    this.container.innerHTML = `
      <!-- Top Executive Command Bar -->
      <header class="rescue-nav-bar">
        <div class="rescue-brand-group">
          <div class="rescue-badge-live">
            <span class="pulse-dot"></span>
            <span>LIVE INCIDENT STREAM</span>
          </div>
          <h1 class="rescue-brand-title">Rescue Incident Dispatch &amp; LLM Urgency Triage</h1>
          <span class="rescue-route-tag">ROUTE: /rescue</span>
        </div>

        <div class="rescue-stats-group">
          <div class="rescue-stat-box">
            <span class="num">${this.signals.length}</span>
            <span class="lbl">TOTAL ALERTS</span>
          </div>
          <div class="rescue-stat-box critical">
            <span class="num">${this.signals.filter((s) => s.llmScore >= 90).length}</span>
            <span class="lbl">P1 CRITICAL</span>
          </div>
          <div class="rescue-stat-box warning">
            <span class="num">${this.signals.filter((s) => s.status === 'IN PROGRESS').length}</span>
            <span class="lbl">DISPATCHED</span>
          </div>
        </div>

        <div class="rescue-nav-actions">
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

        <!-- Right: AI Urgency Triage & Dispatch Detail -->
        <main class="rescue-detail-column">
          ${this._renderSelectedIncidentDetail()}
        </main>
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
              <span class="detail-score-pill">AI URGENCY SCORE: <strong>${item.llmScore} / 100</strong></span>
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
          <div class="section-title">LLM AI TRIAGE ASSESSMENT &amp; MULTI-FACTOR REASONING:</div>
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
      this.onReturnToMap();
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

    this._bindIncidentCardClicks();
    this._bindActionButtons();
  }

  _bindIncidentCardClicks() {
    this.container.querySelectorAll('.rescue-incident-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const found = this.signals.find((s) => s.id === id);
        if (found) {
          this.selectedSignal = found;
          const detailCol = this.container.querySelector('.rescue-detail-column');
          if (detailCol) {
            detailCol.innerHTML = this._renderSelectedIncidentDetail();
            this._bindActionButtons();
          }
          this.container.querySelectorAll('.rescue-incident-card').forEach((c) => c.classList.remove('selected'));
          card.classList.add('selected');
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
        } else {
          this.selectedSignal.status = 'DISPATCHED';
          btn.textContent = 'DISPATCHED & EN ROUTE';
          btn.style.opacity = '0.6';
          btn.style.pointerEvents = 'none';
          const statusVal = this.container.querySelector('.detail-status-box .val');
          if (statusVal) {
            statusVal.textContent = 'DISPATCHED';
            statusVal.className = 'val in-progress';
          }
        }
      });
    });
  }

  _startSimulatedStream() {
    // Add incoming realistic simulated messages periodically
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
      this._render();
    }, 28000);
  }
}
