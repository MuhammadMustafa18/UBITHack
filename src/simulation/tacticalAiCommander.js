/**
 * @module simulation/tacticalAiCommander
 * @description Real-time Tactical AI Commander & Rescue Dispatcher.
 * 
 * Features:
 * - Has full live awareness of the active simulation ID, state (paused or playing),
 *   crest coordinates, river discharge, timeline (simHours & scale), and downstream arrival window.
 * - Real-time monitoring of nationwide emergency rescue fleet deficits (Firetrucks, Boats, Manpower)
 *   and incoming /rescue citizen SOS distress signals.
 * - Proactively briefs the operational commander with NDMA-standard resource deployment strategies.
 * - Supports direct resource dispatch execution ("Deploy 2 Firetrucks", "Send Rescue Boat").
 * - Supports Anthropic/Claude compatible API with configurable endpoints:
 *   Base URL: https://token-plan-sgp.xiaomimimo.com/anthropic
 *   Token: tp-s6p0t8aywzu6coascjrefmgw5106ddfgs7qgrqe0rcps673o
 * - Includes robust military/NDMA fallback rule engine for 100% uptime when external API quotas are exhausted.
 */

import { INITIAL_SOS_SIGNALS } from '../ui/rescueDashboard.js';

export const DEFAULT_AI_CONFIG = {
  baseUrl: 'https://token-plan-sgp.xiaomimimo.com/anthropic',
  apiKey: 'tp-s6p0t8aywzu6coascjrefmgw5106ddfgs7qgrqe0rcps673o',
  model: 'mimo-v2.5',
};

export class TacticalAiCommander {
  constructor(options = {}) {
    this.viewer = options.viewer || null;
    this.floodEngine = options.floodEngine || null;
    this.resourceDefenseGame = options.resourceDefenseGame || null;

    // Load or initialize config from LocalStorage
    this.config = this._loadConfig();

    this.messages = [];
    this.isThinking = false;
    this.container = null;
    this.isOpen = false;
    this.unreadCount = 0;
    this._hasProactivelyBriefed = false;
    this._lastBriefedSimId = null;

    this._listeners = new Set();

    this._initEngineListeners();
  }

