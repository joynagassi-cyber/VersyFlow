/**
 * Bible Domain — Barrel Exports
 */

export { BIBLE_BOOKS, BOOK_ALIASES, resolveBookId } from './entities';
export type { BibleBook } from './entities';
export { parseReference, buildReference } from './parser';
export type { ParsedReference } from './parser';

// Validation schema
export { BibleTranslationSchema, BibleBookSchema, BibleChapterSchema, BibleVerseSchema, validateBibleData, validateBookData } from './schema';
export type { BibleTranslation, BibleChapter, BibleVerse } from './schema';

// Repository
export { BibleRepository } from './repository';

// Multi-translation registry (pure catalogue)
export {
  BibleTranslationRegistry,
  DEFAULT_BIBLE_TRANSLATIONS,
  DEFAULT_TRANSLATION_ID,
} from './registry';
export type {
  BibleTranslationManifest,
  IBibleTranslationRegistry,
  LicenseStatus,
  TextDirection,
  BibleDataFormat,
} from './registry';

// Local multi-translation repository (pure, port-based)
export {
  LocalBibleRepository,
  InMemoryBibleTextSource,
  parseTranslationData,
  BibleTranslationDataSchema,
  BibleBookDataSchema,
  BibleChapterDataSchema,
  BibleVerseDataSchema,
} from './repository-local';
export type {
  ILocalBibleRepository,
  IBibleTextSource,
  BibleTranslationData,
  BibleBookData,
  BibleChapterData,
  BibleVerseData,
} from './repository-local';
