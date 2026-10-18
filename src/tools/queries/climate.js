/**
 * Climate risk queries over the Agaahi grid: cell risk, ranking, area summary
 * and advisory. Every number comes from src/intelligence/queries.js.
 */

import { defineTool, ToolError } from '../catalog.js';
import { validateValue } from '../schema.js';
import { suggestView } from '../views.js';
import { HAZARDS } from '../../intelligence/scoring.js';
import { loadAois, loadGrid } from '../../intelligence/gridStore.js';
import {
  aoiSummary,
  cellAt,
  cellExplain,
  rankCells,
} from '../../intelligence/queries.js';
import { advisory } from '../../intelligence/advisory.js';

const AOI_IDS = ['sukkur', 'karachi', 'swat_kabul', 'fixture'];
const AOI_SCHEMA = {
  type: 'string',
  enum: AOI_IDS,
  description:
    'Monitored area. Never use "fixture" unless the context names it.',
};
const CELL_ID_SCHEMA = {
  type: 'string',
  pattern: '^[a-z0-9_]+:[0-9]+:[0-9]+$',
  description: 'Grid cell id such as "sukkur:12:7".',
};
const LANG_SCHEMA = { type: 'string', enum: ['en', 'ur'] };
const NODE_FS = 'node:fs/promises';
const NODE_PATH = 'node:path';

let nodeFetchPromise = null;

function isNode() {
  return !!globalThis.process?.versions?.node;
}

function nodeFetch() {
  nodeFetchPromise ??= Promise.all([
    import(/* @vite-ignore */ NODE_FS),
    import(/* @vite-ignore */ NODE_PATH),
  ]).then(([{ readFile }, path]) => {
    const root = path.resolve(process.cwd(), 'public', 'data', 'agahi');
    return async (url) => {
      const rel = String(url).split('data/agahi/').pop();
      const file = path.resolve(root, rel);
      if (!file.startsWith(root + path.sep)) return { ok: false, status: 404 };
      try {
        const text = await readFile(file, 'utf8');
        return { ok: true, status: 200, json: async () => JSON.parse(text) };
      } catch {
        return { ok: false, status: 404 };
      }
    };
  });
  return nodeFetchPromise;
}

async function fetchImpl() {
  return isNode() ? nodeFetch() : undefined;
}

async function gridFor(aoi) {
  try {
    return await loadGrid(aoi, await fetchImpl());
  } catch {
    throw new ToolError('unavailable', `No risk grid is available for ${aoi}`);
  }
}

async function aoiAt(lat, lon) {
  const aois = await loadAois(await fetchImpl()).catch(() => []);
  const inside = aois
    .filter(
      ({ bbox: [west, south, east, north] }) =>
        lon >= west && lon <= east && lat >= south && lat <= north,
    )
    .sort((a, b) => (a.aoi === 'fixture') - (b.aoi === 'fixture'));
  return inside[0]?.aoi ?? null;
}

function bboxView(grid) {
  const [west, south, east, north] = grid.bbox;
  return suggestView(
    {},
    {
      point: { lat: (south + north) / 2, lon: (west + east) / 2 },
      altitudeM: 60_000,
    },
  );
}

function explainSummary(explain) {
  const composite = explain.composite ?? {};
  const hazards = explain.hazards ?? composite.hazards ?? {};
  const parts = HAZARDS.map((hazard) => `${hazard} ${hazards[hazard] ?? 'no data'}`);
  const drivers = composite.drivers?.length
    ? `; main drivers ${composite.drivers.join(', ')}`
    : '';
  return (
    `Cell ${explain.id}: composite risk ${composite.score ?? 'no data'} ` +
    `(${composite.band ?? 'no data'}); ${parts.join(', ')}${drivers}.`
  );
}

function summaryText(summary) {
  const bands = Object.entries(summary.bandCounts ?? {})
    .map(([band, count]) => `${band} ${count}`)
    .join(', ');
  const means = HAZARDS.map(
    (hazard) => `${hazard} ${summary.hazardMeans?.[hazard] ?? 'no data'}`,
  ).join(', ');
  return (
    `${summary.aoi}: ${summary.cells} cells; cells by band: ${bands}; ` +
    `mean hazard scores: ${means}; mean data coverage ` +
    `${summary.coverageMean ?? 'no data'}; pipeline ${summary.pipeline}.`
  );
}

