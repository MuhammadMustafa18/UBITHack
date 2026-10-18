# Agahi Climate Intelligence — 10-Hour Implementation Spec

Turn FloodTrace Pakistan from a flood simulator into a multi-hazard climate
intelligence layer: grid-level risk scores for flood, heat, terrain, air and
vegetation, a composite score, a dashboard, bilingual (EN/UR) advisories and a
copilot that only reports computed numbers.

Built **inside the existing app** (Cesium globe, `googleMapsUI` pills, tools
catalog, MCP server, Vite middleware). No new framework, no new runtime deps.

---

## 0. Assumptions and decisions

| # | Decision | Default | Why |
|---|----------|---------|-----|
| A1 | Where it lives | Existing FloodTrace app | Globe, pills, panels, MCP and OpenAI plumbing already exist |
| A2 | Data path | **Precomputed static grid JSON** in `public/data/agahi/grid/` | Same pattern as `public/data/agaahi/*.geojson`; demo never depends on live GEE |
| A3 | Data source | Google Earth Engine (Python) → **fallback** keyless Open-Meteo (Node) | GEE auth/quota can block; decide at **H1 gate** |
| A4 | Scoring | Computed in the browser/server from raw metrics by one JS module | One source of truth for UI, copilot and MCP tools; weights tweakable without re-running pipeline |
| A5 | Copilot LLM | OpenAI Responses API with function tools (reuse `OPENAI_API_KEY`, rate limiter, request helpers) | Already configured; LLM call isolated in one function so provider swap is trivial |
| A6 | Urdu | Hand-written templates, numbers injected | No machine translation; a native speaker reviews strings before demo |
| A7 | AOIs | Swat–Kabul corridor, Sukkur, Karachi | Corridor data already exists; Sukkur heat + Karachi air/heat match published reports |
| A8 | Out of scope | Drone feeds, ground gauges, auth/multi-tenant, ML classifier training, live GEE in browser | No data source / not demoable in 10 h |

"ML classification" is honoured by Sentinel-1 threshold change detection +
JRC/ESA classified products. A trained classifier is out of scope; say so if asked.

---

## 1. Architecture

```
pipeline/agahi/  (offline, run once per AOI)
  gee_grid.py ──┐
  openmeteo_grid.mjs (fallback) ──► public/data/agahi/grid/<aoi>.json   (raw metrics + provenance)
                                         │
src/intelligence/                        ▼
  gridStore.js   load + index grid (browser fetch / server fs)
  scoring.js     raw metrics → hazard scores 0–100 → composite + band     ◄── single source of truth
  queries.js     cellAt · rankCells · aoiSummary · cellExplain           ◄── used by UI, MCP tools, copilot
  advisory.js    EN/UR advisory text from query results
  grounding.js   rejects LLM answers containing numbers not in tool results
  gridLayer.js   Cesium rectangles coloured by selected hazard + click → cellCard
  cellCard.js    per-cell breakdown + provenance
  dashboardPanel.js  AOI summary, top-N table, hazard means, advisory export
  copilotPanel.js    chat UI → /api/agahi/copilot

src/tools/queries/climate.js   MCP/voice tools wrapping queries.js
server/providers/agahiCopilot.js   POST /api/agahi/copilot (OpenAI tool loop + grounding)
src/ui/googleMapsUI.js   "Risk Intel" pill + hazard dropdown + Copilot pill (integration only)
```

---

## 2. Contract (frozen at H0 — every workstream codes against this)

### 2.1 Grid file `public/data/agahi/grid/<aoi>.json`

