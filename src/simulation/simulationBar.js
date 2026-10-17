/**
 * @module simulation/simulationBar
 * @description UI Component for FloodTrace Pakistan simulation mode:
 * playback controls, timeline scrubber, speed stepper, and live telemetry display.
 */

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
      <div class="sim-header">
        <div class="sim-status-badge">
          <span class="sim-dot"></span>
          <span class="sim-title">GLOF &amp; INDUS FLOOD SIMULATION</span>
          <span class="sim-sub">PHYSICS &amp; HYDROLOGICAL FORECAST</span>
        </div>
        <button id="sim-exit-btn" class="sim-btn sim-btn-danger" type="button" title="Exit simulation and return to real-time monitoring">
          <span class="sim-icon">✕</span> EXIT SIMULATION
        </button>
      </div>

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
          <span class="sim-tel-label">WATER LEVEL RISE</span>
          <span id="sim-tel-stage" class="sim-tel-val">+8.5 m</span>
        </div>
        <div class="sim-tel-item">
          <span class="sim-tel-label">RIVER REACH STATUS</span>
          <span id="sim-tel-status" class="sim-tel-val text-warning">GLOF RUPTURE</span>
        </div>
      </div>

      <div class="sim-controls-row">
        <button id="sim-play-pause-btn" class="sim-btn sim-btn-primary" type="button">
          <span id="sim-play-icon" class="sim-icon">❚❚</span> <span id="sim-play-text">PAUSE</span>
        </button>

        <div class="sim-timeline-wrap">
          <div class="sim-time-labels">
            <span id="sim-time-current">T+00:00h</span>
            <span class="sim-time-max">T+72:00h (Karachi Delta)</span>
          </div>
          <input id="sim-scrubber" class="sim-scrubber" type="range" min="0" max="72" step="0.2" value="0" />
        </div>

        <div class="sim-speed-group">
          <button class="sim-speed-btn" data-speed="1" type="button">1x</button>
          <button class="sim-speed-btn active" data-speed="5" type="button">5x</button>
          <button class="sim-speed-btn" data-speed="15" type="button">15x</button>
          <button class="sim-speed-btn" data-speed="40" type="button">40x</button>
        </div>

        <button id="sim-follow-btn" class="sim-btn sim-btn-toggle" type="button" title="Automatically track the leading flood wave with 3D camera">
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

    // Play/Pause button
    const playPauseBtn = this.container.querySelector('#sim-play-pause-btn');
    playPauseBtn.addEventListener('click', () => {
      this.engine.togglePlay();
    });

    // Timeline Scrubber
    const scrubber = this.container.querySelector('#sim-scrubber');
    scrubber.addEventListener('input', (e) => {
      this.engine.seek(Number(e.target.value));
    });

    // Speed buttons
    const speedButtons = this.container.querySelectorAll('.sim-speed-btn');
    speedButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const speed = Number(btn.dataset.speed);
        this.engine.setSpeed(speed);
        speedButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
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
    const hrs = Math.floor(tel.simHours);
    const mins = Math.floor((tel.simHours - hrs) * 60);
    const timeStr = `T+${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}h`;

    const timeLabel = this.container.querySelector('#sim-time-current');
    if (timeLabel) timeLabel.textContent = timeStr;

    // Scrubber position
    const scrubber = this.container.querySelector('#sim-scrubber');
    if (
      scrubber &&
      Math.abs(Number(scrubber.value) - tel.simHours) > 0.3 &&
      !scrubber.matches(':active')
    ) {
      scrubber.value = String(tel.simHours);
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
