import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudMemorizationService } from '@/sync/CloudMemorizationService';
import { Sm2FallbackEngine } from '@/domains/fsrs';
import { Rating } from '@/domains/fsrs';

// Shared mock implementations for storage methods
const sharedStorageMocks = {
  set: vi.fn(() => Promise.resolve()),
  get: vi.fn(() => Promise.resolve(null)),
  getAllKeys: vi.fn(() => Promise.resolve([])),
  clear: vi.fn(() => Promise.resolve()),
};

// Mock the storage module
vi.mock('@/infrastructure/storage', () => ({
  MmkvStorage: vi.fn().mockImplementation(() => ({
    ...sharedStorageMocks,
  })),
}));

// Shared mock implementations for sync service methods
const sharedSyncMocks = {
  syncRecordsToCloud: vi.fn(() => Promise.resolve()),
  syncLogsToCloud: vi.fn(() => Promise.resolve()),
  autoSyncEnabled: true,
  connected: true,
  sync: vi.fn(() => Promise.resolve()),
  getStatus: vi.fn(() => ({
    autoSyncEnabled: true,
    connected: true,
    lastSyncAt: null,
    pendingOperations: 0,
  })),
  setAutoSync: vi.fn(),
};

// Mock the sync module
vi.mock('@/sync/PowerSyncSyncService', () => ({
  PowerSyncSyncService: vi.fn().mockImplementation(() => ({
    ...sharedSyncMocks,
  })),
}));

// Also mock CloudSyncService for backward compatibility
vi.mock('@/sync/CloudSyncService', () => ({
  CloudSyncService: vi.fn().mockImplementation(() => ({
    ...sharedSyncMocks,
  })),
}));

