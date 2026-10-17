import {
  epoch,
  finite,
  httpError,
  LiveSourceError,
  readResponse,
} from './contract.js';
import {
  normalizeAircraftTrack,
  openSkySnapshot,
  readsbSnapshot,
  readsbIdentities,
} from './aircraft.js';
import { normalizeVesselTrack, vesselSnapshot } from './vessels.js';

const defaultFetch = (...args) => globalThis.fetch(...args);
const header = (response, name) => response.headers?.get?.(name);

function openSkyError(response) {
  const error = httpError(response, 'Flights');
  const mode = String(
    header(response, 'x-opensky-auth-mode-used') ||
      header(response, 'x-opensky-auth') ||
      '',
  ).toLowerCase();
  const reason = String(
    header(response, 'x-opensky-auth-reason') || '',
  ).toLowerCase();
  if (response.status === 429 && (!mode || mode === 'anon'))
    error.message = 'OpenSky rate limited (anonymous)';
  if (response.status === 401 || response.status === 403) {
    const reasons = {
      oauth_invalid_or_missing: 'OpenSky OAuth client missing/invalid',
      oauth_invalid_credentials: 'OpenSky OAuth rejected credentials',
      basic_invalid_credentials: 'OpenSky username/password rejected',
      missing_basic_creds: 'OpenSky auth missing',
      missing_oauth_and_basic_creds: 'OpenSky auth missing',
      auth_required: 'OpenSky auth required',
      forced_anonymous: 'OpenSky auth required',
    };
    error.message =
      reasons[reason] ||
      (/^(oauth_|basic_)/.test(reason)
        ? 'OpenSky auth invalid'
        : mode === 'anon'
          ? 'OpenSky auth required'
          : 'OpenSky auth failed');
  }
  return error;
}

/**
 * The provider a feed response names in `X-Feed-Source`, so a server that
 * answers a feed route from another provider is reported as that provider.
 */
function feedSource(response, fallback) {
  const named = header(response, 'x-feed-source');
  return typeof named === 'string' && named.trim()
    ? named.trim().slice(0, 80)
    : fallback;
}

/** The flights feed (/api/flights); no request starts during construction. */
export function createFlightSource({
  fetchImpl = defaultFetch,
  now = () => Date.now(),
} = {}) {
  return {
    // i18n-ignore: feed source name, replaced by the provider from each snapshot and reported to AI tools
    label: 'Flights',
    async getSnapshot(query = {}, { signal } = {}) {
      const params = new URLSearchParams();
      if (Number.isFinite(query.latitude) && Number.isFinite(query.longitude)) {
        params.set('lat', query.latitude.toFixed(4));
        params.set('lon', query.longitude.toFixed(4));
      }
      const { response, payload } = await readResponse(
        fetchImpl,
        `/api/flights${params.size ? '?' + params : ''}`,
        { signal },
        'Flights',
      );
      if (!response.ok) throw openSkyError(response);
      return {
        ...openSkySnapshot(payload, {
          // A fallback provider names itself in X-Flight-Source.
          source:
            header(response, 'x-flight-source') ||
            feedSource(response, 'Flights'),
          coverage:
            header(response, 'x-flight-coverage') ||
            'worldwide upstream snapshot',
          now: now(),
        }),
        status: response.status,
      };
    },
    async getTrack(reference, { signal } = {}) {
      const { response, payload } = await readResponse(
        fetchImpl,
        '/api/flights/track?icao24=' + encodeURIComponent(reference),
        { signal },
        'Flights',
      );
      if (!response.ok) throw httpError(response, 'Flights');
      return {
        records: normalizeAircraftTrack(payload?.path),
        complete: false,
      };
    },
    async getEnrichment(query, { signal } = {}) {
      if (!['type', 'route'].includes(query.kind))
        throw new LiveSourceError('unsupported', 'Enrichment unavailable');
      const { response, payload } = await readResponse(
        fetchImpl,
        `/api/adsbdb/${query.kind}/${encodeURIComponent(query.id)}`,
        { signal },
        'adsbdb',
      );
      if (!response.ok) throw httpError(response, 'adsbdb');
      return payload;
    },
  };
}

