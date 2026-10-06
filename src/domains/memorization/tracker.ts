/**
 * WordFailureTracker Interface — Domain-level abstraction
 *
 * Defines the seam between SessionEngine (domain) and WordFailureTracker (service).
 * Allows injection of mock or alternative implementations for testing.
 *
 * `WordFailure` is defined here (domain-owned data type), the service
 * layer re-exports it for consumer convenience.
 */

export interface WordFailure {
  word: string;
  failCount: number;
  lastFailedAt: number;
  position: number; // Position in the verse
}

export interface IWordFailureTracker {
  /**
   * Record a word failure during verification
   */
  recordFailure(word: string, position: number, now: number): void;

  /**
   * Get the most frequently forgotten words (top N, sorted by fail count desc)
   */
  getMostForgottenWords(count?: number): WordFailure[];

  /**
   * Get failure count for a specific word
   */
  getFailureRate(word: string): number;

  /**
   * Clear all failure records (for new session or reset)
   */
  clear(): void;

  /**
   * Get total number of unique forgotten words
   */
  getUniqueForgottenCount(): number;
}
