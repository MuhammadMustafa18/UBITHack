const HAZARD_KEYS = ['flood', 'heat', 'terrain', 'air', 'veg'];
const BAND_ORDER = ['high', 'elevated', 'moderate', 'low'];

export const URDU_REVIEW_NOTE = 'Urdu text needs native-speaker review before operational use.';

const EN = {
  dir: 'ltr',
  noData: 'no data',
  bands: { high: 'High', elevated: 'Elevated', moderate: 'Moderate', low: 'Low', insufficient_data: 'Insufficient data' },
  hazards: { flood: 'flood', heat: 'heat', terrain: 'terrain', air: 'air quality', veg: 'vegetation' },
  title: {
    cell: 'Cell advisory · {id} · {bandName} risk',
    area: 'Area advisory · {aoiName} · {bandName} risk',
    cellNone: 'Cell advisory · {id} · insufficient data',
    areaNone: 'Area advisory · {aoiName} · insufficient data',
  },
  lead: {
    cell: 'Overall risk score {score}/100 ({bandName}); main driver: {driverName}.',
    area: '{cells} cells assessed; {highElevPct}% rated high or elevated; {popHigh} people live in high-risk cells; mean data coverage {coveragePct}%.',
    areaDriver: 'Dominant driver: {driverName} (mean score {driverScore}/100).',
    pop: 'Population in this cell: {pop}.',
  },
  detail: {
    flood: 'Satellite-detected flood extent covers {sarFloodPct}% of the cell, historical water occurrence is {jrcOccurrence}%, height above nearest drainage is {handM} m.',
    heat: 'Peak land-surface temperature is {lstDayC} °C; urban heat excess over non-built surroundings is {uhiC} °C.',
    terrain: 'Slope is {slopeDeg}°, upstream flow accumulation (log10) is {flowAccLog10}, elevation is {elevM} m.',
    air: 'Air-pollution indicator score is {hs_air}/100 (satellite-based relative indicator, not ground concentration).',
    veg: 'Vegetation index (NDVI) is {ndvi} with a change of {ndviTrend}.',
  },
  actions: {
    flood: {
      high: [
        'Place district flood teams and boats on standby and confirm evacuation routes out of low-lying areas.',
        'Issue flood warnings to communities near rivers and nullahs; advise moving livestock and valuables to higher ground.',
        'Pre-position relief stock and medical supplies on high ground outside the flooded footprint.',
      ],
      elevated: [
        'Increase monitoring of river and drain levels and brief union council focal persons.',
        'Inspect and clear drainage and embankment weak points before the next heavy rain.',
      ],
      moderate: ['Keep flood contingency plans current and watch rainfall forecasts.'],
    },
    heat: {
      high: [
        'Open cooling centres and shaded drinking-water points; keep hospital heat-stroke wards ready.',
        'Shift outdoor labour to early morning and evening and suspend work during the midday peak.',
        'Check on the elderly, children and outdoor workers and issue heat-stroke first-aid guidance.',
      ],
      elevated: [
        'Provide drinking water and shaded rest areas at markets and transport hubs.',
        'Advise outdoor workers to avoid the afternoon peak.',
      ],
      moderate: ['Share heat-safety messaging and keep drinking water available in public spaces.'],
    },
    terrain: {
      high: [
        'Restrict new construction and settlement on steep or runoff-concentrating ground and inspect slopes for landslide and runoff damage.',
        'Keep access roads clear and plan alternative routes for rescue vehicles.',
        'Place early-warning markers where runoff concentrates.',
      ],
      elevated: [
        'Inspect slopes and drainage channels and clear blockages that concentrate runoff.',
        'Avoid siting shelters and relief camps on steep or channelled ground.',
      ],
      moderate: ['Include slope and runoff hotspots in routine site inspections.'],
    },
    air: {
      high: [
        'Advise sensitive groups (children, the elderly, people with asthma or heart conditions) to stay indoors and wear masks outdoors.',
        'Review and enforce limits on open burning, brick kilns and heavy-vehicle emissions.',
        'Verify with ground monitors before issuing public-health orders; this score is a satellite-based relative indicator.',
      ],
      elevated: [
        'Issue health advice to sensitive groups and limit strenuous outdoor activity.',
        'Increase checks on open burning and high-emission sources.',
      ],
      moderate: ['Continue routine air-quality monitoring and confirm with ground stations where available.'],
    },
    veg: {
      high: [
        'Prioritise tree planting and land restoration where vegetation loss is steepest.',
        'Limit clearing and grazing pressure in degraded areas to reduce erosion, runoff and heat.',
        'Coordinate recovery plans with forestry and agriculture departments.',
      ],
      elevated: [
        'Identify areas of declining greenery and plan restoration and protection.',
        'Limit further clearing of vegetation around settlements.',
      ],
      moderate: ['Track vegetation trends each season.'],
    },
  },
  low: 'No immediate action indicated; continue routine monitoring and re-check after the next data update.',
  footer: 'Based on satellite- and model-derived indicators; verify locally before operational decisions.',
  insufficient: [
    'Too little data to score this {unit}: coverage is {coveragePct}%, below the 50% needed for a risk score.',
    'Do not treat this as low risk. Gather local observations or wait for the next data update.',
  ],
  units: { cell: 'cell', area: 'area' },
};