```json
{
  "aoi": "sukkur",
  "name": "Sukkur",
  "nameUr": "سکھر",
  "bbox": [68.70, 27.55, 69.00, 27.85],
  "cellDeg": 0.02,
  "generatedAt": "2026-10-18T10:00:00Z",
  "pipeline": "gee" ,
  "sources": {
    "sar":   { "dataset": "COPERNICUS/S1_GRD", "window": "2022-06-01/2022-09-30", "method": "VV post<-18dB & Δ<-3dB vs pre" },
    "jrc":   { "dataset": "JRC/GSW1_4/GlobalSurfaceWater", "band": "occurrence" },
    "hand":  { "dataset": "MERIT/Hydro/v1_0_1", "band": "hnd" },
    "lst":   { "dataset": "MODIS/061/MOD11A2", "window": "May–Jul 2023–2025", "unit": "°C" },
    "dem":   { "dataset": "USGS/SRTMGL1_003" },
    "flow":  { "dataset": "WWF/HydroSHEDS/15ACC" },
    "s5p":   { "dataset": "COPERNICUS/S5P/OFFL/L3_*", "window": "last 90 days" },
    "ndvi":  { "dataset": "MODIS/061/MOD13Q1", "trend": "mean(2023–2025) − mean(2015–2017)" },
    "pop":   { "dataset": "WorldPop/GP/100m/pop", "year": 2020 }
  },
  "cells": [
    {
      "id": "sukkur:12:7",
      "lat": 27.71, "lon": 68.85,
      "m": {
        "sarFloodFrac": 0.42, "jrcOccurrence": 18.0, "handM": 3.1,
        "lstDayC": 46.2, "uhiC": 3.4,
        "elevM": 62, "slopeDeg": 0.8, "flowAccLog10": 3.9,
        "no2": 0.00011, "co": 0.034, "so2": 0.00009, "aai": 0.6,
        "ndvi": 0.21, "ndviTrend": -0.04,
        "pop": 18450
      }
    }
  ]
}
```

Rules:
- `id` = `<aoi>:<col>:<row>`; `lat/lon` = cell centre; cell rectangle = centre ± `cellDeg/2`.
- **Missing metric = `null`, never `0`.** Fallback pipeline sets `pipeline: "openmeteo"` and fills `sources` with what it actually used (e.g. `lstDayC` from ERA5 2 m air temp → source says so).
- `public/data/agahi/aois.json` = `[{ "aoi", "name", "nameUr", "bbox", "file" }]`.
- Size budget: ≤ 1,500 cells / AOI, ≤ 600 KB.

### 2.2 `src/intelligence/scoring.js` (pure, no DOM, no Cesium)

```js
export const HAZARDS = ['flood', 'heat', 'terrain', 'air', 'veg'];
export const WEIGHTS = { flood: 0.30, heat: 0.25, terrain: 0.15, air: 0.15, veg: 0.15 };
export const BANDS = [[70, 'high'], [45, 'elevated'], [25, 'moderate'], [0, 'low']];
export function hazardScores(m)   // → { flood: 0–100|null, heat, terrain, air, veg }
export function compositeScore(m) // → { score: 0–100|null, band, coverage: 0–1, drivers: [hazard, hazard], hazards }
```

Formulas (`c(x) = clamp(x, 0, 1)`; any input `null` drops that term and renormalises within the hazard; hazard is `null` if all its terms are `null`):

| Hazard | Score ×100 |
|---|---|
| flood | `0.5·sarFloodFrac + 0.3·jrcOccurrence/100 + 0.2·c((15−handM)/15)` |
| heat | `0.7·c((lstDayC−30)/20) + 0.3·c(uhiC/6)` |
| terrain | `0.6·c(slopeDeg/30) + 0.4·c(flowAccLog10/5)` |
| air | mean of `c(no2/2e-4)`, `c((co−0.02)/0.03)`, `c(so2/5e-4)`, `c((aai+1)/3)` |
| veg | `0.6·c(−ndviTrend/0.1) + 0.4·c((0.3−ndvi)/0.3)` |

Composite = Σ wᵢ·scoreᵢ / Σ wᵢ over non-null hazards. `coverage` = Σ wᵢ (non-null).
`coverage < 0.5` → `band: 'insufficient_data'`, `score: null`. `drivers` = top 2 by wᵢ·scoreᵢ.
Air values are column densities (mol/m²) → label "relative indicator, not ground concentration".

### 2.3 `src/intelligence/gridStore.js`

