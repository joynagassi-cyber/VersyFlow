/**
 * FSRS Domain - Entities and Types
 * Pure domain entities for spaced repetition
 * See docs/13-fsrs-domain.md
 *
 * Note: Rating enum and FsrsState/FsrsReview interfaces are defined in engine.ts
 * This file provides only default values and constants.
 */

/**
 * Default initial FSRS state for a new verse.
 *
 * Values are the domain-side floor of the state. The production engine
 * (TsFsrsEngine.newState) derives the authoritative new-card state from the
 * underlying `createEmptyCard()` — this constant is only used by
 * Sm2FallbackEngine and by tests that need a structural placeholder.
 */
export const DEFAULT_FSRS_STATE = {
  stability: 1,
  difficulty: 5,
  recallProbability: 0.9,
  lastInterval: 0,
  nextInterval: 1,
  elapsedDays: 0,
  repetitions: 0,
  requestedRetention: 0.9,
};
