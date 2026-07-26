/**
 * Domain Barrel Exports
 */

// Bible Domain
export { BIBLE_BOOKS, BOOK_ALIASES, resolveBookId } from './bible';
export { parseReference, buildReference } from './bible';
export type { BibleBook, ParsedReference } from './bible';

// FSRS Domain
export { Rating, DEFAULT_FSRS_STATE, RATING_LABELS } from './fsrs';
export type { FsrsState, FsrsReview, IFsrsEngine } from './fsrs';

// Domain Events (Shared)
export { eventBus, DomainEventTypes } from '.';
export type { DomainEvent } from '.';
