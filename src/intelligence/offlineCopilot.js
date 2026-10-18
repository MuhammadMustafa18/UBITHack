const DATA_ROOT = `${import.meta.env?.BASE_URL || '/'}data/agahi/`;
const THRESHOLD = 0.3;
const SUGGESTIONS = 3;
const ARABIC_SCRIPT = /[؀-ۿ]/;
const STOPWORDS = new Set([
  'the', 'is', 'are', 'in', 'a', 'an', 'of', 'what', 'to', 'and', 'for', 'me',
  'this', 'which', 'how', 'do', 'does', 'it', 'on', 'at', 'there', 'کیا', 'ہے',
  'ہیں', 'میں', 'کی', 'کا', 'کے', 'اور', 'کو', 'سے',
]);
const TRY_PREFIX = { en: 'Try asking:', ur: 'یہ پوچھ کر دیکھیں:' };
const NO_HELP = {
  en: 'Ask about risk in this area, for example the riskiest cells or the heat risk.',
  ur: 'اس علاقے کے خطرے کے بارے میں پوچھیں، مثلاً سب سے زیادہ خطرے والے خانے۔',
};

const KEYWORDS = [
  { ids: ['hazard_heat'], boost: 0.6, re: /\b(heat|hot|hotter|temperature|temperatures|lst|warm|uhi)\b|گرمی|گرم|حرارت|تپش/ },
  { ids: ['hazard_flood'], boost: 0.6, re: /\b(flood|floods|flooding|water|inundation|inundated)\b|سیلاب|پانی/ },
  { ids: ['hazard_air'], boost: 0.6, re: /\b(air|pollution|polluted|no2|smog|aerosol)\b|ہوا|آلودگی|فضائی/ },
  { ids: ['hazard_terrain'], boost: 0.6, re: /\b(terrain|slope|slopes|elevation|steep)\b|ڈھلوان|زمین|ارتفاع/ },
  { ids: ['hazard_veg'], boost: 0.6, re: /\b(vegetation|ndvi|green|greenery|trees|crops?)\b|سبزہ|نباتات|پودے|ہریالی/ },
  { ids: ['population_exposure'], boost: 0.6, re: /\b(population|people|exposure|exposed|residents)\b|آبادی|لوگ|افراد/ },
  { ids: ['priorities'], boost: 0.6, re: /\b(priority|priorities|prioriti[sz]e|actions?|should we|what to do|recommend\w*)\b|ترجیح|اقدام|کیا کریں/ },
  { ids: ['riskiest_cells'], boost: 0.5, re: /\b(riskiest|highest|top|worst|dangerous|hotspots?)\b|سب سے زیادہ|خطرناک/ },
  { ids: ['overview'], boost: 0.5, re: /\b(overview|summary|summari[sz]e|situation|overall)\b|خلاصہ|جائزہ/ },
  { ids: ['data_quality'], boost: 0.5, re: /\b(data quality|coverage|missing|reliable|reliability|accurate|accuracy|sources?|confidence|no data)\b|معیار|ذرائع/ },
  { ids: ['forecast_refusal'], boost: 1, re: /\b(forecast|predict|prediction|future|tomorrow|next (year|month|week|decade)|will be)\b|پیش گوئی|پیشگوئی|آئندہ|اگلے سال|مستقبل/ },
  { ids: ['help'], boost: 0.6, re: /\b(help|who are you|what can you do|how do you work|capabilities)\b|مدد|آپ کیا/ },
];
const THIS_CELL = /\b(this cell|selected|explain|why|here)\b|اس خانے|منتخب|وضاحت|کیوں/;
const CELL_MENTION = /([a-z0-9_]+)[:_](\d+)[:_](\d+)/;

const cache = new Map();

export const describeCall = (tool, args) => `${tool}(${JSON.stringify(args)})`;

export const cellEntryId = (cellId) => `cell_${cellId.replace(/:/g, '_')}`;

const tokenize = (text) =>
  new Set(
    (String(text).toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(
      (token) => !STOPWORDS.has(token),
    ),
  );

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}

async function loadCopilotData(aoi) {
  if (!cache.has(aoi)) {
    const promise = fetch(`${DATA_ROOT}copilot/${aoi}.json`)
      .then((response) => {
        if (!response.ok) throw new Error('missing');
        return response.json();
      })
      .then((data) => {
        for (const entry of data.entries || []) {
          entry._tokens = [
            ...(entry.questions?.en || []),
            ...(entry.questions?.ur || []),
          ].map(tokenize);
        }
        return data;
      })
      .catch(() => {
        cache.delete(aoi);
        return null;
      });
    cache.set(aoi, promise);
  }
  return cache.get(aoi);
}

function render(entry, lang) {
  const answer = entry.answer?.[lang] || entry.answer?.en || '';
  return {
    answer,
    dir: lang === 'ur' && entry.answer?.ur ? 'rtl' : 'ltr',
    footer: (entry.tools || [])
      .map(({ tool, args }) => describeCall(tool, args))
      .join('; '),
    matchedId: entry.id,
  };
}

function scoreEntries(entries, question, cellId) {
  const query = tokenize(question);
  const text = String(question).toLowerCase();
  const boosts = new Map();
  for (const { ids, boost, re } of KEYWORDS) {
    if (!re.test(text)) continue;
    for (const id of ids) boosts.set(id, Math.max(boosts.get(id) || 0, boost));
  }
  if (cellId && THIS_CELL.test(text)) boosts.set(cellEntryId(cellId), 1.2);
  const mention = CELL_MENTION.exec(text);
  if (mention) boosts.set(`cell_${mention[1]}_${mention[2]}_${mention[3]}`, 2);
  return entries
    .map((entry) => {
      const overlap = Math.max(0, ...entry._tokens.map((t) => jaccard(query, t)));
      return { entry, score: overlap + (boosts.get(entry.id) || 0) };
    })
    .sort((a, b) => b.score - a.score);
}

export async function answerById(aoi, id, lang = 'en') {
  const data = await loadCopilotData(aoi);
  const entry = data?.entries?.find((item) => item.id === id);
  return entry ? render(entry, lang) : null;
}

export async function answerOffline(question, { aoi, cellId, lang } = {}) {
  const data = await loadCopilotData(aoi);
  if (!data?.entries?.length) return null;
  const language = ARABIC_SCRIPT.test(question) ? 'ur' : lang || 'en';
  const ranked = scoreEntries(data.entries, question, cellId);
  if (ranked[0].score >= THRESHOLD) return render(ranked[0].entry, language);

  const help = data.entries.find((entry) => entry.id === 'help');
  const suggestions = ranked
    .filter(
      ({ entry }) =>
        entry.id !== 'help' &&
        !entry.id.startsWith('cell_') &&
        (entry.questions?.[language] || entry.questions?.en)?.length,
    )
    .slice(0, SUGGESTIONS)
    .map(
      ({ entry }) => (entry.questions[language] || entry.questions.en)[0],
    );
  const base = help?.answer?.[language] || help?.answer?.en || NO_HELP[language];
  return {
    answer: [base, '', TRY_PREFIX[language], ...suggestions.map((q) => `• ${q}`)].join('\n'),
    dir: language === 'ur' ? 'rtl' : 'ltr',
    footer: (help?.tools || [])
      .map(({ tool, args }) => describeCall(tool, args))
      .join('; '),
    matchedId: 'fallback',
  };
}
