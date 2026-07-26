/**
 * FSRS Domain — Entities and Types
 * Pure domain entities for spaced repetition
 * See docs/13-fsrs-domain.md
 */

export enum Rating {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4,
}

export interface FsrsState {
  stability: number;
  difficulty: number;
  recallProbability: number;
  lastInterval: number;
  nextInterval: number;
  elapsedDays: number;
  repetitions: number;
  requestedRetention: number;
}

export interface FsrsReview {
  state: FsrsState;
  due: Date;
  stability: number;
  scheduledDays: number;
  recurring: boolean;
}

/** Default initial FSRS state for a new verse */
export const DEFAULT_FSRS_STATE: FsrsState = {
  stability: 1,
  difficulty: 5,
  recallProbability: 0.9,
  lastInterval: 0,
  nextInterval: 1,
  elapsedDays: 0,
  repetitions: 0,
  requestedRetention: 0.9,
};

/** Rating labels for display */
export const RATING_LABELS: Record<Rating, string> = {
  [Rating.AGAIN]: 'J\'ai oublien',
  [Rating.HARD]: 'Presque',
  [Rating.GOOD]: 'J\'ai rappelen',
  [Rating.EASY]: 'Facile',
};
