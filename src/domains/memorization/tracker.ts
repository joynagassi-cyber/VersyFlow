/**
 * WordFailureTracker Interface — Domain-level abstraction
 *
 * Defines the seam between SessionEngine (domain) and WordFailureTracker (service).
 * Allows injection of mock or alternative implementations for testing.
 */

import { WordFailure } from '@/services/word-failure-tracker';

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
