/**
 * IFsrsEngine Interface (Port)
 * Abstraction layer for FSRS engine - enables swapping WASM/Rust ↔ JS fallback
 * See docs/13-fsrs-domain.md and docs/09-architecture.md
 */

export enum Rating {
  AGAIN = 1,   // Forgot / didn't recall at all
  HARD = 2,    // Recall with difficulty
  GOOD = 3,    // Recall correctly and smoothly
  EASY = 4,    // Recall effortlessly
}

export interface FsrsState {
  /** Days until P(recall) = 0.9 */
  stability: number;
  /** 0-10 scale, higher = harder */
  difficulty: number;
  /** Current recall probability at last review */
  recallProbability: number;
  /** Days since last review (0 for new) */
  lastInterval: number;
  /** Predicted days until next review */
  nextInterval: number;
  /** Days since creation or last review */
  elapsedDays: number;
  /** Total review count */
  repetitions: number;
  /** Target retention (default 0.9) */
  requestedRetention: number;
}

export interface FsrsReview {
  /** Updated state after review */
  state: FsrsState;
  /** Next review date */
  due: Date;
  /** New stability in days */
  stability: number;
  /** New scheduled interval in days */
  scheduledDays: number;
  /** Is this a recurring review item? */
  recurring: boolean;
}

/**
 * Core FSRS engine interface.
 * Implementations:
 * - WasmFsrsEngine (Rust/WASM) — primary
 * - Sm2FallbackEngine (JavaScript) — backup
 * - MockFsrsEngine — testing
 */
export interface IFsrsEngine {
  /** Create a new FSRS state for a new verse */
  newState(requestedRetries: number): Promise<FsrsState>;

  /** Get the current FSRS state without modification */
  currentState(state: FsrsState): FsrsState;

  /** Process a review rating and return updated state + scheduled review */
  review(state: FsrsState, rating: Rating): Promise<FsrsReview>;

  /** Explain what each parameter means for UI tooltips */
  explain(state: FsrsState, rating: Rating): Record<string, string>;

  /** Get IDs of verses needing review based on nextReviewAt */
  getDueItems(states: FsrsState[], now: Date): string[];
}
