# Agahi grid pipeline

Offline step that writes `public/data/agahi/grid/<aoi>.json` (contract: `docs/AGAHI-INTELLIGENCE-SPEC.md` §2.1).

## Path used: Open-Meteo (`pipeline: "openmeteo"`)

Google Earth Engine was not available (`earthengine-api` not installed, no credentials), so the keyless fallback was built. `gee_grid.py` does not exist.

```bash
node pipeline/agahi/openmeteo_grid.mjs sukkur
node pipeline/agahi/openmeteo_grid.mjs karachi
node pipeline/agahi/openmeteo_grid.mjs swat_kabul
```

Node ≥ 20, no dependencies. Needs internet. Raw API responses are cached in `.gev-cache/agahi/` (gitignored), so re-runs are instant and offline; delete that folder to refetch. Runtime: Sukkur ~1 min, Karachi ~2 min, Swat–Kabul ~10–15 min (throttled to ≤ 5 req/s, elevation to ~6 calls/min, 429 → 65 s wait and retry).

| AOI | bbox | cellDeg | cells |
|---|---|---|---|
| sukkur | 68.70, 27.55, 69.00, 27.85 | 0.02 | 15 × 15 = 225 |
| karachi | 66.85, 24.75, 67.35, 25.10 | 0.02 | 25 × 18 = 450 |
| swat_kabul | 68.88, 32.83, 72.87, 36.61 | 0.11 | 37 × 35 = 1,295 |

`swat_kabul` uses 0.11° (not 0.05°) because 0.05° would be ~6,000 cells, over the 1,500-cell budget. Cell ids are `<aoi>:<col>:<row>`, col from west, row from south; `lat/lon` are cell centres. Where bbox is not an exact multiple of `cellDeg` the last row/column overhangs the bbox slightly.

## Metrics and sources

| Metric | Source | Notes |
|---|---|---|
| `elevM` | Open-Meteo Elevation API (Copernicus DEM GLO-90) | centre point |
| `slopeDeg` | same | central difference over ±0.01° (~1.1 km) around the centre; swat_kabul uses a forward difference (0.01° north and east) to stay inside the API rate limit |
| `lstDayC` | Open-Meteo Archive (ERA5) `temperature_2m_max`, May–Jul 2023–2025 mean | **2 m air temperature, not land-surface temperature**; sampled on a 0.1° grid (0.25° for swat_kabul) |
| `no2`, `co`, `so2` | Open-Meteo Air Quality (CAMS), past 30 days hourly mean | **µg/m³ model surface concentration**, not Sentinel-5P columns; 0.1° grid (0.4° for swat_kabul) |
| `aod` | same, `aerosol_optical_depth` | used instead of `aai` |
| `sarFloodFrac` | swat_kabul only: `hist_flood_frac_2022` (UNOSAT) of `public/data/agaahi/communities.geojson` | mean over community polygons overlapping the cell (polygon vertex in cell or cell centre inside polygon); `null` where no community overlaps — this is not a cell-area flood fraction |
| `jrcOccurrence`, `handM`, `flowAccLog10`, `uhiC`, `ndvi`, `ndviTrend`, `pop`, `aai` | — | always `null` on this path |

Missing values are `null`, never `0`. With flood, vegetation and UHI absent, the composite rests on heat (ERA5), terrain (slope only), air and, for swat_kabul, partial flood coverage.

`scoring.js` already has the `pipeline === 'openmeteo'` air branch (`no2/40`, `co/4000`, `so2/40`, `aod/1`).

## GEE path (not built)

Spec §4 WS1 describes it. To build it later: `pip install earthengine-api`, `earthengine authenticate`, then write `gee_grid.py <aoi>` emitting the same JSON with `pipeline: "gee"`.
