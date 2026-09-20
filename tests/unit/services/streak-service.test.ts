/**
 * Tests for StreakService — streak calculation and daily fact recording
 */

import { eventBus, DomainEventTypes } from '@/domains/events';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreakService } from '@/services/streak-service';
import type { MemorizationService } from '@/domains/memorization/service';
import type { IStreakRepository } from '@/domains/streaks/repository';

function makeMockMemorizationService(overrides: Partial<MemorizationService> = {}): MemorizationService {
  return {
    getAllMemorized: vi.fn(async () => []),
    getReviewLogsForRecord: vi.fn(async () => []),
    ...overrides,
  } as unknown as MemorizationService;
}

function makeMockRepository(overrides: Partial<IStreakRepository> = {}): IStreakRepository {
  return {
    insert: vi.fn(async () => {}),
    getForDate: vi.fn(async () => null),
    ...overrides,
  } as unknown as IStreakRepository;
}

describe('StreakService', () => {
  let service: StreakService;
  let mockMemService: MemorizationService;
  let mockRepo: IStreakRepository;
  let mockUserIdResolver: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockMemService = makeMockMemorizationService();
    mockRepo = makeMockRepository();
    mockUserIdResolver = vi.fn(async () => 'user-1');
    service = new StreakService(mockMemService, 'profile-1', mockRepo, mockUserIdResolver);
  });

  describe('calculateStreak()', () => {
    it('returns 0 when no records exist', async () => {
      vi.spyOn(mockMemService, 'getAllMemorized').mockResolvedValue([]);
      const streak = await service.calculateStreak();
      expect(streak).toBe(0);
    });

    it('returns 0 when records have no review timestamps', async () => {
      const record = {
        id: 'rec_1',
        lastReviewedAt: null,
      };
      vi.spyOn(mockMemService, 'getAllMemorized').mockResolvedValue([record as any]);
      vi.spyOn(mockMemService, 'getReviewLogsForRecord').mockResolvedValue([]);

      const streak = await service.calculateStreak();
      expect(streak).toBe(0);
    });

    it('calculates streak from recent activity', async () => {
      const now = Date.now();
      const today = Math.floor(now / 86400000);

      const record = {
        id: 'rec_1',
        lastReviewedAt: today * 86400000, // today
      };
      vi.spyOn(mockMemService, 'getAllMemorized').mockResolvedValue([record as any]);
      vi.spyOn(mockMemService, 'getReviewLogsForRecord').mockResolvedValue([
        { answeredAt: today * 86400000 },
      ]);

      const streak = await service.calculateStreak();
      // With activity today, streak should be at least 1
      expect(streak).toBeGreaterThanOrEqual(1);
    });

    it('breaks streak on gap day', async () => {
      const now = Date.now();
      const today = Math.floor(now / 86400000);
      // Activity from 3 days ago, gap yesterday
      const threeDaysAgo = today - 3;

      const record = {
        id: 'rec_1',
        lastReviewedAt: threeDaysAgo * 86400000,
      };
      vi.spyOn(mockMemService, 'getAllMemorized').mockResolvedValue([record as any]);
      vi.spyOn(mockMemService, 'getReviewLogsForRecord').mockResolvedValue([]);

      const streak = await service.calculateStreak();
      // Should be 0 because yesterday (today-1) has no activity
      expect(streak).toBe(0);
    });

    it('handles service error gracefully', async () => {
      vi.spyOn(mockMemService, 'getAllMemorized').mockRejectedValue(new Error('db error'));
      const streak = await service.calculateStreak();
      expect(streak).toBe(0);
    });
  });

  describe('incrementStreak()', () => {
    it('returns false when streak is 0', async () => {
      vi.spyOn(mockMemService, 'getAllMemorized').mockResolvedValue([]);
      const result = await service.incrementStreak();
      expect(result).toBe(false);
    });

    it('records daily streak and emits event when streak > 0', async () => {
      const now = Date.now();
      const today = Math.floor(now / 86400000);

      const record = {
        id: 'rec_1',
        lastReviewedAt: today * 86400000,
      };
      vi.spyOn(mockMemService, 'getAllMemorized').mockResolvedValue([record as any]);
      vi.spyOn(mockMemService, 'getReviewLogsForRecord').mockResolvedValue([]);

      const result = await service.incrementStreak();
      expect(result).toBe(true);
      expect(mockRepo.insert).toHaveBeenCalled();
    });

    it('emits STREAK_INCREMENTED domain event', async () => {
      const now = Date.now();
      const today = Math.floor(now / 86400000);

      const record = {
        id: 'rec_1',
        lastReviewedAt: today * 86400000,
      };
      vi.spyOn(mockMemService, 'getAllMemorized').mockResolvedValue([record as any]);
      vi.spyOn(mockMemService, 'getReviewLogsForRecord').mockResolvedValue([]);

      const emitSpy = vi.spyOn(eventBus, 'emit');

      await service.incrementStreak();
      expect(emitSpy).toHaveBeenCalled();

      const emittedEvent = emitSpy.mock.calls[0][0];
      expect(emittedEvent.type).toBe('progress.streak_incremented');
      expect((emittedEvent.payload as any).streakDelta).toBe(1);

      emitSpy.mockRestore();
    });

    it('returns false when repository is not provided', async () => {
      const serviceNoRepo = new StreakService(mockMemService, 'profile-1');
      vi.spyOn(mockMemService, 'getAllMemorized').mockResolvedValue([]);
      const result = await serviceNoRepo.incrementStreak();
      expect(result).toBe(false);
    });

    it('returns false when userId resolver returns null and no activity', async () => {
      const serviceNoUser = new StreakService(
        mockMemService,
        'profile-1',
        mockRepo,
        async () => null,
      );
      vi.spyOn(mockMemService, 'getAllMemorized').mockResolvedValue([]);
      vi.spyOn(mockMemService, 'getReviewLogsForRecord').mockResolvedValue([]);

      const result = await serviceNoUser.incrementStreak();
      // Returns false because calculateStreak returns 0 with no records
      expect(result).toBe(false);
    });

    it('handles service error gracefully', async () => {
      vi.spyOn(mockMemService, 'getAllMemorized').mockRejectedValue(new Error('db error'));
      const result = await service.incrementStreak();
      expect(result).toBe(false);
    });
  });

  describe('recordDailyStreak()', () => {
    it('does nothing when no repository', async () => {
      const serviceNoRepo = new StreakService(mockMemService, 'profile-1');
      await serviceNoRepo.recordDailyStreak({ reviewsCompleted: 5 });
      expect(mockRepo.insert).not.toHaveBeenCalled();
    });

    it('does nothing when no userId resolver', async () => {
      const serviceNoResolver = new StreakService(mockMemService, 'profile-1', mockRepo);
      await serviceNoResolver.recordDailyStreak({ reviewsCompleted: 5 });
      expect(mockRepo.insert).not.toHaveBeenCalled();
    });

    it('does nothing when userId resolver returns null', async () => {
      const serviceNoUser = new StreakService(
        mockMemService,
        'profile-1',
        mockRepo,
        async () => null,
      );
      await serviceNoUser.recordDailyStreak({ reviewsCompleted: 5 });
      expect(mockRepo.insert).not.toHaveBeenCalled();
    });

    it('inserts record with correct fields', async () => {
      const insertSpy = vi.spyOn(mockRepo, 'insert').mockResolvedValue(undefined);
      await service.recordDailyStreak({
        versesMemorized: 3,
        reviewsCompleted: 10,
        sessionDurationMinutes: 30,
      });

      expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-1',
        versesMemorized: 3,
        reviewsCompleted: 10,
        sessionDurationMinutes: 30,
      }));
    });

    it('uses defaults when input is undefined', async () => {
      const insertSpy = vi.spyOn(mockRepo, 'insert').mockResolvedValue(undefined);
      await service.recordDailyStreak();

      expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({
        versesMemorized: 0,
        reviewsCompleted: 0,
        sessionDurationMinutes: 0,
      }));
    });

    it('uses today date in YYYY-MM-DD format', async () => {
      const insertSpy = vi.spyOn(mockRepo, 'insert').mockResolvedValue(undefined);
      await service.recordDailyStreak();

      const callArgs = insertSpy.mock.calls[0][0];
      expect(callArgs.streakDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(callArgs.streakDate).toBe(new Date().toISOString().slice(0, 10));
    });
  });
});