  _loadConfig() {
    try {
      const saved = localStorage.getItem('floodtrace:tactical_ai_config');
      if (saved) {
        return { ...DEFAULT_AI_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('[TacticalAI] Error loading config:', e);
    }
    return { ...DEFAULT_AI_CONFIG };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem('floodtrace:tactical_ai_config', JSON.stringify(this.config));
    } catch (e) {
      console.warn('[TacticalAI] Error saving config:', e);
    }
    this._notify();
  }

  _initEngineListeners() {
    if (this.floodEngine) {
      this.floodEngine.subscribe((telemetry) => {
        this._onEngineTelemetry(telemetry);
      });
    }

    if (this.resourceDefenseGame) {
      this.resourceDefenseGame.subscribe((resState) => {
        this._onResourceUpdate(resState);
      });
    }
  }

  _onEngineTelemetry(telemetry) {
    if (!telemetry) return;

    // If a new simulation is active and hasn't been briefed yet, trigger proactive briefing
    if (telemetry.active && telemetry.simulationId && this._lastBriefedSimId !== telemetry.simulationId) {
      this._lastBriefedSimId = telemetry.simulationId;
      this.triggerProactiveBriefing('INIT');
    }

    this._updateHeaderStatus(telemetry);
  }

  _onResourceUpdate(resState) {
    // Check for critical deficit alerts
    if (resState && resState.targetState) {
      const ts = resState.targetState;
      if (ts.status && ts.status.includes('DEFICIT') && !this._lastDeficitNotified) {
        // We can optionally flag warning
      }
    }
  }

  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notify() {
    for (const cb of this._listeners) {
      try {
        cb({
          messages: this.messages,
          isOpen: this.isOpen,
          isThinking: this.isThinking,
          context: this.getOperationalContext(),
        });
      } catch (e) {
        console.error('[TacticalAI] notify error:', e);
      }
    }
  }

  /**
   * Compiles the comprehensive operational context for the LLM
   */
  getOperationalContext() {
    const telemetry = this.floodEngine ? this.floodEngine.getCurrentTelemetry() : null;
    const resState = this.resourceDefenseGame ? this.resourceDefenseGame.getState() : null;

    const simId = telemetry?.simulationId || 'SIM-PK-STANDBY';
    const active = telemetry?.active || false;
    const playing = telemetry?.playing || false;
    const timeFormatted = telemetry?.formattedTime || 'T+0h';
    const locationName = telemetry?.locationName || 'N/A';
    const discharge = telemetry?.dischargeCusecs ? `${telemetry.dischargeCusecs.toLocaleString()} cusecs` : 'N/A';
    const stageRise = telemetry?.stageRiseM ? `${telemetry.stageRiseM} meters` : 'N/A';
    const crestCoords = (telemetry?.crestLat && telemetry?.crestLon) 
      ? `Lat ${telemetry.crestLat.toFixed(3)}°, Lon ${telemetry.crestLon.toFixed(3)}°` 
      : 'N/A';
    const status = telemetry?.status || 'STANDBY';
    const scenarioName = telemetry?.scenarioName || 'N/A';
    const magnitudeLabel = telemetry?.magnitudeLabel || 'N/A';

    // Target safeguard & deficits
    const target = resState?.targetState;
    const pool = resState?.pool || { firetrucks: 0, boats: 0, manpower: 0 };
    const targetName = target?.targetWp?.name || 'Upcoming Floodplain';
    const targetEta = target?.etaHours ? `${target.etaHours} hrs` : 'Imminent';
    const safeguardPct = target?.safeguardPct !== undefined ? `${target.safeguardPct}%` : '0%';
    const deficitFiretrucks = Math.max(0, (target?.requiredFiretrucks || 0) - (target?.arrivedFiretrucks || 0));
    const deficitBoats = Math.max(0, (target?.requiredBoats || 0) - (target?.arrivedBoats || 0));
    const deficitManpower = Math.max(0, (target?.requiredManpower || 0) - (target?.arrivedManpower || 0));

    // Emergency distress signals summary
    const pendingSos = INITIAL_SOS_SIGNALS.filter(s => s.status.includes('PENDING')).slice(0, 3);
    const sosSummary = pendingSos.map(s => 
      `• [${s.id}] ${s.district} (${s.llmRank}): "${s.message.slice(0, 90)}..." (Recommended: ${s.recommendedAction})`
    ).join('\n');

    return {
      simId,
      active,
      playing,
      scenarioName,
      magnitudeLabel,
      timeFormatted,
      locationName,
      discharge,
      stageRise,
      crestCoords,
      status,
      targetName,
      targetEta,
      safeguardPct,
      deficits: {
        firetrucks: deficitFiretrucks,
        boats: deficitBoats,
        manpower: deficitManpower,
      },
      pool: { ...pool },
      sosSummary,
      fullTelemetry: telemetry,
      fullResourceState: resState,
    };
  }

  /**
   * Proactive briefing generation triggered on simulation start or command
   */
  async triggerProactiveBriefing(reason = 'MANUAL') {
    const ctx = this.getOperationalContext();
    
    let prompt = '';
    if (reason === 'INIT') {
      prompt = `ACTIVE SIMULATION DETECTED [${ctx.simId}]. Status is ${ctx.playing ? 'PLAYING' : 'PAUSED'}. Provide an immediate, NDMA tactical deployment briefing for incoming flood crest at ${ctx.locationName} (${ctx.discharge}). Detail resource deficits and immediate deployment orders for Firetrucks and Rescue Boats.`;
    } else if (reason === 'PAUSED') {
      prompt = `Simulation [${ctx.simId}] has been PAUSED at ${ctx.timeFormatted}. Assess current defensive posture at ${ctx.targetName}, evaluate resource travel times and remaining pool reserves, and suggest corrective resource allocation before playback resumes.`;
    } else {
      prompt = `Provide a comprehensive tactical situation and resource deployment briefing for active simulation [${ctx.simId}].`;
    }

    await this.sendMessage(prompt, { isProactive: true, promptLabel: '🚨 TACTICAL DEPLOYMENT BRIEFING' });
  }

  /**
   * Sends user query or automated prompt to LLM / Fallback engine
   */
  async sendMessage(userText, options = {}) {
    if (!userText || !userText.trim()) return;

    const ctx = this.getOperationalContext();

    // Append user message to thread
    const userMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isProactive: options.isProactive || false,
      promptLabel: options.promptLabel || null,
    };

    this.messages.push(userMsg);
    this.isThinking = true;
    this._notify();
    this._renderMessages();

    // Check for direct tool action triggers (e.g. "deploy firetruck", "dispatch boat")
    const actionResult = this._handleDirectCommand(userText);
    if (actionResult) {
      setTimeout(() => {
        this.messages.push({
          id: `msg-${Date.now()}-action`,
          sender: 'assistant',
          text: actionResult,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          simId: ctx.simId,
        });
        this.isThinking = false;
        this._notify();
        this._renderMessages();
      }, 400);
      return;
    }

    try {
      const assistantReply = await this._callAiService(userText, ctx);
      this.messages.push({
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        text: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        simId: ctx.simId,
      });
    } catch (err) {
      console.warn('[TacticalAI] Remote LLM request error, generating localized tactical plan:', err);
      const fallbackReply = this._generateTacticalPlanLocal(userText, ctx);
      this.messages.push({
        id: `msg-${Date.now()}-local`,
        sender: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        simId: ctx.simId,
        isFallback: true,
      });
    } finally {
      this.isThinking = false;
      if (!this.isOpen) {
        this.unreadCount++;
        this._updateBadge();
      }
      this._notify();
      this._renderMessages();
    }
  }

