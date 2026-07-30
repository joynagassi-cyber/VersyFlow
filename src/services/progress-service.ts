/**
 * Services Layer — Progress Calculation
 * Calculates streaks, retention, milestones, and analytics
 * See docs/25-retrieval-analytics-spec.md
 */

import { IFsrsEngine, Rating } from '@/domains/fsrs';
import { MemorizationService } from '@/domains/memorization/service';
import { MemorizationRecord, ReviewLogEntry, MasteryLevel } from '@/domains/memorization/entities';
import { eventBus, DomainEventTypes } from '@/domains';
import { TelemetryService } from './telemetry-service';

export interface ProgressStats {
  /** Total number of memorized verses */
  totalVerses: number;
  /** Number of mastered verses */
  masteredVerses: number;
  /** Number of verses in progress */
  inProgressVerses: number;
  /** Number of verses due for review */
  dueForReview: number;
  /** Current streak count (consecutive days) */
  streakCount: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Current week's verses memorized */
  weeklyTrend: {
    thisWeek: number;
    lastWeek: number;
    changePercentage: number;
  };
  /** Average session duration in minutes */
  avgSessionDurationMin: number;
}

export interface Milestone {
  type: 'first_verse' | 'ten_verses' | 'fifty_verses' | 'mastered_first';
  totalVerses: number;
  totalMastered: number;
  reachedAt: number;
}

/**
 * ProgressService — Orchestrates all progression calculations
 * and emits domain events and telemetry for AI coaching.
 */
export class ProgressService {
  constructor(
    private memorizationService: MemorizationService,
    private fsrsEngine: IFsrsEngine,
    private telemetryService?: TelemetryService, // Optional telemetry
  ) {}

  /**
   * Record an exercise completion telemetry event
   */
  private recordExerciseCompleted(payload: Record<string, unknown>): void {
    if (this.telemetryService) {
      this.telemetryService.recordExerciseCompleted(payload);
    }
  }

  /**
   * Record an exercise abandonment telemetry event
   */
  private recordExerciseAbandoned(payload: Record<string, unknown>): void {
    if (this.telemetryService) {
      this.telemetryService.recordExerciseAbandoned(payload);
    }
  }

  /**
   * Record a review completion telemetry event
   */
  private recordReviewCompleted(payload: Record<string, unknown>): void {
    if (this.telemetryService) {
      this.telemetryService.recordReviewCompleted(payload);
    }
  }

  /**
   * Record a memory session completion telemetry event
   */
  private recordMemorySessionCompleted(payload: Record<string, unknown>): void {
    if (this.telemetryService) {
      this.telemetryService.recordMemorySessionCompleted(payload);
    }
  }

  /**
   * Record an error telemetry event
   */
  private recordError(payload: Record<string, unknown>): void {
    if (this.telemetryService) {
      this.telemetryService.recordError(payload);
    }
  }

  /**
   * Record a feature access telemetry event
   */
  private recordFeatureAccessed(payload: Record<string, unknown>): void {
    if (this.telemetryService) {
      this.telemetryService.recordFeatureAccessed(payload);
    }
  }

  /**
   * Calculate the current streak count (consecutive days with activity)
   */
  async calculateStreak(): Promise<number> {
    try {
      const records = await this.memorizationService.getAllMemorized();
      if (records.length === 0) return 0;

      // Get all review timestamps
      const reviewTimes: number[] = [];
      for (const record of records) {
        if (record.lastReviewedAt) reviewTimes.push(record.lastReviewedAt);
        // Also check review logs if available
        const logs = await this.memorizationService.getReviewLogsForRecord(record.id);
        for (const log of logs) {
          reviewTimes.push(log.answeredAt);
        }
      }

      if (reviewTimes.length === 0) return 0;

      // Sort timestamps ascending
      reviewTimes.sort((a, b) => a - b);

      // Calculate consecutive days
      const today = Math.floor(Date.now() / 86400000);
      let currentStreak = 0;
      let lastReviewDay = today;

      // Check backwards from today
      for (let i = 0; i <= today; i++) {
        const checkDay = today - i;
        const hasActivity = reviewTimes.some(ts => Math.floor(ts / 86400000) === checkDay);

        if (hasActivity) {
          currentStreak++;
          lastReviewDay = checkDay;
        } else {
          // Gap found — streak broken
          break;
        }
      }

      return currentStreak;
    } catch (error) {
      console.error('[ProgressService] calculateStreak failed:', error);
      return 0;
    }
  }