```js
export async function loadAois(fetchImpl?)            // → aois.json
export async function loadGrid(aoi, fetchImpl?)       // → grid with cells[i].score = compositeScore(cells[i].m) precomputed; cached per aoi
```
Server side passes an `fs`-backed `fetchImpl` reading `public/data/agahi/…`.

### 2.4 `src/intelligence/queries.js` (pure over a loaded grid)

```js
export function cellAt(grid, lat, lon)                  // → cell | null (outside bbox → null)
export function rankCells(grid, { hazard = 'composite', limit = 10 })   // → [{ id, lat, lon, score, band, pop }]
export function aoiSummary(grid)                        // → { aoi, cells, bandCounts, hazardMeans, popByBand, topDrivers, coverageMean, pipeline }
export function cellExplain(grid, id)                   // → { id, lat, lon, metrics, hazards, composite, sources }
```
All numbers returned are already rounded to display precision (scores integer, °C 1 dp, fractions 2 dp) so the copilot and UI quote identical values.

### 2.5 `src/intelligence/advisory.js`

```js
export function advisory(explainOrSummary, lang /* 'en' | 'ur' */) // → { title, lines: string[], dir: 'ltr' | 'rtl' }
```
Template per band × top driver (e.g. `high` + `heat` → "Peak land-surface temperature {lstDayC} °C; prioritise cooling centres…"). Urdu strings are template literals with the same placeholders. Every number comes from the input object.

### 2.6 Tools (`src/tools/queries/climate.js`, via `defineTool`)

| Tool | Input | Returns |
|---|---|---|
| `get_climate_risk` | `{ lat, lon }` (POINT_SCHEMA) or `{ cell_id }` | `cellExplain` + suggested view |
| `rank_climate_risk` | `{ aoi, hazard, limit≤25 }` | `rankCells` |
| `get_aoi_risk_summary` | `{ aoi }` | `aoiSummary` |
| `get_climate_advisory` | `{ cell_id \| aoi, lang }` | `advisory` |

Registered in `src/tools/index.js` `coreTools` → automatically available to MCP server and voice.

### 2.7 Copilot endpoint `POST /api/agahi/copilot`

Request `{ question: string ≤ 500, aoi?: string, cellId?: string, lang?: 'en'|'ur' }`.
Response `{ answer, grounded: boolean, calls: [{ tool, args }], fallback?: string }`.

Flow: rate-limit (`openAiRateLimiter`) → OpenAI Responses API with the 4 tools as function tools → execute calls locally against `queries.js` (max 4 rounds) → `grounding.check(answer, toolResults)` → if ungrounded, return the deterministic summary of the last tool result instead with `grounded:false, fallback:'deterministic'`. No key → `503 { error: 'OPENAI_API_KEY not set' }` (UI still offers the quick-question chips, which call tools directly).

System instructions: "Answer only from tool results. Never estimate, extrapolate or round differently. If a value is null say 'no data'. Cite the source dataset name."

### 2.8 `src/intelligence/grounding.js`

```js
export function extractNumbers(text)            // handles 1,234 · 12.5 · 46.2°C · 42% · Urdu digits ۰-۹
export function check(answer, toolResults)      // → { ok, unknown: number[] }
```
A number is grounded if it equals any number found (recursively) in tool results at the same or coarser precision, or equals x·100 for a fraction x (percent). Years and list ordinals 1–25 are allowed.

---

## 3. Parallel workstreams

Five sessions. **Disjoint file ownership** — nobody edits a file owned by another
stream. Shared seams are the contract in §2 and the fixture below.

