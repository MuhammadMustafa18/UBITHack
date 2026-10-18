# Agahi — Agent Prompts (copy-paste, one per session)

Spec: [AGAHI-INTELLIGENCE-SPEC.md](AGAHI-INTELLIGENCE-SPEC.md). Every prompt below
is self-contained. Launch WS0–WS4 at the same time (each in its own git
worktree); launch WS5 when WS0–WS4 have merged.

Branch base for every stream: `harry`.

---

## Shared preamble (paste this where each prompt says `<SHARED PREAMBLE>`)

```
PROJECT: FloodTrace Pakistan (D:\code\UBITHack) — Vite + vanilla JS + Cesium globe app.
We are adding "Agahi Climate Intelligence": grid-level multi-hazard risk scores
(flood, heat, terrain, air, vegetation → composite), a map layer, a dashboard,
EN/UR advisories and a grounded copilot. 10-hour hackathon. Ship working, minimal code.

READ FIRST: docs/AGAHI-INTELLIGENCE-SPEC.md — §2 is the frozen contract. Do not change
contract signatures or JSON shapes. If the contract is wrong, stop and write the
problem in your final report instead of changing it.

RULES
- Edit/create ONLY the files in "YOU OWN". Never touch another stream's files.
- Use CodeGraph (codegraph_explore) before Read/Grep to understand existing code.
- Match surrounding code style (ES modules, 2-space, single quotes, no TypeScript).
- No new npm dependencies. No comments unless critical. No speculative abstractions.
- Missing data is null, never 0. Never present no-data as safe/low risk.
- Do NOT run npm scripts, tests, builds or the dev server. When verification is needed,
  write the exact command in your final report for the human to run.
- Commit on your branch with Conventional Commits. Do not push to harry or main.
- Finish with a report: files changed, what works, what is stubbed, commands to run.
```

---

## WS0 — Core contract (lead)

```
<SHARED PREAMBLE>

ROLE: WS0 Core contract. Every other stream imports your modules. Speed matters:
the fixture must land first (≤ 20 min) so UI streams can render real-shaped data.

BRANCH: agahi/ws0-core

YOU OWN
- public/data/agahi/aois.json
- public/data/agahi/grid/fixture.json
- src/intelligence/scoring.js
- src/intelligence/gridStore.js
- src/intelligence/queries.js
- src/intelligence/grounding.js
- src/intelligence/scoring.test.mjs
- src/intelligence/grounding.test.mjs

TASKS (in order, commit after each)
1. fixture.json: ~40 cells over Sukkur, bbox [68.70,27.55,69.00,27.85], cellDeg 0.02,
   shape exactly per spec §2.1, aoi "fixture", pipeline "gee". Vary values so all
   4 bands appear. Include cells with nulls: one with only lstDayC, one with all air
   null, one fully null. aois.json lists fixture + sukkur + karachi + swat_kabul
   (file names per spec; only fixture exists yet). COMMIT IMMEDIATELY.
2. scoring.js: HAZARDS, WEIGHTS, BANDS, hazardScores(m), compositeScore(m) exactly per
   §2.2 formulas. Null term → dropped and renormalised within hazard; hazard null if
   all terms null; composite renormalises over non-null hazards; coverage<0.5 →
   { score:null, band:'insufficient_data' }; drivers = top 2 by weight·score.
   Also support pipeline === 'openmeteo' air units (µg/m³): no2/40, co/4000, so2/40,
   aod/1 replacing aai — expose as compositeScore(m, { pipeline }).
3. gridStore.js: loadAois(fetchImpl?), loadGrid(aoi, fetchImpl?) — fetch
   `${import.meta.env?.BASE_URL || '/'}data/agahi/...` (same pattern as
   src/simulation/corridorResponse.js DATA_ROOT), precompute cells[i].score, cache per
   aoi, clear cache on failure. Must also work in Node when a fetchImpl is passed
   (no import.meta.env there → fall back to '/').
4. queries.js: cellAt, rankCells, aoiSummary, cellExplain per §2.4. Rounding happens
   HERE only: scores integer, °C 1 dp, fractions 2 dp, pop integer. Reuse distance
   helpers from src/tools/area.js only if needed.
5. grounding.js: extractNumbers(text), check(answer, toolResults) per §2.8 —
   thousands separators, decimals, °C, %, Urdu/Arabic-Indic digits (۰-۹ and ٠-٩,
   decimal mark ٫), fraction↔percent, allow years 1900–2100 and ordinals 1–25.
6. Tests (node:test + node:assert, look at an existing *.test.mjs for the style):
   scoring.test.mjs: null never scores as 0 risk; renormalisation when air missing;
   band edges 70/45/25; insufficient_data when coverage<0.5.
   grounding.test.mjs: quoted 46.2°C passes; invented 47 fails; 42% from 0.42 passes;
   Urdu digits ۴۶٫۲ pass.

DONE WHEN: all 8 files exist, fixture loads through loadGrid, report lists `npm test`.
```

