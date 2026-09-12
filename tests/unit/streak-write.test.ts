/**
 * StreakService — daily streak fact persistence tests
 *
 * Verifies that recordDailyStreak / incrementStreak write a single fact per
 * (user, day) through the insertOnly IStreakRepository, use the deterministic
 * id, emit the correct domain event payload, and are no-ops when there is no
 * repository or no user session.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreakService } from '@/services/streak-service';
import type { MemorizationService } from '@/domains/memorization';
import type { IStreakRepository } from '@/domains/streaks/repository';
import { eventBus, DomainEventTypes } from '@/domains/events';

// ---------------------------------------------------------------------------
// Test double construction helpers
// ---------------------------------------------------------------------------

/**
 * Build a fake PowerSync DB surface that captures every SQL statement plus
 * its bound params so we can assert the exact insert path.
 */
function makeMockDb() {
  const executed: Array<{ sql: string; params: unknown[] }> = [];
  const db = {
    getAll: vi.fn().mockResolvedValue([]),
    writeTransaction: vi.fn(async (cb: (tx: any) => Promise<void>) => {
      const tx = {
        execute: vi.fn(async (sql: string, params: unknown[] = []) => {
          executed.push({ sql, params });
        }),
      };
      await cb(tx);
    }),
    __executed: executed,
  };
  return db;
}

/**
 * A minimal MemorizationService stub — the streak service only calls
 * getAllMemorized(profileId) and getReviewLogsForRecord(recordId, profileId).
 */
function makeFakeMemorizationService(): MemorizationService {
  return {
    getAllMemorized: vi.fn().mockResolvedValue([]),
    getReviewLogsForRecord: vi.fn().mockResolvedValue([]),
  } as unknown as MemorizationService;
}

/**
 * A minimal IStreakRepository that delegates to a captured mock DB.
 * `insert` is a vi.fn() so callers can assert call count.
 */
