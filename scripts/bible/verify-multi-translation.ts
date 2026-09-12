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

// §50 Gate: adapter is translation-agnostic — ALL corpora must produce:
// 1. Exactly 66 books (canon completeness), AND
// 2. Verse counts within 5% of each other (same verse numbering convention).
//
// The D5 reference count (17,380) was measured on a synthetic placeholder
// corpus and is not a valid invariant for real scripture. The real corpus
// verse count varies slightly per translation (≈ 31,000–31,200), driven by
// verse-numbering conventions in different source corpora.
const BASE = 'data/bible/raw/fra';
const EXPECTED_BOOKS = 66;
const TOLERANCE = 0.05; // 5 %

const results: Array<{ name: string; books: number; verses: number }> = [];
let allBooksOk = true;

for (const [name, dir] of Object.entries(corpora)) {
  if (!existsSync(dir)) {
    console.log(`${name}: MISSING (${dir})`);
    allBooksOk = false;
    continue;
  }
  const doc = parseDir(dir);
  const books = doc.books.length;
  const verses = countVerses(doc);
  if (books !== EXPECTED_BOOKS) allBooksOk = false;
  results.push({ name, books, verses });
  console.log(
    `${name}: ${books} books ${books === EXPECTED_BOOKS ? '✓' : '✗ (want ' + EXPECTED_BOOKS + ')'}, ` +
    `${verses} verses`,
  );
}

// Check verse counts are within tolerance of each other
const verses = results.map((r) => r.verses).filter((v) => v > 0);
let verseCountGate = true;
if (verses.length >= 2) {
  const min = Math.min(...verses);
  const max = Math.max(...verses);
  const range = max - min;
  const avg = (min + max) / 2;
  const withinTolerance = range / avg <= TOLERANCE;
  verseCountGate = withinTolerance;
  console.log(
    `Verse count range: ${min}–${max} (Δ${range}, ${((range / avg) * 100).toFixed(1)}% — tolerance ${(TOLERANCE * 100).toFixed(0)}%)`,
  );
}

let allPass = allBooksOk && verseCountGate;
console.log(allPass ? '\n§50 GATE: PASS' : '\n§50 GATE: FAIL');
process.exit(allPass ? 0 : 1);