  _handleDirectCommand(text) {
    const lower = text.toLowerCase().trim();
    if (!this.resourceDefenseGame) return null;

    if (lower.includes('deploy firetruck') || lower.includes('dispatch firetruck') || lower.includes('send firetruck')) {
      const res = this.resourceDefenseGame.dispatchResource('firetruck');
      if (res.success === false) {
        return `⚠️ **DISPATCH FAILED**: ${res.reason}`;
      }
      const st = this.resourceDefenseGame.getState();
      return `🚒 **FIRETRUCK DISPATCHED TO DEFENSE ZONE**\n- Target: ${st.targetState.targetWp?.name || 'Active Front'}\n- Route: High-speed arterial corridor transit deployed.\n- Remaining National Firetruck Reserve: **${st.pool.firetrucks} units**.\n- Manpower allocated: **8 specialists**.`;
    }

    if (lower.includes('deploy boat') || lower.includes('dispatch boat') || lower.includes('send boat')) {
      const res = this.resourceDefenseGame.dispatchResource('boat');
      if (res.success === false) {
        return `⚠️ **DISPATCH FAILED**: ${res.reason}`;
      }
      const st = this.resourceDefenseGame.getState();
      return `🚤 **SWIFT-WATER RESCUE FLOTILLA DISPATCHED**\n- Target: ${st.targetState.targetWp?.name || 'Active Front'}\n- Route: Inundation bypass & marine trailer convoy en route.\n- Remaining Boat Reserve: **${st.pool.boats} units**.\n- Current Safeguard Defense: **${st.targetState.safeguardPct}%**.`;
    }

    if (lower.includes('deploy crew') || lower.includes('dispatch crew') || lower.includes('send crew') || lower.includes('manpower')) {
      const res = this.resourceDefenseGame.dispatchResource('crew');
      if (res.success === false) {
        return `⚠️ **DISPATCH FAILED**: ${res.reason}`;
      }
      const st = this.resourceDefenseGame.getState();
      return `👷 **25-PERSON DISASTER MANPOWER CREW MOBILIZED**\n- Target: ${st.targetState.targetWp?.name || 'Active Front'}\n- Sandbagging, levee fortification, and medical triage staging initiated.\n- Remaining National Manpower Reserve: **${st.pool.manpower} personnel**.`;
    }

    return null;
  }

