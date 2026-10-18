<div align="center">

# 🌊 FloodTrace Pakistan (Agahi Intelligence Digital Twin)
### 3D Climate Forensics, Predictive Inundation Analytics & AI Rescue Command Twin

**Built for UBITHack · Powered by CesiumJS 3D Photorealistic Geospatial Engine & Gemini AI**

*A unified disaster response platform for Pakistan: combining high-resolution 3D terrain, hydrological physics simulation, grid-level multi-hazard risk models, live citizen distress dispatch, and AI rescue resource defense.*

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![CesiumJS](https://img.shields.io/badge/CesiumJS-3D_Geospatial-0052cc)](https://cesium.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Live_SOS_Registry-3ECF8E?logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini_%26_Claude-8E75C4)](https://deepmind.google/technologies/gemini/)

</div>

---

## 🌟 Executive Summary

**FloodTrace Pakistan** provides provincial and national disaster authorities (NDMA, PDMA, Rescue 1122), field commanders, and vulnerable citizens with a real-time, 3D geospatial intelligence platform. 

Rather than relying on fragmented, delayed satellite feeds or coarse national averages, FloodTrace synthesizes **Earth Observation data, hydrological physics, real-time weather streams, and live citizen SOS beacons** into a unified, actionable operating picture.

---

## 🚀 Key Systems & Architecture

```
                                    +-----------------------------------------+
                                    |       EARTH OBSERVATION & SENSORS       |
                                    | Sentinel-1 SAR · OpenMeteo · River Data |
                                    +--------------------+--------------------+
                                                         |
                                                         v
                                    +-----------------------------------------+
                                    |         AGAHI CLIMATE INTELLIGENCE      |
                                    |  Grid-level composite & hazard scoring  |
                                    +--------------------+--------------------+
                                                         |
                         +-------------------------------+-------------------------------+
                         |                                                               |
                         v                                                               v
+-------------------------------------------------+             +-------------------------------------------------+
|             DISASTER FORECAST ENGINE            |             |         EMERGENCY RESCUE & TRIAGE CENTER        |
|  - Continuous Multi-Scale (Minute to Weekly)    |             |  - Citizen Distress Messaging (Web / Mobile)    |
|  - 5 Real-world Pakistan Scenarios              |             |  - 1-Click GPS Lock & Supabase Emergency Queue  |
|  - Downstream Risk Polygons & Dam Deficits      |             |  - P1-P4 AI Life-Threat Triage & Flotilla Route |
+-------------------------------------------------+             +-------------------------------------------------+
                         |                                                               |
                         +-------------------------------+-------------------------------+
                                                         |
                                                         v
                                    +-----------------------------------------+
                                    |        3D DIGITAL TWIN & COMMAND        |
                                    |   CesiumJS 3D photorealistic globe UI   |
                                    |   Gemini-styled minimal white cockpit   |
                                    +-----------------------------------------+
```

---

## 🌊 1. Disaster Forecast Engine & Inundation Forensics

Simulates flood propagation across the complex topography of the Indus River Basin, northern gorges, and coastal delta:

- **Continuous Multi-Scale Simulation:** Infinite, uncapped flood flow across **Minute-by-Minute**, **Hourly**, **Daily**, and **Weekly** scales with seamless timeline scrubbing.
- **5 Authentic Pakistan Disaster Scenarios:**
  1. **Glacier GLOF Breach:** High-altitude Shisper / Hunza glacial outburst surge into Karakoram gorges.
  2. **Transboundary Release:** Sudden discharge from Chenab / Sutlej border dams.
  3. **Koh-e-Suleman Hill Torrents:** Flash torrent surge cutting off Rajanpur and Dera Ghazi Khan.
  4. **Super Flood Inundation:** Kabul–Indus confluence overflow with levee breaches threatening Nowshera and Charsadda.
  5. **Arabian Sea Cyclone Surge:** Coastal storm surge inundating Thatta, Badin, and Karachi littoral zones.
- **Dynamic Magnitude Scaling:** 4 severity grades (Moderate 0.5x, High 1.0x, Very High 1.6x, Super Flood 2.6x) dynamically scaling cusecs discharge, stage elevation (+m), and lateral breach radius.
- **Predictive Breach Polygons & Downstream Impact:** Real-time projected wavefront polygons forecasting downstream inundation ETAs and arrival windows.
- **National Demographic & Threat Tiers:** Pakistan segmented into 19 contiguous regional sectors classified into 5 threat levels (Critical Inundation, High Threat, Moderate Watch, Low Advisory, Secure Staging), detailing total population, age demographic breakdown (children, adults, elderly), and local rescue inventories.

---

## 🌡️ 2. Agahi Climate Risk Intelligence & Copilot

Grid-level multi-hazard risk engine modeled after Pakistan's vulnerability hotspots:

- **6 Hazard Dimensions:** Composite Risk, Flood Exposure, Land Surface Temperature (Heat), Terrain & Drainage Slope, Air Quality (NO₂/Aerosols), and Vegetation NDVI trends.
- **Areas of Interest (AOIs):** Granular grid risk profiles computed for **Sukkur**, **Karachi**, and **Swat–Kabul**.
- **Evidence-Based Grounding:** The AI copilot never invents numbers; answers cite deterministic engine calculations with bilingual advisories (English & Urdu).
- **Automated Open-Meteo Pipelines:** Regenerate live grid facts with keyless telemetry scripts in `pipeline/agahi/`.

---

## 🚨 3. Citizen SOS Beacon & Emergency Rescue Center (`/rescue`)

A citizen-to-command dispatch bridge styled after modern Gemini design principles:

- **Starter Portal:** Choose between **[Call for Help (Citizen SOS)]** or **[Command Dashboard]**.
- **Citizen Web Dispatcher:** Works in any browser (Chrome/mobile) with zero app download:
  - **1-Click GPS Lock:** Auto-detects device coordinates with fallback to local district pins.
  - **Conversational Emergency Chat:** Stranded citizens describe rising water, trapped children/elderly, and medical emergencies.
  - **Real-Time Supabase Sync:** Dispatches distress records to central Supabase table `rescue_requests` with automated local storage failover for offline resilience.
- **Tactical Rescue Command:**
  - Automated **P1–P4 AI Urgency Triage** (P1 Critical Life Threat, P2 Medical Urgent, P3 Stranded Group, P4 Food/Water Logistics).
  - One-click flotilla dispatch for swift-water rescue boats, high-volume dewatering pumps, and Army Aviation medevac.
  - Conversational **Rescue Intelligence Copilot** with active simulation ID awareness, breach wave ETAs, and asset deficit calculations.

---

## 🎮 4. Real-Time Resource Defense Simulation

Interactive operational allocation engine:
- Deploy rescue boats and firetruck pumps to secure vulnerable bunds and populated sectors.
- Real-time safeguard currency calculations and deficit monitoring.
- Dynamic vehicle transit routes modeled directly on the 3D globe.

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- Node.js 20+ or 22+
- Chrome or any WebGL2-compatible hardware-accelerated browser

### Installation

```bash
# 1. Clone repository
git clone https://github.com/MuhammadMustafa18/UBITHack.git
cd UBITHack

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open **`http://localhost:4173`** in your browser.

---

## ⚙️ Environment Variables (`.env`)

To enable cloud features, create a `.env` file in the root directory (see `.env.example`):

```bash
# Supabase Citizen SOS Registry
VITE_SUPABASE_URL="https://pohmxlkyxljuwizhofzj.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_lBbhAhNYIRiJuWzFL0Is-Q_nXU8_XWk"

# LLM Intelligence (Anthropic / OpenAI)
VITE_ANTHROPIC_BASE_URL="https://token-plan-sgp.xiaomimimo.com/anthropic"
VITE_ANTHROPIC_AUTH_TOKEN="tp-s6p0t8aywzu6coascjrefmgw5106ddfgs7qgrqe0rcps673o"
OPENAI_API_KEY="" # Optional: for Agahi serverless copilot
```

---

## 🚢 Production Deployment (Vercel)

FloodTrace is pre-configured for instant deployment on Vercel:

1. Push your repository to GitHub.
2. Import the project into **Vercel**.
3. In **Settings ➔ Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ANTHROPIC_BASE_URL`
   - `VITE_ANTHROPIC_AUTH_TOKEN`
4. Click **Deploy**. Build command is `npm run build` and output directory is `dist`.

---

## 👥 UBITHack Team & Credits

- **Muhammad Mustafa**
- **Muhammad Haris**
- **Aaqib Zahid**

*Special thanks to NDMA, PMD Pakistan, Open-Meteo, Copernicus Sentinel data, and open-source CesiumJS community.*