| WS | Owner files (create/edit only these) | Starts | Ends |
|----|----|----|----|
| **WS0 Core contract** (lead) | `src/intelligence/{scoring,gridStore,queries,grounding}.js`, `src/intelligence/scoring.test.mjs`, `src/intelligence/grounding.test.mjs`, `public/data/agahi/aois.json`, `public/data/agahi/grid/fixture.json` | H0 | H1.5 |
| **WS1 Data pipeline** | `pipeline/agahi/**`, `public/data/agahi/grid/{swat_kabul,sukkur,karachi}.json` | H0 | H5 |
| **WS2 Map layer** | `src/intelligence/{gridLayer,cellCard}.js`, `src/ui/styles/agahi-grid.css` | H0 | H5 |
| **WS3 Dashboard + advisories** | `src/intelligence/{dashboardPanel,advisory}.js`, `src/ui/styles/agahi-dashboard.css` | H0 | H5 |
| **WS4 Copilot** | `src/tools/queries/climate.js`, `server/providers/agahiCopilot.js`, `src/intelligence/copilotPanel.js`, `src/ui/styles/agahi-copilot.css` | H0 | H6 |
| **WS5 Integration** (lead, after WS0) | `src/ui/googleMapsUI.js`, `style.css`, `src/tools/index.js`, `server/providers/openai.js` (route line only), `src/data/dataCredits.js`, `README.md`, `docs/CURRENT-STATE.md` | H5 | H8 |

WS2–WS4 start at H0 by importing the §2 signatures; until WS0 lands they stub
the import with a 5-line local shim and delete it at merge. `fixture.json` (~40
cells over Sukkur, hand-written, mixed nulls) is WS0's **first** commit (≤ 20 min)
so every UI stream renders real-shaped data immediately.

### Merge order
WS0 → (WS1, WS2, WS3, WS4 in any order — no file overlap) → WS5.
Each stream works on its own branch `agahi/ws<N>-<slug>` off `harry`.

---

## 4. Workstream briefs

### WS0 — Core contract (lead, H0–H1.5)
1. `fixture.json` + `aois.json` (commit first). → verify: valid JSON, nulls present in ≥ 1 hazard per cell type.
2. `scoring.js` exactly per §2.2.
3. `gridStore.js`, `queries.js` per §2.3–2.4 (rounding in `queries.js` only).
4. `grounding.js` per §2.8.
5. Tests (the only two new test files in the project):
   - `scoring.test.mjs`: (a) null metric never scores as 0 risk — cell with only `lstDayC` gives heat score, composite `insufficient_data`; (b) renormalisation — dropping `air` keeps composite equal to weighted mean of the rest; (c) band edges 70/45/25.
   - `grounding.test.mjs`: (a) answer quoting `46.2°C` from result passes; (b) invented `47` fails; (c) `42%` from `0.42` passes; (d) Urdu digits `۴۶٫۲` pass.
   → verify: user runs `npm test`.

### WS1 — Data pipeline (H0–H5)
**H0–H1 gate:** try `earthengine authenticate` + a 1-cell `reduceRegions` on Sukkur.
- Works → GEE path. Fails by H1 → Open-Meteo path. Do not do both.

GEE path `pipeline/agahi/gee_grid.py <aoi>`:
- Build grid `ee.FeatureCollection` from bbox/cellDeg.
- Images per §2.1 `sources`: S1 VV change detection → flood mask → `mean` per cell = `sarFloodFrac`; JRC `occurrence` mean; MERIT `hnd` median; MOD11A2 `LST_Day_1km·0.02−273.15` summer mean; UHI = cell LST − median LST of ESA WorldCover non-built (class ≠ 50) cells in AOI; SRTM elev mean, `ee.Terrain.slope` mean; HydroSHEDS 15ACC max → log10; S5P NO2/CO/SO2/AAI 90-day mean; MOD13Q1 NDVI·1e-4 recent mean and trend; WorldPop sum.
- One `reduceRegions` per image at native-ish scale, `getInfo()` (cells ≤ 1,500 fits), merge, write §2.1 JSON. Missing → `null`.

