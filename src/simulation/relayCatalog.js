export const RELAY_CATALOG = {
  markers: { en: 'EXERCISE', ur: 'مشق' },
  reviewed: { en: true, ur: false },
  status: {
    observed_exceed: {
      en: 'River level above a warning threshold has been reported on the {river}.',
      ur: '{river} میں پانی کی سطح خطرے کے نشان سے اوپر رپورٹ ہوئی ہے۔',
    },
    propagated_watch: {
      en: 'High water reported upstream on the {river} may reach this area.',
      ur: '{river} میں اوپر کی طرف رپورٹ ہونے والا اونچا پانی اس علاقے تک پہنچ سکتا ہے۔',
    },
    no_data: {
      en: 'River data for this area is limited.',
      ur: 'اس علاقے کے لیے دریا کی معلومات محدود ہیں۔',
    },
  },
  riverFallback: { en: 'the river', ur: 'دریا' },
  window: {
    range: {
      en: 'Water may arrive in about {lo}–{hi} hours (illustrative estimate).',
      ur: 'پانی تقریباً {lo} سے {hi} گھنٹوں میں پہنچ سکتا ہے (اندازہ)۔',
    },
    now: {
      en: 'Water may arrive now or within {hi} hours (illustrative estimate).',
      ur: 'پانی ابھی یا {hi} گھنٹوں کے اندر پہنچ سکتا ہے (اندازہ)۔',
    },
    passed: {
      en: 'The estimated arrival window has passed; stay alert.',
      ur: 'اندازاً آمد کا وقت گزر چکا ہے؛ چوکنا رہیں۔',
    },
    unknown: {
      en: 'Arrival timing is not known.',
      ur: 'پانی پہنچنے کا وقت معلوم نہیں۔',
    },
  },
  source: {
    en: 'Source: {source}, {issued}.',
    ur: 'ذریعہ: {source}، {issued}۔',
  },
  actions: {
    avoid_riverbanks: {
      en: 'Stay away from the riverbank and streams.',
      ur: 'دریا کے کنارے اور نالوں سے دور رہیں۔',
    },
    move_to_higher_ground: {
      en: 'Move to higher ground.',
      ur: 'اونچی جگہ پر منتقل ہو جائیں۔',
    },
    move_valuables_livestock_up: {
      en: 'Move valuables and livestock to higher ground.',
      ur: 'قیمتی سامان اور مویشی اونچی جگہ پر لے جائیں۔',
    },
    prepare_go_bag: {
      en: 'Keep a bag ready with ID cards, medicines, water and a phone charger.',
      ur: 'شناختی کارڈ، دوائیں، پانی اور فون چارجر کا بیگ تیار رکھیں۔',
    },
    evacuate_to_site: {
      en: 'Go to {site}.',
      ur: '{site} کی طرف منتقل ہو جائیں۔',
    },
    help_elderly_disabled: {
      en: 'Help elderly people, children and people with disabilities move first.',
      ur: 'بزرگوں، بچوں اور معذور افراد کو پہلے منتقل ہونے میں مدد دیں۔',
    },
    do_not_cross_causeways: {
      en: 'Do not cross flooded roads, causeways or bridges.',
      ur: 'پانی میں ڈوبی سڑکیں، کازوے یا پل پار نہ کریں۔',
    },
    listen_for_updates: {
      en: 'Listen for updates from mosque announcements and local officials.',
      ur: 'مسجد کے اعلانات اور مقامی حکام کی تازہ معلومات سنتے رہیں۔',
    },
    contact_relay_point: {
      en: 'Contact your local relay point if you need help.',
      ur: 'مدد کی ضرورت ہو تو اپنے مقامی رابطہ مرکز سے رابطہ کریں۔',
    },
  },
};

export const RELAY_TEMPLATES = {
  sms: {
    en: '{marker} - not an official warning. {communities}: {status} {window} {actions} {source} {marker}',
    ur: '{marker} - یہ سرکاری وارننگ نہیں۔ {communities}: {status} {window} {actions} {source} {marker}',
  },
  voice: {
    en: [
      '{marker}. This is an exercise message, not an official warning.',
      'Attention {communities}.',
      '{status} {source}',
      '{window}',
      '{actions}',
      'Again: {status} {key_action}',
      '{marker}.',
    ].join('\n'),
    ur: [
      '{marker}۔ یہ مشق کا پیغام ہے، سرکاری وارننگ نہیں۔',
      '{communities} کے رہائشی توجہ فرمائیں۔',
      '{status} {source}',
      '{window}',
      '{actions}',
      'دوبارہ سنیں: {status} {key_action}',
      '{marker}۔',
    ].join('\n'),
  },
};
