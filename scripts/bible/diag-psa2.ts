import { USFMAdapter } from '../../src/infrastructure/bible/adapters/usfm-adapter';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function inspect(dir, code, label) {
  const file = readdirSync(dir)
    .filter((f) => f.endsWith('.usfm') && f.includes(`-${code}`))
    .map((f) => join(dir, f))[0];
  const raw = readFileSync(file, 'utf-8');
  const doc = USFMAdapter.parse(raw);
  const book = doc.books[0];
  // For each chapter: verseCount vs maxVerseNumber
  const gaps: Array<{ ch: number; count: number; max: number; missing: number[] }> = [];
  for (const c of book.chapters) {
    if (c.verses.length === 0) continue;
    const max = Math.max(...c.verses.map((v) => v.number));
    const present = new Set(c.verses.map((v) => v.number));
    const missing: number[] = [];
    for (let i = 1; i <= max; i++) if (!present.has(i)) missing.push(i);
    if (missing.length > 0) gaps.push({ ch: c.number, count: c.verses.length, max, missing });
  }
  const total = book.chapters.reduce((s, c) => s + c.verses.length, 0);
  console.log(`\n=== ${label} / ${code} ===`);
  console.log(`totalVerses: ${total}`);
  if (gaps.length === 0) {
    console.log('No gaps — verse numbers are consecutive within each chapter.');
  } else {
    console.log(`Chapters with gaps (${gaps.length}):`);
    for (const g of gaps.slice(0, 5)) {
      console.log(`  ch ${g.ch}: ${g.count} verses, max ${g.max}, missing: [${g.missing.slice(0, 8)}${g.missing.length > 8 ? ', ...' : ''}]`);
    }
  }
}

const BASE = 'data/bible/raw/fra';
for (const [label, name] of [['fob', 'fra_fob_usfm'], ['lsg', 'fraLSG_usfm'], ['jnd', 'frajnd_usfm']] as const) {
  inspect(join(BASE, name), 'PSA', label);
}
