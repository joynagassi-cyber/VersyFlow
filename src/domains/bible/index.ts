/**
 * Bible Domain — Barrel Exports
 */

export { BIBLE_BOOKS, BOOK_ALIASES, resolveBookId } from './entities';
export type { BibleBook } from './entities';
export { parseReference, buildReference } from './parser';
export type { ParsedReference } from './parser';

// Validation schema
export { BibleTranslationSchema, BibleBookSchema, BibleChapterSchema, BibleVerseSchema, validateBibleData, validateBookData } from './schema';
export type { BibleTranslation, BibleBook, BibleChapter, BibleVerse } from './schema';

// Repository
export { BibleRepository } from './repository';
