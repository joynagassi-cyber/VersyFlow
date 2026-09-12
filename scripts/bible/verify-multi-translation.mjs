/**
 * §50 Multi-translation proof — run the SAME generic USFMAdapter over each of
 * the three on-disk French USFM corpora and report books / verse counts.
 *
 * This is the "one adapter → many translations" gate: if all three yield 66
 * books with the expected verse count, the adapter is translation-agnostic.
 *
 * Usage: npx tsx scripts/bible/verify-multi-translation.mjs
 */
import { USFMAdapter } from '../../src/infrastructure/bible/adapters/usfm-adapter';
import { countVerses } from '../../src/domains/bible/document';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'data/bible/raw/fra';
const EXPECTED_BOOKS = 66;
const EXPECTED_VERSES = 17380; // D5 — full PROTESTANT_66 canon

function parseDir(dir: string) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.usfm'))
    .sort();
  const all = files.map((f) => readFileSync(join(dir, f), 'utf-8')).join('\n');
  return USFMAdapter.parse(all);
}

const corpora: Record<string, string> = {
  'frajnd_usfm': join(BASE, 'frajnd_usfm'),
  'fra_fob_usfm': join(BASE, 'fra_fob_usfm'),
  'fraLSG_usfm': join(BASE, 'fraLSG_usfm'),
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
  const okVerses = verses === EXPECTED_VERSES;
  const ok = okBooks && okVerses;
  if (!ok) allPass = false;
  console.log(
    `${name}: ${books} books ${okBooks ? '✓' : '✗ (want ' + EXPECTED_BOOKS + ')'}, ` +
    `${verses} verses ${okVerses ? '✓' : '✗ (want ' + EXPECTED_VERSES + ')'}`,
  );
}

console.log(allPass ? '\n§50 GATE: PASS' : '\n§50 GATE: FAIL');
process.exit(allPass ? 0 : 1);
