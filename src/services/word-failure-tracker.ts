/**
 * WordFailureTracker — Track word-level failure patterns over time
 * Helps identify which words the user consistently forgets
 */

import type { IWordFailureTracker, WordFailure } from '@/domains/memorization/tracker';

export class WordFailureTracker implements IWordFailureTracker {
  private failures: Map<string, WordFailure> = new Map(); // word -> failure record

  /**
   * Record a failure for a specific word during verification
   */
  recordFailure(word: string, position: number, now: number): void {
    const key = word.toLowerCase();
    if (this.failures.has(key)) {
      const failure = this.failures.get(key)!;
      failure.failCount++;
      failure.lastFailedAt = now;
    } else {
      this.failures.set(key, {
        word,
        failCount: 1,
        lastFailedAt: now,
        position,
      });
    }
  }

  /**
   * Get the most frequently forgotten words (top N)
   */
  getMostForgottenWords(count: number = 3): WordFailure[] {
    const failures = Array.from(this.failures.values());
    failures.sort((a, b) => b.failCount - a.failCount);
    return failures.slice(0, count);
  }

  /**
   * Get failure rate for a specific word
   */
  getFailureRate(word: string): number {
    const failure = this.failures.get(word.toLowerCase());
    return failure ? failure.failCount : 0;
  }

  /**
   * Clear all failure records (for new session or reset)
   */
  clear(): void {
    this.failures.clear();
  }

  /**
   * Get total number of unique forgotten words
   */
  getUniqueForgottenCount(): number {
    return this.failures.size;
  }
}

/**
 * Re-export of the domain data type — keep this path so existing
 * consumers that import `WordFailure` from the service layer keep
 * working (single source of truth remains in the domain).
 */
export type { WordFailure } from '@/domains/memorization/tracker';
