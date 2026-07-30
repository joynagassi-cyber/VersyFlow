/**
 * StrategyRecommendor — Recommends exercise strategies based on user performance
 * Implements feature #85: Choix automatique de stratégie
 */

import { ExerciseStrategy } from '@/domains/memorization/entities';
import { FatigueDetector } from '@/services/fatigue-detector';
import { WordFailureTracker } from '@/services/word-failure-tracker';
import { VerificationResult } from '@/domains/memorization/entities';

export interface Recommendation {
  strategy: ExerciseStrategy;
  confidence: number; // 0-1
  rationale: string;
}

export interface RecommendationContext {
  recordId: string;
  verification?: VerificationResult;
  fatigueLevel?: number;
  wordFailures?: Array<{ word: string; failCount: number }>;
}

export class StrategyRecommendor {
  private fatigueDetector = new FatigueDetector();
  private wordFailureTracker = new WordFailureTracker();
  private cache = new Map<string, Recommendation>();

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
    const fatigueLevel = context.fatigueLevel || this.fatigueDetector.getFatigueLevel();
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
        rationale: 'Plusieurs erreurs détectées — révélation incrémentale pour guider l'utilisateur',
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
}
