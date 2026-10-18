/**
 * @module simulation/countryThreatPolygons
 * @description Divides Pakistan into comprehensive regional administrative/basin polygons during flood simulation.
 * Dynamically colors each polygon according to threat severity (Critical, High, Moderate, Low, Secure).
 * On hover, provides detailed regional demographics, age breakdown (children, adults, elderly),
 * and live emergency relief resource inventories.
 */

import * as Cesium from 'cesium';

export const THREAT_LEVELS = {
  CRITICAL: {
    level: 4,
    label: 'CRITICAL INUNDATION',
    badgeClass: 'threat-critical',
    fillColor: '#d90429',
    fillAlpha: 0.44,
    outlineColor: '#ff1744',
    outlineWidth: 3,
    statusText: 'Severe Breach & Direct Water Inflow',
  },
  HIGH: {
    level: 3,
    label: 'HIGH THREAT',
    badgeClass: 'threat-high',
    fillColor: '#ff6f00',
    fillAlpha: 0.36,
    outlineColor: '#ff9100',
    outlineWidth: 2.5,
    statusText: 'Imminent Crest Wave & Levee Pressure',
  },
  MODERATE: {
    level: 2,
    label: 'MODERATE WATCH',
    badgeClass: 'threat-moderate',
    fillColor: '#ffb703',
    fillAlpha: 0.28,
    outlineColor: '#ffd166',
    outlineWidth: 2,
    statusText: 'Canal Backflow & Low-Lying Spillover',
  },
  LOW: {
    level: 1,
    label: 'LOW ADVISORY',
    badgeClass: 'threat-low',
    fillColor: '#0288d1',
    fillAlpha: 0.2,
    outlineColor: '#29b6f6',
    outlineWidth: 1.5,
    statusText: 'Upstream Basin Monitoring & Inflow Buffer',
  },
  SECURE: {
    level: 0,
    label: 'SECURE / STAGING',
    badgeClass: 'threat-secure',
    fillColor: '#2e7d32',
    fillAlpha: 0.16,
    outlineColor: '#4caf50',
    outlineWidth: 1.5,
    statusText: 'High Elevation Relief Staging & Logistics Haven',
  },
};

export const COMMUNITY_BANDS = {
  high: {
    level: 3,
    label: 'HIGH EXPOSURE',
    badgeClass: 'threat-high',
    fillColor: '#ff6f00',
    fillAlpha: 0.5,
    outlineColor: '#ff9100',
    outlineWidth: 2,
  },
  medium: {
    level: 2,
    label: 'MEDIUM EXPOSURE',
    badgeClass: 'threat-moderate',
    fillColor: '#ffb703',
    fillAlpha: 0.4,
    outlineColor: '#ffd166',
    outlineWidth: 1.5,
  },
  low: {
    level: 1,
    label: 'LOW EXPOSURE',
    badgeClass: 'threat-low',
    fillColor: '#0288d1',
    fillAlpha: 0.28,
    outlineColor: '#29b6f6',
    outlineWidth: 1,
  },
};

const COMMUNITY_STATUS_TEXT = {
  observed_exceed: 'Exercise trigger reach (simulated)',
  propagated_watch: 'Downstream of the exercise trigger',
  no_data: 'Not on the trigger path · no data is not safe',
};

export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"]/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch],
  );

/**
 * 19 Comprehensive Contiguous Regional Polygons Covering All of Pakistan
 */
