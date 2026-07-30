/**
 * Integration Tests for Review Log Persistence
 * Tests the complete flow: review session → rating submission → log persistence
 */

import { MemorizationService } from '@/domains/memorization/service';
import { MmkvStorage } from '@/infrastructure/storage';
import { Sm2FallbackEngine } from '@/domains/fsrs';
import { ReviewLogEntry } from '@/domains/memorization/entities';
import { Rating } from '@/domains/fsrs';

describe('Review Log Persistence (Integration)', () => {
  let service: MemorizationService;
  let storage: MmkvStorage;
  let fsrsEngine: Sm2FallbackEngine;

  beforeEach(() => {
    storage = new MmkvStorage();
    fsrsEngine = new Sm2FallbackEngine();
    service = new MemorizationService(storage, fsrsEngine);
  });

  afterEach(async () => {
    await storage.clear();
  });

  it('should persist a review log entry after updating a record', async () => {
    // Arrange - Create a memorized record
    const recordId = 'joh:3:16-lsp:lsg';
    const now = Date.now();
    const record: any = {
      id: recordId,
      bookId: 'joh',
      chapterNumber: 3,
      verseNumber: 16,
      translationId: 'lsg',
      bibleVerseReference: 'Jean 3:16',
      bibleVerseText: 'Car Dieu a tellement aimé le monde...',
      status: 'in-progress',
      fsrsState: { stability: 2.5, difficulty: 5, recallProbability: 0.75, lastInterval: 1, nextInterval: 3, elapsedDays: 1, repetitions: 1, requestedRetention: 0.9 },
      nextReviewAt: now,
      createdAt: now - 86400000,
      lastReviewedAt: null,
      reviewCount: 1,
      totalReviewMinutes: 5,
      wordPerformance: [],
      favorite: false,
      tags: [],
    };

    await service.saveMemorizedRecord(record);

    // Act - Submit a rating during review
    const newFsrsState = {
      stability: 3.0,
      difficulty: 4.8,
      recallProbability: 0.8,
      lastInterval: 3,
      nextInterval: 7,
      elapsedDays: 2,
      repetitions: 2,
      requestedRetention: 0.9,
    };

    const success = await service.updateRecordAfterReview(
      recordId,
      Rating.GOOD,
      newFsrsState,
      now + 86400000 * 7,
      [],
      2.5, // stabilityBefore
      5,   // difficultyBefore
      3,   // predictedInterval
      1,   // actualInterval
    );

    // Assert - Verify the record was updated and a log was saved
    expect(success).toBe(true);

    // Check that review log was saved
    const logs = await service.getReviewLogsForRecord(recordId);
    expect(logs.length).toBe(1);

    const log = logs[0];
    expect(log).toHaveProperty('id');
    expect(log.memorizationRecordId).toBe(recordId);
    expect(log.answeredAt).toBeTruthy();
    expect(log.rating).toBe('good');
    expect(log.actualInterval).toBe(1);
    expect(log.predictedInterval).toBe(3);
    expect(log.stabilityBefore).toBe(2.5);
    expect(log.stabilityAfter).toBe(3.0);
    expect(log.difficultyBefore).toBe(5);
    expect(log.difficultyAfter).toBe(4.8);
  });

  it('should accumulate multiple review logs for the same record', async () => {
    // Arrange - Create a record with initial state
    const recordId = 'joh:3:16-2nd-lsg';
    const now = Date.now();
    const record: any = {
      id: recordId,
      bookId: 'joh',
      chapterNumber: 3,
      verseNumber: 16,
      translationId: 'lsg',
      bibleVerseReference: 'Jean 3:16 (second review)',
      bibleVerseText: 'Car Dieu a tellement aimé le monde...',
      status: 'in-progress',
      fsrsState: { stability: 3.0, difficulty: 4.8, recallProbability: 0.8, lastInterval: 3, nextInterval: 7, elapsedDays: 2, repetitions: 2, requestedRetention: 0.9 },
      nextReviewAt: now,
      createdAt: now - 86400000,
      lastReviewedAt: now,
      reviewCount: 1,
      totalReviewMinutes: 5,
      wordPerformance: [],
      favorite: false,
      tags: [],
    };

    await service.saveMemorizedRecord(record);

    // First review
    const newFsrsState1 = {
      stability: 3.5,
      difficulty: 4.5,
      recallProbability: 0.85,
      lastInterval: 7,
      nextInterval: 14,
      elapsedDays: 9,
      repetitions: 2,
      requestedRetention: 0.9,
    };

    await service.updateRecordAfterReview(
      recordId,
      Rating.GOOD,
      newFsrsState1,
      now + 86400000 * 14,
      [],
      3.0, 4.8, 7, 3
    );

    // Second review with different rating
    const newFsrsState2 = {
      stability: 4.0,
      difficulty: 4.2,
      recallProbability: 0.9,
      lastInterval: 14,
      nextInterval: 30,
      elapsedDays: 23,
      repetitions: 3,
      requestedRetention: 0.9,
    };

    await service.updateRecordAfterReview(
      recordId,
      Rating.EASY,
      newFsrsState2,
      now + 86400000 * 30,
      [],
      3.5, 4.5, 14, 7
    );

    // Assert - Should have 2 review logs
    const logs = await service.getReviewLogsForRecord(recordId);
    expect(logs.length).toBe(2);

    // Verify first log has GOOD rating
    expect(logs[0].rating).toBe('good');
    expect(logs[0].stabilityBefore).toBe(3.0);

    // Verify second log has EASY rating
    expect(logs[1].rating).toBe('easy');
    expect(logs[1].stabilityBefore).toBe(3.5);
  });

  it('should retrieve all review logs across records', async () => {
    // Arrange - Create two records and add logs to each
    const recordId1 = 'gen:1:1-log1-lsg';
    const recordId2 = 'exo:2:1-log2-lsg';
    const now = Date.now();

    // Record 1
    const rec1: any = {
      id: recordId1,
      bookId: 'gen',
      chapterNumber: 1,
      verseNumber: 1,
      translationId: 'lsg',
      bibleVerseReference: 'Genèse 1:1',
      bibleVerseText: 'Au commencement Dieu créa les cieux et la terre.',
      status: 'in-progress',
      fsrsState: { stability: 2.0, difficulty: 5, recallProbability: 0.7, lastInterval: 0, nextInterval: 1, elapsedDays: 0, repetitions: 0, requestedRetention: 0.9 },
      nextReviewAt: now,
      createdAt: now - 86400000,
      lastReviewedAt: null,
      reviewCount: 0,
      totalReviewMinutes: 0,
      wordPerformance: [],
      favorite: false,
      tags: [],
    };
    await service.saveMemorizedRecord(rec1);

    // Record 2
    const rec2: any = {
      id: recordId2,
      bookId: 'exo',
      chapterNumber: 2,
      verseNumber: 1,
      translationId: 'lsg',
      bibleVerseReference: 'Exode 2:1',
      bibleVerseText: 'Il arriva alors qu\'un homme d\'Égypte épousa une femme du pays.',
      status: 'new',
      fsrsState: { stability: 1.0, difficulty: 6, recallProbability: 0.5, lastInterval: 0, nextInterval: 1, elapsedDays: 0, repetitions: 0, requestedRetention: 0.9 },
      nextReviewAt: now + 86400000,
      createdAt: now - 2 * 86400000,
      lastReviewedAt: null,
      reviewCount: 0,
      totalReviewMinutes: 0,
      wordPerformance: [],
      favorite: false,
      tags: [],
    };
    await service.saveMemorizedRecord(rec2);

    // Add review logs to both records
    await service.updateRecordAfterReview(
      recordId1,
      Rating.HARD,
      { stability: 2.2, difficulty: 5.2, recallProbability: 0.65, lastInterval: 1, nextInterval: 2, elapsedDays: 1, repetitions: 1, requestedRetention: 0.9 },
      now + 2 * 86400000,
      [],
      2.0, 5.0, 1, 0
    );

    await service.updateRecordAfterReview(
      recordId2,
      Rating.GOOD,
      { stability: 1.5, difficulty: 5.5, recallProbability: 0.6, lastInterval: 1, nextInterval: 3, elapsedDays: 1, repetitions: 1, requestedRetention: 0.9 },
      now + 3 * 86400000,
      [],
      1.0, 6.0, 1, 0
    );

    // Act - Get all review logs
    const allLogs = await service.getAllReviewLogs();

    // Assert - Should have 2 logs total
    expect(allLogs.length).toBe(2);
    expect(allLogs[0].memorizationRecordId).toBe(recordId1);
    expect(allLogs[1].memorizationRecordId).toBe(recordId2);
  });
});