---

## WS1 — Data pipeline

```
<SHARED PREAMBLE>

ROLE: WS1 Data pipeline. Produce real grid JSON for 3 AOIs.

BRANCH: agahi/ws1-pipeline

YOU OWN
- pipeline/agahi/** (new folder)
- public/data/agahi/grid/sukkur.json
- public/data/agahi/grid/karachi.json
- public/data/agahi/grid/swat_kabul.json

AOIs (bbox lonW,latS,lonE,latN · cellDeg)
- sukkur      [68.70, 27.55, 69.00, 27.85] · 0.02
- karachi     [66.85, 24.75, 67.35, 25.10] · 0.02
- swat_kabul  derive from public/data/agaahi/communities.geojson extent + 0.05° pad · 0.05
Keep each ≤ 1,500 cells and ≤ 600 KB.

STEP 1 — GATE (max 60 min): write pipeline/agahi/gee_grid.py and try
`earthengine authenticate` + one reduceRegions on 1 Sukkur cell. The human runs the
auth command; ask them for it in your report/turn if needed.
- Works → GEE path. Not working by 60 min → Open-Meteo path. Never build both fully.

GEE PATH (pipeline/agahi/gee_grid.py <aoi>, python earthengine-api only)
- Grid FeatureCollection of rectangles from bbox/cellDeg; id "<aoi>:<col>:<row>".
- Metrics → spec §2.1 `m` keys:
  sarFloodFrac: COPERNICUS/S1_GRD IW VV; pre=Apr–May 2022 median, post=Aug–Sep 2022 min;
    flood = post<-18 dB AND (post-pre)<-3 dB; mean of mask per cell.
  jrcOccurrence: JRC/GSW1_4/GlobalSurfaceWater occurrence mean.
  handM: MERIT/Hydro/v1_0_1 'hnd' median.
  lstDayC: MODIS/061/MOD11A2 LST_Day_1km*0.02-273.15, May–Jul 2023–2025 mean.
  uhiC: cell lstDayC − AOI median LST over ESA/WorldCover/v200 non-built (class≠50).
  elevM, slopeDeg: USGS/SRTMGL1_003 mean, ee.Terrain.slope mean.
  flowAccLog10: WWF/HydroSHEDS/15ACC max → log10(x+1).
  no2/co/so2/aai: COPERNICUS/S5P/OFFL/L3_NO2 (tropospheric_NO2_column_number_density),
    L3_CO (CO_column_number_density), L3_SO2 (SO2_column_number_density),
    L3_AER_AI (absorbing_aerosol_index); last 90 days mean.
  ndvi, ndviTrend: MODIS/061/MOD13Q1 NDVI*1e-4; mean 2023–2025; trend = that − mean 2015–2017.
  pop: WorldPop/GP/100m/pop 2020 PAK sum.
- One reduceRegions per image, getInfo(), merge by id, missing → null, write JSON with
  `sources` filled per spec, pipeline "gee", generatedAt ISO.

OPEN-METEO PATH (pipeline/agahi/openmeteo_grid.mjs <aoi>, Node ≥20, no deps)
- elevM: api.open-meteo.com/v1/elevation (≤100 coords/call); slopeDeg from
  neighbour elevation differences (cellDeg → metres).
- no2/co/so2 (µg/m³) + aod: air-quality-api.open-meteo.com hourly nitrogen_dioxide,
  carbon_monoxide, sulphur_dioxide, aerosol_optical_depth, past_days=30, mean.
  Write aod into key "aod" (not aai). aai null.
- lstDayC: archive-api.open-meteo.com ERA5 temperature_2m_max, May–Jul 2023–2025 mean;
  sources.lst must say "ERA5 2 m air temperature, not LST". uhiC null.
- sarFloodFrac: swat_kabul only — hist_flood_frac_2022 of the community polygon
  containing the cell centre (public/data/agaahi/communities.geojson, UNOSAT); else null.
- jrcOccurrence, handM, flowAccLog10, ndvi, ndviTrend: null.
- Coarse sources: sample one request per unique rounded coordinate (0.1°) and reuse.
- Throttle ≤5 req/s, retry 2x, cache raw responses in .gev-cache/agahi/.
- pipeline "openmeteo".

ORDER: sukkur → karachi → swat_kabul. Commit each file as soon as it exists.
Add pipeline/agahi/README.md: how to run each script (exact commands), runtime, sources.

DONE WHEN: 3 JSON files valid per §2.1, every cell id unique, nulls not zeros.
```