export const PAKISTAN_REGIONS = [
  {
    id: 'hunza_diamer_gb',
    name: 'Gilgit-Baltistan & Karakoram Gorges',
    province: 'Gilgit-Baltistan',
    population: 1850000,
    demographics: {
      childrenPct: 40.5,
      adultsPct: 54.8,
      elderlyPct: 4.7,
      infantsPregnant: '68,000 infants & expecting mothers',
    },
    resources: {
      boats: '35 Mountain Swift-Water Rafts & Jet Boats',
      camps: '22 Mountain Evacuation Shelters (Capacity: 26,000)',
      airAssets: '4x Army Aviation High-Altitude Helicopters (Skardu/Gilgit)',
      medicalUnits: '12 Emergency High-Altitude Medical Teams',
      rationsWater: '30,000 Rations & 8 Portable Filtration Plants',
    },
    center: [35.9, 74.5],
    polygon: [
      73.5, 35.2, 74.0, 36.8, 75.0, 37.1, 76.5, 36.5, 77.2, 35.6, 75.8, 35.0,
      74.5, 35.2,
    ],
  },
  {
    id: 'swat_hazara_kp',
    name: 'Swat, Kohistan & Hazara Division',
    province: 'Khyber Pakhtunkhwa',
    population: 5650000,
    demographics: {
      childrenPct: 38.8,
      adultsPct: 56.5,
      elderlyPct: 4.7,
      infantsPregnant: '175,000 infants & expecting mothers',
    },
    resources: {
      boats: '45 Rescue Flotillas & Zodiac Dinghies',
      camps: '34 School & Stadium Relief Hubs (Capacity: 50,000)',
      airAssets: '3x Rescue Aviation Support Choppers',
      medicalUnits: '22 Rapid Trauma & Orthopedic Units',
      rationsWater: '65,000 Food Packs & 12 Clean Water Bowsers',
    },
    center: [34.8, 72.8],
    polygon: [
      71.8, 34.5, 71.8, 35.8, 73.0, 35.8, 73.6, 35.2, 73.5, 34.2, 72.6, 34.2,
    ],
  },
  {
    id: 'peshawar_valley_kp',
    name: 'Peshawar, Nowshera & Charsadda Valley',
    province: 'Khyber Pakhtunkhwa',
    population: 4850000,
    demographics: {
      childrenPct: 39.5,
      adultsPct: 55.8,
      elderlyPct: 4.7,
      infantsPregnant: '160,000 infants & expecting mothers',
    },
    resources: {
      boats: '85 Rescue 1122 Marine & Inflatable Boats',
      camps: '42 Central Evacuation Complexes (Capacity: 65,000)',
      airAssets: '5x Mi-17 Heavy Air-Drop sorties (Peshawar Base)',
      medicalUnits: '32 Specialized Waterborne Disease Units',
      rationsWater: '80,000 Family Hampers & 14 Water Purification Stations',
    },
    center: [34.1, 71.9],
    polygon: [71.2, 33.8, 71.3, 34.5, 72.6, 34.5, 72.6, 33.8],
  },
  {
    id: 'southern_kp',
    name: 'Southern KP (Kohat, Bannu & D.I. Khan)',
    province: 'Khyber Pakhtunkhwa',
    population: 3950000,
    demographics: {
      childrenPct: 41.2,
      adultsPct: 54.3,
      elderlyPct: 4.5,
      infantsPregnant: '135,000 infants & expecting mothers',
    },
    resources: {
      boats: '40 High-Capacity Rubber Boats',
      camps: '28 Field Camps (Capacity: 38,000)',
      airAssets: '2x Aerial Survey & Drop Drones',
      medicalUnits: '16 Mobile Clinic Vans',
      rationsWater: '45,000 Food Baskets & 9 Water Purification Units',
    },
    center: [32.5, 70.8],
    polygon: [70.0, 31.5, 70.4, 33.8, 71.5, 33.8, 71.2, 31.5],
  },
  {
    id: 'potohar_islamabad',
    name: 'Potohar Plateau, Rawalpindi & Islamabad',
    province: 'Punjab / ICT',
    population: 7400000,
    demographics: {
      childrenPct: 33.2,
      adultsPct: 61.5,
      elderlyPct: 5.3,
      infantsPregnant: '190,000 infants & expecting mothers',
    },
    resources: {
      boats: '90 Nullah Lai Flash Flood Response Flotillas',
      camps: '55 Community Emergency Centers (Capacity: 85,000)',
      airAssets: '14x Army Aviation 101 Group (Dhamial Base)',
      medicalUnits: '45 Hospital Quick-Response Trauma Teams',
      rationsWater: '140,000 NDMA Strategic Reserve Rations',
    },
    center: [33.6, 73.0],
    polygon: [72.0, 32.7, 72.2, 34.1, 73.8, 34.1, 73.8, 32.8],
  },
  {
    id: 'north_punjab_border',
    name: 'North Punjab & Border River Reach (Sialkot / Gujrat)',
    province: 'Punjab',
    population: 8650000,
    demographics: {
      childrenPct: 35.8,
      adultsPct: 58.6,
      elderlyPct: 5.6,
      infantsPregnant: '240,000 infants & expecting mothers',
    },
    resources: {
      boats: '110 Rescue 1122 Flood Rescue Outboard Boats',
      camps: '50 Bund Evacuation Facilities (Capacity: 75,000)',
      airAssets: '4x Bell 412 Reconnaissance Helicopters',
      medicalUnits: '35 Mobile Triage Clinics',
      rationsWater: '110,000 Food Rations & 18 Mobile Water Units',
    },
    center: [32.4, 74.4],
    polygon: [73.8, 32.1, 73.8, 33.0, 75.2, 32.8, 74.9, 31.8, 74.2, 32.0],
  },
  {
    id: 'central_punjab',
    name: 'Central Punjab (Lahore, Kasur & Faisalabad)',
    province: 'Punjab',
    population: 23500000,
    demographics: {
      childrenPct: 34.4,
      adultsPct: 60.1,
      elderlyPct: 5.5,
      infantsPregnant: '650,000 infants & expecting mothers',
    },
    resources: {
      boats: '150 Heavy Inundation Rescue Boats',
      camps: '95 Disaster Shelter Complexes (Capacity: 160,000)',
      airAssets: '8x Provincial Aviation Relief Flights',
      medicalUnits: '60 Multi-Specialty Mobile Medical Units',
      rationsWater: '250,000 Rations & 35 Water Purification Plants',
    },
    center: [31.5, 73.8],
    polygon: [72.8, 30.8, 72.8, 32.1, 74.4, 32.1, 74.6, 31.0, 73.6, 30.8],
  },
  {
    id: 'western_punjab_thal',
    name: 'Western Punjab & Thal Basin (Mianwali / Bhakkar)',
    province: 'Punjab',
    population: 4800000,
    demographics: {
      childrenPct: 38.6,
      adultsPct: 56.4,
      elderlyPct: 5.0,
      infantsPregnant: '155,000 infants & expecting mothers',
    },
    resources: {
      boats: '60 Long-Range Canal Rescue Boats',
      camps: '30 Sand Dune & High Ground Camps (Capacity: 45,000)',
      airAssets: '2x Drone Inundation Surveillance Units',
      medicalUnits: '18 Mobile Snakebite & Trauma Teams',
      rationsWater: '60,000 Emergency Food Packs',
    },
    center: [31.8, 71.6],
    polygon: [70.9, 30.8, 71.2, 32.8, 72.4, 32.7, 72.0, 30.8],
  },
  {
    id: 'south_punjab',
    name: 'South Punjab (Multan, Muzaffargarh & Bahawalpur)',
    province: 'Punjab',
    population: 13200000,
    demographics: {
      childrenPct: 39.8,
      adultsPct: 55.4,
      elderlyPct: 4.8,
      infantsPregnant: '420,000 infants & expecting mothers',
    },
    resources: {
      boats: '180 Army & Rescue 1122 Motorized Dinghies',
      camps: '75 Embankment Camp Cities (Capacity: 120,000)',
      airAssets: '10x Multan Aviation Heavy Drop Helicopters',
      medicalUnits: '48 Epidemic Prevention Units',
      rationsWater: '180,000 Emergency Hampers & 24 RO Stations',
    },
    center: [29.8, 71.5],
    polygon: [70.8, 28.2, 70.8, 30.8, 72.8, 30.8, 72.8, 28.5, 71.5, 28.0],
  },
  {
    id: 'derajat_suleman',
    name: 'Koh-e-Suleman & Derajat Torrent Belt (DG Khan / Rajanpur)',
    province: 'Punjab / Balochistan Border',
    population: 3450000,
    demographics: {
      childrenPct: 42.1,
      adultsPct: 53.6,
      elderlyPct: 4.3,
      infantsPregnant: '125,000 infants & expecting mothers',
    },
    resources: {
      boats: '70 Amphibious All-Terrain & Flat-Bottom Boats',
      camps: '35 Canal Bank Evacuation Tents (Capacity: 52,000)',
      airAssets: '4x Mountain Recon & Airdrop Helicopters',
      medicalUnits: '24 Anti-Venom & Water-Borne Care Teams',
      rationsWater: '70,000 Dry Rations & 10 Clean Water Tankers',
    },
    center: [29.8, 70.3],
    polygon: [69.6, 28.5, 69.8, 31.2, 70.8, 31.2, 70.8, 28.5],
  },
  {
    id: 'upper_sindh_guddu',
    name: 'Upper Sindh & Guddu Choke Basin (Kashmore / Jacobabad)',
    province: 'Sindh',
    population: 5850000,
    demographics: {
      childrenPct: 41.5,
      adultsPct: 54.2,
      elderlyPct: 4.3,
      infantsPregnant: '210,000 infants & expecting mothers',
    },
    resources: {
      boats: '130 Marine Command Zodiacs & Aluminum Skiffs',
      camps: '45 Elevated Highway Camps (Capacity: 70,000)',
      airAssets: '6x C-130 & Helo Sorties via PAF Shahbaz Base',
      medicalUnits: '30 Field Infection Control Units',
      rationsWater: '90,000 High-Calorie Rations & 15 RO Plants',
    },
    center: [28.2, 69.1],
    polygon: [68.1, 27.8, 68.1, 28.6, 70.2, 28.5, 69.8, 27.8],
  },
  {
    id: 'central_sindh_larkana',
    name: 'Central Sindh Floodplain (Sukkur, Larkana & Khairpur)',
    province: 'Sindh',
    population: 6850000,
    demographics: {
      childrenPct: 39.2,
      adultsPct: 56.1,
      elderlyPct: 4.7,
      infantsPregnant: '235,000 infants & expecting mothers',
    },
    resources: {
      boats: '160 Motorized Rescue & Evacuation Flotillas',
      camps: '58 Highway & Bund Tent Cities (Capacity: 92,000)',
      airAssets: '6x Navy Sea King & Army Aviation Helis',
      medicalUnits: '36 Mobile Pediatric & Trauma Teams',
      rationsWater: '120,000 Rations & 20 High-Output Water Units',
    },
    center: [27.4, 68.6],
    polygon: [67.8, 26.8, 67.8, 27.8, 69.3, 27.8, 69.0, 26.8],
  },
  {
    id: 'dadu_manchar_sindh',
    name: 'Western Sindh & Lake Manchar Depressed Basin',
    province: 'Sindh',
    population: 3250000,
    demographics: {
      childrenPct: 40.8,
      adultsPct: 54.8,
      elderlyPct: 4.4,
      infantsPregnant: '115,000 infants & expecting mothers',
    },
    resources: {
      boats: '95 Deep-Water Heavy Rescue Boats',
      camps: '38 Ring Bund Camps (Capacity: 58,000)',
      airAssets: '4x Airdrop Supply Helicopters',
      medicalUnits: '22 Epidemic & Malaria Control Units',
      rationsWater: '65,000 Food Packs & 12 Water Purification Rigs',
    },
    center: [26.4, 67.9],
    polygon: [67.3, 25.8, 67.4, 26.8, 68.6, 26.8, 68.5, 25.8],
  },
  {
    id: 'lower_sindh_delta',
    name: 'Lower Sindh & Indus Delta (Hyderabad, Thatta & Badin)',
    province: 'Sindh',
    population: 8900000,
    demographics: {
      childrenPct: 37.5,
      adultsPct: 57.6,
      elderlyPct: 4.9,
      infantsPregnant: '270,000 infants & expecting mothers',
    },
    resources: {
      boats: '140 Marine Rescue Boats & Amphibious Carriers',
      camps: '62 High-Ground Relief Camps (Capacity: 95,000)',
      airAssets: '5x Pakistan Navy / Coast Guard Helicopters',
      medicalUnits: '40 Mobile Hospital Units',
      rationsWater: '150,000 Rations & 25 Clean Water Tankers',
    },
    center: [25.1, 68.5],
    polygon: [67.8, 24.1, 67.8, 25.8, 69.2, 25.8, 69.2, 24.1],
  },
  {
    id: 'karachi_coastal',
    name: 'Karachi Coastal Megacity & Delta Coastline',
    province: 'Sindh',
    population: 17500000,
    demographics: {
      childrenPct: 32.1,
      adultsPct: 62.8,
      elderlyPct: 5.1,
      infantsPregnant: '480,000 infants & expecting mothers',
    },
    resources: {
      boats: '175 Pak Navy, Maritime Security & Rescue Flotillas',
      camps: '80 Urban Relief & School Enclosures (Capacity: 140,000)',
      airAssets: '8x Navy Sea King & Coast Guard Aircraft',
      medicalUnits: '55 Emergency Tertiary Care Units',
      rationsWater: '300,000 Dry Food Hampers & 40 RO Plants',
    },
    center: [24.9, 67.1],
    polygon: [66.6, 24.6, 66.6, 25.4, 67.5, 25.4, 67.5, 24.4],
  },
  {
    id: 'kacchi_plains_balochistan',
    name: 'Eastern Balochistan (Naseerabad, Jaffarabad & Jhal Magsi)',
    province: 'Balochistan',
    population: 2150000,
    demographics: {
      childrenPct: 43.5,
      adultsPct: 52.3,
      elderlyPct: 4.2,
      infantsPregnant: '85,000 infants & expecting mothers',
    },
    resources: {
      boats: '50 Torrent Shallow-Draft Boats',
      camps: '26 Railway & Embankment Camps (Capacity: 35,000)',
      airAssets: '3x Airdrop Helicopters',
      medicalUnits: '14 Mobile Health Dispensaries',
      rationsWater: '40,000 Food Baskets & 6 RO Units',
    },
    center: [28.6, 67.9],
    polygon: [67.2, 27.8, 67.5, 29.5, 68.5, 29.5, 68.1, 27.8],
  },
  {
    id: 'quetta_highlands_balochistan',
    name: 'Northern Balochistan & Quetta Highlands',
    province: 'Balochistan',
    population: 3200000,
    demographics: {
      childrenPct: 39.4,
      adultsPct: 55.8,
      elderlyPct: 4.8,
      infantsPregnant: '105,000 infants & expecting mothers',
    },
    resources: {
      boats: '25 Fast Mountain Torrent Craft',
      camps: '30 Elevated Army Relief Staging Camps (Capacity: 42,000)',
      airAssets: '6x Air Logistics Sorties via Quetta Cantt',
      medicalUnits: '18 Trauma & Cold-Weather Units',
      rationsWater: '55,000 Winterized Relief Packs',
    },
    center: [30.6, 67.3],
    polygon: [66.2, 29.8, 66.5, 31.8, 68.5, 31.8, 68.2, 29.8],
  },
  {
    id: 'makran_coastal_balochistan',
    name: 'Makran Coast, Gwadar & Lasbela Basin',
    province: 'Balochistan',
    population: 1850000,
    demographics: {
      childrenPct: 38.5,
      adultsPct: 56.9,
      elderlyPct: 4.6,
      infantsPregnant: '62,000 infants & expecting mothers',
    },
    resources: {
      boats: '55 Maritime Fishing & Rescue Boats',
      camps: '20 Coastal Evacuation Compounds (Capacity: 28,000)',
      airAssets: '3x Maritime Patrol Aircraft',
      medicalUnits: '12 Marine First Aid Units',
      rationsWater: '35,000 Emergency Supplies & 8 Desalination Units',
    },
    center: [25.8, 64.2],
    polygon: [61.5, 25.0, 62.0, 26.8, 66.6, 26.2, 66.6, 24.8],
  },
  {
    id: 'ajk_jhelum_basin',
    name: 'Azad Jammu & Kashmir (Mangla & Jhelum Valley)',
    province: 'Azad Jammu & Kashmir',
    population: 4150000,
    demographics: {
      childrenPct: 37.2,
      adultsPct: 57.5,
      elderlyPct: 5.3,
      infantsPregnant: '128,000 infants & expecting mothers',
    },
    resources: {
      boats: '40 Mountain Lake & River Rafts',
      camps: '28 Hillside Relief Shelters (Capacity: 38,000)',
      airAssets: '4x Mountain Supply Helicopters',
      medicalUnits: '20 Emergency First Responder Teams',
      rationsWater: '50,000 Rations & 10 Portable Water Filtration Rigs',
    },
    center: [33.6, 73.9],
    polygon: [73.5, 32.8, 73.5, 34.5, 74.3, 34.5, 74.3, 32.8],
  },
];

