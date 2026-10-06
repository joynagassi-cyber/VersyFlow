/**
 * memorization-session-service — composition root for the memorization
 * session engine (Phase 8.4, docs/29 §1 Exception 4).
 *
 * The domain layer owns the engines (`MemorizationSessionEngine`,
 * `SessionEngine`, `MemorizationService`, `ComparisonEngine`) and the
 * constants (`DEFAULT_MVP_STRATEGY`, `BIBLE_BOOKS`, `resolveBookId`);
 * the UI layer must not reach into `src/domains/` with value imports.
 * This service is the single composition root that both
 * `useMemorizationSession` and `useMemorizationWorkspace` route through.
 *
 *   - `createSessionEngine(text)` → plain `SessionEngine` bound to the
 *     default MVP strategy (single-verse preview → revealing → confirm).
 *   - `createWorkspaceEngine()` → factory for the unified workspace
 *     engine: `new MemorizationSessionEngine(repo, fsrsEngine)`. The
 *     repository + FSRS engine are injected so the hook stays
 *     mockable (docs/29 §4: constructor injection, no module-level
 *     singletons in the domain).
 *   - `createMemorizationService()` → profile-scoped storage
 *     orchestrator used for load/save of records and review logs.
 *   - `compareWrittenRecall()` → single-instantiation facade over the
 *     domain `ComparisonEngine` (LCS word-diff), so the hook no longer
 *     constructs the engine directly.
 *   - `resolveBookIdFromText()` / `BIBLE_BOOKS_LIST` → re-exports of
 *     the domain book-name resolver and book list, kept in the service
 *     layer so hooks no longer import `@/domains/bible/entities` as
 *     a value.
 *   - `DEFAULT_SESSION_STRATEGY` → re-export of `DEFAULT_MVP_STRATEGY`.
 */

import {
  MemorizationSessionEngine,
  SessionEngine,
} from '@/domains/memorization/session-engine';
import type { IFsrsEngine } from '@/domains/fsrs';
export type { MemorizationSessionEngine, SessionEngine };
import {
  MemorizationService,
} from '@/domains/memorization/service';
import {
  DEFAULT_MVP_STRATEGY,
} from '@/domains/memorization/entities';
import {
  resolveBookId,
  BIBLE_BOOKS,
} from '@/domains/bible/entities';
import {
  ComparisonEngine,
  type WrittenRecallResult,
} from '@/domains/memorization/comparison-engine';
import { Rating } from '@/domains/fsrs';
import type { ILocalBibleRepository } from '@/domains/bible/repository-local';
import type { IStorage } from '@/infrastructure/storage/storage-types';
import { LocalBibleRepository } from '@/domains/bible/repository-local';
import type { IBibleTextSource } from '@/domains/bible/repository-local';

/**
 * Concrete local bible repository (constructor-injected per docs/29 §4),
 * exposed through the service layer so UI screens don't value-import
 * `@/domains/bible/repository-local` directly.
 */
export function createLocalBibleRepository(
  source: IBibleTextSource,
): ILocalBibleRepository {
  return new LocalBibleRepository(source);
}

/**
 * The domain `Rating` enum (numeric: AGAIN=1…EASY=4), re-exported through
 * the service layer so UI screens don't value-import `@/domains/fsrs`
 * directly (docs/29 §1 Exception 4 — value imports must route through
 * services). The `RATING_*` constants below mirror the enum's numeric
 * values for the subset of ratings UI screens branch on.
 */
export { Rating };
export const RATING_AGAIN: number = Rating.AGAIN;
export const RATING_HARD: number = Rating.HARD;
export const RATING_GOOD: number = Rating.GOOD;
export const RATING_EASY: number = Rating.EASY;

/** Default exercise strategy for single-verse sessions. */
export const DEFAULT_SESSION_STRATEGY = DEFAULT_MVP_STRATEGY;

/**
 * The FSRS "AGAIN" rating value, exposed through the service layer so
 * hooks (which import no domain values, docs/29 §1 Exception 4) can
 * branch on the rating without importing the `Rating` enum as a value.
 * Mirrors `Rating.AGAIN` (numeric 1, see domains/fsrs/engine.ts).
 */
export const RATING_AGAIN: number = Rating.AGAIN;

/**
 * Create a session engine for a single verse.
 * The caller is expected to call `startPreview()` / `initPassage(...)`
 * immediately after construction (mirrors the previous hook behaviour).
 */
export function createSessionEngine(text: string): SessionEngine {
  return new SessionEngine(text, DEFAULT_SESSION_STRATEGY);
}

/**
 * Factory for the unified memorization workspace engine.
 *
 * @param repo    the local bible repository that will load the passage
 * @param fsrsEngine the FSRS engine used for rating
 * @returns a fresh `MemorizationSessionEngine` ready for `startPassage`
 */
export function createWorkspaceEngine(
  repo: ILocalBibleRepository,
  fsrsEngine: IFsrsEngine,
): MemorizationSessionEngine {
  return new MemorizationSessionEngine(repo, fsrsEngine);
}

/**
 * Create a profile-scoped `MemorizationService` (storage + FSRS).
 * `profileId` defaults to 'default' when omitted.
 */
export function createMemorizationService(
  storage: IStorage,
  fsrsEngine: IFsrsEngine,
  profileId?: string,
): MemorizationService {
  return new MemorizationService(storage, fsrsEngine, profileId);
}

/** Resolve a human-friendly book name (e.g. "Jean") to its book id. */
export function resolveBookIdFromText(alias: string): string | null {
  return resolveBookId(alias);
}

/**
 * Re-export of the domain book list, kept in the service layer so
 * hooks (which import no domain values, docs/29 §1 Exception 4) can
 * look up a book's localized name without a direct domain import.
 */
export const BIBLE_BOOKS_LIST = BIBLE_BOOKS;

let _comparisonEngine: ComparisonEngine | null = null;

/**
 * Compare a verse written from memory against the expected passage
 * (LCS word-diff, deterministic, no LLM). Single point of
 * instantiation for the `ComparisonEngine` in the hook layer —
 * re-exported here so `useMemorizationWorkspace` no longer
 * constructs the domain engine directly.
 */
export function compareWrittenRecall(
  written: string,
  expected: string,
): WrittenRecallResult {
  if (!_comparisonEngine) _comparisonEngine = new ComparisonEngine();
  return _comparisonEngine.compareWrittenRecall(written, expected);
}