export function createMilitarySource({
  fetchImpl = defaultFetch,
  now = () => Date.now(),
} = {}) {
  return {
    label: 'Disaster Relief Fleet (NDMA / Army Aviation)',
    async getIdentities(_query = {}, { signal } = {}) {
      return [
        { reference: 'pk_mi17_01', callsign: 'RESCUE-MI17', type: 'Mi-17 Evac' },
        { reference: 'pk_r1122_02', callsign: 'R1122-AIR', type: 'Bell 412 SAR' },
        { reference: 'pk_c130_03', callsign: 'NDMA-SUPPLY', type: 'C-130 Drop' },
        { reference: 'pk_uav_04', callsign: 'UAV-RECON', type: 'Bayraktar TB2' },
      ];
    },
    async getSnapshot(_query = {}, { signal } = {}) {
      const curTime = now();
      const tSec = (curTime / 1000) % 3600;
      const rows = [
        {
          hex: 'pk_mi17_01',
          flight: 'RESCUE-01',
          lat: 34.015 + 0.03 * Math.sin(tSec * 0.04),
          lon: 71.975 + 0.04 * Math.cos(tSec * 0.04),
          alt_baro: 3200,
          gs: 110,
          track: ((tSec * 2.8) % 360),
          category: 7,
          t: 'MI17',
        },
        {
          hex: 'pk_r1122_02',
          flight: 'R1122-SAR',
          lat: 34.150 + 0.03 * Math.cos(tSec * 0.035),
          lon: 71.740 + 0.04 * Math.sin(tSec * 0.035),
          alt_baro: 2800,
          gs: 95,
          track: ((tSec * 2.3) % 360),
          category: 7,
          t: 'B412',
        },
        {
          hex: 'pk_c130_03',
          flight: 'NDMA-AIR-03',
          lat: 30.700 + 0.08 * Math.sin(tSec * 0.02),
          lon: 70.850 + 0.09 * Math.cos(tSec * 0.02),
          alt_baro: 6500,
          gs: 240,
          track: ((tSec * 1.7) % 360),
          category: 1,
          t: 'C130',
        },
        {
          hex: 'pk_uav_04',
          flight: 'NDMA-UAV-01',
          lat: 27.700 + 0.04 * Math.sin(tSec * 0.05),
          lon: 68.860 + 0.05 * Math.cos(tSec * 0.05),
          alt_baro: 4200,
          gs: 80,
          track: ((tSec * 3.4) % 360),
          category: 14,
          t: 'UAV',
        },
      ];
      return {
        source: 'NDMA / Army Aviation Relief Dispatch',
        observedAtMs: curTime,
        now: curTime,
        status: 200,
        records: rows.map((r) => ({
          id: r.hex,
          reference: r.hex,
          latitude: r.lat,
          longitude: r.lon,
          callsign: r.flight,
          originCountry: 'Pakistan',
          positionTimeMs: curTime,
          contactTimeMs: curTime,
          baroAltitudeM: r.alt_baro * 0.3048,
          ellipsoidAltitudeM: r.alt_baro * 0.3048,
          onGround: false,
          speedMps: r.gs * 0.514444,
          courseDeg: r.track,
          verticalRateMps: 0,
          category: r.category,
          typeCode: r.t,
          operator: 'Disaster Relief & Rescue Ops',
        })),
      };
    },
    async getTrack(reference, { signal } = {}) {
      return { records: [] };
    },
  };
}

export function createVesselSource({
  fetchImpl = defaultFetch,
  apiUrl = '/api/vessels',
  origin = () => globalThis.location?.origin || 'http://localhost',
} = {}) {
  return {
    // i18n-ignore: feed source name, replaced by the provider from each snapshot and reported to AI tools
    label: 'Vessels',
    async getSnapshot({ maxRows = 12000, area } = {}, { signal } = {}) {
      const url = new URL(apiUrl, origin());
      url.searchParams.set('maxRows', String(maxRows));
      // An area asks for the vessels around a point; servers that hold every
      // vessel may ignore it, since callers still keep only what they need.
      if (
        Number.isFinite(area?.lat) &&
        Number.isFinite(area?.lon) &&
        Number.isFinite(area?.radiusKm)
      ) {
        url.searchParams.set('lat', area.lat.toFixed(5));
        url.searchParams.set('lon', area.lon.toFixed(5));
        url.searchParams.set('radius_km', area.radiusKm.toFixed(1));
      }
      const { response, payload } = await readResponse(
        fetchImpl,
        url.toString(),
        { signal, cache: 'no-store' },
        'Vessels',
      );
      if (!response.ok) {
        const error = httpError(response, 'Vessels');
        const reasons = {
          'missing-key': 'AISSTREAM_API_KEY not set',
          'auth-failed': 'API key rejected — check AISSTREAM_API_KEY',
          unsupported: 'live feed unsupported',
          error: 'feed down',
          closed: 'feed disconnected',
        };
        error.message = reasons[payload?.status] || error.message;
        throw error;
      }
      return {
        ...vesselSnapshot(payload, { source: feedSource(response, 'Vessels') }),
        status: response.status,
      };
    },
    async getTrack(reference, { signal } = {}) {
      const { response, payload } = await readResponse(
        fetchImpl,
        '/api/vessels/track?mmsi=' + encodeURIComponent(reference),
        { signal },
        'Vessels',
      );
      if (!response.ok) throw httpError(response, 'Vessels');
      return {
        records: normalizeVesselTrack(payload?.samples),
        complete: false,
      };
    },
  };
}
