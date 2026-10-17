/**
 * @module simulation/simulationBar
 * @description UI Component for FloodTrace Pakistan multi-scenario & dynamic magnitude simulation dock:
 * - 5 Flood Origins (Glaciers, Indian Dam Releases, Hill Torrents & Rain, Riverine Super Flood, Arabian Sea Cyclone)
 * - 4 Dynamic Magnitudes (Moderate 0.5x, High 1.0x, Very High 1.6x, Super Flood 2.6x)
 * - Multi-scale timeline (Minute, Hourly, Daily, Weekly)
 * - Stepper controls, scrubber timeline, live telemetry display
 */

import { TIME_SCALES, FLOOD_SCENARIOS, FLOOD_MAGNITUDES } from './flowData.js';

export class SimulationBarUI {
  constructor(engine) {
    this.engine = engine;
    this.container = null;
    this._unsubscribe = null;
    this._buildDOM();
    this._wireEvents();
  }

  _buildDOM() {
    this.container = document.createElement('div');
    this.container.id = 'flood-sim-dock';
    this.container.className = 'flood-sim-dock hidden';

    this.container.innerHTML = `
      <div class="sim-glow"></div>
      
      <!-- Top header with scale tabs and exit -->
      <div class="sim-header">
        <div class="sim-status-badge">
          <span class="sim-dot"></span>
          <span class="sim-title">DISASTER FORECAST ENGINE</span>
          <div class="sim-scale-tabs" role="tablist">
            <button class="sim-scale-tab" data-scale="minute" type="button" title="Minute-by-minute mountain flash flood & breach">MINUTE</button>
            <button class="sim-scale-tab active" data-scale="hourly" type="button" title="Hourly river reach propagation (0 - 72h)">HOURLY</button>
            <button class="sim-scale-tab" data-scale="daily" type="button" title="Day-by-day national transit (Day 1 - 14)">DAILY</button>
            <button class="sim-scale-tab" data-scale="weekly" type="button" title="Week-by-week catastrophic basin pooling & drainage (Week 1 - 8)">WEEKLY</button>
          </div>
        </div>
        <button id="sim-exit-btn" class="sim-btn sim-btn-danger" type="button" title="Exit simulation and return to real-time monitoring">
          <span>✕</span> EXIT SIMULATION
        </button>
      </div>

      <!-- Scenarios & Dynamic Magnitude Row -->
      <div class="sim-scenario-mag-row">
        <!-- Flood Origin & Type Selector -->
        <div class="sim-selector-group">
          <span class="sim-selector-label">FLOOD TYPE &amp; ORIGIN:</span>
          <div class="sim-pills-row" id="sim-scenario-pills">
            <button class="sim-chip-pill active" data-scenario="glacier" type="button" title="Karakoram Moraine Glacial Lake Outburst (Shisper/Hunza)">
              <svg viewBox="0 0 24 24" class="sim-pill-svg"><path fill="currentColor" d="m14 6-3.75 5 2.85 3.8-1.6 1.2L7 10l-6 8h22L14 6z"/></svg>
              <span>Glacier GLOF</span>
            </button>
            <button class="sim-chip-pill" data-scenario="dam_breach" type="button" title="Indian Transboundary Dam Release (Chenab/Sutlej -> Sialkot/Kasur)">
              <svg viewBox="0 0 24 24" class="sim-pill-svg"><path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19H2v2h20v-2h-2.35l-.62-1.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 2c3.87 0 7 3.13 7 7 0 1.5-.47 2.88-1.27 4.02L16.27 13H14v-2h-4v2H7.73l-1.46 3.02C5.47 14.88 5 13.5 5 12c0-3.87 3.13-7 7-7zm-1 9h2v5h-2v-5z"/></svg>
              <span>Indian Dam Release</span>
            </button>
            <button class="sim-chip-pill" data-scenario="rain" type="button" title="Koh-e-Suleman Hill Torrents & Monsoon Cloudburst (Rajanpur/DG Khan)">
              <svg viewBox="0 0 24 24" class="sim-pill-svg"><path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/></svg>
              <span>Hill Torrents &amp; Rain</span>
            </button>
            <button class="sim-chip-pill" data-scenario="riverine" type="button" title="Kabul & Indus River Levee Ruptures (2022 Super Flood Scale)">
              <svg viewBox="0 0 24 24" class="sim-pill-svg"><path fill="currentColor" d="M21 12c-1.19 0-2.27-.47-3.07-1.23-.74.77-1.8 1.23-2.93 1.23-1.14 0-2.19-.47-2.93-1.23-.75.76-1.81 1.23-3.07 1.23s-2.32-.47-3.07-1.23C5.19 11.53 4.14 12 3 12c-.55 0-1-.45-1-1s.45-1 1-1c.6 0 1.15-.24 1.55-.63C5.35 8.57 6.4 8 7.6 8s2.25.57 3.05 1.37c.4-.39.95-.63 1.55-.63s1.15.24 1.55.63C14.55 8.57 15.6 8 16.8 8s2.25.57 3.05 1.37c.4-.39.95-.63 1.55-.63.55 0 1 .45 1 1s-.45 1-1.4 1.26z"/></svg>
              <span>Riverine Super Flood</span>
            </button>
            <button class="sim-chip-pill" data-scenario="cyclone" type="button" title="Arabian Sea Cyclone Storm Surge (Thatta/Karachi/Delta Backflow)">
              <svg viewBox="0 0 24 24" class="sim-pill-svg"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              <span>Arabian Sea Cyclone</span>
            </button>
          </div>
        </div>

        <!-- Dynamic Magnitude Selector -->
        <div class="sim-selector-group">
          <span class="sim-selector-label">MAGNITUDE (SEVERITY):</span>
          <div class="sim-pills-row" id="sim-magnitude-pills">
            <button class="sim-chip-pill" data-magnitude="moderate" type="button" title="0.5x Scale: Localized bank overflow & agricultural inundation">
              <span>Moderate (0.5x)</span>
            </button>
            <button class="sim-chip-pill active" data-magnitude="high" type="button" title="1.0x Scale: Widespread levee alerts & high-velocity discharge">
              <span>High (1.0x)</span>
            </button>
            <button class="sim-chip-pill" data-magnitude="very_high" type="button" title="1.6x Scale: Critical levee ruptures & highway washouts">
              <span>Very High (1.6x)</span>
            </button>
            <button class="sim-chip-pill" data-magnitude="super_flood" type="button" title="2.6x Scale: 2022 Super Flood National Emergency">
              <span>Super Flood (2.6x)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Telemetry Strip -->
      <div class="sim-telemetry-strip">
        <div class="sim-tel-item">
          <span class="sim-tel-label">ORIGIN / REGION</span>
          <span id="sim-tel-origin" class="sim-tel-val">Shisper Glacier, Hunza</span>
        </div>
        <div class="sim-tel-item">
          <span class="sim-tel-label">CREST LOCATION</span>
          <span id="sim-tel-location" class="sim-tel-val">Shisper Moraine</span>
        </div>
        <div class="sim-tel-item">
          <span class="sim-tel-label">EST. DISCHARGE</span>
          <span id="sim-tel-discharge" class="sim-tel-val text-alert">350,000 Cusecs</span>
        </div>
        <div class="sim-tel-item">
          <span class="sim-tel-label">STAGE RISE</span>
          <span id="sim-tel-stage" class="sim-tel-val">+8.5 m</span>
        </div>
        <div class="sim-tel-item">
          <span class="sim-tel-label">STAGE / STATUS</span>
          <span id="sim-tel-status" class="sim-tel-val text-warning">HIGH WARNING</span>
        </div>
      </div>

      <!-- Controls Row with Stepper, Play, Timeline, and Speeds -->
      <div class="sim-controls-row">
        <!-- Step backward -->
        <button id="sim-step-back-btn" class="sim-btn sim-btn-step" type="button" title="Step backward">
          <span id="sim-step-back-label">-1h</span>
        </button>

        <!-- Play / Pause -->
        <button id="sim-play-pause-btn" class="sim-btn sim-btn-primary" type="button">
          <span id="sim-play-icon" class="sim-icon">❚❚</span> <span id="sim-play-text">PAUSE</span>
        </button>

        <!-- Step forward -->
        <button id="sim-step-fwd-btn" class="sim-btn sim-btn-step" type="button" title="Step forward">
          <span id="sim-step-fwd-label">+1h</span>
        </button>

        <!-- Scrubber timeline -->
        <div class="sim-timeline-wrap">
          <div class="sim-time-labels">
            <span id="sim-time-current">T+00:00h</span>
            <span id="sim-time-max" class="sim-time-max">T+72:00h</span>
          </div>
          <input id="sim-scrubber" class="sim-scrubber" type="range" min="0" max="72" step="1" value="0" />
        </div>

        <!-- Follow Wave -->
        <button id="sim-follow-btn" class="sim-btn sim-btn-toggle" type="button" title="Smoothly track the leading flood wave with 3D camera">
          <svg viewBox="0 0 24 24" class="sim-svg-icon" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"><path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
          <span>FOLLOW WAVE</span>
        </button>
      </div>
    `;

    document.body.appendChild(this.container);
  }

