/**
 * Bible Domain — Barrel Exports
 */

export { BIBLE_BOOKS, BOOK_ALIASES, resolveBookId } from './entities';
export type { BibleBook } from './entities';
export { parseReference, buildReference } from './parser';
export type { ParsedReference } from './parser';
