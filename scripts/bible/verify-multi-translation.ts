/**
 * §50 Multi-translation proof — run the SAME generic USFMAdapter over each of
 * the three on-disk French USFM corpora and report books / verse counts.
 *
 * Gate: all corpora must produce exactly 66 books AND verse counts within
 * 5% of each other (same verse-numbering convention). The D5 reference count
 * (17,380) was measured on a synthetic placeholder corpus and is not a valid
 * invariant for real scripture; the real corpus verse count varies slightly
 * per translation (≈ 31,000–31,200).
 *
 * Usage: npx tsx scripts/bible/verify-multi-translation.ts
 */
import { USFMAdapter } from '../../src/infrastructure/bible/adapters/usfm-adapter';
import { countVerses } from '../../src/domains/bible/document';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'data/bible/raw/fra';
const EXPECTED_BOOKS = 66;
const TOLERANCE = 0.05; // 5 %

function parseDir(dir: string) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.usfm'))
    .sort();
  const all = files.map((f) => readFileSync(join(dir, f), 'utf-8')).join('\n');
  return USFMAdapter.parse(all);
}

const corpora: Record<string, string> = {
  frajnd_usfm: join(BASE, 'frajnd_usfm'),
  fra_fob_usfm: join(BASE, 'fra_fob_usfm'),
  fraLSG_usfm: join(BASE, 'fraLSG_usfm'),
};

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

const verseCounts = results.map((r) => r.verses).filter((v) => v > 0);
let verseCountGate = true;
if (verseCounts.length >= 2) {
  const min = Math.min(...verseCounts);
  const max = Math.max(...verseCounts);
  const range = max - min;
  const avg = (min + max) / 2;
  verseCountGate = range / avg <= TOLERANCE;
  console.log(
    `Verse count range: ${min}–${max} (Δ${range}, ${((range / avg) * 100).toFixed(1)}% — tolerance ${(TOLERANCE * 100).toFixed(0)}%)`,
  );
}

const allPass = allBooksOk && verseCountGate;
console.log(allPass ? '\n§50 GATE: PASS' : '\n§50 GATE: FAIL');
process.exit(allPass ? 0 : 1);
