/**
 * StrategyRecommendor — Recommends exercise strategies based on user performance
 * Implements feature #85: Choix automatique de stratégie
 */

import type { VerificationResult } from '@/domains/memorization/entities';
import { ExerciseStrategy } from '@/domains/memorization/entities';
import type { IFatigueDetector } from '@/domains/memorization/fatigue-detector';
import { FatigueDetector } from '@/services/fatigue-detector';
import type { IStrategyRecommendor, Recommendation, RecommendationContext } from '@/domains/memorization/strategy-recommendor';
import { WordFailureTracker } from '@/services/word-failure-tracker';

export class StrategyRecommendor implements IStrategyRecommendor {
  private fatigueDetector: IFatigueDetector;
  private wordFailureTracker: WordFailureTracker;
  private cache = new Map<string, Recommendation>();

  constructor(fatigueDetector?: IFatigueDetector) {
    this.fatigueDetector = fatigueDetector ?? new FatigueDetector();
    this.wordFailureTracker = new WordFailureTracker();
  }

  /**
   * Recommend the best strategy for the current user state
   */
  recommend(context: RecommendationContext): Recommendation {
    const cacheKey = context.recordId;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const recommendation = this.computeRecommendation(context);
    this.cache.set(cacheKey, recommendation);
    return recommendation;
  }

  private computeRecommendation(context: RecommendationContext): Recommendation {
    const fatigueLevel = context.fatigueLevel !== undefined
      ? context.fatigueLevel
      : this.fatigueDetector.getFatigueLevel();
    const verification = context.verification || { score: 0.5, correctWords: [], missingWords: [], extraWords: [], substitutedWords: [] };
    const wordFailures = context.wordFailures || [];

    // High fatigue → use easier strategy
    if (fatigueLevel > 0.6) {
      return {
        strategy: 'progressive-masking',
        confidence: fatigueLevel,
        rationale: 'Utilisateur fatigué — stratégie progressive pour réduire la charge cognitive',
      };
    }

    // Many words forgotten → use heat-words strategy
    if (wordFailures.length > 2) {
      return {
        strategy: 'heat-words',
        confidence: Math.min(0.9, wordFailures.length / 10),
        rationale: `${wordFailures.length} mots souvent oubliés — mode "mots chauds" ciblé`,
      };
    }

    // Low verification score - use supportive strategy
    if (verification.score < 0.5 || verification.missingWords.length > 3) {
      return {
        strategy: 'incremental-reveal',
        confidence: Math.min(0.8, 1 - verification.score),
        rationale: 'Plusieurs erreurs détectées — révélation incrémentale pour guider l\'utilisateur',
      };
    }

    // High performance → suggest more challenging strategy
    if (verification.score >= 0.9) {
      return {
        strategy: 'active-recall',
        confidence: 0.8,
        rationale: 'Excellente performance — rappel actif pour consolider la mémoire',
      };
    }

    // Default progressive masking
    return {
      strategy: 'progressive-masking',
      confidence: 0.6,
      rationale: 'Stratégie par défaut équilibrée',
    };
  }

  /**
   * Record performance data for future recommendations
   */
  recordPerformance(recordId: string, verification?: VerificationResult, fatigueLevel?: number): void {
    if (verification) {
      // Track word failures from verification result
      verification.missingWords.forEach(word => {
        this.wordFailureTracker.recordFailure(word, 0, Date.now());
      });
      verification.substitutedWords.forEach(sub => {
        this.wordFailureTracker.recordFailure(sub.expected, 0, Date.now());
      });
    }
    if (fatigueLevel) {
      this.fatigueDetector.recordSlowResponse(fatigueLevel * 1000); // Simulated
    }
    // Clear cache for this record to force re-computation
    this.cache.delete(recordId);
  }

  /**
   * Get fatigue level (for diagnostics)
   */
  getFatigueLevel(): number {
    return this.fatigueDetector.getFatigueLevel();
  }

  /**
   * Clear all trackers (for new user/session)
   */
  reset(): void {
    this.fatigueDetector.clear();
    this.wordFailureTracker.clear();
    this.cache.clear();
  }

  /**
   * Legacy API — recommend strategy based on word-level performance and average FSRS stability.
   * Additive wrapper around the modern recommend() context-based API.
   * - empty performance -> progressive-masking
   * - any errors detected -> smart-masking
   * - high stability (> 5) -> flashcard
   * - very high stability (> 10) -> recall-writing
   */
  recommendStrategy(wordPerformance: Array<{ word: string; errorCount?: number; totalAttempts?: number }>, avgStability: number): string {
    if (wordPerformance.length === 0) {
      if (avgStability > 10) return 'recall-writing';
      if (avgStability > 5) return 'flashcard';
      return 'progressive-masking';
    }

    const hasErrors = wordPerformance.some(w => (w.errorCount ?? 0) > 0);
    if (hasErrors) return 'smart-masking';

    if (avgStability > 10) return 'recall-writing';
    if (avgStability > 5) return 'flashcard';
    return 'progressive-masking';
  }

  /**
   * Calculate a difficulty score (0-1) from word performance data.
   * Returns 0 for empty input, otherwise the average error rate across words.
   */
  calculateDifficultyScore(wordPerformance: Array<{ word: string; errorCount?: number; totalAttempts?: number }>): number {
    if (wordPerformance.length === 0) return 0;

    let totalErrorRate = 0;
    for (const wp of wordPerformance) {
      const errors = wp.errorCount ?? 0;
      const attempts = wp.totalAttempts ?? (wp.errorCount ?? 0);
      totalErrorRate += attempts > 0 ? errors / attempts : 0;
    }
    return Math.min(1, totalErrorRate / wordPerformance.length);
  }
}