export const getClimateRisk = defineTool({
  name: 'get_climate_risk',
  title: 'Climate risk at a point or cell',
  description:
    'Multi-hazard climate risk (flood, heat, terrain, air, vegetation and a ' +
    'composite, 0-100) for one grid cell, by cell_id or by lat and lon inside ' +
    'a monitored area, with raw metrics and data sources.',
  inputSchema: {
    type: 'object',
    properties: {
      lat: { type: 'number', minimum: -90, maximum: 90 },
      lon: { type: 'number', minimum: -180, maximum: 180 },
      cell_id: CELL_ID_SCHEMA,
    },
    additionalProperties: false,
  },
  async run(args) {
    let aoi;
    let id = args.cell_id;
    if (id) {
      aoi = id.split(':')[0];
    } else if (args.lat != null && args.lon != null) {
      aoi = await aoiAt(args.lat, args.lon);
      if (!aoi)
        throw new ToolError(
          'invalid_arguments',
          'That location is outside monitored areas',
        );
    } else {
      throw new ToolError(
        'invalid_arguments',
        'Give either cell_id, or lat and lon',
      );
    }
    const grid = await gridFor(aoi);
    if (!id) {
      id = cellAt(grid, args.lat, args.lon)?.id;
      if (!id)
        throw new ToolError(
          'invalid_arguments',
          'That location is outside monitored areas',
        );
    }
    const explain = cellExplain(grid, id);
    if (!explain)
      throw new ToolError('invalid_arguments', `No cell with id ${id}`);
    return {
      summary: explainSummary(explain),
      data: {
        ...explain,
        view: suggestView(
          {},
          { point: { lat: explain.lat, lon: explain.lon }, altitudeM: 20_000 },
        ),
      },
    };
  },
});

export const rankClimateRisk = defineTool({
  name: 'rank_climate_risk',
  title: 'Rank cells by climate risk',
  description:
    'The highest-risk grid cells in a monitored area for one hazard or the ' +
    'composite score, with score, band and population.',
  inputSchema: {
    type: 'object',
    properties: {
      aoi: AOI_SCHEMA,
      hazard: { type: 'string', enum: ['composite', ...HAZARDS] },
      limit: { type: 'integer', minimum: 1, maximum: 25 },
    },
    required: ['aoi'],
    additionalProperties: false,
  },
  async run(args) {
    const grid = await gridFor(args.aoi);
    const hazard = args.hazard ?? 'composite';
    const rows = rankCells(grid, { hazard, limit: args.limit ?? 10 });
    const lines = rows.map(
      (row) =>
        `• ${row.id}: ${row.score} (${row.band})` +
        (row.pop != null ? `, population ${row.pop}` : ''),
    );
    return {
      summary: rows.length
        ? `Highest ${hazard} risk cells in ${args.aoi}:\n${lines.join('\n')}`
        : `No scored cells for ${hazard} in ${args.aoi}.`,
      data: { aoi: args.aoi, hazard, rows, sources: grid.sources ?? null },
    };
  },
});

export const getAoiRiskSummary = defineTool({
  name: 'get_aoi_risk_summary',
  title: 'Area climate risk summary',
  description:
    'Summary of a monitored area: cells per risk band, mean score per ' +
    'hazard, population per band, top drivers, data coverage and data sources.',
  inputSchema: {
    type: 'object',
    properties: { aoi: AOI_SCHEMA },
    required: ['aoi'],
    additionalProperties: false,
  },
  async run(args) {
    const grid = await gridFor(args.aoi);
    const summary = aoiSummary(grid);
    return {
      summary: summaryText(summary),
      data: {
        ...summary,
        sources: grid.sources ?? null,
        view: bboxView(grid),
      },
    };
  },
});

export const getClimateAdvisory = defineTool({
  name: 'get_climate_advisory',
  title: 'Climate advisory',
  description:
    'A bilingual (en or ur) action advisory for one grid cell (cell_id) or a ' +
    'whole monitored area (aoi), written from the computed risk values.',
  inputSchema: {
    type: 'object',
    properties: { cell_id: CELL_ID_SCHEMA, aoi: AOI_SCHEMA, lang: LANG_SCHEMA },
    additionalProperties: false,
  },
  async run(args) {
    const lang = args.lang ?? 'en';
    if (!args.cell_id && !args.aoi)
      throw new ToolError('invalid_arguments', 'Give either cell_id or aoi');
    const grid = await gridFor(args.cell_id?.split(':')[0] ?? args.aoi);
    let input;
    if (args.cell_id) {
      input = cellExplain(grid, args.cell_id);
      if (!input)
        throw new ToolError('invalid_arguments', `No cell with id ${args.cell_id}`);
    } else {
      input = aoiSummary(grid);
    }
    const result = advisory(input, lang);
    return {
      summary: [result.title, ...result.lines, result.note]
        .filter(Boolean)
        .join('\n'),
      data: { lang, target: args.cell_id ?? args.aoi, ...result },
    };
  },
});

export const CLIMATE_TOOLS = Object.freeze([
  getClimateRisk,
  rankClimateRisk,
  getAoiRiskSummary,
  getClimateAdvisory,
]);

export async function runClimateTool(name, args = {}, { signal } = {}) {
  const tool = CLIMATE_TOOLS.find((item) => item.name === name);
  if (!tool) throw new ToolError('unsupported', `No tool named ${name}`);
  const problems = validateValue(tool.inputSchema, args);
  if (problems.length)
    throw new ToolError('invalid_arguments', problems.join('; '));
  return tool.run(args, { services: {}, signal });
}
