/**
 * E2E-style Integration Test - Complete Review Flow
 * Simulates end-to-end user journey through review system
 */

import { MemorizationService } from '@/domains/memorization/service';
import { MmkvStorage } from '@/infrastructure/storage';
import { Sm2FallbackEngine } from '@/domains/fsrs';
import { Rating } from '@/domains/fsrs';
import { IFsrsEngine } from '@/domains/fsrs/engine';

describe('Complete Review Flow (Integration)', () => {
  let service: MemorizationService;
  let storage: MmkvStorage;
  let fsrsEngine: IFsrsEngine;

  beforeEach(() => {
    storage = new MmkvStorage();
    fsrsEngine = new Sm2FallbackEngine();
    service = new MemorizationService(storage, fsrsEngine);
  });

  afterEach(async () => {
    await storage.clear();
  });

  it('should complete full review cycle with persistence', async () => {
    // Step 1: Create a memorized record
    const recordId = 'test-record-123';
    const now = Date.now();

    const initialRecord = {
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

    await service.saveMemorizedRecord(initialRecord);

    // Step 2: Perform first review with "GOOD" rating
    const newFsrsState1 = {
      stability: 3.0,
      difficulty: 4.8,
      recallProbability: 0.8,
      lastInterval: 3,
      nextInterval: 7,
      elapsedDays: 2,
      repetitions: 2,
      requestedRetention: 0.9,
    };

    const result1 = await service.updateRecordAfterReview(
      recordId,
      Rating.GOOD,
      newFsrsState1,
      now + 86400000 * 7,
      [],
      2.5, 5, 3, 1
    );

    expect(result1).toBe(true);

    // Verify record was updated
    const updatedRecord = await service.getMemorizedRecord('joh', 3, 16, 'lsg');
    expect(updatedRecord).not.toBeNull();
    expect(updatedRecord?.reviewCount).toBe(2);
    expect(updatedRecord?.nextReviewAt).toBe(now + 86400000 * 7);

    // Verify log was saved
    const logs = await service.getReviewLogsForRecord(recordId);
    expect(logs.length).toBe(1);
    expect(logs[0].rating).toBe('good');
    expect(logs[0].stabilityBefore).toBe(2.5);
    expect(logs[0].stabilityAfter).toBe(3.0);

    // Step 3: Perform second review with "EASY" rating
    const newFsrsState2 = {
      stability: 4.5,
      difficulty: 4.2,
      recallProbability: 0.92,
      lastInterval: 7,
      nextInterval: 15,
      elapsedDays: 9,
      repetitions: 3,
      requestedRetention: 0.9,
    };

    const result2 = await service.updateRecordAfterReview(
      recordId,
      Rating.EASY,
      newFsrsState2,
      now + 86400000 * 15,
      [],
      3.0, 4.8, 7, 3
    );

    expect(result2).toBe(true);

    // Verify second log was added
    const allLogs = await service.getReviewLogsForRecord(recordId);
    expect(allLogs.length).toBe(2);
    expect(allLogs[0].rating).toBe('good');
    expect(allLogs[1].rating).toBe('easy');

    // Verify record stats
    const finalRecord = await service.getMemorizedRecord('joh', 3, 16, 'lsg');
    expect(finalRecord?.reviewCount).toBe(3);
    expect(finalRecord?.fsrsState?.stability).toBeGreaterThanOrEqual(4.5);

    // Step 4: Verify global logs retrieval
    const allServiceLogs = await service.getAllReviewLogs();
    expect(allServiceLogs.length).toBe(2);
    expect(allServiceLogs.some(l => l.memorizationRecordId === recordId)).toBe(true);

    // Step 5: Verify streak and milestones would be updated in ProgressService
    // (This would be tested with actual ProgressService instance)
  });

  it('should handle multiple records independently', async () => {
    // Create two different records
    const recordId1 = 'record-1';
    const recordId2 = 'record-2';

    const now = Date.now();

    await service.saveMemorizedRecord({
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
    });

    await service.saveMemorizedRecord({
      id: recordId2,
      bookId: 'exo',
      chapterNumber: 1,
      verseNumber: 1,
      translationId: 'lsg',
      bibleVerseReference: 'Exode 1:1',
      bibleVerseText: 'Voici les noms des fils d\'Israël... ',
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
    });

    // Perform review on first record
    await service.updateRecordAfterReview(
      recordId1,
      Rating.GOOD,
      { stability: 2.5, difficulty: 4.8, recallProbability: 0.75, lastInterval: 1, nextInterval: 3, elapsedDays: 1, repetitions: 1, requestedRetention: 0.9 },
      now + 3 * 86400000,
      [],
      2.0, 5.0, 1, 0
    );

    // Perform review on second record
    await service.updateRecordAfterReview(
      recordId2,
      Rating.HARD,
      { stability: 1.2, difficulty: 5.8, recallProbability: 0.55, lastInterval: 0, nextInterval: 1, elapsedDays: 1, repetitions: 1, requestedRetention: 0.9 },
      now + 86400000,
      [],
      1.0, 6.0, 1, 0
    );

    // Verify each record has its own logs
    const logs1 = await service.getReviewLogsForRecord(recordId1);
    const logs2 = await service.getReviewLogsForRecord(recordId2);

    expect(logs1.length).toBe(1);
    expect(logs2.length).toBe(1);
    expect(logs1[0].rating).toBe('good');
    expect(logs2[0].rating).toBe('hard');

    // Verify global logs contain both
    const allLogs = await service.getAllReviewLogs();
    expect(allLogs.length).toBe(2);
  });
});
