import { USFMAdapter } from '../../src/infrastructure/bible/adapters/usfm-adapter';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function bookCounts(dir, code) {
  const file = readdirSync(dir)
    .filter((f) => f.endsWith('.usfm') && f.includes(`-${code}`))
    .map((f) => join(dir, f))[0];
  const doc = USFMAdapter.parse(readFileSync(file, 'utf-8'));
  const book = doc.books[0];
  // Find the max verse number per chapter and count actual verses
  const perChapter: Array<[number, number, number]> = [];
  for (const c of book.chapters) {
    const max = c.verses.length ? Math.max(...c.verses.map((v) => v.number)) : 0;
    perChapter.push([c.number, c.verses.length, max]);
  }
  // Find gaps: verse numbers with a count higher than expected
  const gaps = perChapter.filter((c) => c[2] !== c[1]);
  return { code, chapters: book.chapters.length, totalVerses: book.chapters.reduce((s, c) => s + c.verses.length, 0), perChapter, gaps };
}

const BASE = 'data/bible/raw/fra';
const code = 'PSA';
for (const name of ['frajnd_usfm', 'fra_fob_usfm', 'fraLSG_usfm']) {
  const r = bookCounts(join(BASE, name), code);
  console.log(`\n=== ${name} ===`);
  console.log(`chapters: ${r.chapters}, totalVerses: ${r.totalVerses}`);
  if (r.gaps.length) {
    console.log('CHAPTERS WITH GAPS (count != maxVerseNum):');
    for (const [n, count, max] of r.gaps) {
      console.log(`  ch ${n}: ${count} verses, max number ${max} — missing ${max - count} verses`);
    }
  }
}