describe('CloudMemorizationService', () => {
  let fsrsEngine: Sm2FallbackEngine;
  let service: CloudMemorizationService;

  beforeEach(() => {
    fsrsEngine = new Sm2FallbackEngine();
    // Reset shared mock state to defaults
    sharedSyncMocks.autoSyncEnabled = true;
    sharedSyncMocks.connected = true;
    service = new CloudMemorizationService(
      { set: sharedStorageMocks.set, get: sharedStorageMocks.get, getAllKeys: sharedStorageMocks.getAllKeys, clear: sharedStorageMocks.clear } as any,
      sharedSyncMocks as any,
      fsrsEngine
    );
    vi.clearAllMocks();
  });

  const createTestRecord = (overrides: any = {}) => {
    const now = Date.now();
    return {
      bookId: 'joh',
      chapterNumber: 3,
      verseNumber: 16,
      translationId: 'lsg',
      bibleVerseReference: 'Jean 3:16',
      bibleVerseText: 'Car Dieu a tellement aimé le monde...',
      status: 'in-progress',
      fsrsState: { stability: 2.5, difficulty: 5, recallProbability: 0.75, lastInterval: 0, nextInterval: 1, elapsedDays: 0, repetitions: 0, requestedRetention: 0.9 },
      nextReviewAt: now + 86400000,
      createdAt: now,
      lastReviewedAt: null,
      reviewCount: 0,
      totalReviewMinutes: 0,
      wordPerformance: [],
      favorite: false,
      tags: [],
      ...overrides,
    };
  };

  const createTestLogEntry = () => {
    return {
      memorizationRecordId: 'joh:3:16:lsg',
      rating: Rating.GOOD,
      answeredAt: Date.now(),
      timeSpent: 30,
      notes: 'Test note',
    };
  };

  describe('saveMemorizedRecord', () => {
    it('should save a memorized record to local storage', async () => {
      // Arrange
      const record = createTestRecord();
      (sharedStorageMocks.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Act
      await service.saveMemorizedRecord(record);

      // Assert
      expect(sharedStorageMocks.set).toHaveBeenCalledWith(
        expect.stringContaining('versyflow:record:joh:3:16:lsg'),
        expect.any(String)
      );
    });

    it('should trigger cloud sync when autoSync is enabled and connected', async () => {
      // Arrange
      const record = createTestRecord();
      (sharedStorageMocks.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Act
      await service.saveMemorizedRecord(record);

      // Assert
      expect(sharedSyncMocks.syncRecordsToCloud).toHaveBeenCalled();
    });

    it('should not trigger cloud sync when autoSync is disabled', async () => {
      // Arrange
      sharedSyncMocks.autoSyncEnabled = false;
      const record = createTestRecord();
      (sharedStorageMocks.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Act
      await service.saveMemorizedRecord(record);

      // Assert
      expect(sharedSyncMocks.syncRecordsToCloud).not.toHaveBeenCalled();
    });

    it('should not trigger sync when not connected', async () => {
      // Arrange
      sharedSyncMocks.connected = false;
      const record = createTestRecord();
      (sharedStorageMocks.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Act
      await service.saveMemorizedRecord(record);

      // Assert
      expect(sharedSyncMocks.syncRecordsToCloud).not.toHaveBeenCalled();
    });
  });

  describe('getMemorizedRecord', () => {
    it('should retrieve a memorized record from local storage', async () => {
      // Arrange
      const record = createTestRecord();
      const recordId = `${record.bookId}:${record.chapterNumber}:${record.verseNumber}:${record.translationId}`;
      (sharedStorageMocks.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(JSON.stringify({ ...record, id: recordId, updatedAt: Date.now() }));

      // Act
      const result = await service.getMemorizedRecord('joh', 3, 16, 'lsg');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.bibleVerseReference).toBe('Jean 3:16');
      expect(sharedStorageMocks.get).toHaveBeenCalledWith('versyflow:record:' + recordId);
    });

    it('should return null when record does not exist', async () => {
      // Arrange
      (sharedStorageMocks.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      // Act
      const result = await service.getMemorizedRecord('nonexistent', 1, 1, 'test');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getDueRecords', () => {
    it('should return records due for review', async () => {
      // Arrange
      const now = Date.now();
      const dueRecord = createTestRecord({ nextReviewAt: now - 1000, status: 'in-progress' });
      const futureRecord = createTestRecord({ nextReviewAt: now + 86400000, status: 'in-progress' });
      const masteredRecord = createTestRecord({ nextReviewAt: now - 1000, status: 'mastered' });

      (sharedStorageMocks.getAllKeys as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        'versyflow:record:joh:3:16:lsg',
        'versyflow:record:joh:3:17:lsg',
        'versyflow:record:joh:3:18:lsg',
      ]);
      (sharedStorageMocks.get as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(JSON.stringify({ ...dueRecord, id: 'joh:3:16:lsg', updatedAt: now }))
        .mockResolvedValueOnce(JSON.stringify({ ...futureRecord, id: 'joh:3:17:lsg', updatedAt: now }))
        .mockResolvedValueOnce(JSON.stringify({ ...masteredRecord, id: 'joh:3:18:lsg', updatedAt: now }));

      // Act
      const result = await service.getDueRecords();

      // Assert
      expect(result.length).toBe(1);
      expect(result[0]?.bibleVerseReference).toBe('Jean 3:16');
    });

    it('should return empty array when no records due', async () => {
      // Arrange
      (sharedStorageMocks.getAllKeys as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      // Act
      const result = await service.getDueRecords();

      // Assert
      expect(result.length).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      (sharedStorageMocks.getAllKeys as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Test error'));

      // Act
      const result = await service.getDueRecords();

      // Assert
      expect(result.length).toBe(0);
    });
  });

  describe('updateRecordAfterReview', () => {
    it('should update record successfully', async () => {
      // Arrange
      const recordId = 'joh:3:16:lsg';
      const now = Date.now();
      const existingRecord = createTestRecord({
        nextReviewAt: now,
        lastReviewedAt: null,
        reviewCount: 0,
        fsrsState: { stability: 2.5, difficulty: 5, recallProbability: 0.75, lastInterval: 0, nextInterval: 1, elapsedDays: 0, repetitions: 0, requestedRetention: 0.9 },
      });

      (sharedStorageMocks.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(JSON.stringify({ ...existingRecord, id: recordId, updatedAt: now }));
      (sharedStorageMocks.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const newFsrsState = { stability: 3.0, difficulty: 4.8, recallProbability: 0.8, lastInterval: 1, nextInterval: 7, elapsedDays: 2, repetitions: 1, requestedRetention: 0.9 };

      // Act
      const success = await service.updateRecordAfterReview(
        recordId,
        Rating.GOOD,
        newFsrsState,
        now + 86400000 * 7,
        [],
        2.5,
        5,
        3,
        1,
      );

      // Assert
      expect(success).toBe(true);
      expect(sharedStorageMocks.set).toHaveBeenCalledWith(
        'versyflow:record:' + recordId,
        expect.any(String)
      );
    });

    it('should return false when record does not exist', async () => {
      // Arrange
      (sharedStorageMocks.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      // Act
      const success = await service.updateRecordAfterReview(
        'nonexistent',
        Rating.GOOD,
        { stability: 3.0, difficulty: 4.8, recallProbability: 0.8, lastInterval: 1, nextInterval: 7, elapsedDays: 2, repetitions: 1, requestedRetention: 0.9 },
        Date.now(),
        []
      );

      // Assert
      expect(success).toBe(false);
    });

    it('should save review log entry during update', async () => {
      // Arrange
      const recordId = 'joh:3:16:lsg';
      const now = Date.now();
      const existingRecord = createTestRecord({ nextReviewAt: now });
      (sharedStorageMocks.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(JSON.stringify({ ...existingRecord, id: recordId, updatedAt: now }));
      (sharedStorageMocks.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const newFsrsState = { stability: 3.0, difficulty: 4.8, recallProbability: 0.8, lastInterval: 1, nextInterval: 7, elapsedDays: 2, repetitions: 1, requestedRetention: 0.9 };

      // Act
      await service.updateRecordAfterReview(
        recordId,
        Rating.GOOD,
        newFsrsState,
        now + 86400000 * 7,
        [],
        2.5,
        5,
        3,
        1,
      );

      // Assert - Review log stored with specific key pattern
      expect(sharedStorageMocks.set).toHaveBeenCalledWith(
        expect.stringContaining('versyflow:reviewlog:' + recordId + ':'),
        expect.any(String)
      );
      expect(sharedStorageMocks.set).toHaveBeenCalledWith('versyflow:reviewlogs:' + recordId, expect.any(String));
    });
  });

  describe('saveReviewLog', () => {
    it('should save a review log entry', async () => {
      // Arrange
      const logEntry = createTestLogEntry();
      (sharedStorageMocks.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Act
      await service.saveReviewLog(logEntry);

      // Assert
      expect(sharedStorageMocks.set).toHaveBeenCalledWith(
        expect.stringContaining('versyflow:reviewlog:' + logEntry.memorizationRecordId + ':'),
        expect.any(String)
      );
      expect(sharedStorageMocks.set).toHaveBeenCalledWith('versyflow:reviewlogs:' + logEntry.memorizationRecordId, expect.any(String));
    });

    it('should trigger cloud sync for logs', async () => {
      // Arrange
      const logEntry = createTestLogEntry();
      (sharedStorageMocks.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Act
      await service.saveReviewLog(logEntry);

      // Assert
      expect(sharedSyncMocks.syncLogsToCloud).toHaveBeenCalled();
    });

    it('should not trigger cloud sync when autoSync disabled', async () => {
      // Arrange
      sharedSyncMocks.autoSyncEnabled = false;
      sharedSyncMocks.connected = true;
      const logEntry = createTestLogEntry();
      (sharedStorageMocks.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Act
      await service.saveReviewLog(logEntry);

      // Assert
      expect(sharedSyncMocks.syncLogsToCloud).not.toHaveBeenCalled();
    });
  });

  describe('getAllMemorized', () => {
    it('should retrieve all memorized records', async () => {
      // Arrange
      const now = Date.now();
      const record1 = createTestRecord({ bibleVerseReference: 'Jean 3:16' });
      const record2 = createTestRecord({ bibleVerseReference: 'Jean 3:17' });

      (sharedStorageMocks.getAllKeys as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        'versyflow:record:joh:3:16:lsg',
        'versyflow:record:joh:3:17:lsg',
      ]);
      (sharedStorageMocks.get as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(JSON.stringify({ ...record1, id: 'joh:3:16:lsg', updatedAt: now }))
        .mockResolvedValueOnce(JSON.stringify({ ...record2, id: 'joh:3:17:lsg', updatedAt: now }));

      // Act
      const result = await service.getAllMemorized();

      // Assert
      expect(result.length).toBe(2);
      expect(result[0]?.bibleVerseReference).toBe('Jean 3:16');
    });

    it('should return empty array when no records', async () => {
      // Arrange
      (sharedStorageMocks.getAllKeys as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      // Act
      const result = await service.getAllMemorized();

      // Assert
      expect(result.length).toBe(0);
    });
  });

  describe('memorizeVerse', () => {
    it('should complete memorization flow successfully', async () => {
      // Arrange
      const newFsrsStateReview = {
        stability: 2.5,
        difficulty: 5,
        recallProbability: 0.75,
        lastInterval: 0,
        nextInterval: 1,
        elapsedDays: 0,
        repetitions: 1,
        requestedRetention: 0.9,
      };

      // Mock fsrsEngine methods
      (fsrsEngine as any).newState = vi.fn().mockResolvedValue({ ...newFsrsStateReview });
      (fsrsEngine as any).review = vi.fn().mockResolvedValue({
        state: newFsrsStateReview,
        due: new Date(),
        stability: 2.5,
        scheduledDays: 1,
        recurring: true,
      });

      (sharedStorageMocks.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Act
      const result = await service.memorizeVerse({
        bookId: 'joh',
        chapterNumber: 3,
        verseNumber: 16,
        translationId: 'lsg',
        verseText: 'Test verse',
        referenceDisplay: 'Test 3:16',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.rating).toBe(Rating.GOOD);
      expect(result.nextReviewAt).toBeGreaterThan(0);
    });

    it('should handle memorization failure', async () => {
      // Arrange
      (fsrsEngine as any).review = vi.fn().mockRejectedValueOnce(new Error('FSRS error'));
      (sharedStorageMocks.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Act
      const result = await service.memorizeVerse({
        bookId: 'joh',
        chapterNumber: 3,
        verseNumber: 16,
        translationId: 'lsg',
        verseText: 'Test verse',
        referenceDisplay: 'Test 3:16',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.rating).toBe(Rating.AGAIN);
    });
  });

  describe('sync management', () => {
    it('should trigger manual sync', async () => {
      // Act
      await service.triggerSync();

      // Assert
      expect(sharedSyncMocks.sync).toHaveBeenCalled();
    });

    it('should return sync status', () => {
      // Arrange
      (sharedSyncMocks.getStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        autoSyncEnabled: true,
        connected: true,
        lastSyncAt: null,
        pendingOperations: 0,
      });

      // Act
      const status = service.getSyncStatus();

      // Assert
      expect(status.autoSyncEnabled).toBe(true);
      expect(status.connected).toBe(true);
      expect(status.pendingOperations).toBe(0);
    });

    it('should enable/disable auto-sync', () => {
      // Act
      service.setAutoSync(false);

      // Assert
      expect(sharedSyncMocks.setAutoSync).toHaveBeenCalledWith(false);
    });
  });
});
