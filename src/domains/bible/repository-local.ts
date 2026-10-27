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
import { BIBLE_BOOKS, CANONICAL_BOOK_IDS } from './entities';

// A canonical book code → its order index (1..66), for normalisation.
const CANON_ORDER: Record<string, number> = Object.fromEntries(
  BIBLE_BOOKS.map((b) => [b.id, b.orderIndex]),
);

/**
 * Trim a dataset's book list down to the 66-book Protestant canon.
 *
 * Some bundled datasets (KJV, WEBU, Vulgate, Rhampon, ES-GodWord…) carry
 * extra book slots — apocrypha, introductory material, duplicate variants
 * (`int`, `esg`, `s3y`, `sus`, `bel`, `1ma`, `oth`, `dag`…). Those slots are
 * correct *content*, not errors in the JSON: they must never be removed from
 * the files. The trimming happens here, at the repository layer, so every
 * consumer (`getBooks`, `getBook`, verse lookups, verse counts) sees at most
 * the 66 canonical books.
 *
 * Books that are already canonical pass through untouched (the array is
 * returned as-is when nothing has to be dropped — zero allocation for the
 * clean 66-book datasets such as `lsg`).
 */
export function filterCanonicalBooks(books: BibleBookData[]): BibleBookData[] {
  if (books.length === CANONICAL_BOOK_IDS.size) {
    // Fast path: the dataset is already exactly the canon (common case).
    return books;
  }
  return books.filter((b) => CANONICAL_BOOK_IDS.has(b.id));
}

// =====================================================================
// Pure value objects (validated shapes, no I/O)
// =====================================================================

export const BibleVerseDataSchema = z.object({
  number: z.number().int().positive(),
  // Some versions contain legitimately empty verse slots (e.g. Darby) —
  // an empty string is valid data, not an error.
  text: z.string(),
});
export type BibleVerseData = z.infer<typeof BibleVerseDataSchema>;

export const BibleChapterDataSchema = z.object({
  number: z.number().int().positive(),
  // A genuinely empty chapter slot is tolerated (some editions carry
  // commentary-only gaps); lookups treat it as "no verses".
  verses: z.array(BibleVerseDataSchema),
});
export type BibleChapterData = z.infer<typeof BibleChapterDataSchema>;

export const BibleBookDataSchema = z.object({
  id: z.string().min(2).max(12),
  name: z.record(z.string()),
  testament: z.enum(['old', 'new']),
  // Zero is tolerated: some editions carry commentary-only book slots.
  chapterCount: z.number().int().nonnegative(),
  orderIndex: z.number().int().positive().optional(),
  chapters: z.array(BibleChapterDataSchema),
});
export type BibleBookData = z.infer<typeof BibleBookDataSchema>;

/** The full local dataset for one translation (normalized form). */
export const BibleTranslationDataSchema = z.object({
  // Long catalogued ids (e.g. `it-diodati1885`, `uk-kulish1871`) exceed the
  // historical 10-char cap; the dataset catalog is the source of truth.
  id: z.string().min(2).max(16),
  language: z.string().length(2),
  name: z.string().min(1),
  year: z.number().int().positive().optional(),
  author: z.string().min(1).optional(),
  books: z.array(BibleBookDataSchema).nonempty(),
});
export type BibleTranslationData = z.infer<typeof BibleTranslationDataSchema>;

/**
 * Normalises a book so `orderIndex` is always present and `chapterCount`
 * always equals `chapters.length`. The `chapters` array is the source of
 * truth — a drifted counter (in fixtures or hand-edited datasets) is
 * silently corrected so downstream code can rely on the invariant without
 * its own checks.
 */
function normalizeBook(book: BibleBookData): BibleBookData {
  const orderIndex = book.orderIndex ?? CANON_ORDER[book.id] ?? 0;
  const chapterCount = book.chapters.length;
  if (book.orderIndex === orderIndex && book.chapterCount === chapterCount) return book;
  return { ...book, orderIndex, chapterCount };
}

/**
 * Validates a raw payload and returns typed, normalised data. Throws on
 * invalid input.
 *
 * The 66-book canonical filter is applied HERE by default so that every
 * consumer of `parseTranslationData` (repositories, in-memory sources, the
 * service layer, tests) sees at most the canonical books — apocryphal /
 * introductory slots carried by some datasets are trimmed without touching
 * the JSON files. Pass `{ canonicalOnly: false }` to keep a dataset as-is
 * (used by tests with partial fixtures and by any consumer that explicitly
 * wants the raw book set).
 */
export function parseTranslationData(
  raw: unknown,
  options: { canonicalOnly?: boolean } = {},
): BibleTranslationData {
  const canonicalOnly = options.canonicalOnly ?? true;
  const result = BibleTranslationDataSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid Bible translation dataset: ${issues}`);
  }
  // `safeParse` keeps Zod's tuple type on `books`. Spreading `result.data`
  // would preserve it, which is not assignable to `BibleTranslationData`
  // (a plain array). Build the return explicitly to coerce the tuple back.
  const normalizedBooks: BibleBookData[] = result.data.books.map(normalizeBook);
  // The 66-book canon is the source of truth: datasets that carry extra
  // book slots (apocrypha, intro matter…) are trimmed here so every
  // consumer of `parseTranslationData` sees at most the canonical books.
  const finalBooks = canonicalOnly
    ? filterCanonicalBooks(normalizedBooks)
    : normalizedBooks;
  return {
    id: result.data.id,
    language: result.data.language,
    name: result.data.name,
    year: result.data.year,
    author: result.data.author,
    books: finalBooks,
  } as BibleTranslationData;
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
  /**
   * All canonical books (canon structure, max 66) of a translation.
   * Apocryphal/introductory book slots present in some datasets are
   * trimmed by the canonical filter (see `filterCanonicalBooks`).
   */
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
  /**
   * Total verse count of a loaded translation — canonical books only
   * (the filter is applied before counting, matching `getBooks`).
   */
  getVerseCount(translationId: string): Promise<number>;
}

/**
 * Default local repository over an injected `IBibleTextSource`.
 *
 * Datasets are cached per-translation in memory after the first load —
 * the corpus is LOCAL_ONLY and immutable for the lifetime of the app
 * session, so caching is safe and makes `getVerse` O(1) lookups.
 *
 * The canonical 66-book filter is ON by default (`canonicalOnly: true`):
 * `getBooks`/`getBook`/verse lookups/verse counts all see at most the 66
 * canonical books, whatever the raw dataset carries (apocrypha, intro
 * matter…). Pass `canonicalOnly: false` to consume a dataset as-is.
 */
export class LocalBibleRepository implements ILocalBibleRepository {
  private readonly cache = new Map<string, BibleTranslationData>();

  constructor(
    private readonly source: IBibleTextSource,
    private readonly canonicalOnly: boolean = true,
  ) {}

  private async resolve(translationId: string): Promise<BibleTranslationData> {
    const cached = this.cache.get(translationId);
    if (cached) return cached;
    // `parseTranslationData` already applies the 66-book canonical filter
    // (on by default, ON for the repository's source of truth). The extra
    // pass is the belt-and-suspenders guard for sources that bypass it
    // (hand-rolled `IBibleTextSource` implementations, raw JSON).
    const data = await this.source.load(translationId);
    const normalized: BibleTranslationData = this.canonicalOnly
      ? { ...data, books: filterCanonicalBooks(data.books) } as BibleTranslationData
      : data;
    this.cache.set(translationId, normalized);
    return normalized;
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
