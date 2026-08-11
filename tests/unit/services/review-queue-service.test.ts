/**
 * Tests pour ReviewQueueService
 * Vérifie la priorisation intelligente des révisions
 */

import { ReviewQueueService } from '@/services/review-queue-service';
import { MemorizationService } from '@/domains/memorization/service';
import { MmkvStorage } from '@/infrastructure/storage';
import { Sm2FallbackEngine } from '@/domains/fsrs';

describe('ReviewQueueService', () => {
  let service: ReviewQueueService;
  let storage: MmkvStorage;
  let memorizationService: MemorizationService;
  let fsrsEngine: Sm2FallbackEngine;

  beforeEach(() => {
    storage = new MmkvStorage();
    fsrsEngine = new Sm2FallbackEngine();
    memorizationService = new MemorizationService(storage, fsrsEngine);
    service = new ReviewQueueService(memorizationService, fsrsEngine);
  });

  afterEach(async () => {
    await storage.clear();
  });

  describe('Priorisation de la file d\'attente', () => {
    it('should return empty queue when no records', async () => {
      // Act
      const queue = await service.getPrioritizedQueue();
      
      // Assert
      expect(queue).toHaveLength(0);
    });

    it('should prioritize overdue records', async () => {
      // Arrange
      const now = Date.now();
      const record = {
        id: 'test:1',
        bookId: 'gen',
        chapterNumber: 1,
        verseNumber: 1,
        translationId: 'lsg',
        bibleVerseReference: 'Genèse 1:1',
        bibleVerseText: 'Au commencement, Dieu créa les cieux et la terre.',
        status: 'in-progress' as const,
        fsrsState: { 
          stability: 0.5, 
          difficulty: 3, 
          recallProbability: 0.4, 
          lastInterval: 1, 
          nextInterval: 1, 
          elapsedDays: 5, 
          repetitions: 2, 
          requestedRetention: 0.9 
        },
        nextReviewAt: now - 86400000 * 2, // Overdue by 2 days
        createdAt: now - 86400000 * 10,
        lastReviewedAt: now - 86400000 * 2,
        reviewCount: 2,
        totalReviewMinutes: 10,
        wordPerformance: [],
        favorite: false,
      };

      await memorizationService.saveRecord(record);
      
      // Act
      const queue = await service.getPrioritizedQueue();
      
      // Assert
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('test:1');
    });

    it('should return empty queue when no records due', async () => {
      // Arrange - Record not due yet
      const now = Date.now();
      const record = {
        id: 'test:2',
        bookId: 'psa',
        chapterNumber: 23,
        verseNumber: 1,
        translationId: 'lsg',
        bibleVerseReference: 'Psaume 23:1',
        bibleVerseText: 'L\'Éternel est mon berger.',
        status: 'in-progress' as const,
        fsrsState: { 
          stability: 10, 
          difficulty: 2, 
          recallProbability: 0.95, 
          lastInterval: 7, 
          nextInterval: 14, 
          elapsedDays: 1, 
          repetitions: 5, 
          requestedRetention: 0.9 
        },
        nextReviewAt: now + 86400000 * 7, // Due in 7 days
        createdAt: now - 86400000 * 30,
        lastReviewedAt: now,
        reviewCount: 5,
        totalReviewMinutes: 25,
        wordPerformance: [],
        favorite: false,
      };

      await memorizationService.saveRecord(record);
      
      // Act
      const queue = await service.getPrioritizedQueue();
      
      // Assert
      expect(queue).toHaveLength(0);
    });
  });
});
