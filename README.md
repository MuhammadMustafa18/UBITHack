# FloodTrace Pakistan 🌊
### AI-Powered 3D Flood Inundation Predictor, River Forensics & Disaster Rescue Digital Twin

Developed for **UBITHack**, **FloodTrace Pakistan** is a next-generation 3D geospatial dashboard engineered for flood early-warning, dynamic water level rise prediction, and joint disaster response coordination across Pakistan's most vulnerable river basins (Kabul/Swat rivers, Indus Basin, and hill-torrent corridors).

---

## 🇵🇰 Pakistan Basins & Incident Presets

- **Nowshera & Swat Confluence (Khyber Pakhtunkhwa)**: Mountain canyon flash flood surge through gorge bottlenecks into residential floodplains.
- **Sukkur Barrage & Dadu Basin (Sindh)**: High monsoonal Indus discharge, breach dynamics, and agricultural inundation.
- **Taunsa & Rajanpur Hill Torrents (South Punjab)**: Sulaiman range flash floods overflowing into rural communities.
- **Charsadda & Kabul River Basin (KPK)**: Pre-breach river swelling and Warsak Dam spillway management.

---

## 🗺️ Core Capabilities

### 1. 3D Hydrological Topography & Dynamic Flood Rise
- **River Basin Elevation Topography**: 3D terrain profile rendering river channels, floodplain contours, agricultural plots, ring bunds, and vulnerable highway bridges (Nowshera GT Road Bridge).
- **Dynamic Water Rise & Depth Color Ramp**:
  - `0.5m – 1.5m`: Translucent cyan (ankle to waist depth).
  - `1.5m – 3.5m`: Aqua/teal (ground floor submergence, vehicles drowned).
  - `3.5m – 8.0m+`: Dark navy torrent (rooftops submerged, swift currents up to 2.8 m/s).
- **Breach Zone Simulation**: Interactive Western Ring Bund rupture with rush water vector visualization.
- **Real-Time Flood Probe**: Hover anywhere across the basin to calculate:
  - Exact coordinates (GPS WGS84)
  - Ground Elevation (`m MSL`)
  - Water Inundation Depth (`m`)
  - Flow Velocity (`m/s`)
  - Infrastructure Risk & Evacuation Urgency

### 2. Multi-Agency Rescue Fleet & Thermal FLIR Body Heat Detection
- **Rescue 1122 & NDMA Drone Fleet**: Fixed-wing VTOLs and heavy quadcopters (`Shaheen-1`, `Uqab-2`, `Burraq-3`, `Baaz-4`, `Huma-5`, `Ababeel-6`).
- **Thermal FLIR 8-14µm Sensor Mode**:
  - Differentiates cold floodwaters (21 °C) from stranded human body heat (37.2 °C).
  - Automatically identifies and bounds clusters of stranded families on rooftops and isolated trees.
- **Ride-Along Chase Camera**: Smooth camera damping locks onto any aircraft, rescue boat, or drone for a first-person tactical view.

### 3. Relief Operations & Joint Command Logistics
- **Pakistan Army Aviation**: Mil Mi-17 heavy helicopters (ration drops & roof winching) and Bell 412s.
- **Pakistan Navy & Rescue 1122**: Zodiac inflatable boats and fiberglass rescue craft conducting door-to-door boat evacuations.
- **Frontier Works Organization (FWO)**: Heavy bulldozers constructing emergency secondary ring embankments and high-capacity dewatering pumps.
- **Live Rescue & Evacuation Log**: Real-time counter of citizens rescued, children air-lifted, and ration packs delivered.

### 4. Hydrological Timeline & Discharge Analytics
- **Monsoon Deluge Progression**: Scrub forward and backward between pre-surge warning (Jul 26) through Super Flood crest (285,000 cusecs on Jul 28) to recession and dewatering.
- **Synchronized Charts**:
  - River Discharge Inflow vs Outflow (`cusecs`)
  - Inundated Farmland & Residential Area (`sq km` / `acres`)
  - Water Depth Progression (`meters`)
  - Displaced Citizen Count (~62,400 affected)

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **3D Geospatial Engine**: Three.js (dynamic water rise shaders, procedural river valleys, instanced buildings, tactical lighting)
- **Styling**: Tailwind CSS (Tactical Dark Navy / Cyan HUD)
- **Icons**: Lucide React

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/MuhammadMustafa18/UBITHack.git
cd UBITHack

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to explore FloodTrace Pakistan.
