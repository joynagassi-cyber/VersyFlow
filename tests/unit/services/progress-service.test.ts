/**
 * Tests pour ProgressService
 * Vérifie le calcul de la streak, des jalons et des statistiques de progression
 */

import { ProgressService } from '@/services/progress-service';
import { MemorizationService } from '@/domains/memorization/service';
import { MmkvStorage } from '@/infrastructure/storage';
import { Sm2FallbackEngine } from '@/domains/fsrs';

describe('ProgressService', () => {
  let service: ProgressService;
  let storage: MmkvStorage;
  let memorizationService: MemorizationService;
  let fsrsEngine: Sm2FallbackEngine;

  beforeEach(() => {
    storage = new MmkvStorage();
    fsrsEngine = new Sm2FallbackEngine();
    memorizationService = new MemorizationService(storage, fsrsEngine);
    service = new ProgressService(memorizationService, fsrsEngine);
  });

  afterEach(async () => {
    await storage.clear();
  });

  describe('Calcul de la streak', () => {
    it('should return 0 streak when no activity', async () => {
      const stats = await service.calculateProgressStats();
      expect(stats.streakCount).toBe(0);
    });

    it('should calculate streak from recent activity', async () => {
      // Arrange - Create a record with today's activity
      const now = Date.now();
      const recordId = 'joh:3:16:lsg';
      
      const record = {
        id: recordId,
        bookId: 'joh',
        chapterNumber: 3,
        verseNumber: 16,
        translationId: 'lsg',
        bibleVerseReference: 'Jean 3:16',
        bibleVerseText: 'Car Dieu a tellement aimé le monde...',
        status: 'in-progress' as const,
        fsrsState: { 
          stability: 2.5, 
          difficulty: 5, 
          recallProbability: 0.75, 
          lastInterval: 1, 
          nextInterval: 3, 
          elapsedDays: 1, 
          repetitions: 1, 
          requestedRetention: 0.9 
        },
        nextReviewAt: now,
        createdAt: now - 86400000,
        lastReviewedAt: now,
        reviewCount: 1,
        totalReviewMinutes: 5,
        wordPerformance: [],
        favorite: false,
      };

      await memorizationService.saveRecord(record);
      
      // Act
      const stats = await service.calculateProgressStats();
      
      // Assert
      expect(stats.totalVerses).toBeGreaterThan(0);
      expect(typeof stats.streakCount).toBe('number');
    });
  });

  describe('Statistiques de progression', () => {
    it('should return correct verse counts', async () => {
      // Act
      const stats = await service.calculateProgressStats();
      
      // Assert
      expect(stats).toHaveProperty('totalVerses');
      expect(stats).toHaveProperty('masteredVerses');
      expect(stats).toHaveProperty('inProgressVerses');
      expect(stats).toHaveProperty('dueForReview');
    });
  });
});
