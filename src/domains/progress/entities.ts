/**
 * Progress Domain — Entities and Types for Progress Tracking
 * See docs/25-retrieval-analytics-spec.md
 */

import { MemorizationRecord } from '../memorization/entities';

/**
 * Mastery Level computed from FSRS state
 */
export enum MasteryLevel {
  IN_PROGRESS_WEAK = 'in-progress-weak',      // stability < 1 day
  IN_PROGRESS = 'in-progress',               // 1-7 days stability
  IN_PROGRESS_STRONG = 'in-progress-strong', // 7-30 days stability
  MASTERED = 'mastered',                     // > 30 days + 5+ reviews
}

/**
 * Calculate mastery level based on FSRS state
 */
export function calculateMasteryLevel(record: MemorizationRecord): MasteryLevel {
  if (record.status === 'mastered') return MasteryLevel.MASTERED;

  const stability = record.fsrsState.stability;
  const repetitions = record.fsrsState.repetitions;
  const recallProb = record.fsrsState.recallProbability;

  if (stability > 30 && repetitions >= 5 && recallProb > 0.9) {
    return MasteryLevel.MASTERED;
  } else if (stability > 7) {
    return MasteryLevel.IN_PROGRESS_STRONG;
  } else if (stability > 1) {
    return MasteryLevel.IN_PROGRESS;
  } else {
    return MasteryLevel.IN_PROGRESS_WEAK;
  }
}

/**
 * Check if a record is considered mastered
 */
export function isMastered(record: MemorizationRecord): boolean {
  return record.fsrsState.stability > 30 && record.fsrsState.repetitions >= 5;
}
