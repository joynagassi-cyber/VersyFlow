import { USFMAdapter } from '../../src/infrastructure/bible/adapters/usfm-adapter';
import { countVerses } from '../../src/domains/bible/document';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'data/bible/raw/fra';
const EXPECTED_BOOKS = 66;

function parseDir(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.usfm')).sort();
  const all = files.map((f) => readFileSync(join(dir, f), 'utf-8')).join('\n');
  return USFMAdapter.parse(all);
}

const corpora = {
  frajnd_usfm: join(BASE, 'frajnd_usfm'),
  fra_fob_usfm: join(BASE, 'fra_fob_usfm'),
  fraLSG_usfm: join(BASE, 'fraLSG_usfm'),
};

let allPass = true;
for (const [name, dir] of Object.entries(corpora)) {
  if (!existsSync(dir)) {
    console.log(`${name}: MISSING (${dir})`);
    allPass = false;
    continue;
  }
  const doc = parseDir(dir);
  const books = doc.books.length;
  const verses = countVerses(doc);
  const okBooks = books === EXPECTED_BOOKS;
  const ok = okBooks && verses > 0;
  if (!ok) allPass = false;
  console.log(`${name}: ${books} books ${okBooks ? '✓' : '✗'}, ${verses} verses`);
}

// §50 Gate: same adapter, same verse count across all 3 corpora
const counts = [];
for (const [name, dir] of Object.entries(corpora)) {
  if (existsSync(dir)) {
    const doc = parseDir(dir);
    counts.push(countVerses(doc));
  }
}
const allEqual = new Set(counts).size === 1;
if (!allEqual) allPass = false;
console.log('Verse counts:', counts.join(', '));
console.log(allPass ? '\n§50 GATE: PASS' : '\n§50 GATE: FAIL');
process.exit(allPass ? 0 : 1);
