/**
 * @module simulation/simulationBar
 * @description UI Component for FloodTrace Pakistan multi-scale simulation dock:
 * Minute, Hourly, Daily, and Weekly scales, stepper controls, timeline scrubber, and live telemetry display.
 */

import { TIME_SCALES } from './flowData.js';

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
          <span class="sim-title">FLOOD SIMULATION</span>
          <div class="sim-scale-tabs" role="tablist">
            <button class="sim-scale-tab" data-scale="minute" type="button" title="Minute-by-minute mountain flash flood & GLOF breach">MINUTE</button>
            <button class="sim-scale-tab active" data-scale="hourly" type="button" title="Hourly river basin flood crest propagation (0 - 72h)">HOURLY</button>
            <button class="sim-scale-tab" data-scale="daily" type="button" title="Day-by-day Indus Basin transit (Day 1 - 14)">DAILY</button>
            <button class="sim-scale-tab" data-scale="weekly" type="button" title="Week-by-week catastrophic basin pooling & drainage (Week 1 - 8)">WEEKLY</button>
          </div>
        </div>
        <button id="sim-exit-btn" class="sim-btn sim-btn-danger" type="button" title="Exit simulation and return to real-time monitoring">
          <span class="sim-icon">✕</span> EXIT SIMULATION
        </button>
      </div>

      <!-- Telemetry Strip -->
      <div class="sim-telemetry-strip">
        <div class="sim-tel-item">
          <span class="sim-tel-label">CREST LOCATION</span>
          <span id="sim-tel-location" class="sim-tel-val">Shisper Glacier Moraine</span>
        </div>
        <div class="sim-tel-item">
          <span class="sim-tel-label">EST. DISCHARGE</span>
          <span id="sim-tel-discharge" class="sim-tel-val text-alert">140,000 Cusecs</span>
        </div>
        <div class="sim-tel-item">
          <span class="sim-tel-label">STAGE RISE</span>
          <span id="sim-tel-stage" class="sim-tel-val">+8.5 m</span>
        </div>
        <div class="sim-tel-item">
          <span class="sim-tel-label">FORECAST MODE / STATUS</span>
          <span id="sim-tel-status" class="sim-tel-val text-warning">GLOF RUPTURE</span>
        </div>
      </div>

      <!-- Controls Row with Stepper, Play, Timeline, and Speeds -->
      <div class="sim-controls-row">
        <!-- Step backward -->
        <button id="sim-step-back-btn" class="sim-btn sim-btn-step" type="button" title="Step backward">
          <span class="sim-icon">⏮</span> <span id="sim-step-back-label">-1h</span>
        </button>

        <!-- Play / Pause -->
        <button id="sim-play-pause-btn" class="sim-btn sim-btn-primary" type="button">
          <span id="sim-play-icon" class="sim-icon">❚❚</span> <span id="sim-play-text">PAUSE</span>
        </button>

        <!-- Step forward -->
        <button id="sim-step-fwd-btn" class="sim-btn sim-btn-step" type="button" title="Step forward">
          <span id="sim-step-fwd-label">+1h</span> <span class="sim-icon">⏭</span>
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
          <span class="sim-icon">🎯</span> FOLLOW WAVE
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
      const stepTxt = `${tel.step}${tel.unitLabel}`;
      backLabel.textContent = `-${stepTxt}`;
      fwdLabel.textContent = `+${stepTxt}`;
    }

    // Scrubber bounds & position
    const scrubber = this.container.querySelector('#sim-scrubber');
    if (scrubber) {
      if (Number(scrubber.max) !== tel.maxUnits) {
        scrubber.max = String(tel.maxUnits);
        scrubber.step = String(tel.step);
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
    const locEl = this.container.querySelector('#sim-tel-location');
    if (locEl) locEl.textContent = tel.locationName;

    const disEl = this.container.querySelector('#sim-tel-discharge');
    if (disEl)
      disEl.textContent = `${tel.dischargeCusecs.toLocaleString()} Cusecs`;

    const stageEl = this.container.querySelector('#sim-tel-stage');
    if (stageEl) stageEl.textContent = `+${tel.stageRiseM} m`;

    const statEl = this.container.querySelector('#sim-tel-status');
    if (statEl) statEl.textContent = tel.status;
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