---

## WS2 — Map layer + cell card

```
<SHARED PREAMBLE>

ROLE: WS2 Risk grid map layer on the Cesium globe + cell detail card.

BRANCH: agahi/ws2-grid-layer

YOU OWN
- src/intelligence/gridLayer.js
- src/intelligence/cellCard.js
- src/ui/styles/agahi-grid.css

DEPENDENCIES: imports from src/intelligence/{gridStore,queries,scoring}.js (WS0) and
src/intelligence/advisory.js (WS3). Code against the spec §2 signatures. To render
locally before they merge, cherry-pick WS0's commits from agahi/ws0-core into your
worktree, but never commit edits to WS0/WS3 files.

Study first with codegraph_explore: src/simulation/predictiveHeatmaps.js,
src/simulation/countryThreatPolygons.js (hover/pick + tooltip pattern),
src/layers/pakistanLayers.js. Cesium is the global `Cesium`.

gridLayer.js
  export class RiskGridLayer {
    constructor(viewer, { onCellClick })
    async show(aoi)     // loadGrid(aoi); ONE Cesium.Primitive with GeometryInstances of
                        // RectangleGeometry (Rectangle.fromDegrees(centre ± cellDeg/2)),
                        // PerInstanceColorAppearance, instance id = cell.id. Not entities.
    hide()
    setHazard(hazard)   // 'composite' | 'flood'|'heat'|'terrain'|'air'|'veg';
                        // recolour via primitive.getGeometryInstanceAttributes(id).color
    highlight(cellId)   // outline or brighten one cell
    flyTo()             // camera.flyTo bbox
    destroy()
  }
- Colour by score: <25 #2e7d32, <45 #f9a825, <70 #ef6c00, ≥70 #c62828, alpha 0.55.
  null / insufficient_data → #9e9e9e alpha 0.25. No-data must never look green.
- Click: ScreenSpaceEventHandler LEFT_CLICK → scene.pick → id → onCellClick(cellExplain(grid,id)).
  Hover: small tooltip "score · band".
- Legend: fixed bottom-left DOM element, hazard name + 4 band swatches + "no data".
- Every hide/destroy removes primitive, handler, legend, tooltip.

cellCard.js
  export function renderCellCard(explain, { lang = 'en', onAdvisory }) → HTMLElement
- Composite score + band chip; 5 hazard bars (null → "no data", grey);
  raw metrics with units (°C, m, °, mol/m² or µg/m³, NDVI); "Sources" list from
  explain.sources; buttons "Advisory EN" / "اردو" call advisory(explain, lang) and
  render lines (Urdu block dir="rtl" lang="ur").
- Escape all text inserted as HTML (reuse an existing escapeHtml helper — find via codegraph).

agahi-grid.css: prefix every class `agahi-grid-`. Match the dark Google-Maps theme in
src/ui/styles/google-maps-theme.css.

DONE WHEN: with fixture, show('fixture') draws grid, setHazard recolours, click opens card.
Report the manual check steps; WS5 wires the pill.
```

---

## WS3 — Dashboard + bilingual advisories

