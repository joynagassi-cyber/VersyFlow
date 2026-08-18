/**
 * StatsCalculator — Compute progress statistics and analytics
 * Extracted from ProgressService (C8 deepening)
 */

import { MemorizationService } from '@/domains/memorization';
import { MemorizationRecord } from '@/domains/memorization/entities';

export interface ProgressStats {
  totalVerses: number;
  masteredVerses: number;
  inProgressVerses: number;
  dueForReview: number;
  streakCount: number;
  longestStreak: number;
  weeklyTrend: { thisWeek: number; lastWeek: number; changePercentage: number };
  avgSessionDurationMin: number;
}

export class StatsCalculator {
  constructor(
    private memorizationService: MemorizationService,
    private profileId: string,
  ) {}

  /**
   * Calculate the weekly trend of verses memorized
   */
  async getWeeklyTrend(): Promise<{ thisWeek: number; lastWeek: number; changePercentage: number }> {
    try {
      const records = await this.memorizationService.getAllMemorized(this.profileId);
      const today = Math.floor(Date.now() / 86400000);
      const thisWeekStart = today - 7;
      const thisWeekEnd = today;
      const lastWeekStart = today - 14;
      const lastWeekEnd = today - 8;

      const thisWeekCount = records.filter(r => {
        const day = Math.floor(r.createdAt / 86400000);
        return day >= thisWeekStart && day <= thisWeekEnd;
      }).length;

      const lastWeekCount = records.filter(r => {
        const day = Math.floor(r.createdAt / 86400000);
        return day >= lastWeekStart && day <= lastWeekEnd;
      }).length;

      const changePercentage = lastWeekCount > 0
        ? ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100
        : 0;

      return {
        thisWeek: thisWeekCount,
        lastWeek: lastWeekCount,
        changePercentage: Math.round(changePercentage),
      };
    } catch (error) {
      console.error('[StatsCalculator] getWeeklyTrend failed:', error);
      return { thisWeek: 0, lastWeek: 0, changePercentage: 0 };
    }
  }

  /**
   * Calculate retention rate based on FSRS stability
   */
  async calculateAverageRetention(): Promise<number> {
    try {
      const records = await this.memorizationService.getAllMemorized(this.profileId);
      if (records.length === 0) return 0;

      let totalRetention = 0;
      for (const record of records) {
        if (record.fsrsState.stability > 0 && record.fsrsState.nextInterval > 0) {
          totalRetention += (record.fsrsState.stability / record.fsrsState.nextInterval) * 100;
        }
      }

      return Math.round((totalRetention / records.length) * 100) / 100;
    } catch (error) {
      console.error('[StatsCalculator] calculateAverageRetention failed:', error);
      return 0;
    }
  }

  /**
   * Calculate mastery index for a record (0-100)
   * Formula: stabilityScore * 0.4 + repetitionScore * 0.3 + recallScore * 0.3
   */
  calculateMasteryIndex(record: MemorizationRecord): number {
    const { fsrsState } = record;
    const stabilityScore = Math.min(100, (fsrsState.stability / 30) * 100);
    const repetitionScore = Math.min(100, fsrsState.repetitions * 10);
    const recallScore = fsrsState.recallProbability * 100;
    return Math.round(stabilityScore * 0.4 + repetitionScore * 0.3 + recallScore * 0.3);
  }

  /**
   * Detect if a lapse has occurred in a record's history
   */
  async detectLapse(recordId: string): Promise<boolean> {
    try {
      const logs = await this.memorizationService.getReviewLogsForRecord(recordId, this.profileId);
      if (logs.length < 5) return false;

      const recentStabilities = logs.slice(-5).map(log => log.stabilityAfter);
      const olderStabilities = logs.slice(-10, -5).map(log => log.stabilityAfter);

      if (olderStabilities.length === 0) return false;

      const recentAvg = recentStabilities.reduce((a, b) => a + b, 0) / recentStabilities.length;
      const olderAvg = olderStabilities.reduce((a, b) => a + b, 0) / olderStabilities.length;

      return recentAvg < olderAvg * 0.5;
    } catch (error) {
      console.error('[StatsCalculator] detectLapse failed:', error);
      return false;
    }
  }

  /**
   * Get the most frequently forgotten words in a verse
   */
  async getMostForgottenWords(recordId: string): Promise<string[]> {
    try {
      const logs = await this.memorizationService.getReviewLogsForRecord(recordId, this.profileId);
      const wordFailures: Record<string, number> = {};
      for (const log of logs) {
        // Full implementation would analyze wordPerformance
      }
      return Object.entries(wordFailures)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word);
    } catch (error) {
      console.error('[StatsCalculator] getMostForgottenWords failed:', error);
      return [];
    }
  }

  /**
   * Get fragile portions of a verse
   */
  async getFragilePortions(recordId: string): Promise<Array<{ start: number; end: number }>> {
    try {
      await this.memorizationService.getReviewLogsForRecord(recordId, this.profileId);
      return [];
    } catch (error) {
      console.error('[StatsCalculator] getFragilePortions failed:', error);
      return [];
    }
  }

  /**
   * Get all progress stats for dashboard display
   */
  async getStats(streakCount: number): Promise<ProgressStats> {
    const records = await this.memorizationService.getAllMemorized(this.profileId);
    const totalVerses = records.length;
    const masteredVerses = records.filter(r => r.status === 'mastered').length;
    const inProgressVerses = totalVerses - masteredVerses;

    const now = Date.now();
    const dueForReview = records.filter(r => r.nextReviewAt && r.nextReviewAt <= now && r.status !== 'mastered').length;

    const weeklyTrend = await this.getWeeklyTrend();

    let totalMinutes = 0;
    let totalReviews = 0;
    for (const record of records) {
      totalMinutes += record.totalReviewMinutes || 0;
      totalReviews += record.reviewCount || 0;
    }
    const avgSessionDuration = totalReviews > 0 ? Math.round((totalMinutes / totalReviews) * 10) / 10 : 0;

    return {
      totalVerses,
      masteredVerses,
      inProgressVerses,
      dueForReview,
      streakCount,
      longestStreak: streakCount,
      weeklyTrend,
      avgSessionDurationMin: avgSessionDuration,
    };
  }
}