Open-Meteo fallback `pipeline/agahi/openmeteo_grid.mjs <aoi>` (Node, no deps):
- `api.open-meteo.com/v1/elevation` (100 coords/call) → `elevM`; slope from neighbour elevation differences.
- `air-quality-api.open-meteo.com` hourly `nitrogen_dioxide, carbon_monoxide, sulphur_dioxide, aerosol_optical_depth` past 30 days mean → write to `no2/co/so2` **with units µg/m³** and `aod` in place of `aai`; set `sources.s5p` to describe CAMS, and WS0 adds a µg/m³ threshold branch (`no2/40`, `co/4000`, `so2/40`, `aod/1`) keyed on `pipeline === 'openmeteo'`.
- `archive-api.open-meteo.com` ERA5 `temperature_2m_max` May–Jul 2023–2025 mean → `lstDayC` (source says "ERA5 2 m air temp, not LST"); `uhiC` null.
- Flood: Swat–Kabul only, from `public/data/agaahi/communities.geojson` `hist_flood_frac_2022` (UNOSAT) by point-in-polygon; others null. NDVI, HAND, flow null.
- Throttle 5 req/s; cache responses in `.gev-cache/agahi/`.

Deliver 3 AOI files by H5 (Sukkur first, then Karachi, then Swat–Kabul). Push each as soon as it exists.

### WS2 — Map layer (H0–H5)
`gridLayer.js`:
```js
export class RiskGridLayer {
  constructor(viewer, { onCellClick })
  async show(aoi)            // loadGrid, add one Cesium Primitive (GeometryInstances of RectangleGeometry) — not 1,500 entities
  hide()
  setHazard(hazard)          // 'composite' | HAZARDS[i]; recolour via per-instance color attribute
  flyTo()                    // camera to bbox
  destroy()
}
```
- Colour ramp: low `#2e7d32` → moderate `#f9a825` → elevated `#ef6c00` → high `#c62828`; `null` → hatched grey `#9e9e9e` alpha 0.25 (no data ≠ safe). Alpha 0.55.
- Click: `ScreenSpaceEventHandler` pick → `instance id` → `onCellClick(cellExplain(...))`.
- Legend element (bottom-left) with hazard name and band ramp.
`cellCard.js`: `renderCellCard(explain, { lang })` → DOM node: composite + band chip, 5 hazard bars, raw metrics with units, sources list, "Advisory EN | UR" buttons (call `advisory()` from WS3 — import path fixed by §2.5).
→ verify: open app with fixture, toggle hazard, click cell; no console errors.

### WS3 — Dashboard + advisories (H0–H5)
`dashboardPanel.js`:
```js
export class RiskDashboardPanel {
  constructor({ onSelectCell, onAoiChange })
  show(aoi) / hide() / toggle()
}
```
- AOI select (from `aois.json`), header with `pipeline` badge ("GEE" / "Open-Meteo fallback").
- KPI row: cells, % high+elevated, population in high band, coverage mean.
- Hazard means as 5 horizontal bars (CSS only, no chart lib).
- Top-10 table from `rankCells` with hazard switcher; row click → `onSelectCell(id)`.
- "Area advisory" EN/UR toggle; Urdu block `dir="rtl" lang="ur"` with a Noto Nastaliq Urdu font fallback stack.
- Export: "Download briefing" → `Blob` of standalone HTML (summary + advisory both languages) via `URL.createObjectURL`; "Print" → `window.print()` with print stylesheet.
`advisory.js` per §2.5: 5 drivers × 4 bands templates EN + UR, plus `insufficient_data` template. Keep strings in one object per language.
→ verify: fixture renders, Urdu reads RTL, download opens offline.

### WS4 — Copilot (H0–H6)
1. `src/tools/queries/climate.js`: 4 tools per §2.6 using `defineTool`, `POINT_SCHEMA`, `suggestView` (mirror `environment.js` style). Grid loaded via `gridStore.loadGrid` with fs-backed fetch on server.
2. `server/providers/agahiCopilot.js`: export `handleAgahiCopilot(req, res)` modelled on `server/providers/openai/hud-summary.js` (same key check, `enforceRateLimit(openAiRateLimiter())`, `readRequestBody(req, 16 * 1024)`, never relay upstream error text). Responses API with `tools` = the 4 tool schemas; loop executing `function_call` items locally, append `function_call_output`, max 4 rounds; then `grounding.check`. Model: `process.env.OPENAI_AGAHI_MODEL || 'gpt-5-mini'` (inline default; `constants.js` stays untouched).
3. `copilotPanel.js`: `export class CopilotPanel { constructor({ getContext }) show/hide/toggle }` — message list, input, 4 quick chips that call tools **directly** (no LLM): "Riskiest 5 cells", "Heat summary", "Explain selected cell", "Urdu advisory". Each answer shows a "Computed by: tool(args)" footer and a ⚠ badge when `grounded:false`.
→ verify: with key, "What is the heat risk in Sukkur?" returns numbers that appear in `get_aoi_risk_summary`; an injected ungrounded number triggers fallback.