```
<SHARED PREAMBLE>

ROLE: WS3 AOI dashboard panel + EN/UR advisory engine + briefing export.

BRANCH: agahi/ws3-dashboard

YOU OWN
- src/intelligence/dashboardPanel.js
- src/intelligence/advisory.js
- src/ui/styles/agahi-dashboard.css

DEPENDENCIES: src/intelligence/{gridStore,queries,scoring}.js from WS0 (cherry-pick
WS0's fixture commit to develop against public/data/agahi/grid/fixture.json).
Study first: src/simulation/responsePanel.js (panel DOM, show/hide/toggle, escapeHtml).

advisory.js
  export function advisory(input, lang /* 'en'|'ur' */) → { title, lines: string[], dir }
- input is either cellExplain(...) or aoiSummary(...) output (detect by shape).
- Templates: 5 drivers (flood, heat, terrain, air, veg) × 4 bands + insufficient_data,
  both languages, kept as one object per language. 2–4 action lines each, written for
  district officials (e.g. heat/high: cooling centres, water points, shift outdoor work).
- Every number comes from the input; placeholders like {lstDayC}. Missing value →
  "no data" / "ڈیٹا دستیاب نہیں". Urdu written natively, not word-by-word.
  Mark the Urdu object with a one-line note: needs native-speaker review.

dashboardPanel.js
  export class RiskDashboardPanel {
    constructor({ onSelectCell, onAoiChange })
    show(aoi) / hide() / toggle()   // toggle returns visible boolean
    get aoi()
  }
- AOI <select> from loadAois(); pipeline badge "GEE" or "Open-Meteo fallback".
- KPI row: cells, % high+elevated, population in high band, mean coverage, from aoiSummary.
- Hazard means: 5 CSS bars (no chart library), null → "no data".
- Top-10 table from rankCells with hazard switcher; row click → onSelectCell(id).
- Area advisory with EN | اردو toggle; Urdu block dir="rtl" lang="ur",
  font-family "Noto Nastaliq Urdu","Jameel Noori Nastaleeq",serif.
- "Download briefing": Blob of standalone HTML (inline CSS, summary table, both
  advisories, sources, generatedAt) → URL.createObjectURL + <a download>.
  Filename agahi-<aoi>-<yyyy-mm-dd>.html. Revoke URL after click.
- "Print": window.print(); @media print hides everything except the panel.
- Escape all interpolated text.

agahi-dashboard.css: prefix `agahi-dash-`; right-side panel like the corridor response panel.

DONE WHEN: fixture renders KPIs/table/advisory, Urdu RTL, download opens offline.
```

---

## WS4 — Copilot + tools

```
<SHARED PREAMBLE>

ROLE: WS4 grounded copilot: MCP/voice tools, server endpoint, chat panel.
Principle: the AI never produces a number the analysis engine did not compute.

BRANCH: agahi/ws4-copilot

YOU OWN
- src/tools/queries/climate.js
- server/providers/agahiCopilot.js
- src/intelligence/copilotPanel.js
- src/ui/styles/agahi-copilot.css

DEPENDENCIES: src/intelligence/{gridStore,queries,advisory,grounding}.js (WS0/WS3).
Cherry-pick WS0's fixture commit to develop.
Study first with codegraph_explore: defineTool in src/tools/catalog.js,
src/tools/queries/environment.js (getTerrainHeight pattern, POINT_SCHEMA, suggestView),
server/providers/openai/hud-summary.js (key check, rate limit, readRequestBody,
error hygiene), server/providers/openai.js (route registration — do NOT edit it, WS5 does).

1. src/tools/queries/climate.js — 4 defineTool exports per spec §2.6:
   getClimateRisk ('get_climate_risk'), rankClimateRisk ('rank_climate_risk'),
   getAoiRiskSummary ('get_aoi_risk_summary'), getClimateAdvisory ('get_climate_advisory').
   AOI enum from aois.json ids. Point → find AOI whose bbox contains it, else ToolError
   "outside monitored areas". Results are queries.js outputs unchanged.
   Server-side grid loading: fetchImpl that reads public/data/agahi/... with node:fs.
   Export `CLIMATE_TOOLS` array for WS5 to register.

2. server/providers/agahiCopilot.js — export async function handleAgahiCopilot(req, res)
   - POST only; body ≤16 KB; { question ≤500 chars, aoi?, cellId?, lang? } validated.
   - No OPENAI_API_KEY → 503 { error: 'OPENAI_API_KEY not set' }.
   - enforceRateLimit(openAiRateLimiter(), req, res).
   - OpenAI Responses API (https://api.openai.com/v1/responses), model
     process.env.OPENAI_AGAHI_MODEL || 'gpt-5-mini', tools = the 4 climate tools as
     function tools (JSON schema from defineTool inputSchema), instructions:
     "Answer only from tool results. Never estimate, extrapolate or re-round. Null means
      'no data'. Name the source dataset. Answer in {lang}."
   - Loop: execute function_call items locally via the tool run functions, append
     function_call_output, max 4 rounds.
   - grounding.check(answer, allToolResults). Not ok → answer = deterministic text built
     from the last tool result; grounded:false, fallback:'deterministic'.
   - Response { answer, grounded, calls:[{tool,args}], fallback? }.
   - Never relay upstream error text (same as hud-summary).

3. src/intelligence/copilotPanel.js
   export class CopilotPanel { constructor({ getContext }) show() hide() toggle() }
   - getContext() → { aoi, cellId } supplied by WS5.
   - Message list, textarea, send → POST /api/agahi/copilot.
   - 4 chips that call queries/advisory DIRECTLY in the browser (no LLM, work without key):
     "Riskiest 5 cells", "Heat summary", "Explain selected cell", "Urdu advisory".
   - Each answer footer: "Computed by: tool(args)". grounded:false → ⚠ "Model answer
     replaced with computed values". 503 → message "Free-text copilot needs
     OPENAI_API_KEY; chips still work."
   - Urdu answers dir="rtl". Escape all model text (textContent, never innerHTML).

agahi-copilot.css: prefix `agahi-copilot-`; floating bottom-right panel.

DONE WHEN: tools importable, endpoint handler complete, panel works with chips on fixture.
Report the curl command to test the endpoint once WS5 registers the route.
```

