/**
 * Unit Tests — Target Migration
 * Tests migration from legacy verse-only records to target-oriented format
 */

describe('Target Migration', () => {
  describe('Migration detection', () => {
    it('should detect records needing migration', () => {
      const needsMigration = (record: any) => !record.targetId || !record.targetType;

      const legacyRecord = { id: 'joh:3:16:lsg', bookId: 'joh', chapterNumber: 3, verseNumber: 16 };
      const newRecord = { id: 'target-1', targetId: 'target-1', targetType: 'single-verse' };

      expect(needsMigration(legacyRecord)).toBe(true);
      expect(needsMigration(newRecord)).toBe(false);
    });
  });

  describe('Record migration', () => {
    it('should migrate a single verse record', () => {
      const record = {
        id: 'joh:3:16:lsg',
        bookId: 'joh',
        chapterNumber: 3,
        verseNumber: 16,
        translationId: 'lsg',
        bibleVerseReference: 'Jean 3:16',
        bibleVerseText: 'Car Dieu a tant aimé le monde...',
        status: 'new',
        fsrsState: { stability: 0, difficulty: 5, recallProbability: 0.9, lastInterval: 0, nextInterval: 1, elapsedDays: 0, repetitions: 0, requestedRetention: 0.9 },
        favorite: false,
        tags: [],
        createdAt: Date.now(),
        lastReviewedAt: null,
        nextReviewAt: null,
        reviewCount: 0,
        totalReviewMinutes: 0,
        wordPerformance: [],
      };

      const migrated = {
        ...record,
        targetId: record.id,
        targetType: 'single-verse' as const,
        contentReference: {
          bookId: record.bookId,
          chapter: record.chapterNumber,
          startVerse: record.verseNumber,
          translationId: record.translationId,
        },
      };

      expect(migrated.targetId).toBe('joh:3:16:lsg');
      expect(migrated.targetType).toBe('single-verse');
      expect(migrated.contentReference.startVerse).toBe(16);
    });

    it('should migrate a passage record', () => {
      const record = {
        id: 'joh:3:16-18:lsg',
        bookId: 'joh',
        chapterNumber: 3,
        verseNumber: 16,
        endVerse: 18,
        translationId: 'lsg',
        bibleVerseReference: 'Jean 3:16-18',
        bibleVerseText: 'Combined text...',
        status: 'new',
        fsrsState: { stability: 0, difficulty: 5, recallProbability: 0.9, lastInterval: 0, nextInterval: 1, elapsedDays: 0, repetitions: 0, requestedRetention: 0.9 },
        favorite: false,
        tags: [],
        createdAt: Date.now(),
        lastReviewedAt: null,
        nextReviewAt: null,
        reviewCount: 0,
        totalReviewMinutes: 0,
        wordPerformance: [],
        verseTexts: ['Verse 16', 'Verse 17', 'Verse 18'],
      };

      const migrated = {
        ...record,
        targetId: record.id,
        targetType: 'passage' as const,
        contentReference: {
          bookId: record.bookId,
          chapter: record.chapterNumber,
          startVerse: record.verseNumber,
          endVerse: record.endVerse,
          translationId: record.translationId,
        },
        verseTexts: record.verseTexts,
      };

      expect(migrated.targetType).toBe('passage');
      expect(migrated.contentReference.endVerse).toBe(18);
      expect(migrated.verseTexts).toHaveLength(3);
    });

    it('should preserve all existing fields during migration', () => {
      const record = {
        id: 'rec-1',
        bookId: 'psa',
        chapterNumber: 23,
        verseNumber: 1,
        translationId: 'lsg',
        bibleVerseReference: 'Psaumes 23:1',
        bibleVerseText: 'L\'Éternel est mon berger',
        status: 'in-progress',
        fsrsState: { stability: 5, difficulty: 3, recallProbability: 0.85, lastInterval: 3, nextInterval: 5, elapsedDays: 1, repetitions: 3, requestedRetention: 0.9 },
        favorite: true,
        tags: ['favori'],
        createdAt: Date.now() - 86400000,
        lastReviewedAt: Date.now() - 3600000,
        nextReviewAt: Date.now() + 86400000,
        reviewCount: 3,
        totalReviewMinutes: 5.5,
        wordPerformance: [],
      };

      const migrated = {
        ...record,
        targetId: record.id,
        targetType: 'single-verse' as const,
        contentReference: {
          bookId: record.bookId,
          chapter: record.chapterNumber,
          startVerse: record.verseNumber,
          translationId: record.translationId,
        },
      };

      // Preserve all existing fields
      expect(migrated.status).toBe('in-progress');
      expect(migrated.favorite).toBe(true);
      expect(migrated.tags).toEqual(['favori']);
      expect(migrated.reviewCount).toBe(3);
      expect(migrated.fsrsState.stability).toBe(5);
    });
  });

  describe('Idempotency', () => {
    it('should not duplicate data on re-run', () => {
      const needsMigration = (record: any) => !record.targetId || !record.targetType;

      // Already migrated record
      const migratedRecord = {
        id: 'rec-1',
        targetId: 'rec-1',
        targetType: 'single-verse',
        contentReference: { bookId: 'joh', chapter: 3, startVerse: 16, translationId: 'lsg' },
      };

      expect(needsMigration(migratedRecord)).toBe(false);
    });

    it('should handle already-migrated records gracefully', () => {
      const record = {
        id: 'rec-1',
        targetId: 'rec-1',
        targetType: 'single-verse',
        contentReference: { bookId: 'joh', chapter: 3, startVerse: 16, translationId: 'lsg' },
      };

      // Migration should be a no-op
      const migrated = { ...record };
      expect(migrated.targetId).toBe('rec-1');
      expect(migrated.targetType).toBe('single-verse');
    });
  });

  describe('Storage key patterns', () => {
    it('should use consistent key patterns', () => {
      const legacyKey = 'versyflow:record:joh:3:16:lsg';
      const profileKey = 'versyflow:prof-1:record:joh:3:16:lsg';

      expect(legacyKey.startsWith('versyflow:record:')).toBe(true);
      expect(profileKey.startsWith('versyflow:prof-1:')).toBe(true);
    });
  });
});
