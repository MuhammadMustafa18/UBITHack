import { distanceKm } from '../tools/area.js';
import { RELAY_CATALOG, RELAY_TEMPLATES } from './relayCatalog.js';

const DATA_ROOT = `${import.meta.env?.BASE_URL || '/'}data/agaahi/`;
const COVER_KM = 10.0;
const MIN_WINDOW_H = 2.0;
const MIN_RIVER_M = 500.0;
const OBSERVED_MIN_FRAC = 0.05;
const SMS_LIMIT = { en: 459, ur: 201 };
const FLAGGED = new Set(['observed_exceed', 'propagated_watch']);
const SEVERITY = ['observed_exceed', 'propagated_watch', 'no_data'];
const MEDICAL_TYPES = new Set(['ambulance', 'medical_cache']);
const SOURCE_LABEL = 'Agaahi exercise injections';
const ISSUED_LABEL = 'trigger time T+0 h';
const DEMO_ASSETS = [
  ['Mingora', 'boat'],
  ['Mingora', 'ambulance'],
  ['Chakdara', 'boat'],
  ['Chakdara', 'rescue_team'],
  ['Charsadda', 'boat'],
  ['Charsadda', 'ambulance'],
  ['Nowshera', 'boat'],
  ['Nowshera', 'rescue_team'],
  ['Peshawar', 'ambulance'],
  ['Peshawar', 'water_tanker'],
  ['Attock', 'water_tanker'],
  ['Attock', 'medical_cache'],
];
const ASSET_LABEL = {
  boat: 'Boat',
  ambulance: 'Ambulance',
  rescue_team: 'Rescue team',
  water_tanker: 'Water tanker',
  medical_cache: 'Medical cache',
};

export const LANGS = ['en', 'ur'];
export const CHANNELS = ['sms', 'voice'];
export const REQUIRED_CONFIRMATIONS = [
  { id: 'content_matches_sources', label: 'Content matches the sources' },
  { id: 'targets_correct', label: 'Target communities are correct' },
  { id: 'exercise_label_present', label: 'Exercise label is present' },
];
export const VERIFY_CAVEATS = [
  'Observed = UNOSAT 2022 satellite-detected water, a snapshot published after the event. It is used here only for comparison.',
  'Narrow Swat valley reaches and flash-flood damage are under-detected by satellite: a miss may be the satellite’s, not the system’s.',
  'Cloud cover can hide flood water from the satellite.',
  `A community counts as observed when at least ${OBSERVED_MIN_FRAC * 100}% of its approximate area lies inside the extent. Community areas are approximations, not administrative boundaries.`,
  'Flagged = on the downstream path of the exercise trigger (up to 400 km). The trigger is an exercise, not the real 2022 origin: this scores path coverage, not forecast skill.',
  'Communities off the trigger path count as not flagged. No data is not safe.',
];

let _facilities = null;

export function loadFacilities() {
  _facilities ??= fetch(`${DATA_ROOT}facilities.geojson`)
    .then((response) => {
      if (!response.ok)
        throw new Error(`HTTP ${response.status} for facilities.geojson`);
      return response.json();
    })
    .then((data) =>
      data.features.map(({ properties: p, geometry }) => ({
        id: p.facility_id,
        name: p.name,
        kind: p.kind,
        lon: geometry.coordinates[0],
        lat: geometry.coordinates[1],
        inFloodExtent2022: p.in_flood_extent_2022,
        distanceToRiverM: p.distance_to_river_m,
      })),
    )
    .catch((error) => {
      _facilities = null;
      throw error;
    });
  return _facilities;
}

const centerOf = (community) => ({
  lat: community.center[0],
  lon: community.center[1],
});

export function demoAssets(communities) {
  const towns = new Map();
  const ordered = [...communities].sort(
    (a, b) =>
      Number(!['city', 'town'].includes(a.placeType)) -
      Number(!['city', 'town'].includes(b.placeType)),
  );
  for (const c of ordered) {
    const key = c.name.trim().toLowerCase();
    if (!towns.has(key)) towns.set(key, c);
  }
  const counts = {};
  return DEMO_ASSETS.flatMap(([town, type]) => {
    const community = towns.get(town.toLowerCase());
    if (!community) return [];
    counts[type] = (counts[type] || 0) + 1;
    return [
      {
        id: `${type}-${counts[type]}`,
        name: `DEMO ${ASSET_LABEL[type]} ${counts[type]} – ${town}`,
        type,
        ...centerOf(community),
      },
    ];
  });
}