  /**
   * Calls the configured Anthropic-compatible proxy endpoint
   */
  async _callAiService(prompt, ctx) {
    const systemPrompt = `You are the National Disaster Management Authority (NDMA) Tactical AI Operations Commander for Agaahi.
You have real-time live telemetry access to the active flood simulation and emergency rescue operations.

OPERATIONAL SITUATION TELEMETRY:
- Active Simulation ID: ${ctx.simId}
- Engine State: ${ctx.active ? (ctx.playing ? 'ACTIVE (PROPAGATING)' : 'ACTIVE (PAUSED AT SCRUBBER)') : 'IDLE / STANDBY'}
- Scenario: ${ctx.scenarioName} (${ctx.magnitudeLabel})
- Simulation Timeline: ${ctx.timeFormatted}
- Current Crest Position: ${ctx.locationName} (${ctx.crestCoords})
- River Discharge: ${ctx.discharge} | Stage Rise: ${ctx.stageRise}
- Flood Status: ${ctx.status}

DOWNSTREAM DEFENSE & RESOURCE LOGISTICS:
- Target Downstream Bastion: ${ctx.targetName}
- Arrival Window (ETA): ${ctx.targetEta}
- Current Safeguard Defense: ${ctx.safeguardPct}
- Required Logistics Deficit:
  * Firetrucks Deficit: ${ctx.deficits.firetrucks}
  * Swift-Water Boats Deficit: ${ctx.deficits.boats}
  * Manpower Deficit: ${ctx.deficits.manpower} personnel
- Available National Reserve: Firetrucks: ${ctx.pool.firetrucks}, Boats: ${ctx.pool.boats}, Manpower: ${ctx.pool.manpower}

CITIZEN DISTRESS SIGNALS (/rescue stream):
${ctx.sosSummary}

INSTRUCTIONS:
1. Provide a direct, authoritative, NDMA/military-grade briefing.
2. Formulate clear actionable recommendations: which depots to mobilize from, exact units to dispatch, and immediate evacuation or levee shoring priorities.
3. Be proactive: warn about downstream funnel points or critical SOS calls that need prompt dispatch.
4. Format with clean Markdown, bold headers, and bullet points.`;

    const cleanBaseUrl = (this.config.baseUrl || '').replace(/\/+$/, '');
    const url = `${cleanBaseUrl}/v1/messages`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const payload = {
      model: this.config.model || 'mimo-v2.5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text;
    }
    throw new Error('Unexpected response schema');
  }

