const NUMBER_RE = /(?<![\w.])-?\d+(?:\.\d+)?[eE][-+]?\d+|(?<![\w.])-?\d{1,3}(?:,\d{3})+(?:\.\d+)?|(?<![\w.])-?\d+(?:\.\d+)?/g;

function normalizeDigits(text) {
  return String(text)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, '.')
    .replace(/٬/g, ',');
}

function parseToken(raw) {
  const clean = raw.replace(/,/g, '');
  const value = Math.abs(Number(clean));
  if (!Number.isFinite(value)) return null;
  const sci = /^-?(\d+)(?:\.(\d+))?[eE]([-+]?\d+)$/.exec(clean);
  let decimals;
  if (sci) {
    decimals = Math.max(0, (sci[2] ? sci[2].length : 0) - Number(sci[3]));
  } else {
    const dot = clean.indexOf('.');
    decimals = dot === -1 ? 0 : clean.length - dot - 1;
  }
  return { value, decimals };
}

function tokens(text) {
  const out = [];
  for (const match of normalizeDigits(text).matchAll(NUMBER_RE)) {
    const token = parseToken(match[0]);
    if (token) out.push(token);
  }
  return out;
}

export function extractNumbers(text) {
  return tokens(text).map((t) => t.value);
}

function collect(node, into) {
  if (typeof node === 'number') {
    if (Number.isFinite(node)) into.push(Math.abs(node));
  } else if (typeof node === 'string') {
    into.push(...extractNumbers(node));
  } else if (Array.isArray(node)) {
    for (const item of node) collect(item, into);
  } else if (node && typeof node === 'object') {
    for (const item of Object.values(node)) collect(item, into);
  }
}

function roundTo(x, decimals) {
  return Number(x.toFixed(Math.min(decimals, 100)));
}

function matches(answer, known) {
  for (const r of known) {
    if (roundTo(r, answer.decimals) === answer.value) return true;
    if (r <= 1 && roundTo(r * 100, answer.decimals) === answer.value) return true;
  }
  return false;
}

function isAllowed({ value, decimals }) {
  if (decimals !== 0 || !Number.isInteger(value)) return false;
  return (value >= 1 && value <= 25) || (value >= 1900 && value <= 2100);
}

export function check(answer, toolResults) {
  const known = [];
  collect(toolResults, known);
  const unknown = [];
  for (const token of tokens(answer)) {
    if (isAllowed(token) || matches(token, known)) continue;
    if (!unknown.includes(token.value)) unknown.push(token.value);
  }
  return { ok: unknown.length === 0, unknown };
}
