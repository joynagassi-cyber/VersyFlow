/**
 * IFatigueDetector — Domain-level abstraction for user fatigue detection
 *
 * Séam entre les services (ReviewQueueService, StrategyRecommendor)
 * et l'implémentation concrete (FatigueDetector).
 * Permet l'injection de stubs pour les tests.
 */

export interface IFatigueDetector {
  /**
   * Get the current fatigue level (0-1)
   */
  getFatigueLevel(): number;

  /**
   * Record a slow response signal
   */
  recordSlowResponse(responseTimeMs: number, threshold?: number): void;

  /**
   * Record many errors signal
   */
  recordManyErrors(errorCount: number, threshold?: number): void;

  /**
   * Record abandonment signal
   */
  recordAbandonment(): void;

  /**
   * Check if the user shows signs of fatigue
   */
  isFatigued(threshold?: number): boolean;

  /**
   * Check if a break should be recommended
   */
  shouldRecommendBreak(fatigueLevel: number): boolean;

  /**
   * Calculate fatigue level from review metrics
   */
  calculateFatigueLevel(todayReviews: number, recentErrorRate: number, sessionDuration: number): number;

  /**
   * Get recommended action based on fatigue level
   */
  getRecommendedAction(): string | null;

  /**
   * Clear all signals (new session)
   */
  clear(): void;
}
