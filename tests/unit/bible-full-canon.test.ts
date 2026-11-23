/**
 * Canon-completeness test — 66 books × verse counts.
 *
 * The Protestant 66-book canon (39 OT + 27 NT) is the source of truth.
 * Bundled datasets that carry extra book slots (apocrypha, intro matter —
 * `int`, `esg`, `s3y`, `sus`, `bel`, `1ma`, `oth`, `dag`…) must be trimmed
 * to 66 by the canonical filter at the repository layer. The JSON files
 * themselves stay untouched.
 *
 * Seul `lsg.json` est versionné (décision Chantier 2 : un dataset livré avec
 * l'app, 6,9 Mo). Les jeux de données apocryphes qui servaient de matière au
 * filtre canonique ne sont plus dans le dépôt : leurs invariants sont
 * désormais vérifiés sur des **fixtures** qui reproduisent leur forme (slots
 * apocryphes en plus des 66 livres), ce qui teste la même règle sans dépendre
 * de fichiers absents.
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

/**
 * Slots apocryphes / introductifs observés dans les datasets eBible : ils
 * n'appartiennent pas au canon protestant et doivent être retirés à la
 * lecture, sans être supprimés du fichier source.
 */
const EXTRA_SLOTS = ['int', 'esg', 's3y', 'sus', 'bel', '1ma', 'oth', 'dag'];

/**
 * Reproduit la forme d'un dataset apocryphe : les 66 livres canoniques (texte
 * réel de la LSG) plus des slots supplémentaires porteurs de contenu, dans
 * l'ordre du fichier source.
 */
function makeExtraSlotsDataset(extraCount: number): Record<string, unknown> {
  const lsg = loadRaw('lsg') as { books: Array<Record<string, unknown>> } & Record<string, unknown>;
  const books = [...lsg.books];
  // Les slots sont insérés avant les livres du Nouveau Testament, comme dans
  // les fichiers eBible (apocryphes entre Malachie et Matthieu).
  const ntStart = books.findIndex((b) => b.testament === 'new');
  const extras = EXTRA_SLOTS.slice(0, extraCount).map((id) => ({
    ...books[0],
    id,
    name: { fr: id, en: id },
    chapters: [{ number: 1, verses: [{ number: 1, text: 'Contenu deutérocanonique.' }] }],
  }));
  books.splice(ntStart, 0, ...extras);
  return { ...lsg, id: 'fr-extras', books };
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

  it('a dataset with extra slots (73 raw books) filters down to 66', async () => {
    // 66 canoniques + 7 slots apocryphes = 73, comme le KJV de Cambridge.
    const rawFile = makeExtraSlotsDataset(7);
    const books = rawFile.books as Array<{ id: string }>;
    expect(books.length).toBe(73);
    const parsed = parseTranslationData(rawFile);
    expect(parsed.books.length).toBe(66);
    const filtered = filterCanonicalBooks(parsed.books);
    expect(filtered.length).toBe(66);
    // Every canonical book survives the filter.
    for (const id of CANONICAL_BOOK_IDS) {
      expect(filtered.some((b) => b.id === id)).toBe(true);
    }
    // No apocryphal slot leaks through.
    for (const id of EXTRA_SLOTS) {
      expect(filtered.some((b) => b.id === id)).toBe(false);
    }
  });

  it('a fixture with extra slots through the repository sees 66 books', async () => {
    const inMem = new InMemoryBibleTextSource({ 'fr-extras': makeExtraSlotsDataset(8) });
    const inMemRepo = new LocalBibleRepository(inMem);
    expect((await inMemRepo.getBooks('fr-extras')).length).toBe(66);
  });

  it('canonicalOnly:false keeps the raw dataset; default trims to the canon', async () => {
    // A source that hands the repository the RAW dataset (as a hand-rolled
    // IBibleTextSource would), so the repository's own filter is what trims.
    const raw = makeExtraSlotsDataset(7);
    const rawSource: IBibleTextSource = {
      load: async () => parseTranslationData(raw, { canonicalOnly: false }),
    };
    const rawRepo = new LocalBibleRepository(rawSource, false);
    expect((await rawRepo.getBooks('kujv')).length).toBe(73); // raw kept as-is
    const canonRepo = new LocalBibleRepository(rawSource);
    expect((await canonRepo.getBooks('kujv')).length).toBe(66); // default filter trims
  });

  it('parseTranslationData applies the canonical filter by default', () => {
    const data = parseTranslationData(makeExtraSlotsDataset(7));
    expect(data.books.length).toBe(66);
  });

  it('le dataset livré est le seul versionné, et il est catalogué', async () => {
    const lsg = await repo.getBooks('lsg');
    expect(lsg.length).toBe(66);
    expect(BIBLE_DATASET_CATALOG.some((e) => e.id === 'lsg')).toBe(true);
  });
});