  /**
   * High-fidelity military/NDMA fallback rule engine for 100% uptime when proxy quota is exhausted
   */
  _generateTacticalPlanLocal(prompt, ctx) {
    const isPlaying = ctx.playing;
    const isPaused = ctx.active && !ctx.playing;
    const simId = ctx.simId;
    const loc = ctx.locationName;
    const target = ctx.targetName;
    const discharge = ctx.discharge;
    const eta = ctx.targetEta;
    const deficits = ctx.deficits;
    const pool = ctx.pool;

    let plan = `### 📋 NDMA SITUATION & DEPLOYMENT DIRECTIVE\n`;
    plan += `**Operation ID:** \`${simId}\` • **Status:** ${isPlaying ? '🟢 SIMULATION RUNNING' : (isPaused ? '⏸️ SIMULATION PAUSED' : '⚪ STANDBY')} • **Timeline:** ${ctx.timeFormatted}\n\n`;

    plan += `#### 1. Real-Time Hydrodynamic Assessment\n`;
    plan += `- **Active Crest Location:** **${loc}** (${ctx.crestCoords})\n`;
    plan += `- **Peak Discharge:** **${discharge}** with stage rise of **${ctx.stageRise}**.\n`;
    plan += `- **Hydraulic Velocity:** Downstream wave front will intercept **${target}** within **${eta}**.\n\n`;

    plan += `#### 2. Resource Deficit & Vulnerability Analysis\n`;
    plan += `The defense barrier at **${target}** is currently at **${ctx.safeguardPct}** safeguard capacity:\n`;
    plan += `- **Firetruck / Dewatering Deficit:** \`${deficits.firetrucks} units\` needed (National Reserve: ${pool.firetrucks})\n`;
    plan += `- **Swift-Water Boat Deficit:** \`${deficits.boats} boats\` needed (National Reserve: ${pool.boats})\n`;
    plan += `- **Field Crew Deficit:** \`${deficits.manpower} personnel\` needed (National Reserve: ${pool.manpower})\n\n`;

    plan += `#### 3. Immediate Tactical Orders\n`;
    plan += `1. **Mobilize Dewatering Flotilla:** Dispatch **${Math.min(deficits.firetrucks || 2, pool.firetrucks)}x Firetruck Units** and **${Math.min(deficits.boats || 3, pool.boats)}x Rescue Boats** immediately from the nearest regional staging depot.\n`;
    plan += `2. **Reinforce Riverine Levees:** Deploy **${Math.min(deficits.manpower || 50, pool.manpower)} Manpower Specialists** for rapid sandbag revetment along low-lying bund breaches.\n`;
    plan += `3. **Priority Triage Dispatch:** Address pending citizen distress calls in Nowshera & Indus tributaries.\n\n`;

    plan += `> 💡 *Quick Action: Click below or type **"Deploy Firetruck"** or **"Deploy Boat"** to execute instant convoy mobilization.*`;

    return plan;
  }

