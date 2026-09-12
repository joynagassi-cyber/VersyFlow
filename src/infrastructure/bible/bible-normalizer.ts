/**
 * Bible Infrastructure — Normalizer (§49, D4)
 *
 * Pure function that converts a canonical `BibleDocument` (USFM source book
 * codes) into the VersyFlow runtime dataset shape consumed by
 * `LocalBibleRepository` / `parseTranslationData` (`BibleTranslationData`).
 *
 * All book-code → id mapping is INJECTED (`options.codeMap`, `options.names`,
 * `options.testament`) so the normalizer carries no per-translation data. The
 * generic 66-book canonical seed lives in `src/domains/bible/canon-maps.ts`.
 */

import type { BibleDocument } from '@/domains/bible/document';
import { USFM_TO_VFLOW, usfmTestament } from '@/domains/bible/canon-maps';
import type { BibleTranslationData } from '@/domains/bible/repository-local';

export interface NormalizerOptions {
  /** USFM book code → VersyFlow id. Defaults to the canonical 66-book map. */
  codeMap?: Record<string, string>;
  /** VersyFlow id → localized display name. Falls back to the USFM code. */
  names?: Record<string, Record<string, string>>;
  /** USFM book code → testament. Defaults to the PROTESTANT_66 split. */
  testament?: (code: string) => 'old' | 'new';
  /** Locale keys to emit in `book.name` (defaults: fr, en). */
  locales?: string[];
}

/**
 * Convert a parsed `BibleDocument` into a `BibleTranslationData` ready for
 * `parseTranslationData` validation. Returns a plain object (the Zod schema in
 * `repository-local` adds `orderIndex` on parse).
 */
export function normalizeDocument(
  doc: BibleDocument,
  meta: { id: string; language: string; name: string; year?: number; author?: string },
  options: NormalizerOptions = {},
): BibleTranslationData {
  const codeMap = options.codeMap ?? USFM_TO_VFLOW;
  const names = options.names ?? {};
  const testamentOf = options.testament ?? usfmTestament;
  const locales = options.locales ?? ['fr', 'en'];

  return {
    id: meta.id,
    language: meta.language,
    name: meta.name,
    ...(meta.year != null ? { year: meta.year } : {}),
    ...(meta.author ? { author: meta.author } : {}),
    books: doc.books.map((book) => {
      const vflowId = codeMap[book.id] ?? book.id.toLowerCase();
      const localizedName = names[vflowId] ?? {};
      const bookName = locales.reduce<Record<string, string>>((acc, loc) => {
        acc[loc] = localizedName[loc] ?? book.id;
        return acc;
      }, {});
      return {
        id: vflowId,
        name: bookName,
        testament: testamentOf(book.id),
        chapterCount: book.chapters.length,
        chapters: book.chapters.map((c) => ({
          number: c.number,
          verses: c.verses.map((v) => ({ number: v.number, text: v.text })),
        })),
      };
    }),
  } as BibleTranslationData;
}
