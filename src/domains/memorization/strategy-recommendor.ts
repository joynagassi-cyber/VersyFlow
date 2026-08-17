/**
 * IStrategyRecommendor — Domain-level abstraction for strategy recommendation
 *
 * Séam entre ReviewQueueService et l'implémentation concrete
 * (StrategyRecommendor). Permet l'injection de stubs pour les tests.
 */

import { ExerciseStrategy } from './entities';

export interface Recommendation {
  strategy: ExerciseStrategy;
  confidence: number; // 0-1
  rationale: string;
}

export interface RecommendationContext {
  recordId: string;
  verification?: { score: number; correctWords: string[]; missingWords: string[]; extraWords: string[]; substitutedWords: Array<{ expected: string; got: string }> };
  fatigueLevel?: number;
  wordFailures?: Array<{ word: string; failCount: number }>;
}

export interface IStrategyRecommendor {
  /**
   * Recommend the best strategy for the current user state
   */
  recommend(context: RecommendationContext): Recommendation;

  /**
   * Record performance data for future recommendations
   */
  recordPerformance(recordId: string, verification?: any, fatigueLevel?: number): void;

  /**
   * Get current fatigue level
   */
  getFatigueLevel(): number;

  /**
   * Clear all trackers
   */
  reset(): void;
}
