import { readResponseJsonCapped } from '../../sources/httpBody.js';

// A portable export (package.json): no i18n here. Failures stay English data;
// the Layers panel shows them translated.
const msg = (text) => text;

function retryDelay(raw, nowMs) {
  if (!raw) return null;
  const seconds = Number(raw);
  const ms = seconds * 1000;
  if (Number.isFinite(ms) && seconds > 0)
    return Math.min(3600000, Math.max(5000, ms));
  const at = Date.parse(raw);
  return Number.isFinite(at) && at > nowMs
    ? Math.min(3600000, Math.max(5000, at - nowMs))
    : null;
}

export function createAdsbGnssSource({
  fetchImpl = (...args) => globalThis.fetch(...args),
  now = () => Date.now(),
} = {}) {
  return {
    async getSnapshot({ latitude, longitude } = {}, { signal } = {}) {
      signal?.throwIfAborted();
      return {
        retrievedAt: new Date().toISOString(),
        regions: [],
        anomalies: [],
      };
    },
  };
}
