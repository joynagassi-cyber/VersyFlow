/**
 * StreakService — Calculate and track learning streaks
 * Extracted from ProgressService (C8 deepening)
 *
 * P2-4: in addition to computing the streak from the record/review history,
 * the service now persists a daily `streaks` fact (insertOnly, local write →
 * server sync) so the streak survives reload and is visible across devices.
 */

import { eventBus, DomainEventTypes } from '@/domains';
import type { MemorizationService } from '@/domains/memorization';
import type { IStreakRepository } from '@/domains/streaks/repository';

export interface StreakRecordInput {
  /** Verses memorized on the streak day */
  versesMemorized?: number;
  /** Reviews completed on the streak day */
  reviewsCompleted?: number;
  /** Session duration in minutes */
  sessionDurationMinutes?: number;
}

export class StreakService {
  constructor(
    private memorizationService: MemorizationService,
    private profileId: string,
    private streakRepository?: IStreakRepository,
    private userIdResolver?: () => Promise<string | null>,
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
   * Increment streak, persist the daily fact to `streaks`, and emit the
   * domain event (which the TelemetryListener turns into `streak.incremented`).
   *
   * The fact is only written when a streak repository and a user session are
   * available (offline-safe: no repo → no-op; no user → skip the write).
   *
   * `reviewsCompleted` in the daily fact is a *fact* about today's activity
   * (reviews performed), not the streak total — the streak total is derived
   * separately by `calculateStreak()`.
   */
  async incrementStreak(): Promise<boolean> {
    try {
      const currentStreak = await this.calculateStreak();
      if (currentStreak === 0) return false;

      await this.recordDailyStreak({ reviewsCompleted: 1 });

      const isMilestone = [7, 30, 100].includes(currentStreak);
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.STREAK_INCREMENTED,
        timestamp: Date.now(),
        payload: {
          streakDelta: 1,
          previousStreak: currentStreak - 1,
          newStreak: currentStreak,
          isMilestone,
        },
      });
      return true;
    } catch (error) {
      console.error('[StreakService] incrementStreak failed:', error);
      return false;
    }
  }

  /**
   * Persist today's streak fact through the insertOnly repository.
   * Idempotent: a deterministic (user, day) id means re-writing the same
   * day is a server upsert no-op.
   *
   * The input fields are *facts about today's activity* — distinct from
   * `calculateStreak()` (which returns the consecutive-day count). Callers
   * should pass the actual counts they have on hand, not the streak total.
   */
  async recordDailyStreak(input?: StreakRecordInput): Promise<void> {
    if (!this.streakRepository || !this.userIdResolver) return;
    const userId = await this.userIdResolver();
    if (!userId) return; // No session — skip the sync write (offline-safe).

    const today = new Date();
    const streakDate = today.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    await this.streakRepository.insert({
      userId,
      streakDate,
      versesMemorized: input?.versesMemorized ?? 0,
      reviewsCompleted: input?.reviewsCompleted ?? 0,
      sessionDurationMinutes: input?.sessionDurationMinutes ?? 0,
    });
  }
}
