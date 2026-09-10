/**
 * Bible Domain — Local Multi-Translation Repository
 *
 * Read-only repository over the locally-bundled Bible datasets (LOCAL_ONLY).
 * Multi-translation aware: every text lookup is keyed by `translationId`,
 * never by language alone.
 *
 * Purity rule (non-negotiable #3): this file performs NO I/O. All file/
 * SQLite access happens behind the `IBibleTextSource` port, which the
 * infrastructure layer implements. The domain only manipulates validated
 * value objects.
 *
 * See: docs/11-bible-domain.md, system prompt §6/§7.
 */

import { z } from 'zod';
import { BIBLE_BOOKS } from './entities';

// A canonical book code → its order index (1..66), for normalisation.
const CANON_ORDER: Record<string, number> = Object.fromEntries(
  BIBLE_BOOKS.map((b) => [b.id, b.orderIndex]),
);

// =====================================================================
// Pure value objects (validated shapes, no I/O)
// =====================================================================

export const BibleVerseDataSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1),
});
export type BibleVerseData = z.infer<typeof BibleVerseDataSchema>;

export const BibleChapterDataSchema = z.object({
  number: z.number().int().positive(),
  verses: z.array(BibleVerseDataSchema).nonempty(),
});
export type BibleChapterData = z.infer<typeof BibleChapterDataSchema>;

export const BibleBookDataSchema = z.object({
  id: z.string().min(2).max(10),
  name: z.record(z.string()),
  testament: z.enum(['old', 'new']),
  chapterCount: z.number().int().positive(),
  orderIndex: z.number().int().positive().optional(),
  chapters: z.array(BibleChapterDataSchema).nonempty(),
});
export type BibleBookData = z.infer<typeof BibleBookDataSchema>;

/** The full local dataset for one translation (normalized form). */
export const BibleTranslationDataSchema = z.object({
  id: z.string().min(2).max(10),
  language: z.string().length(2),
  name: z.string().min(1),
  year: z.number().int().positive().optional(),
  author: z.string().min(1).optional(),
  books: z.array(BibleBookDataSchema).nonempty(),
});
export type BibleTranslationData = z.infer<typeof BibleTranslationDataSchema>;

/**
 * Normalises a book so `orderIndex` is always present, deriving it from the
 * canonical book list when the source omits it. Unknown codes keep their
 * given index (or 0 if absent) — they are out-of-canon and sorted last.
 */
function normalizeBook(book: BibleBookData): BibleBookData {
  if (book.orderIndex !== undefined) return book;
  return { ...book, orderIndex: CANON_ORDER[book.id] ?? 0 };
}

/**
 * Validates a raw payload and returns typed, normalised data. Throws on
 * invalid input.
 */
export function parseTranslationData(raw: unknown): BibleTranslationData {
  const result = BibleTranslationDataSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid Bible translation dataset: ${issues}`);
  }
  return { ...result.data, books: result.data.books.map(normalizeBook) };
}

// =====================================================================
// Ports
// =====================================================================

/**
 * I/O port for local Bible datasets (implemented in infrastructure).
 * Implementations: JSON file loader (web/native), SQLite bundled dataset,
 * in-memory loader (tests).
 */
export interface IBibleTextSource {
  /** Load the full local dataset for a translation id. Throws when missing. */
  load(translationId: string): Promise<BibleTranslationData>;
}

// =====================================================================
// Local repository (domain, pure)
// =====================================================================

/** Read-only, multi-translation local Bible repository. */
export interface ILocalBibleRepository {
  /** All books (canon structure) of a translation. */
  getBooks(translationId: string): Promise<BibleBookData[]>;
  /** One book by code, or null. */
  getBook(translationId: string, bookId: string): Promise<BibleBookData | null>;
  /** One chapter, or null. */
  getChapter(
    translationId: string,
    bookId: string,
    chapterNumber: number,
  ): Promise<BibleChapterData | null>;
  /**
   * One verse text snapshot. Returns null when the reference does not exist
   * in this translation (verse numbering is translation-specific).
   */
  getVerse(
    translationId: string,
    bookId: string,
    chapterNumber: number,
    verseNumber: number,
  ): Promise<BibleVerseData | null>;
  /** All verses of a chapter, or an empty array. */
  getChapterVerses(
    translationId: string,
    bookId: string,
    chapterNumber: number,
  ): Promise<BibleVerseData[]>;
  /** Total verse count of a loaded translation. */
  getVerseCount(translationId: string): Promise<number>;
}

/**
 * Default local repository over an injected `IBibleTextSource`.
 *
 * Datasets are cached per-translation in memory after the first load —
 * the corpus is LOCAL_ONLY and immutable for the lifetime of the app
 * session, so caching is safe and makes `getVerse` O(1) lookups.
 */
export class LocalBibleRepository implements ILocalBibleRepository {
  private readonly cache = new Map<string, BibleTranslationData>();

  constructor(private readonly source: IBibleTextSource) {}

  private async resolve(translationId: string): Promise<BibleTranslationData> {
    const cached = this.cache.get(translationId);
    if (cached) return cached;
    const data = await this.source.load(translationId);
    this.cache.set(translationId, data);
    return data;
  }

  async getBooks(translationId: string): Promise<BibleBookData[]> {
    const data = await this.resolve(translationId);
    return data.books;
  }

  async getBook(translationId: string, bookId: string): Promise<BibleBookData | null> {
    const data = await this.resolve(translationId);
    return data.books.find((b) => b.id === bookId) ?? null;
  }

  async getChapter(
    translationId: string,
    bookId: string,
    chapterNumber: number,
  ): Promise<BibleChapterData | null> {
    const book = await this.getBook(translationId, bookId);
    return book?.chapters.find((c) => c.number === chapterNumber) ?? null;
  }

  async getVerse(
    translationId: string,
    bookId: string,
    chapterNumber: number,
    verseNumber: number,
  ): Promise<BibleVerseData | null> {
    const chapter = await this.getChapter(translationId, bookId, chapterNumber);
    return chapter?.verses.find((v) => v.number === verseNumber) ?? null;
  }

  async getChapterVerses(
    translationId: string,
    bookId: string,
    chapterNumber: number,
  ): Promise<BibleVerseData[]> {
    const chapter = await this.getChapter(translationId, bookId, chapterNumber);
    return chapter ? chapter.verses : [];
  }

  async getVerseCount(translationId: string): Promise<number> {
    const data = await this.resolve(translationId);
    return data.books.reduce(
      (sum, book) => sum + book.chapters.reduce((s, c) => s + c.verses.length, 0),
      0,
    );
  }
}

/** In-memory text source — used by tests and by the JSON-file adapter fallback. */
export class InMemoryBibleTextSource implements IBibleTextSource {
  constructor(private readonly datasets: Record<string, unknown>) {}

  async load(translationId: string): Promise<BibleTranslationData> {
    const raw = this.datasets[translationId];
    if (raw === undefined) {
      throw new Error(`No local Bible dataset for translation "${translationId}"`);
    }
    return parseTranslationData(raw);
  }
}
