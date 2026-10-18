import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check } from '../../src/intelligence/grounding.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const aoi = process.argv[2];
if (!aoi) {
  console.error('usage: node pipeline/agahi/validate_answers.mjs <aoi>');
  process.exit(1);
}

const facts = JSON.parse(
  await readFile(path.join(root, '.gev-cache', 'agahi', `facts-${aoi}.json`), 'utf8'),
);
const file = JSON.parse(
  await readFile(path.join(root, 'public', 'data', 'agahi', 'copilot', `${aoi}.json`), 'utf8'),
);

let bad = 0;
const ids = new Set();
for (const entry of file.entries) {
  if (ids.has(entry.id)) {
    console.log(`DUPLICATE id ${entry.id}`);
    bad += 1;
  }
  ids.add(entry.id);
  for (const lang of ['en', 'ur']) {
    const text = entry.answer?.[lang];
    if (typeof text !== 'string' || !text.trim()) {
      console.log(`MISSING ${entry.id} answer.${lang}`);
      bad += 1;
      continue;
    }
    const result = check(text, facts);
    if (!result.ok) {
      console.log(`UNGROUNDED ${entry.id} ${lang}: ${result.unknown.join(', ')}`);
      bad += 1;
    }
  }
  if (!entry.questions?.en?.length || !entry.questions?.ur?.length) {
    console.log(`NO QUESTIONS ${entry.id}`);
    bad += 1;
  }
}
console.log(`${file.entries.length} entries, ${bad} problems`);
process.exit(bad ? 1 : 0);
