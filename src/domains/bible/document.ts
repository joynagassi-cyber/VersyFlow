/**
 * Bible Domain — Canonical Corpus Document (§47)
 *
 * A `BibleDocument` is the format-agnostic, intermediate representation that
 * every source adapter (USFM, USFX, …) emits and the normalizer consumes.
 *
 * - Book `id` at this stage is the **source's own book code** (e.g. `GEN`,
 *   `JHN` for USFM), NOT yet a VersyFlow id. Translating source codes into
 *   VersyFlow ids is the *normalizer's* job (an injected map), keeping this
 *   model purely structural.
 *
 * This is a pure type module — no I/O, no dependencies.
 */

/** A single normalized verse. */
export interface BibleVerseDoc {
  /** 1-based verse number within its chapter. */
  number: number;
  /** Plain verse text after marker cleaning (word/division/italics kept,
   *  footnotes & cross-refs stripped). Must be non-empty for a valid corpus. */
  text: string;
}

/** A chapter holding its ordered verses. */
export interface BibleChapterDoc {
  /** 1-based chapter number within its book. */
  number: number;
  /** Ordered verses, consecutive 1..N. */
  verses: BibleVerseDoc[];
}

/**
 * A book holding its ordered chapters.
 * `id` is the source-adapter book code (e.g. `GEN`); the normalizer maps it
 * to a VersyFlow id + localized name.
 */
export interface BibleBookDoc {
  /** Source book code, e.g. `GEN`, `JHN`. */
  id: string;
  /** Ordered chapters, consecutive 1..N. */
  chapters: BibleChapterDoc[];
}

/** The canonical corpus shape emitted by every format adapter. */
export interface BibleDocument {
  books: BibleBookDoc[];
}

/**
 * Count every verse across a document. Used by the validator to check
 * completeness (e.g. 17,380 for a full PROTESTANT_66 canon).
 */
export function countVerses(doc: BibleDocument): number {
  let total = 0;
  for (const book of doc.books) {
    for (const chapter of book.chapters) {
      total += chapter.verses.length;
    }
  }
  return total;
}