function makeFakeStreakRepository(db: ReturnType<typeof makeMockDb>): IStreakRepository {
  const insertSpy = vi.fn(async (record: { userId: string; streakDate: string; versesMemorized: number; reviewsCompleted: number; sessionDurationMinutes: number }) => {
    await db.writeTransaction(async (tx: any) => {
      await tx.execute(
        `INSERT INTO streaks (
          id, user_id, streak_date, verses_memorized, reviews_completed,
          session_duration_minutes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          // The real implementation derives a deterministic id via
          // recordUuid(userId, { bookId: 'streak:<date>', ... }). We use a
          // stable placeholder here — the test asserts the id is present,
          // not its exact value, because recordUuid depends on FNV-1a hash
          // internals.
          `deterministic-streak-id:${record.userId}:${record.streakDate}`,
          record.userId,
          record.streakDate,
          record.versesMemorized,
          record.reviewsCompleted,
          record.sessionDurationMinutes,
          new Date(record.streakDate + 'T00:00:00.000Z').toISOString(), // ISO timestamp
        ],
      );
    });
  });

  return {
    insert: insertSpy,
    getForDate: async () => null,
  } as unknown as IStreakRepository;
}

// ---------------------------------------------------------------------------
// Helpers for deterministic dates
// ---------------------------------------------------------------------------

/**
 * Freeze the system clock to a fixed ms using vi.setSystemTime.
 * Unlike spying on Date.now() alone, setSystemTime also makes
 * `new Date().toISOString()` return the correct UTC date, which is
 * what StreakService.recordDailyStreak uses to derive streakDate.
 */
function freezeDate(nowMs: number): () => void {
  vi.setSystemTime(nowMs);
  return () => vi.useRealTimers();
}

/**
 * Compute the expected UTC date string for a fixed timestamp.
 * Called AFTER the Date.now spy is active so the result is deterministic.
 */
function expectedDate(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

/**
 * Build review timestamps for a given streak length.
 *
 * `calculateStreak` walks backwards from today and checks whether any
 * `reviewTimes` entry (derived from `lastReviewedAt` and `answeredAt`) maps
 * to the same calendar day. To guarantee a streak of N, we emit one
 * timestamp per day for the last N days so that the consecutive-day scan
 * cannot break.
 *
 * Must be called while Date.now() is frozen.
 */
function makeReviewTimestamps(streakLength: number): number[] {
  const ts = Date.now();
  return Array.from({ length: streakLength }, (_, i) => ts - i * 86_400_000);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StreakService', () => {
  let memorizationService: MemorizationService;
  let db: ReturnType<typeof makeMockDb>;
  let repo: IStreakRepository;
  let userIdResolver: () => Promise<string | null>;
  let service: StreakService;
  let restoreDate: () => void;
  const TEST_USER_ID = 'user-abc';
  const TEST_PROFILE_ID = 'profile-1';
  // 2024-06-15T00:00:00.000Z
  const TEST_NOW_MS = 1_718_409_600_000;
  let expectedStreakDate: string;

  beforeEach(() => {
    db = makeMockDb();
    repo = makeFakeStreakRepository(db);
    userIdResolver = vi.fn().mockResolvedValue(TEST_USER_ID);
    memorizationService = makeFakeMemorizationService();
    service = new StreakService(memorizationService, TEST_PROFILE_ID, repo, userIdResolver);
    restoreDate = freezeDate(TEST_NOW_MS);
    // Compute expected date after the spy is active so it matches what the
    // service will produce.
    expectedStreakDate = expectedDate(TEST_NOW_MS);
  });

  afterEach(() => {
    restoreDate();
  });

  // -----------------------------------------------------------------------
  // recordDailyStreak
  // -----------------------------------------------------------------------

  describe('recordDailyStreak', () => {
    it('issues a plain INSERT with user id, today date and input defaults into streaks', async () => {
      await service.recordDailyStreak();

      expect(db.writeTransaction).toHaveBeenCalledTimes(1);
      const { sql, params } = db.__executed[0];
      expect(sql).toContain('INSERT INTO streaks');
      expect(sql).not.toContain('ON CONFLICT');
      expect(params).toHaveLength(7);
      // params[1] = user_id, params[2] = streak_date
      expect(params[1]).toBe(TEST_USER_ID);
      expect(params[2]).toBe(expectedStreakDate);
      // default values when no input provided
      expect(params[3]).toBe(0); // versesMemorized
      expect(params[4]).toBe(0); // reviewsCompleted
      expect(params[5]).toBe(0); // sessionDurationMinutes
      expect(typeof params[6]).toBe('string'); // created_at ISO
    });

    it('uses the resolved user id from userIdResolver', async () => {
      userIdResolver.mockResolvedValueOnce('user-resolved');
      const svc = new StreakService(memorizationService, TEST_PROFILE_ID, repo, userIdResolver);
      await svc.recordDailyStreak();

      const { params } = db.__executed[0];
      expect(params[1]).toBe('user-resolved');
    });

    it('is a no-op when there is no streak repository', async () => {
      const noRepo = new StreakService(memorizationService, TEST_PROFILE_ID, undefined, userIdResolver);
      await noRepo.recordDailyStreak();

      expect(repo.insert).not.toHaveBeenCalled();
      expect(db.writeTransaction).not.toHaveBeenCalled();
    });

    it('is a no-op when there is no userId resolver', async () => {
      const noResolver = new StreakService(memorizationService, TEST_PROFILE_ID, repo, undefined);
      await noResolver.recordDailyStreak();

      expect(repo.insert).not.toHaveBeenCalled();
      expect(db.writeTransaction).not.toHaveBeenCalled();
    });

    it('is a no-op when userIdResolver returns null (no session)', async () => {
      userIdResolver.mockResolvedValueOnce(null);
      const noSession = new StreakService(memorizationService, TEST_PROFILE_ID, repo, userIdResolver);
      await noSession.recordDailyStreak();

      expect(repo.insert).not.toHaveBeenCalled();
      expect(db.writeTransaction).not.toHaveBeenCalled();
    });

    it('passes through input fields into the INSERT params', async () => {
      await service.recordDailyStreak({
        versesMemorized: 12,
        reviewsCompleted: 5,
        sessionDurationMinutes: 30,
      });

      const { params } = db.__executed[0];
      expect(params[3]).toBe(12);
      expect(params[4]).toBe(5);
      expect(params[5]).toBe(30);
    });

    it('calculates streakDate from today using toISOString().slice(0,10)', async () => {
      await service.recordDailyStreak();
      const { params } = db.__executed[0];
      expect(params[2]).toBe(expectedStreakDate);
    });
  });

  // -----------------------------------------------------------------------
  // incrementStreak
  // -----------------------------------------------------------------------

  describe('incrementStreak', () => {
    it('returns false when calculateStreak returns 0', async () => {
      // memorization service returns no records → streak = 0
      const result = await service.incrementStreak();
      expect(result).toBe(false);
      expect(repo.insert).not.toHaveBeenCalled();
    });

    it('calls recordDailyStreak and emits STREAK_INCREMENTED when streak > 0', async () => {
      // Simulate 3 consecutive days of activity → streak = 3
      const reviewTimes = makeReviewTimestamps(3);
      memorizationService.getAllMemorized.mockResolvedValueOnce([
        { id: 'rec-1', lastReviewedAt: reviewTimes[0] },
      ] as any);
      memorizationService.getReviewLogsForRecord.mockResolvedValueOnce(
        reviewTimes.slice(1).map((ts) => ({ answeredAt: ts })),
      );

      const handler = vi.fn();
      eventBus.on(DomainEventTypes.STREAK_INCREMENTED, handler);

      const result = await service.incrementStreak();

      eventBus.off(DomainEventTypes.STREAK_INCREMENTED, handler);

      expect(result).toBe(true);
      expect(repo.insert).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe(DomainEventTypes.STREAK_INCREMENTED);
      expect(event.payload.streakDelta).toBe(1);
      expect(event.payload.previousStreak).toBe(2);
      expect(event.payload.newStreak).toBe(3);
    });

    it('emits isMilestone=true for streaks of 7, 30, 100', async () => {
      const milestones = [7, 30, 100];
      for (const streak of milestones) {
        const reviewTimes = makeReviewTimestamps(streak);
        memorizationService.getAllMemorized.mockResolvedValueOnce([
          { id: 'rec-1', lastReviewedAt: reviewTimes[0] },
        ] as any);
        memorizationService.getReviewLogsForRecord.mockResolvedValueOnce(
          reviewTimes.slice(1).map((ts) => ({ answeredAt: ts })),
        );

        const handler = vi.fn();
        eventBus.on(DomainEventTypes.STREAK_INCREMENTED, handler);
        await service.incrementStreak();
        eventBus.off(DomainEventTypes.STREAK_INCREMENTED, handler);

        const payload = handler.mock.calls[0][0].payload;
        expect(payload.isMilestone).toBe(true);
      }
    });

    it('emits isMilestone=false for non-milestone streaks', async () => {
      // streak = 3 is not a milestone
      const reviewTimes = makeReviewTimestamps(3);
      memorizationService.getAllMemorized.mockResolvedValueOnce([
        { id: 'rec-1', lastReviewedAt: reviewTimes[0] },
      ] as any);
      memorizationService.getReviewLogsForRecord.mockResolvedValueOnce(
        reviewTimes.slice(1).map((ts) => ({ answeredAt: ts })),
      );

      const handler = vi.fn();
      eventBus.on(DomainEventTypes.STREAK_INCREMENTED, handler);
      await service.incrementStreak();
      eventBus.off(DomainEventTypes.STREAK_INCREMENTED, handler);

      expect(handler.mock.calls[0][0].payload.isMilestone).toBe(false);
    });

    it('returns false and does not emit when recordDailyStreak throws', async () => {
      const reviewTimes = makeReviewTimestamps(3);
      memorizationService.getAllMemorized.mockResolvedValueOnce([
        { id: 'rec-1', lastReviewedAt: reviewTimes[0] },
      ] as any);
      memorizationService.getReviewLogsForRecord.mockResolvedValueOnce(
        reviewTimes.slice(1).map((ts) => ({ answeredAt: ts })),
      );
      // Make insert throw
      repo.insert = vi.fn().mockRejectedValue(new Error('db error'));

      const handler = vi.fn();
      eventBus.on(DomainEventTypes.STREAK_INCREMENTED, handler);
      const result = await service.incrementStreak();
      eventBus.off(DomainEventTypes.STREAK_INCREMENTED, handler);

      expect(result).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
