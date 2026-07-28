/**
 * Tests pour MemorizationService
 * Vérifie la persistance des records de méméorisation
 */

import { MemorizationService } from '@/domains/memorization/service';
import { MmkvStorage } from '@/infrastructure/storage';
import { Sm2FallbackEngine } from '@/domains/fsrs';
import { MemorizationRecord } from '@/domains/memorization/entities';

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
      fsrsState: { stability: 2.5, repetitions: 1, recallProbability: 0.75 },
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
      { bookId: 'gen', chapterNumber: 1, verseNumber: 1, translationId: 'lsg', bibleVerseReference: 'Genèse 1:1', bibleVerseText: 'Au commencement...', status: 'in-progress', fsrsState: { stability: 2, repetitions: 0, recallProbability: 0.6 }, nextReviewAt: Date.now() + 1000, createdAt: Date.now(), lastReviewedAt: null, reviewCount: 0, totalReviewMinutes: 0, wordPerformance: [] },
      { bookId: 'exo', chapterNumber: 2, verseNumber: 1, translationId: 'lsg', bibleVerseReference: 'Exode 2:1', bibleVerseText: 'Et il arriva...', status: 'new', fsrsState: { stability: 1.5, repetitions: 0, recallProbability: 0.5 }, nextReviewAt: Date.now() + 2000, createdAt: Date.now(), lastReviewedAt: null, reviewCount: 0, totalReviewMinutes: 0, wordPerformance: [] },
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
});
