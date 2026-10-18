import { compositeScore } from './scoring.js';

const DATA_ROOT = `${import.meta.env?.BASE_URL || '/'}data/agahi/`;

let aoisPromise = null;
const gridPromises = new Map();

async function fetchJson(url, fetchImpl) {
  const response = await (fetchImpl || fetch)(url);
  if (!response || response.ok === false) {
    throw new Error(`Agahi data request failed: ${url}`);
  }
  return response.json();
}

export async function loadAois(fetchImpl) {
  if (!aoisPromise) {
    aoisPromise = fetchJson(`${DATA_ROOT}aois.json`, fetchImpl).catch((error) => {
      aoisPromise = null;
      throw error;
    });
  }
  return aoisPromise;
}

export async function loadGrid(aoi, fetchImpl) {
  if (!gridPromises.has(aoi)) {
    const promise = loadAois(fetchImpl)
      .then((aois) => {
        const entry = aois.find((a) => a.aoi === aoi);
        if (!entry) throw new Error(`Unknown Agahi AOI: ${aoi}`);
        return fetchJson(`${DATA_ROOT}${entry.file}`, fetchImpl);
      })
      .then((grid) => {
        const opts = { pipeline: grid.pipeline };
        for (const cell of grid.cells) cell.score = compositeScore(cell.m, opts);
        return grid;
      })
      .catch((error) => {
        gridPromises.delete(aoi);
        throw error;
      });
    gridPromises.set(aoi, promise);
  }
  return gridPromises.get(aoi);
}
