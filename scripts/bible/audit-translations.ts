/**
 * Quick audit of every translation available in the app (catalogue).
 *
 * Usage:
 *   npx cross-env TS_NODE_PROJECT=tsconfig.app.json tsx -r tsconfig-paths/register scripts/bible/audit-translations.ts [id...]
 *
 * For each translation it verifies the remote Supabase Storage dataset
 * (HEAD → content-length), then downloads and parses it (full audit, the
 * default) to report the actual book/chapter/verse counts and flag empty
 * verse text. Only `--quick` skips the full download+parse.
 *
 * This is a read-only diagnostic: it never modifies the catalogue or the
 * cache. Run it to get a clear picture of what each enabled Bible version
 * actually delivers so issues can be corrected upstream.
 */

import {
  BIBLE_DATASET_CATALOG,
  datasetBaseUrl,
} from '../../src/services/bible-text-service';
import {
  parseTranslationData,
  type BibleTranslationData,
} from '../../src/domains/bible/repository-local';

const QUICK = process.argv.includes('--quick');
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--'));

function bytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.ceil(n / 1024)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

function summarize(data: BibleTranslationData) {
  const chapters = data.books.flatMap((b) => b.chapters);
  const verseTexts = chapters.flatMap((c) => c.verses.map((v) => v.text));
  const empty = verseTexts.filter((t) => t.trim() === '').length;
  return {
    books: data.books.length,
    chapters: chapters.length,
    verses: verseTexts.length,
    empty,
  };
}

async function main() {
  const base = datasetBaseUrl();
  const catalog = ONLY.length
    ? BIBLE_DATASET_CATALOG.filter((e) => ONLY.includes(e.id))
    : BIBLE_DATASET_CATALOG;

  const missing = ONLY.filter((id) => !catalog.some((e) => e.id === id));
  if (missing.length) {
    console.error(`✗ Not in catalogue: ${missing.join(', ')}`);
  }

  console.log(
    `${catalog.length} dataset(s) — base: ${base}  [${QUICK ? 'quick' : 'full audit'}]`,
  );

  for (const entry of catalog) {
    const url = `${base}/${entry.id}.json`;
    try {
      const head = await fetch(url, { method: 'HEAD' });
      const len = Number(head.headers.get('content-length') ?? 0);
      const sizeOk = entry.sizeBytes > 0 ? len === entry.sizeBytes : len > 0;
      console.log(
        `${head.status === 200 ? '✓' : '✗'} ${entry.id.padEnd(14)} HTTP ${head.status}  ` +
          `served=${bytes(len)} catalog=${bytes(entry.sizeBytes)} ` +
          `${sizeOk ? 'ok' : 'MISMATCH'}`,
      );
      if (head.status !== 200) continue;
      if (QUICK) continue;

      const t0 = Date.now();
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`  ✗ download failed (HTTP ${res.status})`);
        continue;
      }
      const text = await res.text();
      const data = parseTranslationData(JSON.parse(text));
      const s = summarize(data);
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(
        `  ✓ parsed in ${dt}s — ${s.books} books, ${s.chapters} chapters, ` +
          `${s.verses} verses, ${s.empty} empty verse text${s.empty ? '  ⚠' : ''}`,
      );
    } catch (error) {
      console.log(`  ✗ ${entry.id} — ${(error as Error).message}`);
    }
  }
}

void main();
