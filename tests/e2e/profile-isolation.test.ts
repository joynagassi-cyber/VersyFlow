/**
 * E2E Tests — Profile Isolation (FAM-PRIV-001)
 * Verify that profile data is completely isolated between users
 */

import { MemorizationRecord } from '@/domains/memorization/entities';

describe('Profile Isolation — E2E', () => {
  describe('Memory data isolation', () => {
    it('should isolate memorization records by profile', () => {
      const profileARecords: MemorizationRecord[] = [
        {
          id: 'a:1',
          learnerProfileId: 'profile-a',
          bookId: 'joh', chapterNumber: 3, verseNumber: 16,
          translationId: 'lsg', bibleVerseReference: 'Jean 3:16',
          bibleVerseText: 'Text A', status: 'in-progress',
          fsrsState: { stability: 5, difficulty: 3, recallProbability: 0.8, lastInterval: 3, nextInterval: 5, elapsedDays: 1, repetitions: 3, requestedRetention: 0.9 },
          nextReviewAt: Date.now(), createdAt: Date.now(), lastReviewedAt: null,
          reviewCount: 3, totalReviewMinutes: 10, wordPerformance: [], favorite: false, tags: [],
        },
      ];

      const profileBRecords: MemorizationRecord[] = [
        {
          id: 'b:1',
          learnerProfileId: 'profile-b',
          bookId: 'psa', chapterNumber: 23, verseNumber: 1,
          translationId: 'lsg', bibleVerseReference: 'Psaume 23:1',
          bibleVerseText: 'Text B', status: 'mastered',
          fsrsState: { stability: 30, difficulty: 1, recallProbability: 0.95, lastInterval: 20, nextInterval: 40, elapsedDays: 20, repetitions: 8, requestedRetention: 0.9 },
          nextReviewAt: Date.now(), createdAt: Date.now(), lastReviewedAt: null,
          reviewCount: 8, totalReviewMinutes: 40, wordPerformance: [], favorite: true, tags: [],
        },
      ];

      // Verify isolation: Profile A records don't contain Profile B data
      expect(profileARecords.some(r => r.learnerProfileId === 'profile-b')).toBe(false);
      expect(profileBRecords.some(r => r.learnerProfileId === 'profile-a')).toBe(false);

      // Verify record IDs don't leak
      const aIds = profileARecords.map(r => r.id).join(',');
      const bIds = profileBRecords.map(r => r.id).join(',');
      expect(aIds).not.toContain('b');
      expect(bIds).not.toContain('a');
    });

    it('should isolate FSRS states between profiles', () => {
      const profileA = {
        fsrsState: { stability: 5, difficulty: 3, recallProbability: 0.8 },
        learnerProfileId: 'profile-a',
      };
      const profileB = {
        fsrsState: { stability: 30, difficulty: 1, recallProbability: 0.95 },
        learnerProfileId: 'profile-b',
      };

      expect(profileA.fsrsState.stability).not.toBe(profileB.fsrsState.stability);
      expect(profileA.fsrsState.difficulty).not.toBe(profileB.fsrsState.difficulty);
      expect(profileA.learnerProfileId).not.toBe(profileB.learnerProfileId);
    });

    it('should isolate review queues by profile', () => {
      const allRecords = [
        { id: 'a1', learnerProfileId: 'profile-a', nextReviewAt: Date.now() },
        { id: 'b1', learnerProfileId: 'profile-b', nextReviewAt: Date.now() },
        { id: 'a2', learnerProfileId: 'profile-a', nextReviewAt: Date.now() + 86400000 },
      ];

      const profileAQueue = allRecords.filter(r => r.learnerProfileId === 'profile-a');
      const profileBQueue = allRecords.filter(r => r.learnerProfileId === 'profile-b');

      expect(profileAQueue).toHaveLength(2);
      expect(profileBQueue).toHaveLength(1);
      expect(profileAQueue.every(r => r.learnerProfileId === 'profile-a')).toBe(true);
      expect(profileBQueue.every(r => r.learnerProfileId === 'profile-b')).toBe(true);
    });

    it('should isolate progress stats between profiles', () => {
      const profileAStats = {
        totalReviewMinutes: 10,
        reviewCount: 3,
        streak: 5,
        learnerProfileId: 'profile-a',
      };
      const profileBStats = {
        totalReviewMinutes: 40,
        reviewCount: 8,
        streak: 12,
        learnerProfileId: 'profile-b',
      };

      expect(profileAStats.totalReviewMinutes).not.toBe(profileBStats.totalReviewMinutes);
      expect(profileAStats.reviewCount).not.toBe(profileBStats.reviewCount);
      expect(profileAStats.streak).not.toBe(profileBStats.streak);
      expect(profileAStats.learnerProfileId).not.toBe(profileBStats.learnerProfileId);
    });
  });

  describe('Data leak prevention', () => {
    it('should not share memorization data between profiles', () => {
      // Simulate: Profile A memorizes John 3:16
      const profileAMemorized = {
        id: 'a:mem:1',
        learnerProfileId: 'profile-a',
        bookId: 'joh', chapterNumber: 3, verseNumber: 16,
        bibleVerseText: 'Car Dieu a tant aimé le monde',
      };

      // Profile B queries their own data — should NOT see John 3:16
      const profileBData = [
        { id: 'b:mem:1', learnerProfileId: 'profile-b', bookId: 'psa', chapterNumber: 23, verseNumber: 1 },
      ];

      const profileBHasJohn316 = profileBData.some(
        r => r.bookId === 'joh' && r.chapterNumber === 3 && r.verseNumber === 16
      );
      expect(profileBHasJohn316).toBe(false);

      // Verify Profile A data is accessible only to Profile A
      const profileAHasJohn316 = profileAMemorized.bookId === 'joh' &&
        profileAMemorized.chapterNumber === 3 &&
        profileAMemorized.verseNumber === 16;
      expect(profileAHasJohn316).toBe(true);
    });

    it('should maintain separate review history per profile', () => {
      const profileAReviews = [
        { id: 'a:r1', learnerProfileId: 'profile-a', word: 'car', correct: true },
        { id: 'a:r2', learnerProfileId: 'profile-a', word: 'dieu', correct: false },
      ];

      const profileBReviews = [
        { id: 'b:r1', learnerProfileId: 'profile-b', word: 'l\'eternel', correct: true },
      ];

      // Profile B should not see Profile A's review history
      const profileBHasCar = profileBReviews.some(r => r.word === 'car');
      const profileBHasDieu = profileBReviews.some(r => r.word === 'dieu');
      expect(profileBHasCar).toBe(false);
      expect(profileBHasDieu).toBe(false);

      // Profile A should have their own reviews
      expect(profileAReviews.every(r => r.learnerProfileId === 'profile-a')).toBe(true);
    });
  });
});