function nearest(pool, site) {
  let best = null;
  for (const asset of pool) {
    const km = distanceKm(site, asset);
    if (!best || km < best.distanceKm) best = { asset, distanceKm: km };
  }
  return best;
}

export function suggestStaging(scenario, facilities, assets, simHours) {
  const targets = scenario.communities.filter(
    (c) =>
      c.band === 'high' &&
      c.priority > 0 &&
      c.windowH &&
      c.windowH[1] - simHours >= MIN_WINDOW_H,
  );
  const sites = facilities.filter(
    (f) => f.name && !f.inFloodExtent2022 && f.distanceToRiverM >= MIN_RIVER_M,
  );
  const near = new Map(
    sites.map((f) => [
      f.id,
      targets.filter((c) => distanceKm(f, centerOf(c)) <= COVER_KM),
    ]),
  );
  const pools = [
    assets.filter((a) => a.type === 'boat'),
    assets.filter((a) => MEDICAL_TYPES.has(a.type)),
  ];
  const covered = new Set();
  const out = [];
  while (pools.some((pool) => pool.length)) {
    let best = null;
    let bestGain = 0;
    for (const f of sites) {
      const gain = near
        .get(f.id)
        .reduce((sum, c) => (covered.has(c.id) ? sum : sum + c.priority), 0);
      if (gain > bestGain) {
        best = f;
        bestGain = gain;
      }
    }
    if (!best) break;
    const staged = [];
    for (const pool of pools) {
      const hit = nearest(pool, best);
      if (!hit) continue;
      pool.splice(pool.indexOf(hit.asset), 1);
      staged.push(hit);
    }
    const fresh = near.get(best.id).filter((c) => !covered.has(c.id));
    for (const c of fresh) covered.add(c.id);
    sites.splice(sites.indexOf(best), 1);
    out.push({
      site: best,
      assets: staged,
      covers: fresh.map((c) => ({
        id: c.id,
        name: c.name,
        windowRemainingH: [c.windowH[0] - simHours, c.windowH[1] - simHours],
      })),
      coveredPopulation: fresh.reduce((sum, c) => sum + c.population, 0),
      reason: `Covers ${fresh.length} high-band communities to watch within ${COVER_KM} km whose illustrative arrival window has not passed; site outside the UNOSAT 2022 extent and at least ${MIN_RIVER_M} m from the river.`,
    });
  }
  return out;
}

export function verify2022(scenario) {
  const flagged = scenario.communities.filter((c) => FLAGGED.has(c.status));
  const observed = scenario.communities.filter(
    (c) => c.histFlood2022 != null && c.histFlood2022 >= OBSERVED_MIN_FRAC,
  );
  const flaggedIds = new Set(flagged.map((c) => c.id));
  const observedIds = new Set(observed.map((c) => c.id));
  return {
    flagged,
    observed,
    hits: observed.filter((c) => flaggedIds.has(c.id)),
    misses: observed.filter((c) => !flaggedIds.has(c.id)),
    falseAlarms: flagged.filter((c) => !observedIds.has(c.id)),
  };
}

function actionsFor(status, site) {
  if (!FLAGGED.has(status)) {
    return {
      sms: ['listen_for_updates'],
      voice: ['listen_for_updates', 'prepare_go_bag', 'contact_relay_point'],
    };
  }
  const move = site ? ['evacuate_to_site'] : ['move_to_higher_ground'];
  return {
    sms: ['avoid_riverbanks', ...move],
    voice: [
      'avoid_riverbanks',
      ...move,
      'help_elderly_disabled',
      'move_valuables_livestock_up',
      'do_not_cross_causeways',
      'prepare_go_bag',
      'listen_for_updates',
      'contact_relay_point',
    ],
  };
}

export function buildFacts(scenario, communityIds, simHours, staging) {
  const wanted = new Set(communityIds);
  const rows = scenario.communities.filter((c) => wanted.has(c.id));
  const primary = [...rows].sort(
    (a, b) =>
      SEVERITY.indexOf(a.status) - SEVERITY.indexOf(b.status) ||
      (a.windowH?.[0] ?? Infinity) - (b.windowH?.[0] ?? Infinity),
  )[0];
  const remaining = primary.windowH
    ? [primary.windowH[0] - simHours, primary.windowH[1] - simHours]
    : null;
  const site =
    staging.find((s) => s.covers.some((c) => wanted.has(c.id)))?.site.name ??
    null;
  return {
    river: null,
    status: primary.status,
    window: remaining
      ? [Math.max(0, Math.floor(remaining[0])), Math.ceil(remaining[1])]
      : null,
    windowPassed: Boolean(remaining && remaining[1] < 0),
    sourceLabel: SOURCE_LABEL,
    issued: ISSUED_LABEL,
    stagingSite: site,
    communities: rows.map((c) => c.name),
    actions: actionsFor(primary.status, site),
  };
}

