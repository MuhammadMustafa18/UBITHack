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
import { PakistanLayersManager } from '../layers/pakistanLayers.js';
import { PredictiveHeatmaps } from '../simulation/predictiveHeatmaps.js';
import { CountryThreatPolygons } from '../simulation/countryThreatPolygons.js';
import { CorridorResponsePanel } from '../simulation/responsePanel.js';
import {
  LivePredictionEngine,
  RISK_MODULES,
  PREDICTION_GRID_CELLS,
} from '../simulation/livePredictionEngine.js';
import {
  DemographicHeatmapEngine,
  HEATMAP_MODES,
} from '../simulation/demographicHeatmapEngine.js';
import {
  FLOOD_SCENARIOS,
  FLOOD_MAGNITUDES,
  TIME_SCALES,
  ELIGIBLE_ORIGINATION_POINTS,
} from '../simulation/flowData.js';
import { ResourceDefenseGame } from '../simulation/resourceDefenseGame.js';
import { RescueDashboardUI } from './rescueDashboard.js';

export const ICONS = {
  simulate: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/></svg>`,
  glacier: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="m14 6-3.75 5 2.85 3.8-1.6 1.2L7 10l-6 8h22L14 6z"/></svg>`,
  dam: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M21 12c-1.19 0-2.27-.47-3.07-1.23-.74.77-1.8 1.23-2.93 1.23-1.14 0-2.19-.47-2.93-1.23-.75.76-1.81 1.23-3.07 1.23s-2.32-.47-3.07-1.23C5.19 11.53 4.14 12 3 12c-.55 0-1-.45-1-1s.45-1 1-1c.6 0 1.15-.24 1.55-.63C5.35 8.57 6.4 8 7.6 8s2.25.57 3.05 1.37c.4-.39.95-.63 1.55-.63s1.15.24 1.55.63C14.55 8.57 15.6 8 16.8 8s2.25.57 3.05 1.37c.4-.39.95-.63 1.55-.63.55 0 1 .45 1 1s-.45 1-1.4 1.26zm0 5c-1.19 0-2.27-.47-3.07-1.23-.74.77-1.8 1.23-2.93 1.23-1.14 0-2.19-.47-2.93-1.23-.75.76-1.81 1.23-3.07 1.23s-2.32-.47-3.07-1.23C5.19 16.53 4.14 17 3 17c-.55 0-1-.45-1-1s.45-1 1-1c.6 0 1.15-.24 1.55-.63C5.35 13.57 6.4 13 7.6 13s2.25.57 3.05 1.37c.4-.39.95-.63 1.55-.63s1.15.24 1.55.63C14.55 13.57 15.6 13 16.8 13s2.25.57 3.05 1.37c.4-.39.95-.63 1.55-.63.55 0 1 .45 1 1s-.45 1-1.4 1.26z"/></svg>`,
  cctv: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>`,
  hotspot: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  fleet: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  weather: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/></svg>`,
  cyclone: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" class="gmaps-item-svg"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  plane: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  prediction: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>`,
  heatmap: `<svg viewBox="0 0 24 24" class="gmaps-pill-svg"><path fill="currentColor" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`,
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
  constructor({
    viewer,
    navigation,
    simulationBarUI,
    floodEngine,
    styleManager,
    catalog,
  }) {
    this.viewer = viewer;
    this.navigation = navigation;
    this.simulationBarUI = simulationBarUI;
    this.floodEngine = floodEngine;
    this.styleManager = styleManager;
    this.catalog = catalog || null;
    this.flightsLayer = catalog?.get?.('flights') || null;
    this.activeCategory = null;
    this.layersMenuOpen = false;

    // Simulation dialog state
    this.selectedScenarioKey = this.floodEngine?.scenarioKey || 'dam_breach';
    this.selectedMagnitudeKey = this.floodEngine?.magnitudeKey || 'high';
    this.selectedTimeScale = this.floodEngine?.timeScale || 'hourly';
    this.resourceManagementEnabled = false;

    // 3D Pakistan Map Labels, Population & Resource Overlays
    this.pakistanLayers = new PakistanLayersManager(this.viewer);

    // Predictive affected-area polygon heatmaps ahead of flood wave
    this.predictiveHeatmaps = new PredictiveHeatmaps(
      this.viewer,
      this.floodEngine,
    );

    // Country Threat Polygons dividing the entire country during flood simulation
    this.countryThreatPolygons = new CountryThreatPolygons(
      this.viewer,
      this.floodEngine,
    );

    this.responsePanel = new CorridorResponsePanel(
      this.viewer,
      this.floodEngine,
    );

    // Live AI Risk Prediction Pipeline Engine (Earth Observation & 6 Risk Modules)
    this.livePredictionEngine = new LivePredictionEngine(this.viewer);

    // Dynamic Demographic & Risk Heatmap Engine (Population, Age, Resources, Risk)
    this.demographicHeatmapEngine = new DemographicHeatmapEngine(this.viewer);

    // Interactive Resource Defense Simulation Game Engine (Uber-like vehicle routes & safeguard currency)
    this.resourceDefenseGame = new ResourceDefenseGame(this.viewer, this.floodEngine);
    this.simulationBarUI?.setResourceDefenseGame(this.resourceDefenseGame);

    // Dedicated /rescue Route Dashboard (Live distress stream & LLM triage)
    this.rescueDashboard = new RescueDashboardUI({
      onReturnToGlobe: () => this._showGlobeView(),
      onLocateOnGlobe: (sos) => this._locateSosOnGlobe(sos),
    });

    // Origin Picker State
    this.selectedOriginPoint = null;
    this._originPickerActive = false;
    this._originPickerHandler = null;
    this._originPickerEntities = [];

    this._init();
  }

  _init() {
    this._injectStyles();
    this._purgeAirplaneMode();
    this._renderDOM();
    this._bindEvents();
    this._syncCompass();
    this._initRouting();
  }

  _purgeAirplaneMode() {
    try {
      if (this.viewer) {
        this.viewer.trackedEntity = undefined;
      }
      this.flightsLayer?.disable?.(this.viewer);
      this.catalog?.get?.('military')?.disable?.(this.viewer);

      const dataManager = this.styleManager?.dataManager;
      if (dataManager) {
        dataManager
          .setEnabled?.('flights', false, { origin: 'user' })
          ?.catch?.(() => {});
        dataManager
          .setEnabled?.('military', false, { origin: 'user' })
          ?.catch?.(() => {});
      }

      const stored = localStorage.getItem('gev:layer-state:v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.enabledLayerIds)) {
          parsed.enabledLayerIds = parsed.enabledLayerIds.filter(
            (id) => id !== 'flights' && id !== 'military',
          );
        }
        if (parsed.options?.flights) {
          parsed.options.flights.selectedFlightsTrackingId = null;
          parsed.options.flights.selectedMilitaryTrackingId = null;
        }
        localStorage.setItem('gev:layer-state:v2', JSON.stringify(parsed));
      }
      document.body.classList.remove('plane-mode-active');
    } catch (e) {
      console.warn('[GoogleMapsUI] purge airplane mode:', e);
    }
  }

  _injectStyles() {
    // google-maps-theme.css will be loaded via style.css
  }

  _renderDOM() {
    // 0. Emergency Exit Airplane Mode Floating Pill (always visible whenever plane is tracked)
    const emergencyBtn = document.createElement('button');
    emergencyBtn.id = 'gmaps-emergency-plane-exit';
    emergencyBtn.className = 'gmaps-emergency-plane-exit hidden';
    emergencyBtn.type = 'button';
    emergencyBtn.title =
      'Click or press Escape to cancel airplane tracking and exit';
    emergencyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      <span>EXIT AIRPLANE MODE ✕</span>
    `;
    document.body.appendChild(emergencyBtn);
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
        <button id="gmaps-pill-rescue" class="gmaps-pill gmaps-pill-rescue" type="button" title="Live Citizen Distress Signals &amp; LLM Urgency Triage (/rescue)">
          <span class="gmaps-pill-icon"><svg viewBox="0 0 24 24" class="gmaps-pill-svg" style="color:#ef4444;"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></span>
          <span>Rescue Triage (/rescue)</span>
        </button>
        <button id="gmaps-pill-prediction" class="gmaps-pill gmaps-pill-prediction" type="button" title="Live AI Risk Prediction &amp; Earth Observation Pipeline">
          <span class="gmaps-pill-icon">${ICONS.prediction}</span>
          <span>Live Prediction</span>
        </button>
        <button id="gmaps-pill-heatmap" class="gmaps-pill gmaps-pill-heatmap" type="button" title="Demographic &amp; Disaster Risk Heatmaps (Population, Age, Resources, Risk)">
          <span class="gmaps-pill-icon">${ICONS.heatmap}</span>
          <span>Heatmaps</span>
        </button>
        <button class="gmaps-pill" data-category="glaciers" type="button" title="Karakoram Glaciers &amp; GLOF Lakes">
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
        <button id="gmaps-pill-response" class="gmaps-pill" type="button" title="Staging, alert drafts and 2022 check (Swat–Kabul exercise)">
          <span class="gmaps-pill-icon">${ICONS.hotspot}</span>
          <span>Response</span>
        </button>
        <button id="gmaps-pill-weather" class="gmaps-pill" type="button" title="Live Precipitation &amp; Weather Radar">
          <span class="gmaps-pill-icon">${ICONS.weather}</span>
          <span>Weather &amp; Radar</span>
        </button>
        <button id="gmaps-pill-planes" class="gmaps-pill gmaps-pill-planes" type="button" title="Toggle Live Air Traffic / Commercial Flights">
          <span class="gmaps-pill-icon">${ICONS.plane}</span>
          <span id="gmaps-pill-planes-label">Plane Mode</span>
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
            <input type="checkbox" id="gmaps-check-predictive" checked />
            <span class="toggle-switch"></span>
            <span>Predictive Impact Polygons</span>
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" id="gmaps-check-country-threat" checked />
            <span class="toggle-switch"></span>
            <span>Country Threat Polygons</span>
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" id="gmaps-check-pop" />
            <span class="toggle-switch"></span>
            <span>Population Density Heatmap</span>
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" id="gmaps-check-resources" />
            <span class="toggle-switch"></span>
            <span>Relief &amp; Fleet Resources</span>
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" id="gmaps-check-labels" checked />
            <span class="toggle-switch"></span>
            <span>3D Map Labels &amp; Barrages</span>
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" id="gmaps-check-cctv" checked />
            <span class="toggle-switch"></span>
            <span>River CCTV Gauge Cameras</span>
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" id="gmaps-check-weather" />
            <span class="toggle-switch"></span>
            <span>Rainfall Radar Overlay</span>
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" id="gmaps-check-plane" />
            <span class="toggle-switch"></span>
            <span>Live Flights (Plane Mode)</span>
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

    // 6. Live AI Risk Prediction Console (Earth Observation & 6 Risk Modules)
    this._renderPredictionPanelDOM();

    // 7. Demographic & Risk Heatmap Floating Capsule (Population, Age, Resources, Risk)
    this._renderHeatmapCapsuleDOM();

    // 8. Bilingual Advisory Executive Modal (NDMA Field Briefing)
    this._renderBilingualModalDOM();
  }

  _renderPredictionPanelDOM() {
    const predPanel = document.createElement('div');
    predPanel.id = 'gmaps-prediction-panel';
    predPanel.className = 'gmaps-prediction-panel hidden';

    const cellOptions = PREDICTION_GRID_CELLS.map(
      (c) => `<option value="${c.id}">${c.name} (${c.compositeGrade})</option>`
    ).join('');

    const modulesHtml = Object.values(RISK_MODULES).map((mod) => `
      <div class="pred-module-chip active" data-module-id="${mod.id}" title="${mod.subtitle}">
        <span class="mod-icon">${mod.iconSvg}</span>
        <div class="mod-text">
          <span class="mod-title">${mod.title}</span>
          <span class="mod-tag">${mod.tag}</span>
        </div>
        <span class="mod-toggle-dot"></span>
      </div>
    `).join('');

    predPanel.innerHTML = `
      <div class="pred-header">
        <div class="pred-title-group">
          <div class="pred-tag">LIVE EARTH OBSERVATION &amp; GEE PIPELINE</div>
          <h3 class="pred-title">AI Risk Prediction Engine</h3>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="pred-min-btn" class="hud-minimize-toggle-btn" type="button" title="Minimize / Expand Panel">—</button>
          <button id="pred-close-btn" class="pred-icon-close" type="button" title="Close Prediction Panel">✕</button>
        </div>
      </div>

      <!-- 4-Step Pipeline -->
      <div class="pred-pipeline-box">
        <div class="pred-section-label">HOW IT WORKS: 4-STEP AI DATA PIPELINE</div>
        <div class="pred-stepper">
          <div class="pred-step">
            <div class="step-num">01</div>
            <div class="step-content">
              <div class="step-name">Data In (Earth Observation)</div>
              <div class="step-detail">Ingests Sentinel-1 SAR, drone feeds, ERA5 reanalysis &amp; ground telemetry</div>
            </div>
          </div>
          <div class="pred-step">
            <div class="step-num">02</div>
            <div class="step-content">
              <div class="step-name">AI Engine (Processing &amp; Modelling)</div>
              <div class="step-detail">Google Earth Engine pipelines &amp; ML inundation classification</div>
            </div>
          </div>
          <div class="pred-step">
            <div class="step-num">03</div>
            <div class="step-content">
              <div class="step-name">Intelligence (Grid-Level Risk)</div>
              <div class="step-detail">Granular 30m grid resolution risk profiles (not national averages)</div>
            </div>
          </div>
          <div class="pred-step">
            <div class="step-num">04</div>
            <div class="step-content">
              <div class="step-name">Decisions (Action on Ground)</div>
              <div class="step-detail">Risk maps, dashboards &amp; bilingual advisories for budget &amp; field briefings</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Risk Modules Grid -->
      <div class="pred-section-label">KEY FEATURES &amp; MODULES (CLICK TO TOGGLE 3D MAP LAYERS)</div>
      <div class="pred-modules-grid">
        ${modulesHtml}
      </div>

      <!-- 30m Granular Grid Inspection -->
      <div class="pred-section-label">GRANULAR OBSERVATION GRID (SELECT REGIONAL CELL)</div>
      <div class="pred-cell-selector-row">
        <select id="pred-cell-select" class="pred-select">
          ${cellOptions}
        </select>
      </div>

      <div id="pred-cell-details" class="pred-cell-card">
        <!-- Rendered dynamically -->
      </div>

      <!-- Footer Action Row -->
      <div class="pred-actions-row">
        <button id="pred-advisory-btn" class="pred-btn-primary" type="button" title="View executive bilingual advisory in English and Urdu">
          <span>Bilingual Advisory (EN / اردو)</span>
        </button>
        <button id="pred-refresh-btn" class="pred-btn-secondary" type="button" title="Re-ingest Sentinel SAR and ERA5 reanalysis">
          <span>↻ Refresh Satellite Feeds</span>
        </button>
      </div>
    `;

    document.body.appendChild(predPanel);
  }

  _renderHeatmapCapsuleDOM() {
    const capsule = document.createElement('div');
    capsule.id = 'gmaps-heatmap-capsule';
    capsule.className = 'gmaps-heatmap-capsule hidden';

    capsule.innerHTML = `
      <div class="heatmap-header">
        <div class="heatmap-title-group">
          <span class="heatmap-badge">THEMATIC HEATMAPS</span>
          <span class="heatmap-title">Pakistan Demographics &amp; Hazard Overlay</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="heatmap-min-btn" class="hud-minimize-toggle-btn" type="button" title="Minimize / Expand Capsule">—</button>
          <button id="heatmap-close-btn" class="heatmap-close-btn" type="button" title="Close Heatmaps">✕</button>
        </div>
      </div>

      <div class="heatmap-toggles-row">
        <button class="heatmap-toggle-btn active" data-mode="population" type="button" title="Population density &amp; headcount across 19 regions (Digital Census 2023)">
          <span class="icon">${HEATMAP_MODES.population.iconSvg}</span>
          <span>Population</span>
        </button>
        <button class="heatmap-toggle-btn" data-mode="age" type="button" title="Vulnerable dependents: Children under 5 and elderly over 65">
          <span class="icon">${HEATMAP_MODES.age.iconSvg}</span>
          <span>Age</span>
        </button>
        <button class="heatmap-toggle-btn" data-mode="resources" type="button" title="Critical relief inventory: Rescue boats, shelter camps, medical &amp; air assets">
          <span class="icon">${HEATMAP_MODES.resources.iconSvg}</span>
          <span>Resources</span>
        </button>
        <button class="heatmap-toggle-btn" data-mode="risk" type="button" title="Composite multi-hazard risk index combining exposure &amp; levee history">
          <span class="icon">${HEATMAP_MODES.risk.iconSvg}</span>
          <span>Risk</span>
        </button>
      </div>

      <div class="heatmap-legend" id="heatmap-legend">
        <div class="legend-scale-bar population-ramp"></div>
        <div class="legend-labels">
          <span id="heatmap-legend-min">1.8M (Sparse GB)</span>
          <span id="heatmap-legend-active">Mode: Population Density</span>
          <span id="heatmap-legend-max">21.5M (High Density)</span>
        </div>
      </div>
    `;

    document.body.appendChild(capsule);
  }

  _renderBilingualModalDOM() {
    const modal = document.createElement('div');
    modal.id = 'gmaps-bilingual-modal';
    modal.className = 'gmaps-bilingual-modal hidden';

    modal.innerHTML = `
      <div class="bilingual-modal-backdrop"></div>
      <div class="bilingual-modal-card">
        <div class="bilingual-header">
          <div class="bilingual-title-group">
            <span class="bilingual-badge">NDMA / PDMA EMERGENCY INTELLIGENCE ADVISORY</span>
            <h2 class="bilingual-headline" id="bilingual-headline">Field Briefing: Sukkur Barrage Bottleneck Corridor</h2>
          </div>
          <button id="bilingual-close-btn" class="bilingual-close-btn" type="button">✕</button>
        </div>

        <div class="bilingual-body">
          <div class="bilingual-column english-col">
            <div class="lang-tag">ENGLISH BRIEFING (CABINET &amp; BUDGET BRIEFING)</div>
            <h4 class="advisory-sub" id="advisory-en-sub">Priority Hazard Assessment</h4>
            <p class="advisory-text" id="advisory-en-text"></p>
            
            <div class="advisory-metrics-box">
              <div class="advisory-metric">
                <span class="k">Model Confidence:</span>
                <span class="v">94.2% (Random Forest Classifier)</span>
              </div>
              <div class="advisory-metric">
                <span class="k">Data Feeds:</span>
                <span class="v">Sentinel-1 SAR C-Band + ERA5 Atmospheric</span>
              </div>
              <div class="advisory-metric">
                <span class="k">Recommended Action:</span>
                <span class="v" id="advisory-en-action">Emergency Evacuation &amp; Levee Reinforcement</span>
              </div>
            </div>
          </div>

          <div class="bilingual-column urdu-col" dir="rtl">
            <div class="lang-tag">قومی ایمرجنسی ہدایت نامہ (فیلڈ بریفنگ)</div>
            <h4 class="advisory-sub" id="advisory-ur-sub">سیلابی خطرے کی فوری وارننگ</h4>
            <p class="advisory-text" id="advisory-ur-text"></p>

            <div class="advisory-metrics-box">
              <div class="advisory-metric">
                <span class="k">ماڈل کا یقین:</span>
                <span class="v">94.2 فیصد (مشین لرننگ ماڈل)</span>
              </div>
              <div class="advisory-metric">
                <span class="k">ڈیٹا ذرائع:</span>
                <span class="v">سینٹینل 1 ریڈار اور موسمیاتی ڈیٹا</span>
              </div>
              <div class="advisory-metric">
                <span class="k">تجویز کردہ اقدام:</span>
                <span class="v" id="advisory-ur-action">کچے کے علاقوں سے فوری انخلاء اور ریلیف کیمپوں کا قیام</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bilingual-footer">
          <button id="bilingual-copy-btn" class="bilingual-btn-secondary" type="button">Copy Advisory Text</button>
          <button id="bilingual-dismiss-btn" class="bilingual-btn-primary" type="button">Acknowledge &amp; Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  toggleLivePrediction(enabled) {
    const isNowActive = enabled !== undefined ? enabled : !this.livePredictionEngine?.active;
    const pill = document.getElementById('gmaps-pill-prediction');
    const panel = document.getElementById('gmaps-prediction-panel');

    if (isNowActive) {
      this.livePredictionEngine?.enable();
      pill?.classList.add('active');
      panel?.classList.remove('hidden');
      this._updatePredictionCellDisplay(this.livePredictionEngine?.selectedCell);
      this._showToast('Live AI Risk Prediction active — 30m Earth observation grid enabled');
    } else {
      this.livePredictionEngine?.disable();
      pill?.classList.remove('active');
      panel?.classList.add('hidden');
      this._showToast('Live Prediction closed');
    }
  }

  toggleHeatmaps(enabled, mode = 'population') {
    const isNowActive = enabled !== undefined ? enabled : !this.demographicHeatmapEngine?.active;
    const pill = document.getElementById('gmaps-pill-heatmap');
    const capsule = document.getElementById('gmaps-heatmap-capsule');

    if (isNowActive) {
      this.demographicHeatmapEngine?.enable(mode);
      pill?.classList.add('active');
      capsule?.classList.remove('hidden');
      this._updateHeatmapLegend(mode);
      this._showToast(`Heatmap active: ${HEATMAP_MODES[mode]?.name}`);
    } else {
      this.demographicHeatmapEngine?.disable();
      pill?.classList.remove('active');
      capsule?.classList.add('hidden');
      this._showToast('Heatmap closed');
    }
  }

  _updateHeatmapLegend(mode) {
    const minEl = document.getElementById('heatmap-legend-min');
    const activeEl = document.getElementById('heatmap-legend-active');
    const maxEl = document.getElementById('heatmap-legend-max');
    const rampEl = document.querySelector('.legend-scale-bar');

    if (mode === 'population') {
      if (minEl) minEl.textContent = '1.8M (Sparse GB)';
      if (activeEl) activeEl.textContent = 'Metric: Population Density';
      if (maxEl) maxEl.textContent = '21.5M (Central Punjab)';
      if (rampEl) rampEl.className = 'legend-scale-bar population-ramp';
    } else if (mode === 'age') {
      if (minEl) minEl.textContent = '38.0% Dependent';
      if (activeEl) activeEl.textContent = 'Metric: Children <5 & Elderly >65';
      if (maxEl) maxEl.textContent = '46.2% Critical Dependent';
      if (rampEl) rampEl.className = 'legend-scale-bar age-ramp';
    } else if (mode === 'resources') {
      if (minEl) minEl.textContent = 'Local Sector Unit';
      if (activeEl) activeEl.textContent = 'Metric: Relief Logistics Staging Hubs';
      if (maxEl) maxEl.textContent = 'Major Regional Command Hub';
      if (rampEl) rampEl.className = 'legend-scale-bar resources-ramp';
    } else {
      if (minEl) minEl.textContent = 'Low Hazard (0-60)';
      if (activeEl) activeEl.textContent = 'Metric: Composite Climate Risk Index';
      if (maxEl) maxEl.textContent = 'Critical Inundation (90-100)';
      if (rampEl) rampEl.className = 'legend-scale-bar risk-ramp';
    }
  }

  _updatePredictionCellDisplay(cell) {
    const details = document.getElementById('pred-cell-details');
    if (!details || !cell) return;

    details.innerHTML = `
      <div class="cell-stat-header">
        <span class="cell-name">${cell.name}</span>
        <span class="cell-grade ${cell.compositeScore >= 90 ? 'critical' : 'high'}">${cell.compositeScore}/100 [${cell.compositeGrade}]</span>
      </div>
      <div class="cell-stats-grid">
        <div class="cell-stat-item">
          <span class="k">Flood Exposure (SAR):</span>
          <span class="v">${cell.floodExposure} (${cell.sarBackscatterDb} dB)</span>
        </div>
        <div class="cell-stat-item">
          <span class="k">Heat Anomaly (LST):</span>
          <span class="v">${cell.lstAnomalyC}</span>
        </div>
        <div class="cell-stat-item">
          <span class="k">Terrain &amp; Drainage:</span>
          <span class="v">${cell.slopeDrainage}</span>
        </div>
        <div class="cell-stat-item">
          <span class="k">Air Quality (AQI):</span>
          <span class="v">${cell.airQuality}</span>
        </div>
        <div class="cell-stat-item full">
          <span class="k">Vegetation Health (NDVI):</span>
          <span class="v">${cell.ndviTrend}</span>
        </div>
      </div>
      <div class="cell-advisory-snippet">
        <strong>Instant Field Advisory:</strong> ${cell.advisoryEn}
      </div>
    `;
  }

  _openBilingualAdvisory(cell = this.livePredictionEngine?.selectedCell || PREDICTION_GRID_CELLS[0]) {
    const modal = document.getElementById('gmaps-bilingual-modal');
    if (!modal) return;

    const headline = document.getElementById('bilingual-headline');
    const enText = document.getElementById('advisory-en-text');
    const urText = document.getElementById('advisory-ur-text');

    if (headline) headline.textContent = `Field Briefing: ${cell.name}`;
    if (enText) enText.textContent = cell.advisoryEn;
    if (urText) urText.textContent = cell.advisoryUr;

    modal.classList.remove('hidden');
  }

  _bindEvents() {
    // 1. Simulation triggers
    document
      .getElementById('gmaps-pill-simulate')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.activeCategory === 'simulate') {
          this._closeDropdown();
        } else {
          this._showSimulationScenarioCard();
        }
      });

    document
      .getElementById('gmaps-directions-btn')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.activeCategory === 'simulate') {
          this._closeDropdown();
        } else {
          this._showSimulationScenarioCard();
        }
      });

    document
      .getElementById('gmaps-status-sim-btn')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.activeCategory === 'simulate') {
          this._closeDropdown();
        } else {
          this._showSimulationScenarioCard();
        }
      });

    // 1b. Rescue Triage Trigger
    document.getElementById('gmaps-pill-rescue')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._showRescueDashboard(true);
    });

    // 1c. Live Prediction Trigger & Minimize
    document.getElementById('gmaps-pill-prediction')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleLivePrediction();
    });

    document.getElementById('pred-min-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = document.getElementById('gmaps-prediction-panel');
      const isMin = p?.classList.toggle('pred-minimized');
      e.currentTarget.textContent = isMin ? '+' : '—';
    });

    document.getElementById('pred-close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleLivePrediction(false);
    });

    // 1d. Heatmaps Trigger & Minimize
    document.getElementById('gmaps-pill-heatmap')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleHeatmaps();
    });

    document.getElementById('heatmap-min-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const cap = document.getElementById('gmaps-heatmap-capsule');
      const isMin = cap?.classList.toggle('heatmap-minimized');
      e.currentTarget.textContent = isMin ? '+' : '—';
    });

    document.getElementById('heatmap-close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleHeatmaps(false);
    });

    // Heatmap Mode Buttons
    document.querySelectorAll('.heatmap-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = btn.getAttribute('data-mode');
        document.querySelectorAll('.heatmap-toggle-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.demographicHeatmapEngine?.setMode(mode);
        this._updateHeatmapLegend(mode);
      });
    });

    // Prediction Module Chips Toggle
    document.querySelectorAll('.pred-module-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const modId = chip.getAttribute('data-module-id');
        const isNowActive = !chip.classList.contains('active');
        chip.classList.toggle('active', isNowActive);
        this.livePredictionEngine?.setModuleActive(modId, isNowActive);
        this._showToast(`${isNowActive ? 'Active' : 'Muted'}: ${modId.toUpperCase()} Intelligence Layer`);
      });
    });

    // Prediction Observation Cell Select
    document.getElementById('pred-cell-select')?.addEventListener('change', (e) => {
      const cellId = e.target.value;
      this.livePredictionEngine?.setSelectedCell(cellId);
      this._updatePredictionCellDisplay(this.livePredictionEngine?.selectedCell);
    });

    // Bilingual Advisory Open & Dismiss
    document.getElementById('pred-advisory-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._openBilingualAdvisory();
    });

    document.getElementById('bilingual-close-btn')?.addEventListener('click', () => {
      document.getElementById('gmaps-bilingual-modal')?.classList.add('hidden');
    });

    document.getElementById('bilingual-dismiss-btn')?.addEventListener('click', () => {
      document.getElementById('gmaps-bilingual-modal')?.classList.add('hidden');
    });

    document.querySelector('.bilingual-modal-backdrop')?.addEventListener('click', () => {
      document.getElementById('gmaps-bilingual-modal')?.classList.add('hidden');
    });

    document.getElementById('bilingual-copy-btn')?.addEventListener('click', () => {
      const en = document.getElementById('advisory-en-text')?.textContent || '';
      const ur = document.getElementById('advisory-ur-text')?.textContent || '';
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(`--- NDMA DISASTER ADVISORY ---\n${en}\n\n--- قومی ڈیزاسٹر مینجمنٹ اتھارٹی ہدایت نامہ ---\n${ur}`);
      }
      this._showToast('Advisory briefing copied to clipboard');
    });

    // Refresh satellite feeds simulated button
    document.getElementById('pred-refresh-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      btn.classList.add('loading');
      btn.textContent = '↻ Ingesting Sentinel-1 SAR & ERA5...';
      setTimeout(() => {
        btn.classList.remove('loading');
        btn.textContent = '↻ Refresh Satellite Feeds';
        this._showToast('Satellite feeds updated: Sentinel-1 SAR pass + GEE reanalysis complete');
      }, 1200);
    });

    // 2. Category Pills (Glaciers, Dams, Hotspots)
    const pills = document.querySelectorAll('.gmaps-pill[data-category]');
    pills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
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
    document
      .getElementById('gmaps-pill-cctv')
      ?.addEventListener('click', () => {
        const cctvPanel = document.getElementById('cctv-panel');
        if (cctvPanel) {
          cctvPanel.classList.toggle('collapsed');
        }
        this._showToast('River CCTV Feeds toggled');
      });

    document
      .getElementById('gmaps-pill-fleet')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        const checkResources = document.getElementById('gmaps-check-resources');
        const newState = checkResources
          ? !checkResources.checked
          : !this.pakistanLayers.resourcesVisible;
        if (checkResources) checkResources.checked = newState;
        this.pakistanLayers.setResourcesVisible(newState);
        this._showToast(
          newState
            ? 'Relief fleet & military bases overlay: ACTIVE'
            : 'Relief fleet overlay hidden',
        );
      });

    document
      .getElementById('gmaps-pill-response')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.responsePanel.toggle();
      });

    document
      .getElementById('gmaps-pill-weather')
      ?.addEventListener('click', () => {
        this._showToast('Monsoon cloud & precipitation layer updated');
      });

    // 5. Share Button
    document
      .getElementById('gmaps-share-btn')
      ?.addEventListener('click', () => {
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

    document
      .getElementById('gmaps-btn-zoom-in')
      ?.addEventListener('click', () => {
        this.viewer?.camera?.zoomIn(zoomAmount());
      });

    document
      .getElementById('gmaps-btn-zoom-out')
      ?.addEventListener('click', () => {
        this.viewer?.camera?.zoomOut(zoomAmount());
      });

    document
      .getElementById('gmaps-btn-locate')
      ?.addEventListener('click', () => {
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

    document
      .getElementById('gmaps-btn-compass')
      ?.addEventListener('click', () => {
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
      // Keep the plane-mode checkbox in sync with the live flights-layer state
      if (this.layersMenuOpen) {
        const dataManager = this.styleManager?.dataManager;
        const planeCheck = document.getElementById('gmaps-check-plane');
        if (planeCheck && dataManager) {
          const entry = dataManager.layers?.get?.('flights');
          planeCheck.checked = Boolean(entry?.enabled);
          document.body.classList.toggle(
            'plane-mode-active',
            Boolean(entry?.enabled),
          );
        }
      }
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
        this._showToast(
          `Switched map base to ${btn.querySelector('span').textContent}`,
        );
      });
    });

    // Layer details checkboxes
    document.getElementById('gmaps-check-predictive')?.addEventListener('change', (e) => {
      this.predictiveHeatmaps?.setVisible(e.target.checked);
    });
    document.getElementById('gmaps-check-country-threat')?.addEventListener('change', (e) => {
      if (e.target.checked) this.countryThreatPolygons?.enable();
      else this.countryThreatPolygons?.disable();
    });
    document.getElementById('gmaps-check-pop')?.addEventListener('change', (e) => {
      this.pakistanLayers?.setPopulationVisible(e.target.checked);
    });
    document.getElementById('gmaps-check-resources')?.addEventListener('change', (e) => {
      this.pakistanLayers?.setResourcesVisible(e.target.checked);
    });
    document.getElementById('gmaps-check-labels')?.addEventListener('change', (e) => {
      this.pakistanLayers?.setLabelsVisible(e.target.checked);
    });
    document.getElementById('gmaps-check-plane')?.addEventListener('change', (e) => {
      this.setFlightsLayerEnabled(e.target.checked);
    });
    document.getElementById('gmaps-pill-planes')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentActive = document.body.classList.contains('plane-mode-active');
      this.setFlightsLayerEnabled(!currentActive);
    });
    document.getElementById('gmaps-plane-banner-exit')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.exitAirplaneMode();
    });

    document
      .getElementById('gmaps-emergency-plane-exit')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.exitAirplaneMode();
      });

    // Listen for trackedEntity changes (e.g. if an airplane was clicked)
    if (this.viewer) {
      this.viewer.trackedEntityChanged.addEventListener(() => {
        const hasTracked = Boolean(this.viewer.trackedEntity);
        const emergencyBtn = document.getElementById(
          'gmaps-emergency-plane-exit',
        );
        if (emergencyBtn) {
          emergencyBtn.classList.toggle('hidden', !hasTracked);
        }
      });
      // Initial check in case viewer woke up with tracked entity
      if (this.viewer.trackedEntity) {
        document
          .getElementById('gmaps-emergency-plane-exit')
          ?.classList.remove('hidden');
      }
    }

    // Press Escape to immediately exit Airplane Mode, close panels, and unlock camera
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const bilingualModal = document.getElementById('gmaps-bilingual-modal');
        if (bilingualModal && !bilingualModal.classList.contains('hidden')) {
          bilingualModal.classList.add('hidden');
          return;
        }
        if (this.livePredictionEngine?.active) {
          this.toggleLivePrediction(false);
        }
        if (this.demographicHeatmapEngine?.active) {
          this.toggleHeatmaps(false);
        }
        if (this.viewer?.trackedEntity || document.body.classList.contains('plane-mode-active')) {
          this.exitAirplaneMode();
        }
      }
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (
        !e.target.closest('#gmaps-dropdown-card') &&
        !e.target.closest('.gmaps-pill') &&
        !e.target.closest('#gmaps-search-box') &&
        !e.target.closest('#gmaps-status-sim-btn')
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

  _showSimulationScenarioCard() {
    this.activeCategory = 'simulate';
    document
      .querySelectorAll('.gmaps-pill')
      .forEach((p) => p.classList.remove('active'));
    document.getElementById('gmaps-pill-simulate')?.classList.add('active');

    const card = document.getElementById('gmaps-dropdown-card');
    if (!card) return;

    card.classList.add('sim-dialog-mode');
    card.classList.remove('hidden');

    this._renderForecastDialog(card);
  }

  _renderForecastDialog(card) {
    const sc =
      FLOOD_SCENARIOS[this.selectedScenarioKey] || FLOOD_SCENARIOS.glacier;
    const mag =
      FLOOD_MAGNITUDES[this.selectedMagnitudeKey] || FLOOD_MAGNITUDES.high;
    const firstWp = sc.waypoints?.[0] || {};
    const mult = mag.multiplier || 1.0;
    const estDischarge = Math.round((firstWp.dischargeCusecs || 350000) * mult);
    const estStageRise = (
      Number(firstWp.stageRiseM || 6.0) * Math.sqrt(mult)
    ).toFixed(1);
    const real = sc.dataBasis === 'real';
    const dischargeText = real
      ? 'No gauge data'
      : `${estDischarge.toLocaleString()} Cusecs`;
    const stageText = real ? 'No gauge data' : `+${estStageRise} m`;
    const originRegion = sc.origin?.region || sc.region;
    const stageStatus = firstWp.status || 'FORECAST STAGE';
    const crestLoc = firstWp.name || sc.origin?.name || 'Head Basin Entry';

    const scenariosList = [
      {
        key: 'glacier',
        title: 'Glacier GLOF',
        desc: 'Hunza / Passu Moraine Ice Dam Breach',
        badge: 'High Altitude',
        icon: ICONS.glacier,
        cls: 'badge-danger',
      },
      {
        key: 'dam_breach',
        title: 'Indian Dam Release',
        desc: 'Baglihar / Salal Transboundary Surge',
        badge: 'Border Release',
        icon: ICONS.dam,
        cls: 'badge-warning',
      },
      {
        key: 'rain',
        title: 'Hill Torrents &amp; Rain',
        desc: 'Koh-e-Suleman Rod-Kohi Flash Flood',
        badge: 'Flash Torrents',
        icon: ICONS.weather,
        cls: 'badge-primary',
      },
      {
        key: 'riverine',
        title: 'Swat–Kabul Riverine',
        desc: 'Kalam trigger down the real river network',
        badge: 'Real Data',
        icon: ICONS.dam,
        cls: 'badge-primary',
      },
      {
        key: 'cyclone',
        title: 'Arabian Sea Cyclone',
        desc: 'Thatta &amp; Karachi Delta Storm Surge',
        badge: 'Coastal Surge',
        icon: ICONS.cyclone,
        cls: 'badge-info',
      },
    ];

    const magnitudesList = [
      { key: 'moderate', label: 'Moderate', mult: '0.5x' },
      { key: 'high', label: 'High', mult: '1.0x' },
      { key: 'very_high', label: 'Very High', mult: '1.6x' },
      { key: 'super_flood', label: 'Super Flood', mult: '2.6x' },
    ];

    card.innerHTML = `
      <div class="sim-forecast-header">
        <div class="sim-forecast-title-row">
          <span class="sim-forecast-dot"></span>
          <span class="sim-forecast-title">Disaster Forecast Engine</span>
        </div>
        <div class="sim-forecast-scales">
          <button class="sim-forecast-scale-btn ${this.selectedTimeScale === 'minute' ? 'active' : ''}" data-scale="minute" type="button">MINUTE</button>
          <button class="sim-forecast-scale-btn ${this.selectedTimeScale === 'hourly' ? 'active' : ''}" data-scale="hourly" type="button">HOURLY</button>
          <button class="sim-forecast-scale-btn ${this.selectedTimeScale === 'daily' ? 'active' : ''}" data-scale="daily" type="button">DAILY</button>
          <button class="sim-forecast-scale-btn ${this.selectedTimeScale === 'weekly' ? 'active' : ''}" data-scale="weekly" type="button">WEEKLY</button>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="sim-dialog-minimize" class="card-minimize-btn" type="button" title="Minimize / Expand Dialog">—</button>
          <button id="sim-dialog-close" class="gmaps-close-btn" type="button" aria-label="Close">✕</button>
        </div>
      </div>

      <div class="sim-forecast-body">
        <!-- Flood Type & Origin with 3D Map Origin Picker -->
        <div>
          <div class="sim-section-header">
            <span>Flood Type &amp; Origin:</span>
            <span style="font-weight: 500; text-transform: none; color: #1a73e8; font-size: 11px;">10 Gateways Available</span>
          </div>

          <!-- 3D Map Origin Picker Trigger & Eligible Chips -->
          <div class="sim-origin-picker-box">
            <button id="sim-origin-picker-trigger" class="sim-origin-picker-btn" type="button" title="Select starting flood surge pin interactively on the 3D globe">
              <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <span>🧭 Pick Origin on 3D Map</span>
            </button>
            <div class="sim-origin-chips-scroll" id="sim-origin-chips-container">
              ${ELIGIBLE_ORIGINATION_POINTS.map((pt) => `
                <button class="sim-origin-chip ${this.selectedOriginPoint?.id === pt.id ? 'active' : ''}" data-origin-id="${pt.id}" type="button" title="${pt.name} (${pt.region})">
                  ${pt.name}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="sim-scenarios-grid" style="margin-top: 8px;">
            ${scenariosList
              .map(
                (item) => `
              <div class="sim-scenario-card ${this.selectedScenarioKey === item.key ? 'active' : ''}" data-scenario="${item.key}" role="button" tabindex="0">
                <div class="sim-scenario-left">
                  <div class="sim-scenario-icon">${item.icon}</div>
                  <div>
                    <div class="sim-scenario-title">${item.title}</div>
                    <div style="font-size: 11px; color: #5f6368;">${item.desc}</div>
                    <div style="font-size: 10px; color: #80868b;">${FLOOD_SCENARIOS[item.key]?.dataBasis === 'real' ? 'HydroRIVERS · WorldPop · OSM · UNOSAT 2022' : 'Illustrative · figures not sourced'}</div>
                  </div>
                </div>
                <span class="sim-scenario-badge ${item.cls}">${item.badge}</span>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <!-- Magnitude (Severity) -->
        <div>
          <div class="sim-section-header">Magnitude (Severity):</div>
          <div class="sim-mag-row">
            ${magnitudesList
              .map(
                (m) => `
              <div class="sim-mag-btn ${this.selectedMagnitudeKey === m.key ? 'active' : ''}" data-mag="${m.key}" role="button" tabindex="0">
                <span class="sim-mag-title">${m.label}</span>
                <span class="sim-mag-mult">(${m.mult})</span>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <!-- Telemetry Details Box -->
        <div class="sim-telemetry-box">
          <div class="sim-telemetry-grid">
            <div class="sim-tel-cell sim-tel-cell-full">
              <span class="sim-tel-label">Origin / Region</span>
              <span class="sim-tel-val" id="dialog-tel-region">${this.selectedOriginPoint ? `${this.selectedOriginPoint.name} (${this.selectedOriginPoint.region})` : originRegion}</span>
            </div>
            <div class="sim-tel-cell sim-tel-cell-full">
              <span class="sim-tel-label">Stage / Status</span>
              <span class="sim-tel-val" id="dialog-tel-status" style="color: #d93025;">${this.selectedOriginPoint ? `${this.selectedOriginPoint.badge} • FORECAST` : stageStatus}</span>
            </div>
            <div class="sim-tel-cell sim-tel-cell-full">
              <span class="sim-tel-label">Crest Location</span>
              <span class="sim-tel-val" id="dialog-tel-crest">${this.selectedOriginPoint ? this.selectedOriginPoint.name : crestLoc}</span>
            </div>
            <div class="sim-tel-cell">
              <span class="sim-tel-label">Est. Discharge</span>
              <span class="sim-tel-val" id="dialog-tel-discharge" style="color: #38bdf8; font-family: monospace;">${dischargeText}</span>
            </div>
            <div class="sim-tel-cell">
              <span class="sim-tel-label">Stage Rise</span>
              <span class="sim-tel-val" id="dialog-tel-stage" style="color: #f87171; font-family: monospace;">${stageText}</span>
            </div>
          </div>
        </div>

        <!-- Feature Toggles -->
        <div class="sim-toggles-container">
          <label class="sim-toggle-row">
            <div class="sim-toggle-info">
              <span class="sim-toggle-name">Resource Management &amp; Relief Dispatch (Simulation Game)</span>
              <span class="sim-toggle-sub" id="dialog-resource-status">${this.resourceManagementEnabled ? 'ACTIVE / DISPATCH READY (FIRETRUCKS, BOATS, CREWS)' : 'STANDBY'}</span>
            </div>
            <input type="checkbox" id="dialog-resource-toggle" ${this.resourceManagementEnabled ? 'checked' : ''} style="accent-color: #1a73e8; width: 18px; height: 18px; cursor: pointer;" />
          </label>
          <div style="height: 1px; background: #e8eaed;"></div>
          <label class="sim-toggle-row">
            <div class="sim-toggle-info">
              <span class="sim-toggle-name">Predictive Impact Heatmap (Polygons)</span>
              <span class="sim-toggle-sub">Projected downstream floodplains ahead of crest</span>
            </div>
            <input type="checkbox" id="dialog-predictive-toggle" ${this.predictiveHeatmaps?.visible ? 'checked' : ''} style="accent-color: #1a73e8; width: 18px; height: 18px; cursor: pointer;" />
          </label>
          <div style="height: 1px; background: #e8eaed;"></div>
          <label class="sim-toggle-row">
            <div class="sim-toggle-info">
              <span class="sim-toggle-name">Country Threat Polygons &amp; Demographics</span>
              <span class="sim-toggle-sub">Illustrative provinces; real communities to watch on the Swat–Kabul corridor</span>
            </div>
            <input type="checkbox" id="dialog-country-threat-toggle" ${this.countryThreatPolygons?.active ? 'checked' : 'checked'} style="accent-color: #1a73e8; width: 18px; height: 18px; cursor: pointer;" />
          </label>
          <div style="height: 1px; background: #e8eaed;"></div>
          <label class="sim-toggle-row">
            <div class="sim-toggle-info">
              <span class="sim-toggle-name">Population Density Heatmap</span>
              <span class="sim-toggle-sub">Illustrative · figures not sourced</span>
            </div>
            <input type="checkbox" id="dialog-pop-toggle" ${this.pakistanLayers?.populationVisible ? 'checked' : ''} style="accent-color: #1a73e8; width: 18px; height: 18px; cursor: pointer;" />
          </label>
          <div style="height: 1px; background: #e8eaed;"></div>
          <label class="sim-toggle-row">
            <div class="sim-toggle-info">
              <span class="sim-toggle-name">Relief Resources &amp; Fleet Overlay</span>
              <span class="sim-toggle-sub">Illustrative · not a live inventory</span>
            </div>
            <input type="checkbox" id="dialog-relief-toggle" ${this.pakistanLayers?.resourcesVisible ? 'checked' : ''} style="accent-color: #1a73e8; width: 18px; height: 18px; cursor: pointer;" />
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="sim-dialog-actions">
          <button id="dialog-start-btn" class="gmaps-dialog-start-btn" type="button">
            ▶ START SIMULATION
          </button>
          ${
            this.floodEngine?.active
              ? `
            <button id="dialog-exit-btn" class="gmaps-dialog-exit-btn" type="button">
              ✕ EXIT
            </button>
          `
              : ''
          }
        </div>
      </div>
    `;

    // 0. Minimize Dialog button
    card.querySelector('#sim-dialog-minimize')?.addEventListener('click', (e) => {
      const isMin = card.classList.toggle('card-minimized');
      e.currentTarget.textContent = isMin ? '+' : '—';
    });

    // 0b. Origin picker trigger & chips
    card.querySelector('#sim-origin-picker-trigger')?.addEventListener('click', () => {
      this._enterOriginPickerMode();
    });

    card.querySelectorAll('.sim-origin-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const originId = btn.getAttribute('data-origin-id');
        const pt = ELIGIBLE_ORIGINATION_POINTS.find((p) => p.id === originId);
        if (pt) {
          this._selectOriginPoint(pt);
        }
      });
    });

    // 1. Scenario selection (DO NOT AUTO START!)
    card.querySelectorAll('.sim-scenario-card').forEach((elem) => {
      elem.addEventListener('click', () => {
        const key = elem.dataset.scenario;
        this.selectedOriginPoint = null;
        card.querySelectorAll('.sim-origin-chip').forEach((c) => c.classList.remove('active'));
        card.querySelectorAll('.sim-scenario-card').forEach((c) => c.classList.remove('active'));
        elem.classList.add('active');
        this._updateDialogTelemetry(card);
      });
    });

    // 2. Magnitude selection (DO NOT AUTO START!)
    card.querySelectorAll('.sim-mag-btn').forEach((elem) => {
      elem.addEventListener('click', () => {
        const key = elem.dataset.mag;
        this.selectedMagnitudeKey = key;
        card
          .querySelectorAll('.sim-mag-btn')
          .forEach((b) => b.classList.remove('active'));
        elem.classList.add('active');
        this._updateDialogTelemetry(card);
      });
    });

    // 3. Time scale selection
    card.querySelectorAll('.sim-forecast-scale-btn').forEach((elem) => {
      elem.addEventListener('click', () => {
        const scale = elem.dataset.scale;
        this.selectedTimeScale = scale;
        card
          .querySelectorAll('.sim-forecast-scale-btn')
          .forEach((b) => b.classList.remove('active'));
        elem.classList.add('active');
      });
    });

    // 4. Feature toggles
    card.querySelector('#dialog-resource-toggle')?.addEventListener('change', (e) => {
      this.resourceManagementEnabled = e.target.checked;
      const statusEl = card.querySelector('#dialog-resource-status');
      if (statusEl) {
        statusEl.textContent = this.resourceManagementEnabled ? 'ACTIVE / DISPATCH READY (FIRETRUCKS, BOATS, CREWS)' : 'STANDBY';
      }
      this._showToast(this.resourceManagementEnabled ? 'Resource defense game enabled (Firetrucks, Boats, Manpower)' : 'Resource defense standby');
    });

    card
      .querySelector('#dialog-predictive-toggle')
      ?.addEventListener('change', (e) => {
        this.predictiveHeatmaps?.setVisible(e.target.checked);
        const mainCheck = document.getElementById('gmaps-check-predictive');
        if (mainCheck) mainCheck.checked = e.target.checked;
      });

    card
      .querySelector('#dialog-country-threat-toggle')
      ?.addEventListener('change', (e) => {
        if (e.target.checked) this.countryThreatPolygons?.enable();
        else this.countryThreatPolygons?.disable();
        const mainCheck = document.getElementById('gmaps-check-country-threat');
        if (mainCheck) mainCheck.checked = e.target.checked;
      });

    card
      .querySelector('#dialog-pop-toggle')
      ?.addEventListener('change', (e) => {
        this.pakistanLayers?.setPopulationVisible(e.target.checked);
        const mainCheck = document.getElementById('gmaps-check-pop');
        if (mainCheck) mainCheck.checked = e.target.checked;
      });

    card
      .querySelector('#dialog-relief-toggle')
      ?.addEventListener('change', (e) => {
        this.pakistanLayers?.setResourcesVisible(e.target.checked);
        const mainCheck = document.getElementById('gmaps-check-resources');
        if (mainCheck) mainCheck.checked = e.target.checked;
      });

    // 5. Start button (Explicit user launch)
    card.querySelector('#dialog-start-btn')?.addEventListener('click', async () => {
      await this.floodEngine?.setScenario(this.selectedScenarioKey);
      if (
        this.floodEngine &&
        this.floodEngine.scenarioKey !== this.selectedScenarioKey
      ) {
        this._showToast('Corridor data unavailable; simulation not started');
        return;
      }
      this.floodEngine?.setMagnitude(this.selectedMagnitudeKey);
      this.floodEngine?.setTimeScale(this.selectedTimeScale);
      this.simulationBarUI?.show();

      // Launch Resource Defense Game if enabled
      if (this.resourceManagementEnabled) {
        this.resourceDefenseGame?.start();
      } else {
        this.resourceDefenseGame?.stop();
      }

      this.floodEngine?.start();
      this._closeDropdown();
      const activeSc = FLOOD_SCENARIOS[this.selectedScenarioKey];
      this._showToast(`Simulation started: ${this.selectedOriginPoint ? this.selectedOriginPoint.name : (activeSc?.name || 'Flood Forecast')}`);
    });

    // 6. Exit button
    card.querySelector('#dialog-exit-btn')?.addEventListener('click', () => {
      this.resourceDefenseGame?.stop();
      this.floodEngine?.exit();
      this.simulationBarUI?.hide();
      this._closeDropdown();
      this._showToast('Disaster forecast simulation stopped');
    });

    // 7. Close button
    card.querySelector('#sim-dialog-close')?.addEventListener('click', () => {
      this._closeDropdown();
    });
  }

  _updateDialogTelemetry(card) {
    const sc =
      FLOOD_SCENARIOS[this.selectedScenarioKey] || FLOOD_SCENARIOS.glacier;
    const mag =
      FLOOD_MAGNITUDES[this.selectedMagnitudeKey] || FLOOD_MAGNITUDES.high;
    const firstWp = sc.waypoints?.[0] || {};
    const mult = mag.multiplier || 1.0;
    const estDischarge = Math.round((firstWp.dischargeCusecs || 350000) * mult);
    const estStageRise = (
      Number(firstWp.stageRiseM || 6.0) * Math.sqrt(mult)
    ).toFixed(1);

    const elRegion = card.querySelector('#dialog-tel-region');
    const elStatus = card.querySelector('#dialog-tel-status');
    const elCrest = card.querySelector('#dialog-tel-crest');
    const elDischarge = card.querySelector('#dialog-tel-discharge');
    const elStage = card.querySelector('#dialog-tel-stage');

    if (elRegion) elRegion.textContent = sc.origin?.region || sc.region;
    if (elStatus) elStatus.textContent = firstWp.status || 'FORECAST STAGE';
    if (elCrest)
      elCrest.textContent =
        firstWp.name || sc.origin?.name || 'Head Basin Entry';
    const real = sc.dataBasis === 'real';
    if (elDischarge)
      elDischarge.textContent = real
        ? 'No gauge data'
        : `${estDischarge.toLocaleString()} Cusecs`;
    if (elStage)
      elStage.textContent = real ? 'No gauge data' : `+${estStageRise} m`;
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

    card
      .querySelector('#gmaps-dropdown-close')
      ?.addEventListener('click', () => {
        this._closeDropdown();
      });
  }

  _performSearch(query, triggerDirect = true) {
    const q = query.toLowerCase();
    const allItems = [
      ...PAKISTAN_LOCATIONS.glaciers.items.map((i) => ({
        ...i,
        category: 'Glacier',
      })),
      ...PAKISTAN_LOCATIONS.dams.items.map((i) => ({
        ...i,
        category: 'Dam / Barrage',
      })),
      ...PAKISTAN_LOCATIONS.hotspots.items.map((i) => ({
        ...i,
        category: 'Flood Hotspot',
      })),
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

      card
        .querySelector('#gmaps-dropdown-close')
        ?.addEventListener('click', () => {
          this._closeDropdown();
        });
    } else if (triggerDirect) {
      // Fallback to geocoding or toast
      this.navigation?.lookupLocation?.(query);
    }
  }

  _closeDropdown() {
    this.activeCategory = null;
    document.querySelectorAll('.gmaps-pill').forEach((p) => {
      p.classList.remove('active');
    });
    const card = document.getElementById('gmaps-dropdown-card');
    card?.classList.add('hidden');
    card?.classList.remove('sim-dialog-mode');
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

  /**
   * Plane Mode: explicitly enable/disable the live civil-flights data layer.
   * Off by default so the map stays clean; flight HUD chrome only shows
   * while plane mode is active (body.plane-mode-active in google-maps-theme.css).
   */
  setFlightsLayerEnabled(enabled) {
    const dataManager = this.styleManager?.dataManager;
    const planeCheck = document.getElementById('gmaps-check-plane');
    const pill = document.getElementById('gmaps-pill-planes');
    const pillLabel = document.getElementById('gmaps-pill-planes-label');

    if (enabled) {
      if (dataManager) {
        dataManager
          .setEnabled('flights', true, { origin: 'user' })
          .catch((error) =>
            console.warn('[GoogleMapsUI] flights enable failed:', error),
          );
      }
      this.flightsLayer?.enable?.(this.viewer);
      document.body.classList.add('plane-mode-active');
      if (planeCheck) planeCheck.checked = true;
      if (pill) pill.classList.add('active');
      if (pillLabel) pillLabel.textContent = 'Exit Plane Mode ✕';
      this._showToast('Plane mode ON — live air traffic enabled');
    } else {
      if (dataManager) {
        dataManager
          .setEnabled('flights', false, { origin: 'user' })
          .catch((error) =>
            console.warn('[GoogleMapsUI] flights disable failed:', error),
          );
        dataManager
          .setEnabled('military', false, { origin: 'user' })
          .catch(() => {});
      }
      if (this.viewer) {
        this.viewer.trackedEntity = undefined;
      }
      const emergencyBtn = document.getElementById(
        'gmaps-emergency-plane-exit',
      );
      if (emergencyBtn) emergencyBtn.classList.add('hidden');

      this.flightsLayer?.disable?.(this.viewer);
      this.catalog?.get?.('military')?.disable?.(this.viewer);
      document.body.classList.remove('plane-mode-active');
      if (planeCheck) planeCheck.checked = false;
      if (pill) pill.classList.remove('active');
      if (pillLabel) pillLabel.textContent = 'Plane Mode';

      // Clean local storage so it stays off
      try {
        const stored = localStorage.getItem('gev:layer-state:v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.enabledLayerIds)) {
            parsed.enabledLayerIds = parsed.enabledLayerIds.filter(
              (id) => id !== 'flights' && id !== 'military',
            );
            localStorage.setItem('gev:layer-state:v2', JSON.stringify(parsed));
          }
        }
      } catch {}

      this._showToast('Plane mode EXITED — air traffic hidden & camera freed');
    }
  }

  _initRouting() {
    // Check initial route
    if (window.location.pathname === '/rescue') {
      this._showRescueDashboard(false);
    }

    // Handle back / forward browser navigation
    window.addEventListener('popstate', () => {
      if (window.location.pathname === '/rescue') {
        this._showRescueDashboard(false);
      } else {
        this._showGlobeView(false);
      }
    });
  }

  _showRescueDashboard(pushHistory = true) {
    if (pushHistory && window.location.pathname !== '/rescue') {
      window.history.pushState(null, '', '/rescue');
    }
    this._exitOriginPickerMode();
    this._closeDropdown();
    this.rescueDashboard?.mount();
    document.getElementById('gmaps-pill-rescue')?.classList.add('active');
  }

  _showGlobeView(pushHistory = true) {
    if (pushHistory && window.location.pathname === '/rescue') {
      window.history.pushState(null, '', '/');
    }
    this.rescueDashboard?.unmount();
    document.getElementById('gmaps-pill-rescue')?.classList.remove('active');
  }

  _locateSosOnGlobe(sos) {
    this._showGlobeView(true);
    if (!this.viewer || !sos.coords) return;

    const [lon, lat] = sos.coords;
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 4500),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-40),
        roll: 0,
      },
      duration: 2.2,
    });

    // Drop emergency rescue pin beacon
    const sosBeacon = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 100),
      point: {
        pixelSize: 18,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      label: {
        text: `🚨 SOS: ${sos.sender}\n${sos.district}\n[${sos.llmRank}]`,
        font: 'bold 13px Inter, sans-serif',
        fillColor: Cesium.Color.WHITE,
        backgroundColor: Cesium.Color.fromCssColorString('#0f172a'),
        showBackground: true,
        backgroundPadding: new Cesium.Cartesian2(8, 5),
        pixelOffset: new Cesium.Cartesian2(0, -45),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });

    setTimeout(() => {
      if (this.viewer && this.viewer.entities) {
        this.viewer.entities.remove(sosBeacon);
      }
    }, 18000);

    this._showToast(`Located SOS signal from ${sos.sender} in ${sos.district}`);
  }

  _enterOriginPickerMode() {
    if (this._originPickerActive) return;
    this._originPickerActive = true;

    // Temporarily hide background map landmark labels to declutter view
    this._prevLabelsVisible = this.pakistanLayers?.labelsVisible;
    if (this.pakistanLayers) {
      this.pakistanLayers.setLabelsVisible(false);
    }

    // Minimize dialog so user can see globe clearly
    const card = document.getElementById('gmaps-dropdown-card');
    card?.classList.add('card-minimized');
    const minBtn = card?.querySelector('#sim-dialog-minimize');
    if (minBtn) minBtn.textContent = '+';

    // Show floating instruction banner on globe
    const banner = document.createElement('div');
    banner.id = 'origin-picker-banner';
    banner.className = 'origin-picker-active-banner';
    banner.innerHTML = `
      <span>🎯 HOVER OVER ANY PIN TO PREVIEW INTEL • CLICK TO SET SIMULATION ORIGIN</span>
      <button id="origin-picker-cancel" class="origin-picker-cancel-btn" type="button">✕ Cancel</button>
    `;
    document.body.appendChild(banner);

    banner.querySelector('#origin-picker-cancel')?.addEventListener('click', () => {
      this._exitOriginPickerMode();
      card?.classList.remove('card-minimized');
      if (minBtn) minBtn.textContent = '—';
    });

    // Create prominent floating hover callout element
    let hoverCalloutEl = document.getElementById('origin-hover-callout');
    if (!hoverCalloutEl) {
      hoverCalloutEl = document.createElement('div');
      hoverCalloutEl.id = 'origin-hover-callout';
      hoverCalloutEl.className = 'origin-hover-callout hidden';
      document.body.appendChild(hoverCalloutEl);
    }

    // Render Cesium markers for each eligible origination gateway
    this._originPickerEntities = [];
    for (const pt of ELIGIBLE_ORIGINATION_POINTS) {
      const ent = this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(pt.lon, pt.lat, pt.alt || 500),
        point: {
          pixelSize: 16,
          color: Cesium.Color.fromCssColorString('#1863dc'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 3,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `📍 ${pt.name}`,
          font: 'bold 12px "Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
          fillColor: Cesium.Color.WHITE,
          backgroundColor: Cesium.Color.fromCssColorString('#071829').withAlpha(0.88),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(8, 4),
          pixelOffset: new Cesium.Cartesian2(0, -32),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 4500000),
        },
      });
      ent._originData = pt;
      this._originPickerEntities.push(ent);
    }

    // Fly camera to Pakistan national overview
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(71.5, 30.8, 1400000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-55),
        roll: 0,
      },
      duration: 1.8,
    });

    // Helper: Find origin entity at screen position (direct pick or proximity radius)
    let currentHoveredEnt = null;
    const findOriginAtPos = (screenPos) => {
      if (!screenPos || !this.viewer) return null;
      // 1. Direct pick
      const picked = this.viewer.scene.pick(screenPos);
      if (Cesium.defined(picked) && picked.id && picked.id._originData) {
        return picked.id;
      }
      // 2. Proximity tolerance (35px window radius) to make clicking effortless
      let closest = null;
      let minDist = 35;
      for (const ent of this._originPickerEntities) {
        const pos = ent.position?.getValue(Cesium.JulianDate.now());
        if (!pos) continue;
        const windowCoord = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, pos);
        if (!windowCoord) continue;
        const dx = windowCoord.x - screenPos.x;
        const dy = windowCoord.y - screenPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = ent;
        }
      }
      return closest;
    };

    const resetEntityStyle = (ent) => {
      if (!ent || !ent.point) return;
      ent.point.pixelSize = 16;
      ent.point.color = Cesium.Color.fromCssColorString('#1863dc');
      ent.point.outlineWidth = 3;
      ent.point.outlineColor = Cesium.Color.WHITE;
      if (ent.label) {
        ent.label.fillColor = Cesium.Color.WHITE;
        ent.label.font = 'bold 12px "Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif';
        ent.label.backgroundColor = Cesium.Color.fromCssColorString('#071829').withAlpha(0.88);
      }
    };

    const highlightEntityStyle = (ent) => {
      if (!ent || !ent.point) return;
      ent.point.pixelSize = 28;
      ent.point.color = Cesium.Color.fromCssColorString('#ff7759');
      ent.point.outlineWidth = 5;
      ent.point.outlineColor = Cesium.Color.WHITE;
      if (ent.label) {
        ent.label.fillColor = Cesium.Color.fromCssColorString('#ffad9b');
        ent.label.font = 'bold 15px "Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif';
        ent.label.backgroundColor = Cesium.Color.fromCssColorString('#17171c').withAlpha(0.96);
      }
    };

    // Screen Space Handler for Hover and Click
    this._originPickerHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // MOUSE_MOVE: Prominently reveal gateway name and specs on hover
    this._originPickerHandler.setInputAction((movement) => {
      const ent = findOriginAtPos(movement.endPosition);
      if (ent && ent._originData) {
        this.viewer.canvas.style.cursor = 'pointer';
        if (currentHoveredEnt !== ent) {
          resetEntityStyle(currentHoveredEnt);
          currentHoveredEnt = ent;
          highlightEntityStyle(ent);
        }

        const pt = ent._originData;
        hoverCalloutEl.innerHTML = `
          <div class="callout-header">
            <span class="callout-badge">${pt.badge}</span>
            <span class="callout-elev">${pt.alt || 500}m ASL</span>
          </div>
          <div class="callout-title">${pt.name}</div>
          <div class="callout-region">📍 ${pt.region}</div>
          <div class="callout-desc">${pt.description}</div>
          <div class="callout-cta">
            <span>🎯 CLICK TO SELECT THIS ORIGIN</span>
          </div>
        `;
        hoverCalloutEl.classList.remove('hidden');

        // Clamp callout position inside viewport
        const calloutWidth = 300;
        const calloutHeight = 160;
        let x = movement.endPosition.x - calloutWidth / 2;
        let y = movement.endPosition.y - calloutHeight - 20;

        x = Math.max(16, Math.min(window.innerWidth - calloutWidth - 16, x));
        if (y < 80) {
          y = movement.endPosition.y + 30; // flip below if near top
        }

        hoverCalloutEl.style.left = `${x}px`;
        hoverCalloutEl.style.top = `${y}px`;
      } else {
        this.viewer.canvas.style.cursor = 'default';
        if (currentHoveredEnt) {
          resetEntityStyle(currentHoveredEnt);
          currentHoveredEnt = null;
        }
        hoverCalloutEl.classList.add('hidden');
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // LEFT_CLICK: Effortless selection via map pin, proximity, or hover card click
    const handlePickSelection = (pt) => {
      if (!pt) return;
      this._selectOriginPoint(pt);
      this._exitOriginPickerMode();
      card?.classList.remove('card-minimized');
      if (minBtn) minBtn.textContent = '—';
      this._showToast(`🎯 Origin Selected: ${pt.name}`);
    };

    this._originPickerHandler.setInputAction((click) => {
      const picked = findOriginAtPos(click.position);
      if (picked && picked._originData) {
        handlePickSelection(picked._originData);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Clicking the prominent hover callout itself also selects that origin point
    hoverCalloutEl.onclick = () => {
      if (currentHoveredEnt && currentHoveredEnt._originData) {
        handlePickSelection(currentHoveredEnt._originData);
      }
    };

    this._showToast('Origin picker active — hover any gateway pin to preview');
  }

  _exitOriginPickerMode() {
    this._originPickerActive = false;
    document.getElementById('origin-picker-banner')?.remove();

    const hoverCalloutEl = document.getElementById('origin-hover-callout');
    if (hoverCalloutEl) {
      hoverCalloutEl.onclick = null;
      hoverCalloutEl.remove();
    }

    if (this.viewer?.canvas) {
      this.viewer.canvas.style.cursor = 'default';
    }

    if (this._originPickerHandler) {
      this._originPickerHandler.destroy();
      this._originPickerHandler = null;
    }

    if (this.viewer && this.viewer.entities) {
      for (const ent of this._originPickerEntities) {
        this.viewer.entities.remove(ent);
      }
    }
    this._originPickerEntities = [];

    // Restore background landmark labels if they were previously visible
    if (this.pakistanLayers && this._prevLabelsVisible !== undefined) {
      this.pakistanLayers.setLabelsVisible(this._prevLabelsVisible);
    }
  }

  _selectOriginPoint(pt) {
    this.selectedOriginPoint = pt;
    this.selectedScenarioKey = pt.scenarioKey;

    // Update active state on chips and scenario cards
    const card = document.getElementById('gmaps-dropdown-card');
    if (card) {
      card.querySelectorAll('.sim-origin-chip').forEach((c) => {
        c.classList.toggle('active', c.getAttribute('data-origin-id') === pt.id);
      });
      card.querySelectorAll('.sim-scenario-card').forEach((c) => {
        c.classList.toggle('active', c.dataset.scenario === pt.scenarioKey);
      });

      // Update telemetry box
      const reg = card.querySelector('#dialog-tel-region');
      if (reg) reg.textContent = `${pt.name} (${pt.region})`;
      const stat = card.querySelector('#dialog-tel-status');
      if (stat) stat.textContent = `${pt.badge} • READY`;
      const crest = card.querySelector('#dialog-tel-crest');
      if (crest) crest.textContent = pt.name;
    }

    // Smoothly fly camera to selected origin gateway
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(pt.lon, pt.lat, 6500),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-32),
        roll: 0,
      },
      duration: 2.0,
    });

    this._showToast(`Selected origin: ${pt.name} (${pt.region})`);
  }

  exitAirplaneMode() {
    this.setFlightsLayerEnabled(false);
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

  destroy() {
    this._exitOriginPickerMode();
    this.rescueDashboard?.destroy();
    this.resourceDefenseGame?.destroy();
    this.pakistanLayers?.destroy();
    this.predictiveHeatmaps?.destroy();
    this.countryThreatPolygons?.destroy();
    this.responsePanel?.destroy();
  }
}
