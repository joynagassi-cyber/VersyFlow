/**
 * Canon-completeness test — 66 books × verse counts.
 *
 * The Protestant 66-book canon (39 OT + 27 NT) is the source of truth.
 * Bundled datasets that carry extra book slots (apocrypha, intro matter —
 * `int`, `esg`, `s3y`, `sus`, `bel`, `1ma`, `oth`, `dag`…) must be trimmed
 * to 66 by the canonical filter at the repository layer. The JSON files
 * themselves stay untouched.
 *
 * Loads the full datasets through the Node fs source and asserts the canon
 * invariants end-to-end.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  LocalBibleRepository,
  InMemoryBibleTextSource,
  filterCanonicalBooks,
  parseTranslationData,
} from '@/domains/bible';
import type { IBibleTextSource } from '@/domains/bible';
import { CANONICAL_BOOK_IDS, BIBLE_BOOKS } from '@/domains/bible/entities';
import { BibleJsonFileSource } from '@/infrastructure/bible/bible-json-source';
import { BIBLE_DATASET_CATALOG } from '@/services/bible-text-service';

const DATA_DIR = resolve(process.cwd(), 'data/bible');

function loadRaw(id: string): unknown {
  return JSON.parse(readFileSync(resolve(DATA_DIR, `${id}.json`), 'utf8'));
}

const source = new BibleJsonFileSource({ useNodeFs: true });
const repo = new LocalBibleRepository(source);

describe('Full canon completeness (66 books)', () => {
  it('lsg.json loads exactly 66 canonical books', async () => {
    const books = await repo.getBooks('lsg');
    expect(books.length).toBe(66);
  }, 60_000);

  it('all 66 BIBLE_BOOKS ids are present in the lsg dataset', async () => {
    const books = await repo.getBooks('lsg');
    const ids = new Set(books.map((b) => b.id));
    for (const book of BIBLE_BOOKS) {
      expect(ids.has(book.id)).toBe(true);
    }
    expect(ids.size).toBe(66);
  }, 60_000);

  it('lsg verse count is 31170 (canonical books only)', async () => {
    const count = await repo.getVerseCount('lsg');
    expect(count).toBe(31170);
  }, 60_000);

  it('kujv.json (73 raw books) filters down to 66', async () => {
    const raw = await source.load('kujv');
    // `parseTranslationData` already trims; assert the raw file had 73 slots.
    const rawFile = loadRaw('kujv') as { books: Array<{ id: string }> };
    expect(rawFile.books.length).toBe(73);
    const filtered = filterCanonicalBooks(
      parseTranslationData(rawFile).books,
    );
    expect(filtered.length).toBe(66);
    // The in-repo load agrees.
    expect(raw.books.length).toBe(66);
    // Every canonical book survives the filter.
    for (const id of CANONICAL_BOOK_IDS) {
      expect(filtered.some((b) => b.id === id)).toBe(true);
    }
  }, 60_000);

  it('kujv through the repository sees 66 books (default canonicalOnly)', async () => {
    const books = await repo.getBooks('kujv');
    expect(books.length).toBe(66);
  }, 60_000);

  it('webu.json (69 raw books) filters down to 66', async () => {
    const rawFile = loadRaw('webu') as { books: Array<{ id: string }> };
    expect(rawFile.books.length).toBe(69);
    const raw = await source.load('webu');
    expect(raw.books.length).toBe(66);
    const filtered = filterCanonicalBooks(parseTranslationData(rawFile).books);
    expect(filtered.length).toBe(66);
  }, 60_000);

  it('the other apocrypha datasets keep 66+ raw but filter to 66', async () => {
    for (const id of ['la-vulgate', 'francrampon', 'es-godword']) {
      const rawFile = loadRaw(id) as { books: Array<{ id: string }> };
      // Raw JSON is untouched: it still carries the extra slots.
      expect(rawFile.books.length).toBeGreaterThanOrEqual(66);
      const raw = await source.load(id);
      expect(raw.books.length).toBe(66);
      expect(filterCanonicalBooks(parseTranslationData(rawFile).books).length).toBe(66);
    }
  }, 60_000);

  it('canonicalOnly:false keeps the raw dataset; default trims to the canon', async () => {
    // A source that hands the repository the RAW dataset (as a hand-rolled
    // IBibleTextSource would), so the repository's own filter is what trims.
    const rawSource: IBibleTextSource = {
      load: async (id: string) =>
        parseTranslationData(loadRaw(id), { canonicalOnly: false }),
    };
    const rawRepo = new LocalBibleRepository(rawSource, false);
    expect((await rawRepo.getBooks('kujv')).length).toBe(73); // raw kept as-is
    const canonBooks = await repo.getBooks('kujv');
    expect(canonBooks.length).toBe(66); // default filter trims to the canon
  }, 60_000);

  it('parseTranslationData applies the canonical filter by default', () => {
    const data = parseTranslationData(loadRaw('kujv'));
    expect(data.books.length).toBe(66);
  });

  it('InMemoryBibleTextSource + LocalBibleRepository agree on the canon', async () => {
    const inMem = new InMemoryBibleTextSource({ webu: loadRaw('webu') });
    const inMemRepo = new LocalBibleRepository(inMem);
    const books = await inMemRepo.getBooks('webu');
    expect(books.length).toBe(66);
    // Cross-check: webu is a catalogued dataset.
    expect(BIBLE_DATASET_CATALOG.some((e) => e.id === 'webu')).toBe(true);
  }, 60_000);
});