const UR = {
  dir: 'rtl',
  noData: 'ڈیٹا دستیاب نہیں',
  bands: { high: 'شدید', elevated: 'بلند', moderate: 'درمیانہ', low: 'کم', insufficient_data: 'ڈیٹا ناکافی' },
  hazards: { flood: 'سیلاب', heat: 'گرمی', terrain: 'زمینی ساخت', air: 'فضائی آلودگی', veg: 'سبزے کی صورتحال' },
  title: {
    cell: 'خانے کی ایڈوائزری · {id} · {bandName} خطرہ',
    area: 'علاقائی ایڈوائزری · {aoiName} · {bandName} خطرہ',
    cellNone: 'خانے کی ایڈوائزری · {id} · ڈیٹا ناکافی',
    areaNone: 'علاقائی ایڈوائزری · {aoiName} · ڈیٹا ناکافی',
  },
  lead: {
    cell: 'مجموعی خطرے کا اسکور {score}/100 ({bandName}) ہے؛ بنیادی سبب: {driverName}۔',
    area: '{cells} خانوں کا جائزہ لیا گیا؛ {highElevPct}% خانے شدید یا بلند خطرے میں ہیں؛ شدید خطرے والے خانوں میں {popHigh} افراد رہتے ہیں؛ ڈیٹا کی اوسط کوریج {coveragePct}% ہے۔',
    areaDriver: 'غالب سبب: {driverName} (اوسط اسکور {driverScore}/100)۔',
    pop: 'اس خانے کی آبادی: {pop}۔',
  },
  detail: {
    flood: 'سیٹلائٹ سے معلوم سیلابی رقبہ خانے کا {sarFloodPct}% ہے، تاریخی طور پر پانی کی موجودگی {jrcOccurrence}% ہے اور قریب ترین نکاسی سے بلندی {handM} میٹر ہے۔',
    heat: 'زمینی سطح کا زیادہ سے زیادہ درجۂ حرارت {lstDayC} °C ہے؛ غیر تعمیر شدہ اطراف کے مقابلے میں شہری گرمی کا اضافہ {uhiC} °C ہے۔',
    terrain: 'ڈھلان {slopeDeg}° ہے، بالائی بہاؤ کا اشاریہ (log10) {flowAccLog10} ہے اور بلندی {elevM} میٹر ہے۔',
    air: 'فضائی آلودگی کا اشاریہ {hs_air}/100 ہے (سیٹلائٹ پر مبنی نسبتی اشارہ، زمینی ارتکاز نہیں)۔',
    veg: 'سبزے کا اشاریہ (NDVI) {ndvi} ہے اور اس میں تبدیلی {ndviTrend} ہے۔',
  },
  actions: {
    flood: {
      high: [
        'ضلعی ریسکیو ٹیمیں اور کشتیاں تیار رکھیں اور نشیبی علاقوں سے انخلا کے راستوں کی تصدیق کریں۔',
        'دریاؤں اور نالوں کے قریب آبادیوں کو سیلاب کی وارننگ جاری کریں اور مویشی و قیمتی سامان اونچی جگہ منتقل کرنے کی ہدایت دیں۔',
        'امدادی سامان اور طبی سپلائی سیلاب زدہ حدود سے باہر اونچی جگہ پر پہلے سے پہنچا دیں۔',
      ],
      elevated: [
        'دریا اور نالوں کی سطح کی نگرانی بڑھائیں اور یونین کونسل کے رابطہ افسران کو آگاہ کریں۔',
        'اگلی تیز بارش سے پہلے نکاسیِ آب اور پشتوں کے کمزور مقامات کا معائنہ کریں اور رکاوٹیں ہٹائیں۔',
      ],
      moderate: ['سیلاب کے ہنگامی منصوبے تازہ رکھیں اور بارش کی پیش گوئی پر نظر رکھیں۔'],
    },
    heat: {
      high: [
        'کولنگ سینٹر اور سایہ دار پینے کے پانی کے مقامات کھولیں اور ہسپتالوں میں ہیٹ اسٹروک وارڈ تیار رکھیں۔',
        'کھلے میں کام کرنے والوں کے اوقات صبح سویرے اور شام میں منتقل کریں اور دوپہر کی شدید گرمی میں کام روک دیں۔',
        'بزرگوں، بچوں اور باہر کام کرنے والوں کی خبرگیری کریں اور ہیٹ اسٹروک سے بچاؤ کی ہدایات جاری کریں۔',
      ],
      elevated: [
        'بازاروں اور ٹرانسپورٹ اڈوں پر پینے کے پانی اور سایہ دار آرام گاہوں کا انتظام کریں۔',
        'باہر کام کرنے والوں کو سہ پہر کی شدید گرمی سے بچنے کا مشورہ دیں۔',
      ],
      moderate: ['گرمی سے بچاؤ کا پیغام عام کریں اور عوامی مقامات پر پینے کا پانی دستیاب رکھیں۔'],
    },
    terrain: {
      high: [
        'ڈھلوانی یا بارش کا پانی جمع کرنے والی زمین پر نئی تعمیرات اور آبادکاری روکیں اور لینڈ سلائیڈ اور بہاؤ سے ہونے والے نقصان کے لیے ڈھلانوں کا معائنہ کریں۔',
        'رسائی کی سڑکیں کھلی رکھیں اور ریسکیو گاڑیوں کے لیے متبادل راستے طے کریں۔',
        'جہاں بارش کا پانی اکٹھا ہو کر بہتا ہے وہاں قبل از وقت انتباہی نشانات لگائیں۔',
      ],
      elevated: [
        'ڈھلانوں اور نکاسی کے راستوں کا معائنہ کریں اور پانی کا بہاؤ روکنے والی رکاوٹیں ہٹائیں۔',
        'پناہ گاہیں اور امدادی کیمپ ڈھلوانی یا پانی کے راستے والی زمین پر قائم نہ کریں۔',
      ],
      moderate: ['ڈھلان اور پانی کے بہاؤ کے حساس مقامات کو معمول کے معائنوں میں شامل رکھیں۔'],
    },
    air: {
      high: [
        'حساس افراد، یعنی بچوں، بزرگوں اور دمہ یا دل کے مریضوں کو گھر کے اندر رہنے اور باہر ماسک پہننے کا مشورہ دیں۔',
        'کھلے میں کوڑا جلانے، بھٹوں اور بھاری گاڑیوں کے دھوئیں پر پابندیوں کا جائزہ لے کر ان پر عمل کروائیں۔',
        'صحتِ عامہ کے احکامات سے پہلے زمینی مانیٹرز سے تصدیق کریں؛ یہ اسکور سیٹلائٹ پر مبنی نسبتی اشارہ ہے۔',
      ],
      elevated: [
        'حساس افراد کو صحت کے مشورے جاری کریں اور سخت بیرونی سرگرمیاں محدود کرنے کا کہیں۔',
        'کھلے میں کوڑا جلانے اور زیادہ دھواں دینے والے ذرائع کی نگرانی بڑھائیں۔',
      ],
      moderate: ['فضائی معیار کی معمول کی نگرانی جاری رکھیں اور جہاں ممکن ہو زمینی اسٹیشنوں سے تصدیق کریں۔'],
    },
    veg: {
      high: [
        'سبزے میں سب سے زیادہ کمی والے علاقوں میں شجرکاری اور زمین کی بحالی کو ترجیح دیں۔',
        'متاثرہ علاقوں میں درختوں کی کٹائی اور چرائی کا دباؤ محدود کریں تاکہ کٹاؤ، پانی کا بہاؤ اور گرمی کم ہو۔',
        'بحالی کے منصوبوں پر محکمۂ جنگلات اور محکمۂ زراعت کے ساتھ مل کر کام کریں۔',
      ],
      elevated: [
        'سبزے میں کمی والے علاقوں کی نشاندہی کریں اور بحالی و تحفظ کا منصوبہ بنائیں۔',
        'آبادیوں کے گرد مزید درخت اور جھاڑیاں کاٹنے پر پابندی لگائیں۔',
      ],
      moderate: ['ہر موسم میں سبزے کے رجحان کی نگرانی کریں۔'],
    },
  },
  low: 'فوری اقدام کی ضرورت نہیں؛ معمول کی نگرانی جاری رکھیں اور اگلی ڈیٹا اپ ڈیٹ کے بعد دوبارہ جائزہ لیں۔',
  footer: 'یہ سیٹلائٹ اور ماڈل سے حاصل شدہ اشاریوں پر مبنی ہے؛ عملی فیصلوں سے پہلے مقامی سطح پر تصدیق کریں۔',
  insufficient: [
    'اس {unit} کے لیے ڈیٹا ناکافی ہے: کوریج {coveragePct}% ہے جبکہ خطرے کے اسکور کے لیے کم از کم 50% درکار ہے۔',
    'اسے کم خطرہ نہ سمجھیں؛ مقامی مشاہدات جمع کریں یا اگلی ڈیٹا اپ ڈیٹ کا انتظار کریں۔',
  ],
  units: { cell: 'خانے', area: 'علاقے' },
  note: URDU_REVIEW_NOTE,
};