  /**
   * Builds and mounts the floating AI Commander Drawer in DOM
   */
  mount(parent = document.body) {
    if (this.container) return;

    const div = document.createElement('div');
    div.id = 'tactical-ai-root';
    div.className = 'tactical-ai-root';

    div.innerHTML = `
      <!-- Floating Capsule Toggle Button -->
      <button id="tactical-ai-toggle-btn" class="tactical-ai-toggle-btn" title="Open NDMA Tactical AI Commander">
        <div class="tactical-ai-btn-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h4a2 2 0 0 1 2 2v2h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1V9a2 2 0 0 1 2-2h4V5.72c-.6-.34-1-.98-1-1.72a2 2 0 0 1 2-2zm-3 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-6 5v2h6v-2H9z"/>
          </svg>
        </div>
        <div class="tactical-ai-btn-text">
          <span class="tactical-ai-btn-title">Tactical AI</span>
          <span id="tactical-ai-btn-sim-badge" class="tactical-ai-btn-sim-badge">STANDBY</span>
        </div>
        <div id="tactical-ai-unread-badge" class="tactical-ai-unread-badge hidden">0</div>
      </button>

      <!-- Expandable Command Panel Drawer -->
      <div id="tactical-ai-drawer" class="tactical-ai-drawer hidden">
        <!-- Header -->
        <div class="tactical-ai-header">
          <div class="tactical-ai-header-left">
            <div class="tactical-ai-pulse-dot"></div>
            <div>
              <div class="tactical-ai-header-title">TACTICAL AI COMMANDER</div>
              <div class="tactical-ai-header-subtitle">
                <span id="tactical-ai-sim-id-label">SIM-PK-STANDBY</span> • 
                <span id="tactical-ai-sim-state-label" class="state-idle">IDLE</span>
              </div>
            </div>
          </div>
          <div class="tactical-ai-header-actions">
            <button id="tactical-ai-settings-toggle" class="tactical-ai-icon-btn" title="API Credentials & Endpoint Settings">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
            </button>
            <button id="tactical-ai-close-btn" class="tactical-ai-icon-btn" title="Close Panel">✕</button>
          </div>
        </div>

        <!-- Telemetry Glance Ribbon -->
        <div class="tactical-ai-glance-bar">
          <div class="glance-item">
            <span class="glance-label">CREST WAVE</span>
            <span id="tactical-glance-crest" class="glance-val">Standby</span>
          </div>
          <div class="glance-item">
            <span class="glance-label">DISCHARGE</span>
            <span id="tactical-glance-flow" class="glance-val">0 cusecs</span>
          </div>
          <div class="glance-item">
            <span class="glance-label">DEFICIT</span>
            <span id="tactical-glance-deficit" class="glance-val">0 / 0</span>
          </div>
        </div>

        <!-- Settings Drawer (Collapsible) -->
        <div id="tactical-ai-settings-panel" class="tactical-ai-settings-panel hidden">
          <div class="settings-title">Anthropic / Xiaomi Mimo Proxy Config</div>
          <div class="settings-group">
            <label>Base URL</label>
            <input id="tactical-ai-base-url" type="text" value="${this.config.baseUrl}" />
          </div>
          <div class="settings-group">
            <label>Auth Token</label>
            <input id="tactical-ai-auth-token" type="password" value="${this.config.apiKey}" />
          </div>
          <div class="settings-group">
            <label>Model ID</label>
            <input id="tactical-ai-model-id" type="text" value="${this.config.model}" />
          </div>
          <div class="settings-actions">
            <button id="tactical-ai-settings-save" class="tactical-btn-primary">Save Settings</button>
            <button id="tactical-ai-settings-cancel" class="tactical-btn-secondary">Cancel</button>
          </div>
        </div>

        <!-- Message Thread -->
        <div id="tactical-ai-messages" class="tactical-ai-messages">
          <!-- Initial welcome -->
          <div class="tactical-msg msg-assistant">
            <div class="msg-header">
              <span class="msg-author">TACTICAL COMMANDER</span>
              <span class="msg-time">SYSTEM</span>
            </div>
            <div class="msg-body">
              <strong>NDMA Tactical AI Intelligence online.</strong> Connected to active hydrodynamic simulation telemetry and nationwide emergency fleet reserves.
              <br/><br/>
              Launch or pick any flood simulation to receive proactive operational briefings and tactical deployment orders.
            </div>
          </div>
        </div>

        <!-- Quick Command Chips -->
        <div class="tactical-ai-chips">
          <button class="tactical-chip" data-cmd="Proactive Briefing">📋 Operational Briefing</button>
          <button class="tactical-chip" data-cmd="Deploy Firetruck">🚒 Deploy Firetruck</button>
          <button class="tactical-chip" data-cmd="Deploy Boat">🚤 Deploy Rescue Boat</button>
          <button class="tactical-chip" data-cmd="Deploy Crew">👷 Mobilize Crew</button>
          <button class="tactical-chip" data-cmd="SOS Triage">🚨 SOS Triage</button>
        </div>

        <!-- Input Bar -->
        <div class="tactical-ai-input-bar">
          <textarea 
            id="tactical-ai-input" 
            class="tactical-ai-input" 
            placeholder="Ask commander or type 'Deploy Firetruck'..." 
            rows="1"
          ></textarea>
          <button id="tactical-ai-send-btn" class="tactical-ai-send-btn" title="Send Directive">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    parent.appendChild(div);
    this.container = div;

    this._bindDOM();
  }

  _bindDOM() {
    if (!this.container) return;

    const toggleBtn = this.container.querySelector('#tactical-ai-toggle-btn');
    const drawer = this.container.querySelector('#tactical-ai-drawer');
    const closeBtn = this.container.querySelector('#tactical-ai-close-btn');
    const settingsToggle = this.container.querySelector('#tactical-ai-settings-toggle');
    const settingsPanel = this.container.querySelector('#tactical-ai-settings-panel');
    const settingsSave = this.container.querySelector('#tactical-ai-settings-save');
    const settingsCancel = this.container.querySelector('#tactical-ai-settings-cancel');
    const input = this.container.querySelector('#tactical-ai-input');
    const sendBtn = this.container.querySelector('#tactical-ai-send-btn');
    const chips = this.container.querySelectorAll('.tactical-chip');

    toggleBtn?.addEventListener('click', () => {
      this.setOpen(!this.isOpen);
    });

    closeBtn?.addEventListener('click', () => {
      this.setOpen(false);
    });

    settingsToggle?.addEventListener('click', () => {
      settingsPanel?.classList.toggle('hidden');
    });

    settingsCancel?.addEventListener('click', () => {
      settingsPanel?.classList.add('hidden');
    });

    settingsSave?.addEventListener('click', () => {
      const baseUrl = this.container.querySelector('#tactical-ai-base-url')?.value.trim();
      const apiKey = this.container.querySelector('#tactical-ai-auth-token')?.value.trim();
      const model = this.container.querySelector('#tactical-ai-model-id')?.value.trim();

      this.saveConfig({ baseUrl, apiKey, model });
      settingsPanel?.classList.add('hidden');
      alert('Tactical AI credentials updated successfully.');
    });

    sendBtn?.addEventListener('click', () => {
      this._handleInputSubmit();
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleInputSubmit();
      }
    });

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const cmd = chip.getAttribute('data-cmd');
        if (cmd === 'Proactive Briefing') {
          this.triggerProactiveBriefing('MANUAL');
        } else if (cmd === 'SOS Triage') {
          this.sendMessage('Provide an emergency triage briefing on all pending citizen SOS distress calls and prioritize boat assignments.');
        } else {
          this.sendMessage(cmd);
        }
      });
    });
  }

  setOpen(open) {
    this.isOpen = open;
    const drawer = this.container?.querySelector('#tactical-ai-drawer');
    if (drawer) {
      if (open) {
        drawer.classList.remove('hidden');
        this.unreadCount = 0;
        this._updateBadge();
        const input = this.container?.querySelector('#tactical-ai-input');
        input?.focus();
      } else {
        drawer.classList.add('hidden');
      }
    }
  }

  _updateBadge() {
    const badge = this.container?.querySelector('#tactical-ai-unread-badge');
    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  _handleInputSubmit() {
    const input = this.container?.querySelector('#tactical-ai-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    input.value = '';
    this.sendMessage(val);
  }

  _updateHeaderStatus(telemetry) {
    if (!this.container) return;

    const btnSimBadge = this.container.querySelector('#tactical-ai-btn-sim-badge');
    const headerSimId = this.container.querySelector('#tactical-ai-sim-id-label');
    const headerState = this.container.querySelector('#tactical-ai-sim-state-label');
    const glanceCrest = this.container.querySelector('#tactical-glance-crest');
    const glanceFlow = this.container.querySelector('#tactical-glance-flow');
    const glanceDeficit = this.container.querySelector('#tactical-glance-deficit');

    const simId = telemetry?.simulationId || 'STANDBY';
    const isPlaying = telemetry?.playing;
    const isActive = telemetry?.active;

    if (btnSimBadge) {
      btnSimBadge.textContent = simId.replace('SIM-PK-', '');
    }

    if (headerSimId) {
      headerSimId.textContent = simId;
    }

    if (headerState) {
      if (isPlaying) {
        headerState.textContent = 'PLAYING';
        headerState.className = 'state-playing';
      } else if (isActive) {
        headerState.textContent = 'PAUSED';
        headerState.className = 'state-paused';
      } else {
        headerState.textContent = 'STANDBY';
        headerState.className = 'state-idle';
      }
    }

    if (glanceCrest && telemetry) {
      glanceCrest.textContent = telemetry.locationName || 'N/A';
    }

    if (glanceFlow && telemetry) {
      glanceFlow.textContent = `${(telemetry.dischargeCusecs || 0).toLocaleString()} cfs`;
    }

    if (glanceDeficit && this.resourceDefenseGame) {
      const ts = this.resourceDefenseGame.targetState;
      const fDef = Math.max(0, (ts.requiredFiretrucks || 0) - (ts.arrivedFiretrucks || 0));
      const bDef = Math.max(0, (ts.requiredBoats || 0) - (ts.arrivedBoats || 0));
      glanceDeficit.textContent = `${fDef} FT / ${bDef} Boats`;
    }
  }

  _renderMessages() {
    const thread = this.container?.querySelector('#tactical-ai-messages');
    if (!thread) return;

    let html = `
      <div class="tactical-msg msg-assistant">
        <div class="msg-header">
          <span class="msg-author">TACTICAL COMMANDER</span>
          <span class="msg-time">ONLINE</span>
        </div>
        <div class="msg-body">
          <strong>NDMA Tactical AI Intelligence online.</strong> Real-time situational awareness active.
        </div>
      </div>
    `;

    for (const msg of this.messages) {
      const isUser = msg.sender === 'user';
      const cssClass = isUser ? 'msg-user' : 'msg-assistant';
      const author = isUser ? 'COMMANDER YOU' : 'TACTICAL AI';

      let body = this._formatMarkdown(msg.text);

      // If it's an assistant message, append interactive quick-dispatch buttons if appropriate
      if (!isUser && (body.includes('Firetruck') || body.includes('Boat') || body.includes('Safeguard'))) {
        body += `
          <div class="msg-quick-actions">
            <button class="msg-action-btn" data-action="deploy-ft">🚒 Dispatch Firetruck</button>
            <button class="msg-action-btn" data-action="deploy-boat">🚤 Dispatch Rescue Boat</button>
          </div>
        `;
      }

      html += `
        <div class="tactical-msg ${cssClass}">
          <div class="msg-header">
            <span class="msg-author">${author}</span>
            ${msg.simId ? `<span class="msg-sim-tag">${msg.simId}</span>` : ''}
            <span class="msg-time">${msg.timestamp}</span>
          </div>
          <div class="msg-body">${body}</div>
        </div>
      `;
    }

    if (this.isThinking) {
      html += `
        <div class="tactical-msg msg-assistant msg-thinking">
          <div class="msg-header">
            <span class="msg-author">TACTICAL AI</span>
            <span class="msg-time">ANALYZING TELEMETRY...</span>
          </div>
          <div class="msg-body">
            <span class="tactical-typing-dots">
              <span></span><span></span><span></span>
            </span>
            Synthesizing hydrodynamic flood wavefront, resource deficits, and emergency triage orders...
          </div>
        </div>
      `;
    }

    thread.innerHTML = html;
    thread.scrollTop = thread.scrollHeight;

    // Attach click events to in-message quick dispatch buttons
    const actionBtns = thread.querySelectorAll('.msg-action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        if (action === 'deploy-ft') {
          this.sendMessage('Deploy Firetruck');
        } else if (action === 'deploy-boat') {
          this.sendMessage('Deploy Boat');
        }
      });
    });
  }

  _formatMarkdown(text) {
    if (!text) return '';
    let out = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/### (.*?)\n/g, '<h4 class="msg-h3">$1</h4>')
      .replace(/#### (.*?)\n/g, '<h5 class="msg-h4">$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="msg-code">$1</code>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n- /g, '<br/>• ')
      .replace(/\n/g, '<br/>');
    return out;
  }
}
