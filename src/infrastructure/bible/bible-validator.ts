/**
 * Bible Infrastructure — Corpus Validator (§52–§55, D5)
 *
 * Pure function that checks a canonical `BibleDocument` (VersyFlow book ids,
 * normalized) against a `CanonExpectation` and returns a structured report.
 *
 * The validator is translation-agnostic: it does not know any specific
 * translation. All canon data is injected via the `CanonExpectation` object.
 */

import type { BibleDocument } from '@/domains/bible/document';

export type Severity = 'error' | 'warning';

export interface ValidationIssue {
  code:
    | 'MISSING_BOOK'
    | 'EXTRA_BOOK'
    | 'DUPLICATE_BOOK'
    | 'CHAPTER_COUNT_MISMATCH'
    | 'VERSE_COUNT_MISMATCH'
    | 'EMPTY_VERSE'
    | 'VERSE_GAP'
    | 'UNICODE_SURROGATE';
  severity: Severity;
  message: string;
  bookId?: string;
  chapterNumber?: number;
  verseNumber?: number;
}

export interface ValidationReport {
  pass: boolean;
  totalIssues: number;
  issues: ValidationIssue[];
}

/**
 * Canon expectation: which books to include, how many chapters per book,
 * and how many verses per book.
 */
export interface CanonExpectation {
  /** List of expected VersyFlow book ids (order-insensitive). */
  expectedBooks: string[];
  /** Verse-count expectations per VersyFlow book id. Omit for no verse-count check. */
  expectedVerseCount?: Record<string, number>;
  /** Chapter-count expectations per VersyFlow book id. Omit for no chapter check. */
  expectedChapterCount?: Record<string, number>;
}

export function validateDocument(
  doc: BibleDocument,
  expectation: CanonExpectation,
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const seenBookIds = new Set<string>();
  const expectedBookSet = new Set(expectation.expectedBooks);

  // --- Book-level checks ---
  for (const book of doc.books) {
    if (seenBookIds.has(book.id)) {
      issues.push({
        code: 'DUPLICATE_BOOK',
        severity: 'error',
        message: `Duplicate book "${book.id}" in document.`,
        bookId: book.id,
      });
    }
    seenBookIds.add(book.id);

    if (!expectedBookSet.has(book.id)) {
      issues.push({
        code: 'EXTRA_BOOK',
        severity: 'warning',
        message: `Book "${book.id}" not in the expected canon list.`,
        bookId: book.id,
      });
    }

    if (expectation.expectedChapterCount && book.id in expectation.expectedChapterCount) {
      const expectedChapters = expectation.expectedChapterCount[book.id];
      if (book.chapters.length !== expectedChapters) {
        issues.push({
          code: 'CHAPTER_COUNT_MISMATCH',
          severity: 'error',
          message: `Book "${book.id}" has ${book.chapters.length} chapters, expected ${expectedChapters}.`,
          bookId: book.id,
        });
      }
    }

    // Verse-count expectation (sum across all chapters of this book)
    if (expectation.expectedVerseCount && book.id in expectation.expectedVerseCount) {
      const totalVerses = book.chapters.reduce((s, c) => s + c.verses.length, 0);
      const expectedVerses = expectation.expectedVerseCount[book.id];
      if (totalVerses !== expectedVerses) {
        issues.push({
          code: 'VERSE_COUNT_MISMATCH',
          severity: 'error',
          message: `Book "${book.id}" has ${totalVerses} verses, expected ${expectedVerses}.`,
          bookId: book.id,
        });
      }
    }

    // Chapter / verse-level checks
    for (const chapter of book.chapters) {
      // Empty verse check
      for (const verse of chapter.verses) {
        if (verse.text.trim().length === 0) {
          // §53: a verse with no text is a WARNING (completeness data is
          // reported but does not block the build — the source corpus may
          // have missing verses). Only structural errors block.
          issues.push({
            code: 'EMPTY_VERSE',
            severity: 'warning',
            message: `Book "${book.id}" ch. ${chapter.number} verse ${verse.number} is empty.`,
            bookId: book.id,
            chapterNumber: chapter.number,
            verseNumber: verse.number,
          });
        }
        // Lone surrogates / broken unicode
        if (/[\uD800-\uDBFF]/.test(verse.text)) {
          issues.push({
            code: 'UNICODE_SURROGATE',
            severity: 'error',
            message: `Book "${book.id}" ch. ${chapter.number} verse ${verse.number} contains a lone surrogate pair.`,
            bookId: book.id,
            chapterNumber: chapter.number,
            verseNumber: verse.number,
          });
        }
      }

      // Verse-number gap check: verse numbers must be consecutive starting at 1.
      // Some source corpora merge adjacent verses into one line (e.g. arbnav
      // USFM `\v 25-26 …`) and the eBible USFM corpus silently DROPS verses in
      // places (webu Esther 4 omits \v 6, LUK 17 omits 36, ACT 15 omits 26…).
      // A gap is a source-data quirk, NOT a structural defect (§53): the verse
      // content is present and correctly numbered — only the numbering deviates
      // from canonical. Report as a WARNING so it never blocks the build.
      const verseNumbers = chapter.verses.map((v) => v.number).sort((a, b) => a - b);
      for (let i = 0; i < verseNumbers.length; i++) {
        const expected = i + 1;
        if (verseNumbers[i] !== expected) {
          issues.push({
            code: 'VERSE_GAP',
            severity: 'warning',
            message: `Book "${book.id}" ch. ${chapter.number}: verse numbers are not consecutive at position ${i} (found ${verseNumbers[i]}, expected ${expected}).`,
            bookId: book.id,
            chapterNumber: chapter.number,
            verseNumber: verseNumbers[i],
          });
          break; // report the first gap only
        }
      }
    }
  }

  // --- Missing book check ---
  for (const expectedId of expectation.expectedBooks) {
    if (!seenBookIds.has(expectedId)) {
      issues.push({
        code: 'MISSING_BOOK',
        severity: 'error',
        message: `Book "${expectedId}" is missing from the document.`,
        bookId: expectedId,
      });
    }
  }

  const hasError = issues.some((i) => i.severity === 'error');
  return {
    pass: !hasError,
    totalIssues: issues.length,
    issues,
  };
}