const LANGS = { en: EN, ur: UR };

const hazardKey = (d) => {
  const key = typeof d === 'string' ? d : d?.hazard || d?.name;
  return HAZARD_KEYS.includes(key) ? key : null;
};

const meanOf = (v) => (v && typeof v === 'object' ? v.mean ?? v.score ?? null : v ?? null);

const pct = (x) => (typeof x === 'number' && Number.isFinite(x) ? Math.round(x * 100) : null);

const fmt = (x, T) => {
  if (x == null || (typeof x === 'number' && !Number.isFinite(x))) return T.noData;
  return typeof x === 'number' ? x.toLocaleString('en-US', { maximumFractionDigits: 6 }) : String(x);
};

const fill = (tpl, vals, T) => tpl.replace(/\{(\w+)\}/g, (_, k) => fmt(vals[k], T));

const isCell = (input) => input && (input.metrics !== undefined || input.composite !== undefined);

function topHazard(scores) {
  let best = null;
  for (const k of HAZARD_KEYS) {
    const v = meanOf(scores?.[k]);
    if (typeof v === 'number' && (best === null || v > best.v)) best = { k, v };
  }
  return best?.k || null;
}

function cellContext(input) {
  const comp = input.composite || {};
  const hazards = input.hazards || comp.hazards || {};
  const scored = comp.score != null && comp.band && comp.band !== 'insufficient_data';
  const driver = hazardKey(comp.drivers?.[0]) || topHazard(hazards);
  const vals = {
    ...(input.metrics || {}),
    id: input.id,
    score: comp.score,
    sarFloodPct: pct(input.metrics?.sarFloodFrac),
    coveragePct: pct(comp.coverage),
  };
  for (const k of HAZARD_KEYS) vals[`hs_${k}`] = meanOf(hazards[k]);
  return { kind: 'cell', band: scored ? comp.band : 'insufficient_data', driver, vals };
}

