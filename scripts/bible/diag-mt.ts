import { USFMAdapter } from '../../src/infrastructure/bible/adapters/usfm-adapter';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'data/bible/raw/fra';
const corpora = {
  frajnd_usfm: join(BASE, 'frajnd_usfm'),
  fra_fob_usfm: join(BASE, 'fra_fob_usfm'),
  fraLSG_usfm: join(BASE, 'fraLSG_usfm'),
};

function countsFor(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.usfm')).sort();
  const all = files.map((f) => readFileSync(join(dir, f), 'utf-8')).join('\n');
  const doc = USFMAdapter.parse(all);
  const perBook: Record<string, number> = {};
  for (const b of doc.books) {
    const n = b.chapters.reduce((s, c) => s + c.verses.length, 0);
    perBook[b.id] = n;
  }
  return perBook;
}

const results = {};
for (const [name, dir] of Object.entries(corpora)) {
  results[name] = countsFor(dir);
}

// Print per-book verse counts across corpora
const keys = Object.keys(results.fraLSG_usfm);
console.log('USFM', ...Object.keys(corpora).map((n) => n.padStart(14)));
for (const k of keys) {
  const vals = [results.fraLSG_usfm[k], results.fra_fob_usfm[k], results.frajnd_usfm[k]];
  const diff = vals[0] !== vals[1] || vals[0] !== vals[2];
  console.log(k.padEnd(6), vals.join(' '), diff ? '  <-- DIFF' : '');
}
const tot = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
console.log('TOTAL', [tot(results.fraLSG_usfm), tot(results.fra_fob_usfm), tot(results.frajnd_usfm)].join(' '));