  _wireEvents() {
    // Exit button
    this.container
      .querySelector('#sim-exit-btn')
      .addEventListener('click', () => {
        this.engine.exit();
        this.hide();
      });

    // Scale Tabs
    const tabs = this.container.querySelectorAll('.sim-scale-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const scaleKey = tab.dataset.scale;
        this.engine.setTimeScale(scaleKey);
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    // Scenario Pills
    const scenarioPills = this.container.querySelectorAll('#sim-scenario-pills .sim-chip-pill');
    scenarioPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const scenarioKey = pill.dataset.scenario;
        this.engine.setScenario(scenarioKey);
        scenarioPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    // Magnitude Pills
    const magPills = this.container.querySelectorAll('#sim-magnitude-pills .sim-chip-pill');
    magPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const magKey = pill.dataset.magnitude;
        this.engine.setMagnitude(magKey);
        magPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    // Play/Pause button
    const playPauseBtn = this.container.querySelector('#sim-play-pause-btn');
    playPauseBtn.addEventListener('click', () => {
      this.engine.togglePlay();
    });

    // Steppers
    this.container
      .querySelector('#sim-step-back-btn')
      .addEventListener('click', () => {
        this.engine.stepBackward();
      });

    this.container
      .querySelector('#sim-step-fwd-btn')
      .addEventListener('click', () => {
        this.engine.stepForward();
      });

    // Timeline Scrubber
    const scrubber = this.container.querySelector('#sim-scrubber');
    scrubber.addEventListener('input', (e) => {
      this.engine.seekUnits(Number(e.target.value));
    });

    // Follow wave button
    const followBtn = this.container.querySelector('#sim-follow-btn');
    followBtn.addEventListener('click', () => {
      this.engine.toggleFollowCrest();
      followBtn.classList.toggle('active', this.engine.followCrest);
    });

    // Subscribe to engine telemetry updates
    this._unsubscribe = this.engine.subscribe((tel) => {
      this._updateUI(tel);
    });
  }

  _updateUI(tel) {
    if (!this.container) return;

    // Time text
    const timeLabel = this.container.querySelector('#sim-time-current');
    if (timeLabel) timeLabel.textContent = tel.formattedTime;

    const maxLabel = this.container.querySelector('#sim-time-max');
    if (maxLabel) {
      if (tel.timeScale === 'minute') maxLabel.textContent = '180 min (3h)';
      else if (tel.timeScale === 'hourly') maxLabel.textContent = '72h (3 Days)';
      else if (tel.timeScale === 'daily') maxLabel.textContent = 'Day 14 / 14';
      else if (tel.timeScale === 'weekly') maxLabel.textContent = 'Week 8 / 8';
    }

    // Stepper labels
    const backLabel = this.container.querySelector('#sim-step-back-label');
    const fwdLabel = this.container.querySelector('#sim-step-fwd-label');
    if (backLabel && fwdLabel) {
      const stepTxt = `${tel.unitLabel || 'h'}`;
      backLabel.textContent = `-1${stepTxt}`;
      fwdLabel.textContent = `+1${stepTxt}`;
    }

    // Scrubber bounds & position
    const scrubber = this.container.querySelector('#sim-scrubber');
    if (scrubber) {
      if (Number(scrubber.max) !== tel.maxUnits) {
        scrubber.max = String(tel.maxUnits);
      }
      if (
        Math.abs(Number(scrubber.value) - tel.scaleUnits) > 0.4 &&
        !scrubber.matches(':active')
      ) {
        scrubber.value = String(tel.scaleUnits);
      }
    }

    // Play/pause state
    const playIcon = this.container.querySelector('#sim-play-icon');
    const playText = this.container.querySelector('#sim-play-text');
    if (playIcon && playText) {
      if (tel.playing) {
        playIcon.textContent = '❚❚';
        playText.textContent = 'PAUSE';
      } else {
        playIcon.textContent = '▶';
        playText.textContent = 'PLAY';
      }
    }

    // Telemetry strip values
    const originEl = this.container.querySelector('#sim-tel-origin');
    if (originEl) originEl.textContent = tel.scenarioRegion || tel.scenarioName;

    const locEl = this.container.querySelector('#sim-tel-location');
    if (locEl) locEl.textContent = tel.locationName;

    const disEl = this.container.querySelector('#sim-tel-discharge');
    if (disEl)
      disEl.textContent = `${tel.dischargeCusecs.toLocaleString()} Cusecs`;

    const stageEl = this.container.querySelector('#sim-tel-stage');
    if (stageEl) stageEl.textContent = `+${tel.stageRiseM} m`;

    const statEl = this.container.querySelector('#sim-tel-status');
    if (statEl) {
      statEl.textContent = `${tel.status} (${tel.magnitudeLabel})`;
      if (tel.magnitudeColor) {
        statEl.style.color = tel.magnitudeColor;
      }
    }
  }

  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }

  toggle() {
    if (this.container.classList.contains('hidden')) {
      this.show();
      this.engine.start();
    } else {
      this.hide();
      this.engine.exit();
    }
  }
}
