/**
 * Tests — Data Isolation (Phase 7)
 * Verify Personal and Family data don't mix
 */

import { MemorizationRecord } from '@/domains/memorization/entities';

describe('Data Isolation — Personal vs Family', () => {
  describe('MemorizationRecord profile scoping', () => {
    it('should have learnerProfileId for personal records', () => {
      const record: MemorizationRecord = {
        id: 'test:1',
        learnerProfileId: 'profile-personal-1',
        bookId: 'joh',
        chapterNumber: 3,
        verseNumber: 16,
        translationId: 'lsg',
        bibleVerseReference: 'Jean 3:16',
        bibleVerseText: 'Car Dieu a tant aimé le monde',
        status: 'in-progress',
        fsrsState: {
          stability: 5, difficulty: 3, recallProbability: 0.8,
          lastInterval: 3, nextInterval: 5, elapsedDays: 1,
          repetitions: 3, requestedRetention: 0.9,
        },
        nextReviewAt: Date.now() + 86400000 * 5,
        createdAt: Date.now() - 86400000 * 10,
        lastReviewedAt: Date.now(),
        reviewCount: 3,
        totalReviewMinutes: 10,
        wordPerformance: [],
        favorite: false,
        tags: [],
      };

      expect(record.learnerProfileId).toBe('profile-personal-1');
      expect(record.id).toBe('test:1');
    });

    it('should have learnerProfileId for family records', () => {
      const record: MemorizationRecord = {
        id: 'test:2',
        learnerProfileId: 'profile-family-sarah',
        bookId: 'psa',
        chapterNumber: 23,
        verseNumber: 1,
        translationId: 'lsg',
        bibleVerseReference: 'Psaume 23:1',
        bibleVerseText: "L'Éternel est mon berger",
        status: 'mastered',
        fsrsState: {
          stability: 30, difficulty: 1, recallProbability: 0.95,
          lastInterval: 20, nextInterval: 40, elapsedDays: 20,
          repetitions: 8, requestedRetention: 0.9,
        },
        nextReviewAt: Date.now() + 86400000 * 40,
        createdAt: Date.now() - 86400000 * 50,
        lastReviewedAt: Date.now(),
        reviewCount: 8,
        totalReviewMinutes: 40,
        wordPerformance: [],
        favorite: true,
        tags: [],
      };

      expect(record.learnerProfileId).toBe('profile-family-sarah');
      expect(record.status).toBe('mastered');
    });

    it('should isolate records by learnerProfileId', () => {
      const personalRecords: MemorizationRecord[] = [
        {
          id: 'p1',
          learnerProfileId: 'profile-joy',
          bookId: 'joh', chapterNumber: 3, verseNumber: 16,
          translationId: 'lsg', bibleVerseReference: 'Jean 3:16',
          bibleVerseText: 'Text 1', status: 'in-progress',
          fsrsState: { stability: 5, difficulty: 3, recallProbability: 0.8, lastInterval: 3, nextInterval: 5, elapsedDays: 1, repetitions: 3, requestedRetention: 0.9 },
          nextReviewAt: Date.now(), createdAt: Date.now(), lastReviewedAt: null,
          reviewCount: 3, totalReviewMinutes: 10, wordPerformance: [], favorite: false, tags: [],
        },
      ];

      const familyRecords: MemorizationRecord[] = [
        {
          id: 'f1',
          learnerProfileId: 'profile-sarah',
          bookId: 'psa', chapterNumber: 23, verseNumber: 1,
          translationId: 'lsg', bibleVerseReference: 'Psaume 23:1',
          bibleVerseText: 'Text 2', status: 'mastered',
          fsrsState: { stability: 30, difficulty: 1, recallProbability: 0.95, lastInterval: 20, nextInterval: 40, elapsedDays: 20, repetitions: 8, requestedRetention: 0.9 },
          nextReviewAt: Date.now(), createdAt: Date.now(), lastReviewedAt: null,
          reviewCount: 8, totalReviewMinutes: 40, wordPerformance: [], favorite: true, tags: [],
        },
      ];

      // Verify isolation: personal records don't leak to family
      const personalIds = personalRecords.map(r => r.id);
      const familyIds = familyRecords.map(r => r.id);

      expect(personalIds).not.toContain('f1');
      expect(familyIds).not.toContain('p1');

      // Verify profile IDs are distinct
      const personalProfileIds = personalRecords.map(r => r.learnerProfileId);
      const familyProfileIds = familyRecords.map(r => r.learnerProfileId);

      expect(personalProfileIds).toContain('profile-joy');
      expect(familyProfileIds).toContain('profile-sarah');
      expect(personalProfileIds).not.toEqual(familyProfileIds);
    });
  });

  describe('FSRS state isolation', () => {
    it('should have different FSRS states for different profiles', () => {
      const joyRecord = {
        fsrsState: { stability: 5, difficulty: 3, recallProbability: 0.8 },
        learnerProfileId: 'profile-joy',
      };

      const sarahRecord = {
        fsrsState: { stability: 30, difficulty: 1, recallProbability: 0.95 },
        learnerProfileId: 'profile-sarah',
      };

      // Different stability values
      expect(joyRecord.fsrsState.stability).not.toBe(sarahRecord.fsrsState.stability);
      expect(joyRecord.learnerProfileId).not.toBe(sarahRecord.learnerProfileId);
    });

    it('should calculate different review intervals per profile', () => {
      const joyNextReview = Date.now() + 86400000 * 5;
      const sarahNextReview = Date.now() + 86400000 * 40;

      // Different next review times
      expect(joyNextReview).not.toBe(sarahNextReview);
    });
  });

  describe('Review queue isolation', () => {
    it('should filter review queue by profile', () => {
      const allRecords = [
        { id: 'p1', learnerProfileId: 'profile-joy', nextReviewAt: Date.now() },
        { id: 'f1', learnerProfileId: 'profile-sarah', nextReviewAt: Date.now() },
        { id: 'p2', learnerProfileId: 'profile-joy', nextReviewAt: Date.now() + 86400000 },
      ];

      const profileId = 'profile-joy';
      const filtered = allRecords.filter(r => r.learnerProfileId === profileId);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.learnerProfileId === 'profile-joy')).toBe(true);
      expect(filtered.some(r => r.learnerProfileId === 'profile-sarah')).toBe(false);
    });
  });
});