export class CountryThreatPolygons {
  constructor(viewer, floodEngine) {
    this.viewer = viewer;
    this.floodEngine = floodEngine;
    this.active = false;
    this.hoveredRegion = null;

    this._entities = new Map();
    this._eventHandler = null;
    this._unsubscribe = null;
    this._tooltipEl = null;

    this._initTooltip();
    this._init();
  }

  _initTooltip() {
    let tooltip = document.getElementById('threat-polygon-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'threat-polygon-tooltip';
      tooltip.className = 'threat-polygon-tooltip hidden';
      document.body.appendChild(tooltip);
    }
    this._tooltipEl = tooltip;
  }

  _init() {
    if (this.floodEngine) {
      this._unsubscribe = this.floodEngine.subscribe((tel) => {
        if (tel.active && !this.active) {
          this.enable();
        } else if (!tel.active && this.active) {
          this.disable();
        } else if (this.active) {
          if (tel.scenarioKey !== this._scenarioKey) this._createPolygons();
          this._updateThreatVisuals(tel);
        }
      });
    }

    // If floodEngine is already running, enable immediately
    if (this.floodEngine?.active) {
      this.enable();
    }
  }

  enable() {
    this.active = true;
    this._createPolygons();
    this._bindHoverEvents();
    const tel = this.floodEngine?.getCurrentTelemetry();
    if (tel) {
      this._updateThreatVisuals(tel);
    }
  }