  /**
   * Check if a milestone has been reached and emit event if so
   * Also records telemetry for future AI coaching
   */
  async checkAndEmitMilestones(): Promise<Milestone[]> {
    const milestones: Milestone[] = [];
    const records = await this.memorizationService.getAllMemorized();

    const totalMemorized = records.length;
    const masteredCount = records.filter(r => r.status === 'mastered').length;

    // F-002-A: First verse
    if (totalMemorized === 1) {
      milestones.push({
        type: 'first_verse',
        totalVerses: 1,
        totalMastered: masteredCount,
        reachedAt: Date.now(),
      });
      // Emit milestone event
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.PROGRESS_MILESTONE_REACHED,
        timestamp: Date.now(),
        payload: { milestoneType: 'first_verse', totalVerses: 1, totalMastered: masteredCount },
      });
      // Record telemetry for feature usage
      this.recordFeatureAccessed({ featureName: 'milestone.first_verse' });
    }

    // F-002-B: Ten verses
    if (totalMemorized === 10) {
      milestones.push({
        type: 'ten_verses',
        totalVerses: 10,
        totalMastered: masteredCount,
        reachedAt: Date.now(),
      });
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.PROGRESS_MILESTONE_REACHED,
        timestamp: Date.now(),
        payload: { milestoneType: 'ten_verses', totalVerses: 10, totalMastered: masteredCount },
      });
      this.recordFeatureAccessed({ featureName: 'milestone.ten_verses' });
    }

    // F-002-C: Fifty verses
    if (totalMemorized === 50) {
      milestones.push({
        type: 'fifty_verses',
        totalVerses: 50,
        totalMastered: masteredCount,
        reachedAt: Date.now(),
      });
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.PROGRESS_MILESTONE_REACHED,
        timestamp: Date.now(),
        payload: { milestoneType: 'fifty_verses', totalVerses: 50, totalMastered: masteredCount },
      });
      this.recordFeatureAccessed({ featureName: 'milestone.fifty_verses' });
    }

    // F-002-D: First mastered verse
    if (masteredCount === 1 && totalMemorized >= 1) {
      milestones.push({
        type: 'mastered_first',
        totalVerses: totalMemorized,
        totalMastered: 1,
        reachedAt: Date.now(),
      });
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.PROGRESS_MILESTONE_REACHED,
        timestamp: Date.now(),
        payload: { milestoneType: 'mastered_first', totalVerses: totalMemorized, totalMastered: 1 },
      });
      this.recordFeatureAccessed({ featureName: 'milestone.mastered_first' });
    }

    return milestones;
  }

  /**
   * Calculate the weekly trend of verses memorized
   */
  async getWeeklyTrend(): Promise<{ thisWeek: number; lastWeek: number; changePercentage: number }> {
    try {
      const records = await this.memorizationService.getAllMemorized();

      // Calculate timestamps for this week and last week
      const today = new Date();
      const todayDay = Math.floor(today.getTime() / 86400000);
      const sevenDaysAgo = todayDay - 7;
      const fourteenDaysAgo = todayDay - 14;

      // This week: days 7-14 ago (excluding today's week overlap)
      const thisWeekStart = fourteenDaysAgo + 1;
      const thisWeekEnd = todayDay;

      // Last week: days 14-21 ago
      const lastWeekStart = fourteenDaysAgo + 1;
      const lastWeekEnd = todayDay - 21;

      // Count records created in each period
      const thisWeekCount = records.filter(r => {
        const createdAtDay = Math.floor(r.createdAt / 86400000);
        return createdAtDay >= thisWeekStart && createdAtDay <= thisWeekEnd;
      }).length;

      const lastWeekCount = records.filter(r => {
        const createdAtDay = Math.floor(r.createdAt / 86400000);
        return createdAtDay >= lastWeekStart && createdAtDay <= lastWeekEnd;
      }).length;

      const changePercentage = lastWeekCount > 0 ? ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100 : 0;

      return { thisWeek: thisWeekCount, lastWeek: lastWeekCount, changePercentage: Math.round(changePercentage) * 100 };
    } catch (error) {
      console.error('[ProgressService] getWeeklyTrend failed:', error);
      return { thisWeek: 0, lastWeek: 0, changePercentage: 0 };
    }
  }

  /**
   * Calculate retention rate based on FSRS stability
   * Formula: retention = stability / predicted_interval * 100
   */
  async calculateAverageRetention(): Promise<number> {
    try {
      const records = await this.memorizationService.getAllMemorized();
      if (records.length === 0) return 0;

      let totalRetention = 0;
      for (const record of records) {
        if (record.fsrsState.stability > 0 && record.fsrsState.nextInterval > 0) {
          const retention = (record.fsrsState.stability / record.fsrsState.nextInterval) * 100;
          totalRetention += retention;
        }
      }

      return Math.round((totalRetention / records.length) * 100) / 100;
    } catch (error) {
      console.error('[ProgressService] calculateAverageRetention failed:', error);
      return 0;
    }
  }

  /**
   * Calculate mastery index for a record (0-100)
   * Formula: stabilityScore * 0.4 + repetitionScore * 0.3 + recallScore * 0.3
   */
  calculateMasteryIndex(record: MemorizationRecord): number {
    const { fsrsState } = record;

    // stabilityScore: 0-100 based on stability (30 days = mastery)
    const stabilityScore = Math.min(100, (fsrsState.stability / 30) * 100);

    // repetitionScore: 0-100 based on repetitions (10 reps = mastery)
    const repetitionScore = Math.min(100, fsrsState.repetitions * 10);

    // recallScore: 0-100 based on recall probability
    const recallScore = fsrsState.recallProbability * 100;

    return Math.round(stabilityScore * 0.4 + repetitionScore * 0.3 + recallScore * 0.3);
  }

  /**
   * Detect if a lapse has occurred in a record's history
   */
  async detectLapse(recordId: string): Promise<boolean> {
    try {
      const logs = await this.memorizationService.getReviewLogsForRecord(recordId);
      if (logs.length < 5) return false;

      const recentStabilities = logs.slice(-5).map(log => log.stabilityAfter);
      const olderStabilities = logs.slice(-10, -5).map(log => log.stabilityAfter);

      if (olderStabilities.length === 0) return false;

      const recentAvg = recentStabilities.reduce((a, b) => a + b, 0) / recentStabilities.length;
      const olderAvg = olderStabilities.reduce((a, b) => a + b, 0) / olderStabilities.length;

      // Stability dropped more than 50% = lapse detected
      return recentAvg < olderAvg * 0.5;
    } catch (error) {
      console.error('[ProgressService] detectLapse failed:', error);
      return false;
    }
  }

  /**
   * Get the most frequently forgotten words in a verse
   */
  async getMostForgottenWords(recordId: string): Promise<string[]> {
    try {
      const logs = await this.memorizationService.getReviewLogsForRecord(recordId);
      const wordFailures: Record<string, number> = {};

      for (const log of logs) {
        // Count missing words from verification (simplified)
        // In a full implementation, wordPerformance would track this
      }

      // Sort by frequency and return top 3
      return Object.entries(wordFailures)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word);
    } catch (error) {
      console.error('[ProgressService] getMostForgottenWords failed:', error);
      return [];
    }
  }

  /**
   * Get fragile portions of a verse (segments with low accuracy)
   */
  async getFragilePortions(recordId: string): Promise<Array<{ start: number; end: number }>> {
    try {
      const logs = await this.memorizationService.getReviewLogsForRecord(recordId);
      // In a full implementation, analyze strongPortions/fragilePortions from VerificationResult
      return [];
    } catch (error) {
      console.error('[ProgressService] getFragilePortions failed:', error);
      return [];
    }
  }

  /**
   * Get all progress stats for dashboard display
   */
  async getStats(): Promise<ProgressStats> {
    const records = await this.memorizationService.getAllMemorized();
    const totalVerses = records.length;
    const masteredVerses = records.filter(r => r.status === 'mastered').length;
    const inProgressVerses = totalVerses - masteredVerses;

    // Count due verses (nextReviewAt <= now and not mastered)
    const now = Date.now();
    const dueForReview = records.filter(r => r.nextReviewAt && r.nextReviewAt <= now && r.status !== 'mastered').length;

    const streak = await this.calculateStreak();
    const weeklyTrend = await this.getWeeklyTrend();

    // Average session duration (from totalReviewMinutes / reviewCount)
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
      streakCount: streak,
      longestStreak: streak, // In MVP, current streak = longest (stored separately in future)
      weeklyTrend,
      avgSessionDurationMin: avgSessionDuration,
    };
  }

  /**
   * Increment streak and emit event if it's a new daily streak
   * Also records telemetry for streak activity
   */
  async incrementStreak(): Promise<boolean> {
    try {
      const currentStreak = await this.calculateStreak();
      if (currentStreak > 0) {
        // Emit streak incremented event
        const isMilestone = [7, 30, 100].includes(currentStreak);
        eventBus.emit({
          id: crypto.randomUUID(),
          type: DomainEventTypes.STREAK_INCREMENTED,
          timestamp: Date.now(),
          payload: { streakCount: currentStreak, isMilestone },
        });

        // Record streak activity telemetry
        this.recordFeatureAccessed({ featureName: `streak.day_${currentStreak}` });

        // Log streak milestone if applicable
        if (isMilestone) {
          this.recordFeatureAccessed({ featureName: `streak.milestone_${currentStreak}` });
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('[ProgressService] incrementStreak failed:', error);
      this.recordError({ errorType: 'streak_increment_error', errorMessage: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }
}

// Export for use in services and UI
export type { ProgressStats, Milestone };
