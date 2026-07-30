/**
 * Tests pour MemorizationService
 * Vérifie la persistance des records de méméorisation et des logs de révision
 */

import { MemorizationService } from '@/domains/memorization/service';
import { MmkvStorage } from '@/infrastructure/storage';
import { Sm2FallbackEngine } from '@/domains/fsrs';
import { MemorizationRecord, ReviewLogEntry } from '@/domains/memorization/entities';
import { FsrsState, Rating as FsrsRating } from '@/domains/fsrs';

describe('MemorizationPersistence', () => {
  let service: MemorizationService;
  let storage: MmkvStorage;
  let fsrsEngine: Sm2FallbackEngine;

  beforeEach(() => {
    storage = new MmkvStorage();
    fsrsEngine = new Sm2FallbackEngine();
    service = new MemorizationService(storage, fsrsEngine);
  });

  afterEach(async () => {
    // Nettoyage entre les tests
    await storage.clear();
  });

  it('should save and retrieve a memorized record', async () => {
    // Arrange
    const recordId = 'joh:3:16:lsg';
    const recordToSave: Omit<MemorizationRecord, 'id'> = {
      bookId: 'joh',
      chapterNumber: 3,
      verseNumber: 16,
      translationId: 'lsg',
      bibleVerseReference: 'Jean 3:16',
      bibleVerseText: 'Car Dieu a tellement aimé le monde...',
      status: 'in-progress',
      fsrsState: { stability: 2.5, repetitions: 1, recallProbability: 0.75, difficulty: 5, lastInterval: 0, nextInterval: 1, elapsedDays: 0, requestedRetention: 0.9 },
      nextReviewAt: Date.now() + 86400000,
      createdAt: Date.now(),
      lastReviewedAt: null,
      reviewCount: 0,
      totalReviewMinutes: 0,
      wordPerformance: [],
    };

    // Act - Sauvegarder le record
    await service.saveMemorizedRecord(recordToSave);

    // Assert - Récupérer le record
    const loaded = await service.getMemorizedRecord('joh', 3, 16, 'lsg');
    expect(loaded).not.toBeNull();
    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe(recordId);
    expect(loaded?.bibleVerseReference).toBe('Jean 3:16');
    expect(loaded?.status).toBe('in-progress');
  });

  it('should return null when record does not exist', async () => {
    // Act & Assert
    const result = await service.getMemorizedRecord('nonexistent', 1, 1, 'test');
    expect(result).toBeNull();
  });

  it('should retrieve all memorized records', async () => {
    // Arrange - Créer plusieurs records
    const records: Omit<MemorizationRecord, 'id'>[] = [
      { bookId: 'gen', chapterNumber: 1, verseNumber: 1, translationId: 'lsg', bibleVerseReference: 'Genèse 1:1', bibleVerseText: 'Au commencement...', status: 'in-progress', fsrsState: { stability: 2, repetitions: 0, recallProbability: 0.6, difficulty: 5, lastInterval: 0, nextInterval: 1, elapsedDays: 0, requestedRetention: 0.9 }, nextReviewAt: Date.now() + 1000, createdAt: Date.now(), lastReviewedAt: null, reviewCount: 0, totalReviewMinutes: 0, wordPerformance: [] },
      { bookId: 'exo', chapterNumber: 2, verseNumber: 1, translationId: 'lsg', bibleVerseReference: 'Exode 2:1', bibleVerseText: 'Et il arriva...', status: 'new', fsrsState: { stability: 1.5, repetitions: 0, recallProbability: 0.5, difficulty: 5, lastInterval: 0, nextInterval: 1, elapsedDays: 0, requestedRetention: 0.9 }, nextReviewAt: Date.now() + 2000, createdAt: Date.now(), lastReviewedAt: null, reviewCount: 0, totalReviewMinutes: 0, wordPerformance: [] },
    ];

    for (const rec of records) {
      const recordId = `${rec.bookId}:${rec.chapterNumber}:${rec.verseNumber}:${rec.translationId}`;
      await service.saveMemorizedRecord({ ...rec, id: recordId });
    }

    // Act
    const allRecords = await service.getAllMemorized();

    // Assert
    expect(allRecords.length).toBe(2);
    expect(allRecords[0].bibleVerseReference).toContain('Genèse');
    expect(allRecords[1].bibleVerseReference).toContain('Exode');
  });

  // ====================
  // Review Log Persistence Tests
  // ====================

  it('should save a review log entry', async () => {
    // Arrange
    const recordId = 'joh:3:16:lsg';
    const now = Date.now();
    const testLog: Omit<ReviewLogEntry, 'id'> = {
      memorizationRecordId: recordId,
      answeredAt: now,
      rating: 'good',
      actualInterval: 1,
      predictedInterval: 3,
      stabilityBefore: 2.5,
      stabilityAfter: 3.0,
      difficultyBefore: 5,
      difficultyAfter: 4.8,
      wordPerformance: [],
    };

    // Act
    await service.saveReviewLog(testLog);

    // Assert
    const logs = await service.getReviewLogsForRecord(recordId);
    expect(logs.length).toBe(1);
    expect(logs[0]).toHaveProperty('id');
    expect(logs[0]).toHaveProperty('memorizationRecordId', recordId);
    expect(logs[0]).toHaveProperty('answeredAt', now);
    expect(logs[0]).toHaveProperty('rating', 'good');
    expect(logs[0]).toHaveProperty('actualInterval', 1);
    expect(logs[0]).toHaveProperty('predictedInterval', 3);
    expect(logs[0]).toHaveProperty('stabilityBefore', 2.5);
    expect(logs[0]).toHaveProperty('stabilityAfter', 3.0);
  });

  it('should retrieve all review logs for a record', async () => {
    // Arrange
    const recordId = 'joh:3:16:lsg';
    const now = Date.now();
    const logs: Omit<ReviewLogEntry, 'id'>[] = [
      {
        memorizationRecordId: recordId,
        answeredAt: now,
        rating: 'again',
        actualInterval: null,
        predictedInterval: 1,
        stabilityBefore: 2.5,
        stabilityAfter: 1.0,
        difficultyBefore: 5,
        difficultyAfter: 5,
        wordPerformance: [],
      },
      {
        memorizationRecordId: recordId,
        answeredAt: now + 1000,
        rating: 'good',
        actualInterval: 1,
        predictedInterval: 3,
        stabilityBefore: 1.0,
        stabilityAfter: 1.5,
        difficultyBefore: 5,
        difficultyAfter: 4.8,
        wordPerformance: [],
      },
    ];

    // Act - Sauvegarder les logs
    for (const log of logs) {
      await service.saveReviewLog(log);
    }

    // Assert
    const retrievedLogs = await service.getReviewLogsForRecord(recordId);
    expect(retrievedLogs.length).toBe(2);
    expect(retrievedLogs[0].rating).toBe('again');
    expect(retrievedLogs[1].rating).toBe('good');
  });

  it('should save review log when updating record after review', async () => {
    // Arrange
    const recordId = 'joh:3:16:lsg';
    const now = Date.now();

    // Créer un record initial
    const initialRecord: Omit<MemorizationRecord, 'id'> = {
      bookId: 'joh',
      chapterNumber: 3,
      verseNumber: 16,
      translationId: 'lsg',
      bibleVerseReference: 'Jean 3:16',
      bibleVerseText: 'Car Dieu a tellement aimé le monde...',
      status: 'in-progress',
      fsrsState: { stability: 2.5, repetitions: 1, recallProbability: 0.75, difficulty: 5, lastInterval: 1, nextInterval: 3, elapsedDays: 1, requestedRetention: 0.9 },
      nextReviewAt: now,
      createdAt: now - 86400000,
      lastReviewedAt: null,
      reviewCount: 1,
      totalReviewMinutes: 5,
      wordPerformance: [],
    };

    await service.saveMemorizedRecord({ ...initialRecord, id: recordId });

    // Act - Effectuer une révision (met à jour le record ET enregistre le log)
    const newFsrsState: FsrsState = {
      stability: 3.0,
      repetitions: 2,
      recallProbability: 0.8,
      difficulty: 4.8,
      lastInterval: 3,
      nextInterval: 7,
      elapsedDays: 2,
      requestedRetention: 0.9,
    };

    const success = await service.updateRecordAfterReview(
      recordId,
      FsrsRating.GOOD,
      newFsrsState,
      now + 86400000 * 7,
      [],
      2.5, // stabilityBefore
      5,   // difficultyBefore
      3,   // predictedInterval
      1,   // actualInterval
    );

    // Assert
    expect(success).toBe(true);
    const logs = await service.getReviewLogsForRecord(recordId);
    expect(logs.length).toBe(1);
    expect(logs[0].rating).toBe('good');
    expect(logs[0].actualInterval).toBe(1);
    expect(logs[0].predictedInterval).toBe(3);
    expect(logs[0].stabilityBefore).toBe(2.5);
    expect(logs[0].stabilityAfter).toBe(3.0);
    expect(logs[0].difficultyBefore).toBe(5);
    expect(logs[0].difficultyAfter).toBe(4.8);
  });

  it('should retrieve all review logs across records', async () => {
    // Arrange
    const recordId1 = 'joh:3:16:lsg';
    const recordId2 = 'joh:3:17:lsg';
    const now = Date.now();

    // Enregistrer un log pour chaque record
    await service.saveReviewLog({
      memorizationRecordId: recordId1,
      answeredAt: now,
      rating: 'good',
      actualInterval: 1,
      predictedInterval: 3,
      stabilityBefore: 2.5,
      stabilityAfter: 3.0,
      difficultyBefore: 5,
      difficultyAfter: 4.8,
      wordPerformance: [],
    });

    await service.saveReviewLog({
      memorizationRecordId: recordId2,
      answeredAt: now + 1000,
      rating: 'easy',
      actualInterval: 3,
      predictedInterval: 7,
      stabilityBefore: 3.0,
      stabilityAfter: 4.5,
      difficultyBefore: 4.8,
      difficultyAfter: 4.5,
      wordPerformance: [],
    });

    // Act
    const allLogs = await service.getAllReviewLogs();

    // Assert
    expect(allLogs.length).toBe(2);
    expect(allLogs[0].memorizationRecordId).toBe(recordId1);
    expect(allLogs[1].memorizationRecordId).toBe(recordId2);
  });
});
