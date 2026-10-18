import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAois, loadGrid } from '../../src/intelligence/gridStore.js';
import { aoiSummary, rankCells, cellExplain } from '../../src/intelligence/queries.js';
import { HAZARDS } from '../../src/intelligence/scoring.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dataDir = path.join(root, 'public');

const fetchImpl = async (url) => {
  const file = path.join(dataDir, url.replace(/^\//, ''));
  try {
    const text = await readFile(file, 'utf8');
    return { ok: true, json: async () => JSON.parse(text) };
  } catch {
    return { ok: false };
  }
};

const aoi = process.argv[2];
if (!aoi) {
  console.error('usage: node pipeline/agahi/build_facts.mjs <aoi>');
  process.exit(1);
}

const aois = await loadAois(fetchImpl);
const entry = aois.find((a) => a.aoi === aoi);
if (!entry) {
  console.error(`unknown aoi ${aoi}`);
  process.exit(1);
}
const grid = await loadGrid(aoi, fetchImpl);
const summary = aoiSummary(grid);

const pct = (n) => (summary.cells ? Math.round((n / summary.cells) * 100) : null);
const derived = {
  pctByBand: Object.fromEntries(
    Object.entries(summary.bandCounts).map(([band, n]) => [band, pct(n)]),
  ),
  populationTotal: Object.values(summary.popByBand).reduce((a, b) => a + b, 0),
  pctHighOrElevated: pct(summary.bandCounts.high + summary.bandCounts.elevated),
  hazardsWithNoData: HAZARDS.filter((h) => summary.hazardMeans[h] === null),
};

const rankings = { composite: rankCells(grid, { hazard: 'composite', limit: 8 }) };
for (const h of HAZARDS) rankings[h] = rankCells(grid, { hazard: h, limit: 5 });

const ids = new Set(rankings.composite.map((r) => r.id));
for (const h of HAZARDS) for (const r of rankings[h].slice(0, 3)) ids.add(r.id);
const cells = {};
for (const id of ids) cells[id] = cellExplain(grid, id);

const facts = {
  aoi,
  name: entry.name,
  nameUr: entry.nameUr,
  bbox: entry.bbox,
  pipeline: grid.pipeline,
  generatedAt: grid.generatedAt,
  sources: grid.sources,
  summary,
  derived,
  rankings,
  cells,
};

const outDir = path.join(root, '.gev-cache', 'agahi');
await mkdir(outDir, { recursive: true });
const out = path.join(outDir, `facts-${aoi}.json`);
await writeFile(out, JSON.stringify(facts, null, 1));
console.log(`${out} (${ids.size} cells, ${JSON.stringify(facts).length} bytes)`);