function areaContext(input) {
  const counts = input.bandCounts || {};
  const scoredTotal = BAND_ORDER.reduce((s, b) => s + (counts[b] || 0), 0);
  const cellsN = typeof input.cells === 'number'
    ? input.cells
    : Array.isArray(input.cells)
      ? input.cells.length
      : scoredTotal + (counts.insufficient_data || 0);
  let band = 'insufficient_data';
  if (scoredTotal > 0) {
    let cum = 0;
    band = 'low';
    for (const b of BAND_ORDER) {
      cum += counts[b] || 0;
      if (cum / scoredTotal >= 0.25) {
        band = b;
        break;
      }
    }
  }
  const driver = hazardKey(input.topDrivers?.[0]) || topHazard(input.hazardMeans);
  const vals = {
    aoi: input.aoi,
    cells: cellsN,
    highElevPct: cellsN ? Math.round((((counts.high || 0) + (counts.elevated || 0)) / cellsN) * 100) : null,
    popHigh: input.popByBand?.high,
    coveragePct: pct(input.coverageMean),
    driverScore: driver ? meanOf(input.hazardMeans?.[driver]) : null,
  };
  return { kind: 'area', band, driver, vals };
}

export function advisory(input, lang = 'en') {
  const T = LANGS[lang] || EN;
  const ctx = isCell(input) ? cellContext(input || {}) : areaContext(input || {});
  const { kind, band, driver, vals } = ctx;
  const aoiName = lang === 'ur' ? input?.nameUr || input?.name || input?.aoi : input?.name || input?.aoi;
  vals.aoiName = aoiName;
  vals.bandName = T.bands[band];
  vals.driverName = driver ? T.hazards[driver] : null;
  vals.unit = T.units[kind];
  const withNote = (out) => (T.note ? { ...out, note: T.note } : out);

  if (band === 'insufficient_data') {
    return withNote({
      title: fill(T.title[`${kind}None`], vals, T),
      lines: T.insufficient.map((l) => fill(l, vals, T)),
      dir: T.dir,
    });
  }

  const lines = [fill(T.lead[kind], vals, T)];
  if (kind === 'area') {
    if (driver) lines.push(fill(T.lead.areaDriver, vals, T));
  } else {
    if (driver) lines.push(fill(T.detail[driver], vals, T));
    lines.push(fill(T.lead.pop, vals, T));
  }
  if (band === 'low' || !driver) lines.push(T.low);
  else lines.push(...(T.actions[driver][band] || [T.low]));
  lines.push(T.footer);

  return withNote({ title: fill(T.title[kind], vals, T), lines, dir: T.dir });
}
