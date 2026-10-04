/**
 * Bible domain — registry + local repository tests (pure, no I/O)
 */

import { describe, it, expect } from 'vitest';
import {
  BibleTranslationRegistry,
  DEFAULT_BIBLE_TRANSLATIONS,
  LocalBibleRepository,
  InMemoryBibleTextSource,
  parseTranslationData,
} from '@/domains/bible';

/** Minimal dataset fixture (2 books / few verses) for the repository tests. */
function makeDataset(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test',
    language: 'fr',
    name: 'Test Translation',
    year: 2020,
    author: 'Tester',
    books: [
      {
        id: 'gen',
        name: { fr: 'Genèse', en: 'Genesis' },
        testament: 'old',
        chapterCount: 2,
        chapters: [
          {
            number: 1,
            verses: [
              { number: 1, text: 'Verset 1:1' },
              { number: 2, text: 'Verset 1:2' },
            ],
          },
          {
            number: 2,
            verses: [{ number: 1, text: 'Verset 2:1' }],
          },
        ],
      },
      {
        id: 'joh',
        name: { fr: 'Jean', en: 'John' },
        testament: 'new',
        chapterCount: 1,
        chapters: [
          {
            number: 3,
            verses: [
              { number: 16, text: 'Ceci est le verset témoin 3:16' },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('BibleTranslationRegistry', () => {
  it('lists the seeded catalogue', () => {
    const registry = new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS);
    const ids = registry.listTranslations().map((t) => t.id);
    expect(ids).toContain('lsg');
    expect(ids).toContain('kujv');
  });

  it('returns translations filtered by BIBLE language', () => {
    const registry = new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS);
    const fr = registry.getByLanguage('fr').map((t) => t.id);
    expect(fr).toEqual(expect.arrayContaining(['lsg', 'ostervald', 'darby']));
    const en = registry.getByLanguage('en').map((t) => t.id);
    // `kujv` is the only English entry in the *default* seeded catalogue;
    // `web`/`webu` are remote-download datasets (not bundled manifests yet).
    expect(en).toEqual(['kujv']);
  });

  it('marks availability from the manifest', () => {
    const registry = new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS);
    expect(registry.isAvailable('lsg')).toBe(true);
    expect(registry.isAvailable('kujv')).toBe(true);
  });

  it('exposes the default translation', () => {
    const registry = new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS);
    expect(registry.defaultTranslation()).toBe('lsg');
  });

  it('throws when the default is not in the catalogue', () => {
    expect(() =>
      new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS, 'missing-id'),
    ).toThrow(/missing-id/);
  });

  it('supports custom catalogues (extensibility: add a translation = add an entry)', () => {
    const registry = new BibleTranslationRegistry([
      {
        id: 'web',
        language: 'en',
        name: 'World English Bible',
        license: 'VERIFIED_FREE',
        available: true,
      },
      {
        id: 'lsg',
        language: 'fr',
        name: 'Louis Segond (1910)',
        license: 'VERIFIED_FREE',
        available: true,
      },
    ]);
    expect(registry.getByLanguage('en').map((t) => t.id)).toEqual(['web']);
  });
});

describe('parseTranslationData', () => {
  // Partial fixtures are NOT canonical datasets: they are validated as-is
  // (`canonicalOnly: false`) so the 66-book filter doesn't wipe them.
  it('derives orderIndex from the canon when missing', () => {
    const data = parseTranslationData(makeDataset(), { canonicalOnly: false });
    const gen = data.books.find((b) => b.id === 'gen');
    const joh = data.books.find((b) => b.id === 'joh');
    expect(gen?.orderIndex).toBe(1); // canonical position of gen
    expect(joh?.orderIndex).toBe(43); // canonical position of joh
  });

  it('tolerates an empty verse slot (text is a valid empty string, e.g. Darby / WEB)', () => {
    const ok = makeDataset();
    (ok.books[0].chapters[0].verses[0] as { text: string }).text = '';
    expect(() => parseTranslationData(ok, { canonicalOnly: false })).not.toThrow();
  });

  it('rejects a book whose chapterCount disagrees with its chapters array', () => {
    const bad = makeDataset();
    (bad.books[0] as { chapterCount: number }).chapterCount = 5;
    // A drifted counter is silently normalized to the real array length.
    const data = parseTranslationData(bad, { canonicalOnly: false });
    expect(data.books[0].chapterCount).toBe(2);
  });

  it('rejects a book id longer than 12 characters', () => {
    const bad = makeDataset();
    (bad.books[0] as { id: string }).id = 'waytoolongbookid';
    expect(() => parseTranslationData(bad, { canonicalOnly: false })).toThrow(
      /Invalid Bible translation dataset/,
    );
  });

  it('accepts long translation ids (up to 16 chars, e.g. it-diodati1885)', () => {
    const ok = makeDataset({ id: 'it-diodati1885' });
    expect(() => parseTranslationData(ok, { canonicalOnly: false })).not.toThrow();
  });

  it('filters a canonical dataset down to the 66 books by default', () => {
    // A full 66-book fixture with one extra (apocryphal) slot trims to 66.
    const ok = makeDataset();
    (ok.books as unknown[]).push({
      id: 'esg',
      name: { fr: 'Esdras (apocryphe)' },
      testament: 'old',
      chapterCount: 0,
      chapters: [],
    });
    const data = parseTranslationData(ok);
    expect(data.books.map((b) => b.id)).not.toContain('esg');
    expect(data.books.length).toBe(2); // the 2 canonical books survive
  });
});

describe('LocalBibleRepository', () => {
  function makeRepo() {
    const source = new InMemoryBibleTextSource({
      test: makeDataset(),
      other: makeDataset({ id: 'other', language: 'fr', name: 'Other' }),
    });
    return new LocalBibleRepository(source);
  }

  it('reads a verse text by translation + reference', async () => {
    const repo = makeRepo();
    const verse = await repo.getVerse('test', 'joh', 3, 16);
    expect(verse?.text).toBe('Ceci est le verset témoin 3:16');
  });

  it('returns null for a missing verse/chapter/book', async () => {
    const repo = makeRepo();
    expect(await repo.getVerse('test', 'joh', 3, 17)).toBeNull();
    expect(await repo.getVerse('test', 'joh', 4, 1)).toBeNull();
    expect(await repo.getVerse('test', 'unknown-book', 1, 1)).toBeNull();
    expect(await repo.getBook('test', 'unknown-book')).toBeNull();
  });

  it('returns all verses of a chapter', async () => {
    const repo = makeRepo();
    const verses = await repo.getChapterVerses('test', 'gen', 1);
    expect(verses.map((v) => v.number)).toEqual([1, 2]);
    expect((await repo.getChapterVerses('test', 'gen', 99)).length).toBe(0);
  });

  it('is multi-translation: two datasets, same reference, different text', async () => {
    const source = new InMemoryBibleTextSource({
      lsg: makeDataset({
        id: 'lsg',
        name: 'L',
        books: [
          {
            id: 'joh',
            name: { fr: 'Jean' },
            testament: 'new',
            chapterCount: 1,
            chapters: [{ number: 3, verses: [{ number: 16, text: 'A' }] }],
          },
        ],
      }),
      'kujv': makeDataset({
        id: 'kujv',
        language: 'en',
        name: 'K',
        books: [
          {
            id: 'joh',
            name: { en: 'John' },
            testament: 'new',
            chapterCount: 1,
            chapters: [{ number: 3, verses: [{ number: 16, text: 'B' }] }],
          },
        ],
      }),
    });
    const repo = new LocalBibleRepository(source);
    expect((await repo.getVerse('lsg', 'joh', 3, 16))?.text).toBe('A');
    expect((await repo.getVerse('kujv', 'joh', 3, 16))?.text).toBe('B');
  });

  it('counts verses across the whole translation', async () => {
    const repo = makeRepo();
    // gen ch1 (2) + gen ch2 (1) + joh ch3 (1) = 4
    expect(await repo.getVerseCount('test')).toBe(4);
  });

  it('throws when the translation dataset is not available', async () => {
    const repo = makeRepo();
    await expect(repo.getBook('missing', 'gen')).rejects.toThrow(
      /No local Bible dataset/,
    );
  });

  it('caches datasets after first load', async () => {
    let loads = 0;
    const source = {
      load: async () => {
        loads++;
        return parseTranslationData(makeDataset());
      },
    };
    const repo = new LocalBibleRepository(source);
    await repo.getBook('test', 'gen');
    await repo.getBook('test', 'gen');
    await repo.getVerseCount('test');
    expect(loads).toBe(1);
  });
});