  disable() {
    this.active = false;
    this._clearPolygons();
    this._unbindHoverEvents();
    this._hideTooltip();
  }

  toggle() {
    if (this.active) this.disable();
    else this.enable();
    return this.active;
  }

  _createPolygons() {
    this._clearPolygons();
    const scenario = this.floodEngine?.activeScenario;
    this._scenarioKey = scenario?.id;
    if (!this.viewer || !this.viewer.entities) return;

    const regions = scenario?.communities
      ? scenario.communities.filter((c) => c.band)
      : PAKISTAN_REGIONS;
    for (const reg of regions) {
      const hierarchy = Cesium.Cartesian3.fromDegreesArray(reg.polygon);
      const entity = this.viewer.entities.add({
        name: `ThreatZone: ${reg.name}`,
        polygon: {
          hierarchy,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString('#0288d1').withAlpha(0.25),
          ),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#29b6f6'),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });

      // Attach custom reference on the entity for fast picking
      entity.threatRegionData = reg;
      entity.currentThreatInfo = THREAT_LEVELS.LOW;

      this._entities.set(reg.id, entity);
    }
  }

  _clearPolygons() {
    if (this.viewer && this.viewer.entities) {
      for (const ent of this._entities.values()) {
        this.viewer.entities.remove(ent);
      }
    }
    this._entities.clear();
  }

  /**
   * Dynamically calculates threat levels across all 19 regions based on active scenario,
   * current flood crest location, and elapsed physical simulation hours.
   */
  _calculateThreatLevel(region, tel) {
    if (region.band) return COMMUNITY_BANDS[region.band];
    const scenarioKey = tel.scenarioKey || 'glacier';
    const simHours = tel.simHours || 0;
    const [cLat, cLon] = region.center;
    const crestLat = tel.crestLat || 30.0;
    const crestLon = tel.crestLon || 70.0;

    // Euclidean distance in degrees to active crest
    const distDeg = Math.hypot(cLat - crestLat, cLon - crestLon);

    let threat = THREAT_LEVELS.LOW;

    if (scenarioKey === 'dam_breach') {
      // Indian Dam Release (Sialkot / Gujrat / Punjab)
      if (region.id === 'north_punjab_border') {
        threat = THREAT_LEVELS.CRITICAL;
      } else if (region.id === 'central_punjab') {
        threat = simHours > 12 ? THREAT_LEVELS.CRITICAL : THREAT_LEVELS.HIGH;
      } else if (region.id === 'south_punjab') {
        threat =
          simHours > 28
            ? THREAT_LEVELS.CRITICAL
            : simHours > 14
              ? THREAT_LEVELS.HIGH
              : THREAT_LEVELS.MODERATE;
      } else if (region.id === 'upper_sindh_guddu') {
        threat =
          simHours > 48
            ? THREAT_LEVELS.CRITICAL
            : simHours > 24
              ? THREAT_LEVELS.HIGH
              : THREAT_LEVELS.MODERATE;
      } else if (region.id === 'central_sindh_larkana') {
        threat =
          simHours > 56
            ? THREAT_LEVELS.CRITICAL
            : simHours > 36
              ? THREAT_LEVELS.HIGH
              : THREAT_LEVELS.MODERATE;
      } else if (region.id === 'dadu_manchar_sindh') {
        threat = simHours > 64 ? THREAT_LEVELS.HIGH : THREAT_LEVELS.MODERATE;
      } else if (
        region.id === 'potohar_islamabad' ||
        region.id === 'western_punjab_thal'
      ) {
        threat = THREAT_LEVELS.MODERATE;
      } else if (
        region.id === 'hunza_diamer_gb' ||
        region.id === 'makran_coastal_balochistan'
      ) {
        threat = THREAT_LEVELS.SECURE;
      }
    } else if (scenarioKey === 'glacier') {
      // Karakoram GLOF (Hunza -> Tarbela -> Indus Plains)
      if (region.id === 'hunza_diamer_gb') {
        threat = THREAT_LEVELS.CRITICAL;
      } else if (region.id === 'swat_hazara_kp') {
        threat = simHours > 15 ? THREAT_LEVELS.CRITICAL : THREAT_LEVELS.HIGH;
      } else if (region.id === 'peshawar_valley_kp') {
        threat = simHours > 24 ? THREAT_LEVELS.CRITICAL : THREAT_LEVELS.HIGH;
      } else if (region.id === 'western_punjab_thal') {
        threat = simHours > 36 ? THREAT_LEVELS.HIGH : THREAT_LEVELS.MODERATE;
      } else if (
        region.id === 'derajat_suleman' ||
        region.id === 'south_punjab'
      ) {
        threat = simHours > 48 ? THREAT_LEVELS.HIGH : THREAT_LEVELS.MODERATE;
      } else if (
        region.id === 'upper_sindh_guddu' ||
        region.id === 'central_sindh_larkana'
      ) {
        threat = simHours > 60 ? THREAT_LEVELS.HIGH : THREAT_LEVELS.MODERATE;
      } else if (
        region.id === 'makran_coastal_balochistan' ||
        region.id === 'quetta_highlands_balochistan'
      ) {
        threat = THREAT_LEVELS.SECURE;
      }
    } else if (scenarioKey === 'rain') {
      // Koh-e-Suleman Hill Torrents (Rajanpur / DG Khan)
      if (region.id === 'derajat_suleman') {
        threat = THREAT_LEVELS.CRITICAL;
      } else if (
        region.id === 'south_punjab' ||
        region.id === 'kacchi_plains_balochistan'
      ) {
        threat = simHours > 8 ? THREAT_LEVELS.CRITICAL : THREAT_LEVELS.HIGH;
      } else if (region.id === 'upper_sindh_guddu') {
        threat = simHours > 18 ? THREAT_LEVELS.CRITICAL : THREAT_LEVELS.HIGH;
      } else if (region.id === 'central_sindh_larkana') {
        threat = simHours > 30 ? THREAT_LEVELS.HIGH : THREAT_LEVELS.MODERATE;
      } else if (region.id === 'dadu_manchar_sindh') {
        threat = simHours > 42 ? THREAT_LEVELS.HIGH : THREAT_LEVELS.MODERATE;
      } else if (
        region.id === 'hunza_diamer_gb' ||
        region.id === 'potohar_islamabad'
      ) {
        threat = THREAT_LEVELS.SECURE;
      }
    } else if (scenarioKey === 'cyclone') {
      // Arabian Sea Coastal Storm Surge
      if (
        region.id === 'karachi_coastal' ||
        region.id === 'lower_sindh_delta'
      ) {
        threat = THREAT_LEVELS.CRITICAL;
      } else if (region.id === 'makran_coastal_balochistan') {
        threat = THREAT_LEVELS.HIGH;
      } else if (region.id === 'dadu_manchar_sindh') {
        threat = THREAT_LEVELS.MODERATE;
      } else if (region.id === 'central_sindh_larkana') {
        threat = THREAT_LEVELS.MODERATE;
      } else {
        threat = THREAT_LEVELS.SECURE;
      }
    }

    // Dynamic proximity override if crest is physically inside this region
    if (distDeg < 1.1) {
      threat = THREAT_LEVELS.CRITICAL;
    } else if (distDeg < 2.0 && threat.level < 3) {
      threat = THREAT_LEVELS.HIGH;
    }

    return threat;
  }

  _updateThreatVisuals(tel) {
    for (const [id, entity] of this._entities.entries()) {
      const reg = entity.threatRegionData;
      if (!reg) continue;

      const threat = this._calculateThreatLevel(reg, tel);
      entity.currentThreatInfo = threat;

      const isHovered = this.hoveredRegion && this.hoveredRegion.id === id;
      const styleKey = `${threat.label}|${isHovered}`;
      if (entity.threatStyleKey === styleKey) continue;
      entity.threatStyleKey = styleKey;
      const alpha = isHovered
        ? Math.min(0.72, threat.fillAlpha + 0.18)
        : threat.fillAlpha;
      const outlineWidth = isHovered
        ? threat.outlineWidth + 1.5
        : threat.outlineWidth;

      entity.polygon.material = new Cesium.ColorMaterialProperty(
        Cesium.Color.fromCssColorString(threat.fillColor).withAlpha(alpha),
      );
      entity.polygon.outlineColor = isHovered
        ? Cesium.Color.WHITE
        : Cesium.Color.fromCssColorString(threat.outlineColor);
      entity.polygon.outlineWidth = outlineWidth;
    }
  }

  _bindHoverEvents() {
    this._unbindHoverEvents();
    if (!this.viewer?.scene?.canvas) return;

    this._eventHandler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.scene.canvas,
    );

    this._eventHandler.setInputAction((movement) => {
      if (!this.active) return;

      const pickedObject = this.viewer.scene.pick(movement.endPosition);

      if (
        Cesium.defined(pickedObject) &&
        pickedObject.id &&
        pickedObject.id.threatRegionData
      ) {
        const entity = pickedObject.id;
        const reg = entity.threatRegionData;
        const threat = entity.currentThreatInfo || THREAT_LEVELS.LOW;

        this.hoveredRegion = reg;
        this.viewer.canvas.style.cursor = 'pointer';

        this._showTooltip(reg, threat, movement.endPosition);

        // Highlight hovered polygon
        entity.polygon.outlineColor = Cesium.Color.WHITE;
      } else {
        if (this.hoveredRegion) {
          this.hoveredRegion = null;
          this.viewer.canvas.style.cursor = 'default';
          this._hideTooltip();
          const tel = this.floodEngine?.getCurrentTelemetry();
          if (tel) this._updateThreatVisuals(tel);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  _unbindHoverEvents() {
    if (this._eventHandler) {
      this._eventHandler.destroy();
      this._eventHandler = null;
    }
    if (this.viewer?.canvas) {
      this.viewer.canvas.style.cursor = 'default';
    }
  }

  _showTooltip(reg, threat, mousePos) {
    if (!this._tooltipEl) return;

    if (reg.band) {
      this._tooltipEl.innerHTML = this._communityTooltipHtml(reg, threat);
      this._placeTooltip(mousePos);
      return;
    }

    const childrenCount = Math.round(
      reg.population * (reg.demographics.childrenPct / 100),
    );
    const adultsCount = Math.round(
      reg.population * (reg.demographics.adultsPct / 100),
    );
    const elderlyCount = Math.round(
      reg.population * (reg.demographics.elderlyPct / 100),
    );

    this._tooltipEl.innerHTML = `
      <div class="threat-tooltip-header">
        <div class="threat-tooltip-title-col">
          <div class="threat-tooltip-reg-name">${reg.name}</div>
          <div class="threat-tooltip-province">${reg.province} • Illustrative zone · figures not sourced</div>
        </div>
        <span class="threat-badge ${threat.badgeClass}">${threat.label}</span>
      </div>

      <div class="threat-tooltip-status">
        <span class="threat-status-dot" style="background-color: ${threat.fillColor};"></span>
        <span>${threat.statusText}</span>
      </div>

      <!-- Total Population -->
      <div class="threat-tooltip-pop-row">
        <span class="threat-pop-label">TOTAL REGIONAL POPULATION</span>
        <span class="threat-pop-val">${reg.population.toLocaleString()} People</span>
      </div>

      <!-- Age Demographics Breakdown -->
      <div class="threat-demographics-section">
        <div class="threat-demo-header">Population Breakdown by Age:</div>
        
        <div class="threat-bar-container">
          <div class="threat-bar-segment segment-children" style="width: ${reg.demographics.childrenPct}%;" title="Children (<14): ${reg.demographics.childrenPct}%"></div>
          <div class="threat-bar-segment segment-adults" style="width: ${reg.demographics.adultsPct}%;" title="Adults (15-64): ${reg.demographics.adultsPct}%"></div>
          <div class="threat-bar-segment segment-elderly" style="width: ${reg.demographics.elderlyPct}%;" title="Elderly (65+): ${reg.demographics.elderlyPct}%"></div>
        </div>

        <div class="threat-demo-grid">
          <div class="threat-demo-cell">
            <span class="demo-chip chip-children">Children (&lt;14)</span>
            <span class="demo-cell-pct">${reg.demographics.childrenPct}%</span>
            <span class="demo-cell-count">${childrenCount.toLocaleString()}</span>
          </div>
          <div class="threat-demo-cell">
            <span class="demo-chip chip-adults">Adults (15–64)</span>
            <span class="demo-cell-pct">${reg.demographics.adultsPct}%</span>
            <span class="demo-cell-count">${adultsCount.toLocaleString()}</span>
          </div>
          <div class="threat-demo-cell">
            <span class="demo-chip chip-elderly">Elderly (65+)</span>
            <span class="demo-cell-pct">${reg.demographics.elderlyPct}%</span>
            <span class="demo-cell-count">${elderlyCount.toLocaleString()}</span>
          </div>
        </div>

        <div class="threat-special-note">
          <svg viewBox="0 0 24 24" class="threat-mini-icon"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <span>Priority Care: ${reg.demographics.infantsPregnant}</span>
        </div>
      </div>

      <!-- Available Regional Resources -->
      <div class="threat-resources-section">
        <div class="threat-res-header">Disaster Relief Resources in Region:</div>
        <div class="threat-res-list">
          <div class="threat-res-item">
            <span class="res-text"><strong>Boats &amp; Flotillas:</strong> ${reg.resources.boats}</span>
          </div>
          <div class="threat-res-item">
            <span class="res-text"><strong>Evacuation Camps:</strong> ${reg.resources.camps}</span>
          </div>
          <div class="threat-res-item">
            <span class="res-text"><strong>Air Assets:</strong> ${reg.resources.airAssets}</span>
          </div>
          <div class="threat-res-item">
            <span class="res-text"><strong>Medical Teams:</strong> ${reg.resources.medicalUnits}</span>
          </div>
          <div class="threat-res-item">
            <span class="res-text"><strong>Rations &amp; Water:</strong> ${reg.resources.rationsWater}</span>
          </div>
        </div>
      </div>
    `;

    this._placeTooltip(mousePos);
  }

  _communityTooltipHtml(c, band) {
    const windowText = c.windowH
      ? `+${c.windowH[0]}–${c.windowH[1]} h after trigger (illustrative, 1–3 m/s)`
      : 'Not on the trigger path';
    const histText =
      c.histFlood2022 == null
        ? 'Not available'
        : `${Math.round(c.histFlood2022 * 100)}% of area inside the UNOSAT 2022 extent`;
    return `
      <div class="threat-tooltip-header">
        <div class="threat-tooltip-title-col">
          <div class="threat-tooltip-reg-name">${escapeHtml(c.name)}</div>
          <div class="threat-tooltip-province">${escapeHtml(c.placeType)} • Community to watch</div>
        </div>
        <span class="threat-badge ${band.badgeClass}">${band.label}</span>
      </div>

      <div class="threat-tooltip-status">
        <span class="threat-status-dot" style="background-color: ${band.fillColor};"></span>
        <span>${COMMUNITY_STATUS_TEXT[c.status]}</span>
      </div>

      <div class="threat-tooltip-pop-row">
        <span class="threat-pop-label">≈ POPULATION · WORLDPOP 2025, MODELLED</span>
        <span class="threat-pop-val">≈${Math.round(c.population).toLocaleString()} people</span>
      </div>

      <div class="threat-resources-section">
        <div class="threat-res-list">
          <div class="threat-res-item">
            <span class="res-text"><strong>Arrival window:</strong> ${windowText}</span>
          </div>
          <div class="threat-res-item">
            <span class="res-text"><strong>2022 flood:</strong> ${histText}</span>
          </div>
          <div class="threat-res-item">
            <span class="res-text"><strong>Distance to river:</strong> ≈${Math.round(c.distanceToRiverM).toLocaleString()} m</span>
          </div>
          <div class="threat-res-item">
            <span class="res-text"><strong>OSM facilities:</strong> ${c.facilities.health} health · ${c.facilities.school} schools · ${c.facilities.shelter} shelter candidates</span>
          </div>
        </div>
      </div>

      <div class="threat-special-note">
        <span>Exercise data, not an official warning. Sources: HydroRIVERS, WorldPop, OpenStreetMap, UNOSAT.</span>
      </div>
    `;
  }

  _placeTooltip(mousePos) {
    const tooltipWidth = 360;
    const tooltipHeight = 440;
    let posX = mousePos.x + 20;
    let posY = mousePos.y + 15;

    if (posX + tooltipWidth > window.innerWidth) {
      posX = mousePos.x - tooltipWidth - 15;
    }
    if (posY + tooltipHeight > window.innerHeight) {
      posY = window.innerHeight - tooltipHeight - 15;
    }
    if (posY < 10) posY = 10;
    if (posX < 10) posX = 10;

    this._tooltipEl.style.left = `${posX}px`;
    this._tooltipEl.style.top = `${posY}px`;
    this._tooltipEl.classList.remove('hidden');
  }

  _hideTooltip() {
    if (this._tooltipEl) {
      this._tooltipEl.classList.add('hidden');
    }
  }

  destroy() {
    this.disable();
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    if (this._tooltipEl) {
      this._tooltipEl.remove();
      this._tooltipEl = null;
    }
  }
}
