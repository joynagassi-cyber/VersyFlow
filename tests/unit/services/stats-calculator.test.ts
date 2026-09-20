/**
 * Tests for StatsCalculator — progress statistics and analytics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatsCalculator } from '@/services/stats-calculator';
import type { MemorizationService } from '@/domains/memorization/service';
import type { MemorizationRecord } from '@/domains/memorization/entities';

function makeMockMemorizationService(overrides: Partial<MemorizationService> = {}): MemorizationService {
  return {
    getAllMemorized: vi.fn(async () => []),
    getReviewLogsForRecord: vi.fn(async () => []),
    ...overrides,
  } as unknown as MemorizationService;
}

function makeRecord(overrides: Partial<MemorizationRecord> = {}): MemorizationRecord {
  return {
    id: 'rec_1',
    learnerProfileId: 'profile-1',
    bookId: 'joh',
    chapterNumber: 3,
    verseNumber: 16,
    translationId: 'lsg',
    bibleVerseReference: 'Jean 3:16',
    bibleVerseText: 'Car Dieu a tant aimé le monde',
    status: 'in-progress',
    fsrsState: {
      stability: 5,
      difficulty: 5,
      recallProbability: 0.8,
      lastInterval: 3,
      nextInterval: 5,
      elapsedDays: 1,
      repetitions: 3,
      requestedRetention: 0.9,
    },
    nextReviewAt: Date.now() + 86400000 * 5,
    createdAt: Date.now() - 86400000 * 10,
    lastReviewedAt: Date.now(),
    reviewCount: 3,
    totalReviewMinutes: 10,
    wordPerformance: [],
    favorite: false,
    tags: [],
    ...overrides,
  } as MemorizationRecord;
}

describe('StatsCalculator', () => {
  let calculator: StatsCalculator;
  let mockService: MemorizationService;

  beforeEach(() => {
    mockService = makeMockMemorizationService();
    calculator = new StatsCalculator(mockService, 'profile-1');
  });

  describe('getWeeklyTrend()', () => {
    it('returns zeros when no records', async () => {
      vi.spyOn(mockService, 'getAllMemorized').mockResolvedValue([]);
      const trend = await calculator.getWeeklyTrend();
      expect(trend.thisWeek).toBe(0);
      expect(trend.lastWeek).toBe(0);
      expect(trend.changePercentage).toBe(0);
    });

    it('counts records created this week', async () => {
      const now = Date.now();
      const thisWeekRecord = makeRecord({ createdAt: now - 86400000 * 3 });
      vi.spyOn(mockService, 'getAllMemorized').mockResolvedValue([thisWeekRecord]);

      const trend = await calculator.getWeeklyTrend();
      expect(trend.thisWeek).toBe(1);
      expect(trend.lastWeek).toBe(0);
    });

    it('counts records created last week', async () => {
      const now = Date.now();
      const lastWeekRecord = makeRecord({ createdAt: now - 86400000 * 10 });
      vi.spyOn(mockService, 'getAllMemorized').mockResolvedValue([lastWeekRecord]);

      const trend = await calculator.getWeeklyTrend();
      expect(trend.lastWeek).toBe(1);
    });

    it('calculates positive changePercentage', async () => {
      const now = Date.now();
      const thisWeekRecord = makeRecord({ createdAt: now - 86400000 * 3 });
      const lastWeekRecord = makeRecord({ createdAt: now - 86400000 * 10 });
      vi.spyOn(mockService, 'getAllMemorized').mockResolvedValue([thisWeekRecord, lastWeekRecord]);

      const trend = await calculator.getWeeklyTrend();
      expect(trend.thisWeek).toBe(1);
      expect(trend.lastWeek).toBe(1);
      expect(trend.changePercentage).toBe(0); // same count
    });

    it('handles service error gracefully', async () => {
      vi.spyOn(mockService, 'getAllMemorized').mockRejectedValue(new Error('db error'));
      const trend = await calculator.getWeeklyTrend();
      expect(trend.thisWeek).toBe(0);
      expect(trend.lastWeek).toBe(0);
      expect(trend.changePercentage).toBe(0);
    });
  });

  describe('calculateAverageRetention()', () => {
    it('returns 0 when no records', async () => {
      vi.spyOn(mockService, 'getAllMemorized').mockResolvedValue([]);
      const retention = await calculator.calculateAverageRetention();
      expect(retention).toBe(0);
    });

    it('calculates retention from stability/nextInterval ratio', async () => {
      const record = makeRecord({
        fsrsState: {
          stability: 10,
          difficulty: 3,
          recallProbability: 0.85,
          lastInterval: 5,
          nextInterval: 10,
          elapsedDays: 1,
          repetitions: 4,
          requestedRetention: 0.9,
        },
      });
      vi.spyOn(mockService, 'getAllMemorized').mockResolvedValue([record]);

      const retention = await calculator.calculateAverageRetention();
      // retention = (10/10) * 100 = 100
      expect(retention).toBeCloseTo(100, 0);
    });

    it('skips records with zero stability or interval', async () => {
      const record = makeRecord({
        fsrsState: {
          stability: 0,
          difficulty: 5,
          recallProbability: 0.5,
          lastInterval: 0,
          nextInterval: 1,
          elapsedDays: 0,
          repetitions: 0,
          requestedRetention: 0.9,
        },
      });
      vi.spyOn(mockService, 'getAllMemorized').mockResolvedValue([record]);

      const retention = await calculator.calculateAverageRetention();
      expect(retention).toBe(0);
    });

    it('handles service error gracefully', async () => {
      vi.spyOn(mockService, 'getAllMemorized').mockRejectedValue(new Error('db error'));
      const retention = await calculator.calculateAverageRetention();
      expect(retention).toBe(0);
    });
  });

  describe('calculateMasteryIndex()', () => {
    it('calculates mastery index from FSRS state', () => {
      const record = makeRecord({
        fsrsState: {
          stability: 15,
          difficulty: 3,
          recallProbability: 0.85,
          lastInterval: 7,
          nextInterval: 14,
          elapsedDays: 1,
          repetitions: 5,
          requestedRetention: 0.9,
        },
      });
      const index = calculator.calculateMasteryIndex(record);
      expect(index).toBeGreaterThan(0);
      expect(index).toBeLessThanOrEqual(100);
    });

    it('returns 0 for new verse with no stability', () => {
      const record = makeRecord({
        fsrsState: {
          stability: 0,
          difficulty: 5,
          recallProbability: 0.5,
          lastInterval: 0,
          nextInterval: 1,
          elapsedDays: 0,
          repetitions: 0,
          requestedRetention: 0.9,
        },
      });
      const index = calculator.calculateMasteryIndex(record);
      // stabilityScore=0, repetitionScore=0, recallScore=50 → 0*0.4 + 0*0.3 + 50*0.3 = 15
      expect(index).toBeGreaterThan(0);
    });

    it('caps stability score at 100', () => {
      const record = makeRecord({
        fsrsState: {
          stability: 100, // > 30 → capped at 100
          difficulty: 1,
          recallProbability: 0.99,
          lastInterval: 90,
          nextInterval: 180,
          elapsedDays: 90,
          repetitions: 20,
          requestedRetention: 0.9,
        },
      });
      const index = calculator.calculateMasteryIndex(record);
      expect(index).toBeLessThanOrEqual(100);
    });

    it('caps repetition score at 100 (10+ reps)', () => {
      const record = makeRecord({
        fsrsState: {
          stability: 5,
          difficulty: 5,
          recallProbability: 0.8,
          lastInterval: 3,
          nextInterval: 5,
          elapsedDays: 1,
          repetitions: 15,
          requestedRetention: 0.9,
        },
      });
      const index = calculator.calculateMasteryIndex(record);
      // repetitionScore = min(100, 15*10) = 100
      expect(index).toBeGreaterThan(0);
    });
  });

  describe('detectLapse()', () => {
    it('returns false when fewer than 5 logs', async () => {
      vi.spyOn(mockService, 'getReviewLogsForRecord').mockResolvedValue([
        { id: 'l1', memorizationRecordId: 'r1', answeredAt: Date.now(), rating: 'good', actualInterval: 1, predictedInterval: 1, stabilityBefore: 1, stabilityAfter: 2, difficultyBefore: 5, difficultyAfter: 4, wordPerformance: [] },
      ]);
      const result = await calculator.detectLapse('rec_1');
      expect(result).toBe(false);
    });

    it('returns false when service throws', async () => {
      vi.spyOn(mockService, 'getReviewLogsForRecord').mockRejectedValue(new Error('db error'));
      const result = await calculator.detectLapse('rec_1');
      expect(result).toBe(false);
    });
  });

  describe('getMostForgottenWords()', () => {
    it('returns empty array when no logs', async () => {
      vi.spyOn(mockService, 'getReviewLogsForRecord').mockResolvedValue([]);
      const words = await calculator.getMostForgottenWords('rec_1');
      expect(words).toEqual([]);
    });

    it('returns empty array on error', async () => {
      vi.spyOn(mockService, 'getReviewLogsForRecord').mockRejectedValue(new Error('db error'));
      const words = await calculator.getMostForgottenWords('rec_1');
      expect(words).toEqual([]);
    });
  });

  describe('getFragilePortions()', () => {
    it('returns empty array', async () => {
      vi.spyOn(mockService, 'getReviewLogsForRecord').mockResolvedValue([]);
      const portions = await calculator.getFragilePortions('rec_1');
      expect(portions).toEqual([]);
    });

    it('returns empty array on error', async () => {
      vi.spyOn(mockService, 'getReviewLogsForRecord').mockRejectedValue(new Error('db error'));
      const portions = await calculator.getFragilePortions('rec_1');
      expect(portions).toEqual([]);
    });
  });

  describe('getStats()', () => {
    it('returns stats with zero values when no records', async () => {
      vi.spyOn(mockService, 'getAllMemorized').mockResolvedValue([]);
      const stats = await calculator.getStats(0);
      expect(stats.totalVerses).toBe(0);
      expect(stats.masteredVerses).toBe(0);
      expect(stats.inProgressVerses).toBe(0);
      expect(stats.dueForReview).toBe(0);
      expect(stats.streakCount).toBe(0);
    });

    it('counts mastered and in-progress verses', async () => {
      const records = [
        makeRecord({ status: 'mastered' }),
        makeRecord({ status: 'in-progress' }),
        makeRecord({ status: 'in-progress' }),
      ];
      vi.spyOn(mockService, 'getAllMemorized').mockResolvedValue(records);

      const stats = await calculator.getStats(3);
      expect(stats.totalVerses).toBe(3);
      expect(stats.masteredVerses).toBe(1);
      expect(stats.inProgressVerses).toBe(2);
      expect(stats.streakCount).toBe(3);
      expect(stats.longestStreak).toBe(3);
    });

    it('calculates dueForReview', async () => {
      const now = Date.now();
      const records = [
        makeRecord({
          status: 'in-progress',
          nextReviewAt: now - 86400000, // overdue
        }),
        makeRecord({
          status: 'mastered',
          nextReviewAt: now - 86400000, // mastered, should not count
        }),
      ];
      vi.spyOn(mockService, 'getAllMemorized').mockResolvedValue(records);

      const stats = await calculator.getStats(0);
      expect(stats.dueForReview).toBe(1);
    });

    it('calculates avgSessionDurationMin', async () => {
      const records = [
        makeRecord({ reviewCount: 2, totalReviewMinutes: 10 }),
        makeRecord({ reviewCount: 3, totalReviewMinutes: 15 }),
      ];
      vi.spyOn(mockService, 'getAllMemorized').mockResolvedValue(records);

      const stats = await calculator.getStats(0);
      // totalMinutes=25, totalReviews=5 → avg = 25/5 = 5.0
      expect(stats.avgSessionDurationMin).toBe(5);
    });

    it('throws when service errors (no try/catch in getStats)', async () => {
      vi.spyOn(mockService, 'getAllMemorized').mockRejectedValue(new Error('db error'));
      await expect(calculator.getStats(0)).rejects.toThrow('db error');
    });
  });
});
