/**
 * AI Coach Capability — Typed contracts for future AI integration
 *
 * This module defines the interface that any AI engine must implement.
 * Currently backed by a no-op adapter. No LLM, no external API.
 */

/**
 * Types of AI coach recommendations
 */
export type RecommendationType = 'verse' | 'exercise' | 'reminder' | 'insight';

/**
 * Priority levels for recommendations
 */
export type RecommendationPriority = 'high' | 'medium' | 'low';

/**
 * Single recommendation from the AI coach
 */
export interface IAiCoachRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
}

/**
 * An insight about the learner's progress or patterns
 */
export interface IAiCoachInsight {
  id: string;
  theme: string;
  dataPoint: string;
  suggestion: string;
}

/**
 * Daily learning plan items
 */
export interface IAiCoachDailyPlan {
  items: string[];
}

/**
 * Weekly performance report
 */
export interface IAiCoachWeeklyReport {
  totalSessions: number;
  versesMemorized: number;
  avgScore: number;
}

/**
 * Port that any AI engine must implement.
 * Future implementations (LLM, rules-based, etc.) will satisfy this contract.
 */
export interface IAiCoachPort {
  /**
   * Get personalized recommendations for the current learner.
   * Returns empty array when no recommendations are available.
   */
  getRecommendations(): Promise<IAiCoachRecommendation[]>;

  /**
   * Get insights about learning patterns and progress.
   * Returns empty array when no insights are available.
   */
  getInsights(): Promise<IAiCoachInsight[]>;

  /**
   * Get the daily learning plan.
   * Returns null when no plan is available.
   */
  getDailyPlan(): Promise<IAiCoachDailyPlan | null>;

  /**
   * Get a weekly summary report.
   * Returns null when insufficient data is available.
   */
  getWeeklyReport(): Promise<IAiCoachWeeklyReport | null>;
}

/**
 * No-op adapter — returns empty values for all methods.
 * Satisfies the IAiCoachPort contract without any AI logic.
 */
export class NoOpAiCoachAdapter implements IAiCoachPort {
  async getRecommendations(): Promise<IAiCoachRecommendation[]> {
    return [];
  }

  async getInsights(): Promise<IAiCoachInsight[]> {
    return [];
  }

  async getDailyPlan(): Promise<IAiCoachDailyPlan | null> {
    return null;
  }

  async getWeeklyReport(): Promise<IAiCoachWeeklyReport | null> {
    return null;
  }
}
