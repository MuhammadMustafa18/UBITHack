# FireTrace: 3D Wildfire Forensic Analysis & Geospatial Dashboard

An interactive, high-precision 3D geospatial dashboard for wildfire forensic analysis, multi-UAV aerial fleet tracking, and incident command logistics — inspired by cutting-edge digital twin geospatial defense and fire-mapping systems.

---

## 🗺️ Key Features

### 1. 3D Mountain Topography & Active Fire Front
- **Procedural Canyon Landscape**: Accurate elevation terrain representing the San Gabriel Mountain range (peaking at Mesa Peak at 1,892 m).
- **Burn Scar & dNBR Heatmaps**: Time-scrubbed burn scar polygons with glowing active fire front emitters and emissive embers.
- **Isochrone Spread Lines**: Sequential contour progression lines with spread directional vectors (`Aug 14 18:00`, `Aug 15 00:00`, `Aug 15 06:00`, `Aug 15 12:00`).
- **Interactive Terrain Probe**: Real-time raycasting inspection displaying elevation, slope, aspect, fuel type, and time burned on mouse hover.
- **2D / 3D Orthographic Switcher**: Seamlessly toggle between top-down topographic contour maps and 3D oblique perspective.

### 2. Live Drone Fleet Telemetry & Picture-in-Picture (PIP) HUD
- **6 Airborne UAVs**: Tracks fixed-wing, hexacopters, and quadcopters (`FT-01 Kestrel` to `FT-06 Wren`) with orbit rings and altitude guidance lines.
- **Gimbal HUD Overlay**: Realistic UAV reticle with artificial horizon pitch ladders, heading tape, and target coordinate tracking.
- **Sensor Palette Switching**:
  - **EO (Electro-Optical)**: Natural daylight optical feed with smoke plume visualization.
  - **IR (Infrared FLIR)**: False-color thermal heatmap highlighting high-temperature hotspots up to 983 °C.
- **Ride-Along Chase Camera**: Dynamic camera damping that locks onto any drone or vehicle for a chase-cam perspective.

### 3. Resource Logistics & Command Operations
- **13 Active Units**: VLAT tankers (DC-10), large tankers (C-130Q), helitankers (S-64 Skycrane), wildland engines (E-31, E-45), and Hotshot hand crews (C-7, C-14).
- **Canyon Road Navigation**: Animated ground units patrolling winding mountain passes.
- **Air Ops Drop Log**: Real-time retardant and water drop tracking with geographic coordinates.

### 4. Forensic Timeline & Multi-Metric Graphs
- **Play/Pause/Scrubbing**: Seamless forensic replay from ignition (Aug 14, 14:26) to containment (Aug 18, 11:20) with 1x, 2x, 5x, and 10x playback speeds.
- **Key Forensic Events**: Quick jump bookmarks for Ignition, Rapid Growth, Spot Fire, Ridge Crossing, and Containment.
- **Context-Aware Analytics**:
  - **Incident Mode**: Fire Area (acres), Rate of Spread (chains/hr), and Elevation Profile.
  - **Drones Mode**: Altitude (ft AGL), Max Temperature in View (°C), and Battery Discharge (%).
  - **Resources Mode**: Retardant Dropped (gal), Fire Line Built (chains), and Personnel Assigned.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **3D Graphics Engine**: Three.js (WebGL shaders, procedural heightmaps, instanced foliage, dynamic lighting)
- **Styling**: Tailwind CSS (custom sand/tactical HUD theme)
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/MuhammadMustafa18/UBITHack.git
cd UBITHack

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to explore the 3D dashboard.

### Production Build

```bash
npm run build
npm run preview
```