---

## WS5 — Integration (launch after WS0–WS4 merge)

```
<SHARED PREAMBLE>

ROLE: WS5 Integration. Wire everything into the running app. You are the ONLY stream
allowed to edit the shared files below.

BRANCH: agahi/ws5-integration (from harry after merging agahi/ws0..ws4)

FIRST: merge in order ws0 → ws1 → ws2 → ws3 → ws4 into your branch. Files are disjoint;
any conflict means a stream broke ownership — report it, don't silently resolve.

YOU OWN
- src/ui/googleMapsUI.js
- style.css
- src/tools/index.js
- server/providers/openai.js (one route line + import)
- src/data/dataCredits.js
- .env.example
- README.md, docs/CURRENT-STATE.md

Study first with codegraph_explore: GoogleMapsUI constructor, _buildDOM pill markup,
_bindEvents (gmaps-pill-response wiring for CorridorResponsePanel), registerDynamicCredit.

TASKS
1. googleMapsUI.js:
   - Construct RiskGridLayer(viewer, { onCellClick }), RiskDashboardPanel({ onSelectCell,
     onAoiChange }), CopilotPanel({ getContext }) next to CorridorResponsePanel.
   - Pill "Risk Intel" (id gmaps-pill-risk) → toggles dashboard + grid layer for current
     AOI (default 'sukkur'), flyTo. Dropdown of hazards (Composite, Flood, Heat, Terrain,
     Air, Vegetation) using the existing pill dropdown pattern → gridLayer.setHazard.
   - Pill "Copilot" (id gmaps-pill-copilot) → copilot.toggle().
   - onSelectCell(id) → gridLayer.highlight(id) + show renderCellCard(cellExplain) in
     a card container; onCellClick does the same and records selectedCellId.
   - onAoiChange(aoi) → gridLayer.show(aoi) + flyTo.
   - getContext → { aoi: dashboard.aoi, cellId: selectedCellId }.
   - Hiding the pill removes layer, card, legend.
2. style.css: @import agahi-grid.css, agahi-dashboard.css, agahi-copilot.css after simulation.css.
3. src/tools/index.js: add CLIMATE_TOOLS to coreTools.
4. server/providers/openai.js: import handleAgahiCopilot;
   middlewares.use('/api/agahi/copilot', sameSiteGated(handleAgahiCopilot)).
5. dataCredits.js: AGAHI_GRID_CREDIT (Copernicus Sentinel-1/5P, MODIS, SRTM, JRC GSW,
   MERIT Hydro, HydroSHEDS, WorldPop, ESA WorldCover; plus Open-Meteo/CAMS/ERA5 when
   grid.pipeline==='openmeteo'); registerDynamicCredit when grid layer shows.
6. .env.example: OPENAI_AGAHI_MODEL= with one-line description.
7. README: "Agahi Climate Intelligence" section (what, AOIs, pipeline commands, copilot
   key). docs/CURRENT-STATE.md: dated entry 2026-10-18.

COMMANDS FOR THE HUMAN (list in report, don't run):
  npm run check:boundaries
  npm test
  npm run dev
If check:boundaries flags src/intelligence imports, move the import to an allowed
module — never disable the check.

DONE WHEN: acceptance criteria in spec §7 are reachable through the UI; report the
5-minute demo path (spec §6) with any step that doesn't work yet.
```
