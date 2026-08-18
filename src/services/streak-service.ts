/**
 * StreakService — Calculate and track learning streaks
 * Extracted from ProgressService (C8 deepening)
 */

import { eventBus, DomainEventTypes } from '@/domains';
import { MemorizationService } from '@/domains/memorization';

export class StreakService {
  constructor(
    private memorizationService: MemorizationService,
    private profileId: string,
  ) {}

  /**
   * Calculate the current streak count (consecutive days with activity)
   */
  async calculateStreak(): Promise<number> {
    try {
      const records = await this.memorizationService.getAllMemorized(this.profileId);
      if (records.length === 0) return 0;

      const reviewTimes: number[] = [];
      for (const record of records) {
        if (record.lastReviewedAt) reviewTimes.push(record.lastReviewedAt);
        const logs = await this.memorizationService.getReviewLogsForRecord(record.id, this.profileId);
        for (const log of logs) {
          reviewTimes.push(log.answeredAt);
        }
      }

      if (reviewTimes.length === 0) return 0;

      reviewTimes.sort((a, b) => a - b);

      const today = Math.floor(Date.now() / 86400000);
      let currentStreak = 0;

      for (let i = 0; i <= today; i++) {
        const checkDay = today - i;
        const hasActivity = reviewTimes.some(ts => Math.floor(ts / 86400000) === checkDay);
        if (hasActivity) {
          currentStreak++;
        } else {
          break;
        }
      }

      return currentStreak;
    } catch (error) {
      console.error('[StreakService] calculateStreak failed:', error);
      return 0;
    }
  }

  /**
   * Increment streak, emit event if milestone reached
   */
  async incrementStreak(): Promise<boolean> {
    try {
      const currentStreak = await this.calculateStreak();
      if (currentStreak > 0) {
        const isMilestone = [7, 30, 100].includes(currentStreak);
        eventBus.emit({
          id: crypto.randomUUID(),
          type: DomainEventTypes.STREAK_INCREMENTED,
          timestamp: Date.now(),
          payload: { streakCount: currentStreak, isMilestone },
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[StreakService] incrementStreak failed:', error);
      return false;
    }
  }
}