### WS5 — Integration (lead, H5–H8)
1. `googleMapsUI.js`: add pills `Risk Intel` (opens dashboard + grid layer, hazard dropdown in same pill menu pattern as `data-category` pills) and `Copilot`. Wire `onSelectCell` → `gridLayer` highlight + `cellCard`; copilot `getContext` → `{ aoi, cellId }`.
2. `style.css`: `@import` the three `agahi-*.css` files after `simulation.css`.
3. `src/tools/index.js`: add climate tools to `coreTools`.
4. `server/providers/openai.js`: `middlewares.use('/api/agahi/copilot', sameSiteGated(handleAgahiCopilot));`.
5. `dataCredits.js`: `AGAHI_GRID_CREDIT` listing Copernicus Sentinel-1/5P, MODIS, SRTM, JRC GSW, MERIT Hydro, HydroSHEDS, WorldPop (or Open-Meteo/CAMS/ERA5 for fallback); register when grid layer shows.
6. Docs: README section + `docs/CURRENT-STATE.md` entry. `.env.example`: `OPENAI_AGAHI_MODEL=`.
→ verify: user runs `npm run check:boundaries` (new `src/intelligence` imports `src/tools/area.js`; if the boundary checker objects, move the import, don't disable the check), `npm test`, `npm run dev`.

---

## 5. Timeline

| Hour | Lead (WS0/WS5) | WS1 | WS2 | WS3 | WS4 |
|---|---|---|---|---|---|
| 0–0.3 | fixture.json + aois.json | GEE auth try | layer skeleton (shim) | panel skeleton (shim) | tools skeleton (shim) |
| 0.3–1.5 | scoring, queries, grounding, 2 tests | **H1 gate** → pick path, Sukkur grid | Primitive grid + colour | KPIs + table | server tool loop |
| 1.5–5 | review/merge WS PRs as they land | Karachi, Swat–Kabul | click + card + legend | advisories EN/UR + export | grounding wiring + panel |
| 5–6 | start integration | regenerate if scoring needs metric fixes | merge | merge | finish + merge |
| 6–8 | pills, credits, routes, docs | support | bug fixes on integration | bug fixes | bug fixes |
| 8–9.5 | **feature freeze H8** · demo script rehearsal ×2 | | | | |
| 9.5–10 | buffer | | | | |

Cut list if late (in order): NDVI trend → terrain flow accumulation → print stylesheet → copilot free-text (keep chips) → Swat–Kabul grid (corridor sim already covers flood).

---

## 6. Demo script (5 min)

1. Open app → Risk Intel → Sukkur. Composite grid, pipeline badge, KPIs.
2. Switch hazard to Heat → hottest cells; click one → card with LST, UHI, sources.
3. Urdu advisory on that cell → download briefing.
4. Karachi → Air hazard; top-10 table.
5. Copilot: "Which 5 cells in Karachi have the highest air risk and why?" → answer + "Computed by" footer. Ask "What will the temperature be next year?" → refuses / "no data", never invents.
6. Swat–Kabul → existing flood simulation + grid flood layer side by side.

---

## 7. Acceptance criteria

- [ ] 3 AOI grids load; every cell has composite score or `insufficient_data`.
- [ ] No-data cells render grey, never green.
- [ ] Every number shown in card, dashboard, advisory and copilot traces to `queries.js` output.
- [ ] Copilot ungrounded answers are replaced, never shown as-is.
- [ ] Urdu advisory renders RTL and exports offline.
- [ ] MCP clients see the 4 climate tools.
- [ ] `npm test` and `npm run check:boundaries` pass (run by user).