const fill = (template, values) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));

const actionText = (id, lang, site) =>
  fill(RELAY_CATALOG.actions[id][lang], { site: site || '' });

function windowPhrase(facts, lang) {
  const phrases = RELAY_CATALOG.window;
  if (facts.windowPassed) return phrases.passed[lang];
  if (!facts.window) return phrases.unknown[lang];
  const key = facts.window[0] === 0 ? 'now' : 'range';
  return fill(phrases[key][lang], { lo: facts.window[0], hi: facts.window[1] });
}

function render(facts, channel, lang) {
  const river = facts.river || RELAY_CATALOG.riverFallback[lang];
  const actions = facts.actions[channel].map((id) =>
    actionText(id, lang, facts.stagingSite),
  );
  return fill(RELAY_TEMPLATES[channel][lang], {
    marker: RELAY_CATALOG.markers[lang],
    communities: facts.communities.join(lang === 'en' ? ', ' : '، '),
    status: fill(RELAY_CATALOG.status[facts.status][lang], { river }),
    window: windowPhrase(facts, lang),
    source: fill(RELAY_CATALOG.source[lang], {
      source: facts.sourceLabel,
      issued: facts.issued,
    }),
    actions: actions.join(' '),
    key_action: actions[0] || '',
  });
}

export function draftTexts(facts) {
  return Object.fromEntries(
    LANGS.map((lang) => [
      lang,
      {
        sms: render(facts, 'sms', lang),
        voice: render(facts, 'voice', lang),
        reviewed: RELAY_CATALOG.reviewed[lang],
      },
    ]),
  );
}

const EASTERN_DIGITS = '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩';
const normalise = (text) =>
  text.replace(/[۰-۹٠-٩]/g, (ch) => String(EASTERN_DIGITS.indexOf(ch) % 10));
const numbers = (text) =>
  new Set((normalise(text).match(/\d+/g) || []).map(Number));

function factNumbers(facts) {
  return numbers(
    [
      facts.river,
      facts.issued,
      facts.sourceLabel,
      facts.stagingSite,
      ...(facts.window || []),
      ...facts.communities,
    ]
      .filter((v) => v != null)
      .join(' '),
  );
}

function* eachText(texts) {
  for (const [lang, entry] of Object.entries(texts)) {
    for (const channel of CHANNELS) yield [lang, channel, entry[channel] || ''];
  }
}

const result = (id, blocking, failures) => ({
  id,
  blocking,
  passed: failures.length === 0,
  detail: failures.join('; ') || null,
});

export function runChecks(facts, texts) {
  const allowed = factNumbers(facts);
  const marker = [];
  const extraNumbers = [];
  const missingActions = [];
  for (const [lang, channel, text] of eachText(texts)) {
    if (!text.includes(RELAY_CATALOG.markers[lang]))
      marker.push(
        `${lang} ${channel}: missing '${RELAY_CATALOG.markers[lang]}'`,
      );
    const extra = [...numbers(text)].filter((n) => !allowed.has(n));
    if (extra.length)
      extraNumbers.push(`${lang} ${channel}: ${extra.join(', ')} not in facts`);
    for (const id of facts.actions[channel]) {
      if (!text.includes(actionText(id, lang, facts.stagingSite)))
        missingActions.push(
          `${lang} ${channel}: catalog text for '${id}' not found`,
        );
    }
  }
  const smsLength = Object.entries(texts)
    .filter(([lang, entry]) => entry.sms.length > SMS_LIMIT[lang])
    .map(
      ([lang, entry]) =>
        `${lang}: ${entry.sms.length} > ${SMS_LIMIT[lang]} chars`,
    );
  const sourceTime = Object.entries(texts)
    .filter(
      ([, entry]) =>
        !normalise(entry.voice).includes(facts.sourceLabel) ||
        !normalise(entry.voice).includes(facts.issued),
    )
    .map(([lang]) => `${lang} voice: source or trigger time not named`);
  return [
    result('exercise_marker', true, marker),
    result('numbers_match_facts', true, extraNumbers),
    result('actions_from_catalog', true, missingActions),
    result('sms_length', false, smsLength),
    result('has_source_and_time', false, sourceTime),
  ];
}
