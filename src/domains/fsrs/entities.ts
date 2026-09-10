/**
 * FSRS Domain - Entities and Types
 * Pure domain entities for spaced repetition
 * See docs/13-fsrs-domain.md
 *
 * Note: Rating enum and FsrsState/FsrsReview interfaces are defined in engine.ts
 * This file provides only default values and constants.
 */

/** Default initial FSRS state for a new verse */
export const DEFAULT_FSRS_STATE = {
  stability: 0,
  difficulty: 0,
  recallProbability: 0,
  lastInterval: 0,
  nextInterval: 1,
  elapsedDays: 0,
  repetitions: 0,
  requestedRetention: 0.9,
};
