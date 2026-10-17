/**
 * @module ui/googleMapsUI
 * @description Google Maps Light Theme UI overlay for FloodTrace Pakistan:
 * - Crisp floating white search bar with hamburger menu, input, search icon, and directions/action button
 * - Horizontal category pills (Simulate Flood, Glaciers & GLOF, Dams & Barrages, Live CCTVs, Flood Hotspots, Relief Fleet, Weather)
 * - Floating interactive dropdown cards for points of interest
 * - Bottom-left Google Maps Layers card with layer switcher
 * - Bottom-right floating navigation capsule (+ / - zoom, 3D tilt, compass, locate)
 * - Bottom status strip with flood severity scale
 */

import * as Cesium from 'cesium';

export const ICONS = {
  simulate: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/></svg>`,
  glacier: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="m14 6-3.75 5 2.85 3.8-1.6 1.2L7 10l-6 8h22L14 6z"/></svg>`,
  dam: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M21 12c-1.19 0-2.27-.47-3.07-1.23-.74.77-1.8 1.23-2.93 1.23-1.14 0-2.19-.47-2.93-1.23-.75.76-1.81 1.23-3.07 1.23s-2.32-.47-3.07-1.23C5.19 11.53 4.14 12 3 12c-.55 0-1-.45-1-1s.45-1 1-1c.6 0 1.15-.24 1.55-.63C5.35 8.57 6.4 8 7.6 8s2.25.57 3.05 1.37c.4-.39.95-.63 1.55-.63s1.15.24 1.55.63C14.55 8.57 15.6 8 16.8 8s2.25.57 3.05 1.37c.4-.39.95-.63 1.55-.63.55 0 1 .45 1 1s-.45 1-1.4 1.26zm0 5c-1.19 0-2.27-.47-3.07-1.23-.74.77-1.8 1.23-2.93 1.23-1.14 0-2.19-.47-2.93-1.23-.75.76-1.81 1.23-3.07 1.23s-2.32-.47-3.07-1.23C5.19 16.53 4.14 17 3 17c-.55 0-1-.45-1-1s.45-1 1-1c.6 0 1.15-.24 1.55-.63C5.35 13.57 6.4 13 7.6 13s2.25.57 3.05 1.37c.4-.39.95-.63 1.55-.63s1.15.24 1.55.63C14.55 13.57 15.6 13 16.8 13s2.25.57 3.05 1.37c.4-.39.95-.63 1.55-.63.55 0 1 .45 1 1s-.45 1-1.4 1.26z"/></svg>`,
  cctv: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>`,
  hotspot: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  fleet: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  weather: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" class="gmaps-item-svg"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
};

export const PAKISTAN_LOCATIONS = {
  glaciers: {
    title: 'Glaciers & GLOF Lakes',
    icon: ICONS.glacier,
    items: [
      {
        id: 'shisper',
        name: 'Shisper Glacier & Ice Dam',
        region: 'Hunza Valley, Gilgit-Baltistan',
        lat: 36.452,
        lon: 74.886,
        height: 5200,
        pitch: -32,
        heading: 35,
        badge: 'GLOF ACTIVE',
        badgeClass: 'badge-danger',
        desc: 'Rapid surge glacier blocking Mochowar stream with active moraine dammed lake',
      },
      {
        id: 'passu',
        name: 'Passu Glacier Moraine',
        region: 'Gojal, Upper Hunza',
        lat: 36.485,
        lon: 74.895,
        height: 5800,
        pitch: -30,
        heading: 40,
        badge: 'MONITORED',
        badgeClass: 'badge-warning',
        desc: 'High-altitude ice tongue discharging into Hunza river gorge',
      },
      {
        id: 'baltoro',
        name: 'Baltoro Glacier (K2 Highway)',
        region: 'Baltistan, Karakoram',
        lat: 35.733,
        lon: 76.383,
        height: 12000,
        pitch: -35,
        heading: 290,
        badge: '63 KM ICESHEET',
        badgeClass: 'badge-info',
        desc: 'One of the longest non-polar glaciers on Earth feeding the Indus headwaters',
      },
      {
        id: 'batura',
        name: 'Batura Glacier Melt Basin',
        region: 'Passu / Batura Mustagh',
        lat: 36.55,
        lon: 74.65,
        height: 9500,
        pitch: -28,
        heading: 110,
        badge: 'HIGH MELT',
        badgeClass: 'badge-warning',
        desc: '57 km valley glacier vulnerable to summer heatwave outbursts',
      },
    ],
  },
  dams: {
    title: 'Dams & Barrages',
    icon: ICONS.dam,
    items: [
      {
        id: 'tarbela',
        name: 'Tarbela Dam & Spillway',
        region: 'Haripur / Swabi, KP',
        lat: 34.088,
        lon: 72.698,
        height: 4200,
        pitch: -30,
        heading: 170,
        badge: 'CAPACITY 1.5M CFS',
        badgeClass: 'badge-primary',
        desc: 'Largest earth-filled dam in the world; primary Indus flood buffer',
      },
      {
        id: 'sukkur',
        name: 'Sukkur Barrage',
        region: 'Sukkur, Sindh',
        lat: 27.697,
        lon: 68.847,
        height: 3200,
        pitch: -28,
        heading: 330,
        badge: 'CRITICAL BOTTLENECK',
        badgeClass: 'badge-danger',
        desc: '66 sluice gates feeding 7 canals; super-flood overflow gateway to Arabian Sea',
      },
      {
        id: 'taunsa',
        name: 'Taunsa Barrage Spillway',
        region: 'Kot Addu / DG Khan, Punjab',
        lat: 30.708,
        lon: 70.842,
        height: 3600,
        pitch: -26,
        heading: 200,
        badge: 'HIGH STAGE',
        badgeClass: 'badge-warning',
        desc: 'Major Indus river crossing regulating South Punjab irrigation canals',
      },
      {
        id: 'guddu',
        name: 'Guddu Barrage',
        region: 'Kashmore, Upper Sindh',
        lat: 28.421,
        lon: 69.704,
        height: 3800,
        pitch: -28,
        heading: 190,
        badge: 'SUPER FLOOD ZONE',
        badgeClass: 'badge-danger',
        desc: 'Sindh entry gateway; handles pooled discharges from Punjab five rivers',
      },
      {
        id: 'chashma',
        name: 'Chashma Barrage & Reservoir',
        region: 'Mianwali, Punjab',
        lat: 32.435,
        lon: 71.378,
        height: 4100,
        pitch: -26,
        heading: 210,
        badge: 'HYDEL STORAGE',
        badgeClass: 'badge-info',
        desc: 'Wetland storage and diversion barrage into Chashma-Jhelum Link canal',
      },
      {
        id: 'kotri',
        name: 'Kotri Barrage (Lower Delta)',
        region: 'Jamshoro / Hyderabad, Sindh',
        lat: 25.378,
        lon: 68.318,
        height: 3300,
        pitch: -28,
        heading: 160,
        badge: 'DELTA DISCHARGE',
        badgeClass: 'badge-primary',
        desc: 'Final barrage on River Indus before delta discharge into Arabian Sea',
      },
      {
        id: 'warsak',
        name: 'Warsak Dam Hydro Spillway',
        region: 'Peshawar Valley, KP',
        lat: 34.167,
        lon: 71.35,
        height: 3400,
        pitch: -32,
        heading: 135,
        badge: 'KABUL RIVER INFLOW',
        badgeClass: 'badge-warning',
        desc: 'Regulates transboundary inflows from Kabul river before Peshawar plains',
      },
    ],
  },
  hotspots: {
    title: 'Flood Hotspots',
    icon: ICONS.hotspot,
    items: [
      {
        id: 'nowshera',
        name: 'Nowshera Flood Bypass & GT Road',
        region: 'Kabul River Basin, KP',
        lat: 34.015,
        lon: 71.985,
        height: 3200,
        pitch: -28,
        heading: 140,
        badge: 'SEVERE FLOOD PRONE',
        badgeClass: 'badge-danger',
        desc: 'Funnel choke point where Swat and Kabul rivers merge before Indus confluence',
      },
      {
        id: 'charsadda',
        name: 'Charsadda Jindi & Swat Confluence',
        region: 'Peshawar Valley, KP',
        lat: 34.148,
        lon: 71.731,
        height: 3500,
        pitch: -26,
        heading: 180,
        badge: 'FLASH FLOOD ZONE',
        badgeClass: 'badge-danger',
        desc: 'River Swat split channels frequently breaking banks into residential sectors',
      },
      {
        id: 'sukkur-city',
        name: 'Sukkur & Rohri Indus Bunds',
        region: 'Indus Basin, Sindh',
        lat: 27.705,
        lon: 68.857,
        height: 3400,
        pitch: -30,
        heading: 210,
        badge: 'LEVEE WATCH',
        badgeClass: 'badge-warning',
        desc: 'Key urban protective embankments holding back monsoon peak discharges',
      },
      {
        id: 'rawalpindi',
        name: 'Nullah Lai Gawalmandi Basin',
        region: 'Rawalpindi / Islamabad',
        lat: 33.6,
        lon: 73.055,
        height: 2800,
        pitch: -34,
        heading: 175,
        badge: 'URBAN FLASH FLOOD',
        badgeClass: 'badge-danger',
        desc: 'High-speed urban torrent ravine running through central Rawalpindi',
      },
      {
        id: 'peshawar',
        name: 'Michni Gauge & River Entry',
        region: 'Peshawar Basin, KP',
        lat: 34.18,
        lon: 71.42,
        height: 3800,
        pitch: -28,
        heading: 110,
        badge: 'EARLY WARNING GAUGING',
        badgeClass: 'badge-info',
        desc: 'Upstream hydro-telemetered gauging station for KP flood alarms',
      },
      {
        id: 'hyderabad',
        name: 'Gidu Flood Bund & Jamshoro',
        region: 'Hyderabad, Lower Sindh',
        lat: 25.396,
        lon: 68.357,
        height: 4000,
        pitch: -26,
        heading: 185,
        badge: 'DELTA PLAIN SURGE',
        badgeClass: 'badge-warning',
        desc: 'Low-gradient plain prone to months-long inundation pooling',
      },
    ],
  },
};

export class GoogleMapsUI {
  constructor({ viewer, navigation, simulationBarUI, floodEngine, styleManager }) {
    this.viewer = viewer;
    this.navigation = navigation;
    this.simulationBarUI = simulationBarUI;
    this.floodEngine = floodEngine;
    this.styleManager = styleManager;
    this.activeCategory = null;
    this.layersMenuOpen = false;

    this._init();
  }

  _init() {
    this._injectStyles();
    this._renderDOM();
    this._bindEvents();
    this._syncCompass();
  }

  _injectStyles() {
    // google-maps-theme.css will be loaded via style.css
  }

  _renderDOM() {
    // 1. Top Bar Container
    const topBar = document.createElement('div');
    topBar.id = 'gmaps-top-container';
    topBar.className = 'gmaps-top-container';
    topBar.innerHTML = `
      <!-- Google Maps Floating White Search Bar -->
      <div id="gmaps-search-box" class="gmaps-search-box">
        <button id="gmaps-menu-btn" class="gmaps-icon-btn" type="button" aria-label="Menu" title="FloodTrace Navigation Menu">
          <svg viewBox="0 0 24 24" class="gmaps-svg-icon"><path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        </button>
        <input 
          id="gmaps-search-input" 
          class="gmaps-search-input" 
          type="text" 
          placeholder="Search FloodTrace Pakistan (e.g. Tarbela, Sukkur, Shisper)..." 
          autocomplete="off" 
          spellcheck="false" 
        />
        <button id="gmaps-search-submit" class="gmaps-icon-btn" type="button" aria-label="Search" title="Search Location">
          <svg viewBox="0 0 24 24" class="gmaps-svg-icon"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </button>
        <div class="gmaps-search-divider"></div>
        <button id="gmaps-directions-btn" class="gmaps-directions-btn" type="button" aria-label="Simulate Flood Flow" title="Launch Flood Wave Simulation">
          <svg viewBox="0 0 24 24" class="gmaps-directions-icon"><path fill="#ffffff" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
        </button>
      </div>

      <!-- Google Maps Category Filter Pills -->
      <div id="gmaps-filter-bar" class="gmaps-filter-bar" role="toolbar" aria-label="Map categories">
        <button id="gmaps-pill-simulate" class="gmaps-pill gmaps-pill-featured" type="button" title="Simulate Glacial Lake Outburst & Downstream Flooding">
          <span class="gmaps-pill-icon">${ICONS.simulate}</span>
          <span>Simulate Flood</span>
        </button>
        <button class="gmaps-pill" data-category="glaciers" type="button" title="Karakoram Glaciers & GLOF Lakes">
          <span class="gmaps-pill-icon">${ICONS.glacier}</span>
          <span>Glaciers &amp; GLOF</span>
        </button>
        <button class="gmaps-pill" data-category="dams" type="button" title="National Dams & Indus River Barrages">
          <span class="gmaps-pill-icon">${ICONS.dam}</span>
          <span>Dams &amp; Barrages</span>
        </button>
        <button id="gmaps-pill-cctv" class="gmaps-pill" type="button" title="Live River & Barrage CCTV Feeds">
          <span class="gmaps-pill-icon">${ICONS.cctv}</span>
          <span>Live CCTVs</span>
        </button>
        <button class="gmaps-pill" data-category="hotspots" type="button" title="High-Risk Flood Hotspots">
          <span class="gmaps-pill-icon">${ICONS.hotspot}</span>
          <span>Flood Hotspots</span>
        </button>
        <button id="gmaps-pill-fleet" class="gmaps-pill" type="button" title="Rescue 1122 &amp; Military Fleet">
          <span class="gmaps-pill-icon">${ICONS.fleet}</span>
          <span>Relief Fleet</span>
        </button>
        <button id="gmaps-pill-weather" class="gmaps-pill" type="button" title="Live Precipitation &amp; Weather Radar">
          <span class="gmaps-pill-icon">${ICONS.weather}</span>
          <span>Weather &amp; Radar</span>
        </button>
      </div>

      <!-- Top Right Quick Actions -->
      <div class="gmaps-top-right">
        <button id="gmaps-share-btn" class="gmaps-round-btn" type="button" title="Share 3D View Link" aria-label="Share">
          <svg viewBox="0 0 24 24" class="gmaps-svg-icon"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
        </button>
      </div>
    `;
    document.body.appendChild(topBar);

    // 2. Dropdown Card for Categories & Search Results
    const dropdownCard = document.createElement('div');
    dropdownCard.id = 'gmaps-dropdown-card';
    dropdownCard.className = 'gmaps-dropdown-card hidden';
    document.body.appendChild(dropdownCard);

    // 3. Bottom-Left Google Maps Layers Widget
    const layersWidget = document.createElement('div');
    layersWidget.id = 'gmaps-layers-widget';
    layersWidget.className = 'gmaps-layers-widget';
    layersWidget.innerHTML = `
      <div id="gmaps-layers-card" class="gmaps-layers-card" title="Change map layers &amp; styles" role="button" tabindex="0">
        <div class="gmaps-layers-thumb">
          <div class="layers-thumb-overlay"></div>
          <div class="gmaps-layers-label">
            <svg viewBox="0 0 24 24" class="layers-icon-svg"><path fill="currentColor" d="m11.99 18.54-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9.07l-9-7-9 7 1.63 1.27L12 16z"/></svg>
            <span>Layers</span>
          </div>
        </div>
      </div>

      <!-- Popover Layer Menu -->
      <div id="gmaps-layers-menu" class="gmaps-layers-menu hidden">
        <div class="layers-menu-header">
          <span>Map types</span>
          <button id="gmaps-layers-close" class="gmaps-close-btn" type="button">✕</button>
        </div>
        <div class="layers-types-row">
          <button class="layer-type-opt active" data-map-type="3d">
            <div class="layer-type-preview preview-sat"></div>
            <span>3D Satellite</span>
          </button>
          <button class="layer-type-opt" data-map-type="terrain">
            <div class="layer-type-preview preview-terrain"></div>
            <span>Terrain Relief</span>
          </button>
          <button class="layer-type-opt" data-map-type="street">
            <div class="layer-type-preview preview-street"></div>
            <span>Road &amp; River</span>
          </button>
        </div>
        <div class="layers-divider"></div>
        <div class="layers-menu-header">
          <span>Map details</span>
        </div>
        <div class="layers-toggles-list">
          <label class="layer-toggle-row">
            <input type="checkbox" id="gmaps-check-flood" checked />
            <span class="toggle-switch"></span>
            <span>Flood Inundation Corridor</span>
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" id="gmaps-check-cctv" checked />
            <span class="toggle-switch"></span>
            <span>River CCTV Gauge Cameras</span>
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" id="gmaps-check-fleet" checked />
            <span class="toggle-switch"></span>
            <span>Relief Aircraft &amp; Boats</span>
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" id="gmaps-check-weather" />
            <span class="toggle-switch"></span>
            <span>Rainfall Radar Overlay</span>
          </label>
        </div>
      </div>
    `;
    document.body.appendChild(layersWidget);

    // 4. Bottom-Right Navigation Capsule
    const navCapsule = document.createElement('div');
    navCapsule.id = 'gmaps-nav-capsule';
    navCapsule.className = 'gmaps-nav-capsule';
    navCapsule.innerHTML = `
      <!-- My Location / Reset to Pakistan button -->
      <button id="gmaps-btn-locate" class="gmaps-nav-btn" type="button" title="Center over Pakistan Indus Basin" aria-label="Center view">
        <svg viewBox="0 0 24 24" class="gmaps-svg-icon"><path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
      </button>

      <!-- Zoom In / Zoom Out Capsule -->
      <div class="gmaps-nav-group">
        <button id="gmaps-btn-zoom-in" class="gmaps-nav-btn" type="button" title="Zoom in" aria-label="Zoom in">
          <svg viewBox="0 0 24 24" class="gmaps-svg-icon"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
        <div class="gmaps-nav-divider"></div>
        <button id="gmaps-btn-zoom-out" class="gmaps-nav-btn" type="button" title="Zoom out" aria-label="Zoom out">
          <svg viewBox="0 0 24 24" class="gmaps-svg-icon"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>
        </button>
      </div>

      <!-- 3D / Tilt Toggle -->
      <button id="gmaps-btn-tilt" class="gmaps-nav-btn gmaps-nav-tilt" type="button" title="Tilt map between 3D oblique and 2D vertical" aria-label="Toggle 3D view">
        <span class="gmaps-tilt-text">3D</span>
      </button>

      <!-- Compass / North Up -->
      <button id="gmaps-btn-compass" class="gmaps-nav-btn gmaps-compass-btn" type="button" title="Reset map bearing to North" aria-label="Reset bearing">
        <div id="gmaps-compass-needle" class="gmaps-compass-needle">
          <span class="needle-north"></span>
          <span class="needle-south"></span>
        </div>
      </button>
    `;
    document.body.appendChild(navCapsule);

    // 5. Bottom Status Strip (Google Maps style traffic/status strip)
    const statusStrip = document.createElement('div');
    statusStrip.id = 'gmaps-bottom-status';
    statusStrip.className = 'gmaps-bottom-status';
    statusStrip.innerHTML = `
      <div class="gmaps-status-pill">
        <span class="status-indicator-dot"></span>
        <span class="status-title">Flood Inundation Stage:</span>
        <div class="status-legend-bar">
          <span class="legend-color legend-normal" title="Normal flow (< 100,000 cfs)"></span>
          <span class="legend-color legend-alert" title="Alert stage (100k - 250k cfs)"></span>
          <span class="legend-color legend-high" title="High flood (250k - 500k cfs)"></span>
          <span class="legend-color legend-critical" title="Very high / super flood (> 500k cfs)"></span>
        </div>
        <span class="status-metric">140,000 cfs</span>
        <button id="gmaps-status-sim-btn" class="gmaps-status-action-btn" type="button">Run Simulation</button>
      </div>
    `;
    document.body.appendChild(statusStrip);
  }

  _bindEvents() {
    // 1. Simulation triggers
    const triggerSim = () => {
      this.simulationBarUI?.toggle();
      this._closeDropdown();
    };

    document.getElementById('gmaps-pill-simulate')?.addEventListener('click', triggerSim);
    document.getElementById('gmaps-directions-btn')?.addEventListener('click', triggerSim);
    document.getElementById('gmaps-status-sim-btn')?.addEventListener('click', triggerSim);

    // 2. Category Pills (Glaciers, Dams, Hotspots)
    const pills = document.querySelectorAll('.gmaps-pill[data-category]');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const cat = pill.dataset.category;
        if (this.activeCategory === cat) {
          this._closeDropdown();
        } else {
          this._showCategoryDropdown(cat);
        }
      });
    });

    // 3. Search Bar Input
    const searchInput = document.getElementById('gmaps-search-input');
    const searchSubmit = document.getElementById('gmaps-search-submit');

    const handleSearch = () => {
      const query = (searchInput.value || '').trim();
      if (!query) return;
      this._performSearch(query);
    };

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
      else if (e.key === 'Escape') this._closeDropdown();
      else {
        // Debounce live suggestions
        clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => {
          const val = (searchInput.value || '').trim();
          if (val.length >= 2) this._performSearch(val, false);
          else if (!val) this._closeDropdown();
        }, 220);
      }
    });

    searchSubmit?.addEventListener('click', handleSearch);

    // 4. CCTV and Fleet buttons
    document.getElementById('gmaps-pill-cctv')?.addEventListener('click', () => {
      const cctvPanel = document.getElementById('cctv-panel');
      if (cctvPanel) {
        cctvPanel.classList.toggle('collapsed');
      }
      this._showToast('River CCTV Feeds toggled');
    });

    document.getElementById('gmaps-pill-fleet')?.addEventListener('click', () => {
      this._showToast('Rescue 1122 & Military aircraft tracking active');
    });

    document.getElementById('gmaps-pill-weather')?.addEventListener('click', () => {
      this._showToast('Monsoon cloud & precipitation layer updated');
    });

    // 5. Share Button
    document.getElementById('gmaps-share-btn')?.addEventListener('click', () => {
      const shareBtn = document.getElementById('share-btn');
      if (shareBtn) shareBtn.click();
      else {
        navigator.clipboard?.writeText(window.location.href);
        this._showToast('Link copied to clipboard');
      }
    });

    // 6. Navigation Controls
    const zoomAmount = () => {
      const h = this.viewer?.camera?.positionCartographic?.height || 200000;
      return Math.max(h * 0.45, 100);
    };

    document.getElementById('gmaps-btn-zoom-in')?.addEventListener('click', () => {
      this.viewer?.camera?.zoomIn(zoomAmount());
    });

    document.getElementById('gmaps-btn-zoom-out')?.addEventListener('click', () => {
      this.viewer?.camera?.zoomOut(zoomAmount());
    });

    document.getElementById('gmaps-btn-locate')?.addEventListener('click', () => {
      // Fly to central Pakistan Indus Basin overview
      this.flyToLocation({
        name: 'Pakistan (Indus River Basin)',
        lat: 30.3753,
        lon: 69.3451,
        height: 1450000,
        pitch: -88,
        heading: 0,
      });
    });

    document.getElementById('gmaps-btn-tilt')?.addEventListener('click', () => {
      const tiltBtn = document.getElementById('tilt-map-view');
      if (tiltBtn) tiltBtn.click();
      else {
        // Toggle tilt manually
        const pitch = Cesium.Math.toDegrees(this.viewer.camera.pitch);
        const nextPitch = pitch < -55 ? -35 : -89;
        this.viewer.camera.flyTo({
          destination: this.viewer.camera.position,
          orientation: {
            heading: this.viewer.camera.heading,
            pitch: Cesium.Math.toRadians(nextPitch),
            roll: 0,
          },
          duration: 1.0,
        });
      }
    });

    document.getElementById('gmaps-btn-compass')?.addEventListener('click', () => {
      const northBtn = document.getElementById('north-up-view');
      if (northBtn) northBtn.click();
      else {
        this.viewer.camera.flyTo({
          destination: this.viewer.camera.position,
          orientation: {
            heading: 0,
            pitch: this.viewer.camera.pitch,
            roll: 0,
          },
          duration: 0.8,
        });
      }
    });

    // 7. Layers Widget & Menu
    const layersCard = document.getElementById('gmaps-layers-card');
    const layersMenu = document.getElementById('gmaps-layers-menu');
    const layersClose = document.getElementById('gmaps-layers-close');

    layersCard?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.layersMenuOpen = !this.layersMenuOpen;
      layersMenu.classList.toggle('hidden', !this.layersMenuOpen);
    });

    layersClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.layersMenuOpen = false;
      layersMenu.classList.add('hidden');
    });

    // Layer type options (3D Satellite, Terrain, Street)
    const typeBtns = layersMenu?.querySelectorAll('.layer-type-opt');
    typeBtns?.forEach((btn) => {
      btn.addEventListener('click', () => {
        typeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mapType = btn.dataset.mapType;
        this._showToast(`Switched map base to ${btn.querySelector('span').textContent}`);
      });
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (
        !e.target.closest('#gmaps-dropdown-card') &&
        !e.target.closest('.gmaps-pill[data-category]') &&
        !e.target.closest('#gmaps-search-box')
      ) {
        this._closeDropdown();
      }
      if (
        !e.target.closest('#gmaps-layers-menu') &&
        !e.target.closest('#gmaps-layers-card')
      ) {
        if (this.layersMenuOpen) {
          this.layersMenuOpen = false;
          layersMenu?.classList.add('hidden');
        }
      }
    });
  }

  _showCategoryDropdown(categoryKey) {
    const data = PAKISTAN_LOCATIONS[categoryKey];
    if (!data) return;

    this.activeCategory = categoryKey;

    // Highlight active pill
    document.querySelectorAll('.gmaps-pill[data-category]').forEach((p) => {
      p.classList.toggle('active', p.dataset.category === categoryKey);
    });

    const card = document.getElementById('gmaps-dropdown-card');
    if (!card) return;

    let itemsHtml = data.items
      .map(
        (item) => `
      <div class="gmaps-dropdown-item" data-id="${item.id}" role="button" tabindex="0">
        <div class="item-icon-col">${data.icon}</div>
        <div class="item-info-col">
          <div class="item-name-row">
            <span class="item-title">${item.name}</span>
            <span class="item-badge ${item.badgeClass || ''}">${item.badge}</span>
          </div>
          <div class="item-region">${item.region}</div>
          <div class="item-desc">${item.desc}</div>
        </div>
      </div>
    `,
      )
      .join('');

    card.innerHTML = `
      <div class="gmaps-dropdown-header">
        <div class="dropdown-header-title">
          <span class="header-icon">${data.icon}</span>
          <span>${data.title} (${data.items.length})</span>
        </div>
        <button id="gmaps-dropdown-close" class="gmaps-close-btn" type="button" aria-label="Close">✕</button>
      </div>
      <div class="gmaps-dropdown-body">
        ${itemsHtml}
      </div>
    `;

    card.classList.remove('hidden');

    // Bind item clicks
    card.querySelectorAll('.gmaps-dropdown-item').forEach((elem) => {
      elem.addEventListener('click', () => {
        const id = elem.dataset.id;
        const target = data.items.find((i) => i.id === id);
        if (target) {
          this.flyToLocation(target);
          this._closeDropdown();
        }
      });
    });

    card.querySelector('#gmaps-dropdown-close')?.addEventListener('click', () => {
      this._closeDropdown();
    });
  }

  _performSearch(query, triggerDirect = true) {
    const q = query.toLowerCase();
    const allItems = [
      ...PAKISTAN_LOCATIONS.glaciers.items.map((i) => ({ ...i, category: 'Glacier' })),
      ...PAKISTAN_LOCATIONS.dams.items.map((i) => ({ ...i, category: 'Dam / Barrage' })),
      ...PAKISTAN_LOCATIONS.hotspots.items.map((i) => ({ ...i, category: 'Flood Hotspot' })),
    ];

    const matches = allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q),
    );

    if (matches.length > 0) {
      if (triggerDirect && matches.length === 1) {
        this.flyToLocation(matches[0]);
        this._closeDropdown();
        return;
      }

      const card = document.getElementById('gmaps-dropdown-card');
      if (!card) return;

      const itemsHtml = matches
        .slice(0, 7)
        .map(
          (item) => `
        <div class="gmaps-dropdown-item" data-id="${item.id}" role="button" tabindex="0">
          <div class="item-icon-col">${ICONS.pin}</div>
          <div class="item-info-col">
            <div class="item-name-row">
              <span class="item-title">${item.name}</span>
              <span class="item-badge ${item.badgeClass || ''}">${item.category}</span>
            </div>
            <div class="item-region">${item.region}</div>
          </div>
        </div>
      `,
        )
        .join('');

      card.innerHTML = `
        <div class="gmaps-dropdown-header">
          <div class="dropdown-header-title">
            <span>Search Results for "${query}" (${matches.length})</span>
          </div>
          <button id="gmaps-dropdown-close" class="gmaps-close-btn" type="button">✕</button>
        </div>
        <div class="gmaps-dropdown-body">
          ${itemsHtml}
        </div>
      `;

      card.classList.remove('hidden');

      card.querySelectorAll('.gmaps-dropdown-item').forEach((elem) => {
        elem.addEventListener('click', () => {
          const id = elem.dataset.id;
          const target = matches.find((i) => i.id === id);
          if (target) {
            this.flyToLocation(target);
            this._closeDropdown();
          }
        });
      });

      card.querySelector('#gmaps-dropdown-close')?.addEventListener('click', () => {
        this._closeDropdown();
      });
    } else if (triggerDirect) {
      // Fallback to geocoding or toast
      this.navigation?.lookupLocation?.(query);
    }
  }

  _closeDropdown() {
    this.activeCategory = null;
    document.querySelectorAll('.gmaps-pill[data-category]').forEach((p) => {
      p.classList.remove('active');
    });
    const card = document.getElementById('gmaps-dropdown-card');
    card?.classList.add('hidden');
  }

  flyToLocation(target) {
    if (!this.viewer || !target) return;

    const lat = target.lat;
    const lon = target.lon;
    const height = target.height || 3500;
    const pitch = target.pitch || -30;
    const heading = target.heading || 0;

    this.viewer.camera.cancelFlight();
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
        roll: 0,
      },
      duration: 2.2,
      complete: () => {
        this._showToast(`Arrived at ${target.name}`);
      },
    });
  }

  _syncCompass() {
    const needle = document.getElementById('gmaps-compass-needle');
    if (!needle || !this.viewer) return;

    this.viewer.scene.preRender.addEventListener(() => {
      const heading = this.viewer.camera.heading;
      const deg = Cesium.Math.toDegrees(heading);
      needle.style.transform = `rotate(${-deg}deg)`;
    });
  }

  _showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }
}
