/**
 * CloudMemorizationService — Offline-first memorization with cloud sync
 *
 * Wraps MemorizationStorageAdapter with cloud synchronization via CloudSyncService.
 * Non-profile-scoped (key prefix: 'versyflow:') — uses single-user model.
 */

import { MemorizationStorageAdapter } from '@/domains/memorization/storage-adapter';
import { fsrsRatingToString } from '@/domains/memorization/entities';
import { CloudSyncService } from './CloudSyncService';
import {
  MemorizationRecord,
  ReviewLogEntry,
  WordPerformance,
} from '@/domains/memorization/entities';
import { IFsrsEngine, Rating } from '@/domains/fsrs';
import { IStorage } from '@/infrastructure/storage/storage-types';
import { MmkvStorage } from '@/infrastructure/storage';

export class CloudMemorizationService {
  private storageAdapter: MemorizationStorageAdapter;
  private syncService: CloudSyncService;
  private fsrsEngine: IFsrsEngine;

  constructor(
    storage: IStorage,
    syncService: CloudSyncService,
    fsrsEngine: IFsrsEngine,
  ) {
    this.storageAdapter = new MemorizationStorageAdapter(storage, 'versyflow:');
    this.syncService = syncService;
    this.fsrsEngine = fsrsEngine;
  }

  async saveMemorizedRecord(record: Omit<MemorizationRecord, 'id'>): Promise<void> {
    const recordId = `${record.bookId}:${record.chapterNumber}:${record.verseNumber}:${record.translationId}`;
    const fullRecord: MemorizationRecord = { id: recordId, ...record, updatedAt: Date.now() };
    await this.storageAdapter.saveRecord(fullRecord);
    if (this.syncService.autoSyncEnabled && this.syncService.connected) {
      await this.syncService.syncRecordsToCloud();
    }
  }

  async getReviewLogsForRecord(recordId: string): Promise<ReviewLogEntry[]> {
    return this.storageAdapter.getReviewLogs(recordId);
  }

  async getAllReviewLogs(): Promise<ReviewLogEntry[]> {
    return this.storageAdapter.getAllReviewLogs();
  }

  async updateRecordAfterReview(
    recordId: string,
    rating: Rating,
    newFsrsState: any,
    newNextReviewAt: number,
    wordPerformance?: WordPerformance[],
    stabilityBefore?: number,
    difficultyBefore?: number,
    predictedInterval?: number,
    actualInterval?: number | null,
  ): Promise<boolean> {
    try {
      const record = await this.storageAdapter.getRecord(recordId);
      if (!record) return false;

      const stabilityBeforeValue = stabilityBefore ?? record.fsrsState.stability;
      const difficultyBeforeValue = difficultyBefore ?? record.fsrsState.difficulty;
      const actualIntervalValue = actualInterval !== undefined ? actualInterval : (record.fsrsState.lastInterval ?? null);
      const predictedIntervalValue = predictedInterval !== undefined ? predictedInterval : record.fsrsState.nextInterval ?? 0;

      record.fsrsState = newFsrsState;
      record.nextReviewAt = newNextReviewAt;
      record.lastReviewedAt = Date.now();
      record.reviewCount = (record.reviewCount || 0) + 1;
      if (wordPerformance) record.wordPerformance = wordPerformance;

      await this.storageAdapter.saveRecord(record);

      const reviewLog: Omit<ReviewLogEntry, 'id'> = {
        memorizationRecordId: recordId,
        answeredAt: Date.now(),
        rating: fsrsRatingToString(rating),
        actualInterval: actualIntervalValue,
        predictedInterval: predictedIntervalValue,
        stabilityBefore: stabilityBeforeValue,
        stabilityAfter: newFsrsState.stability,
        difficultyBefore: difficultyBeforeValue,
        difficultyAfter: newFsrsState.difficulty,
        wordPerformance: (wordPerformance as any) || [],
      };
      await this.storageAdapter.saveReviewLog({ id: crypto.randomUUID(), ...reviewLog });

      if (this.syncService.autoSyncEnabled && this.syncService.connected) {
        await this.syncService.syncLogsToCloud();
      }
      return true;
    } catch (error) {
      console.error('[CloudMemorizationService] updateRecordAfterReview failed:', error);
      return false;
    }
  }

  async getMemorizedRecord(bookId: string, chapter: number, verse: number, translationId: string): Promise<MemorizationRecord | null> {
    const recordId = `${bookId}:${chapter}:${verse}:${translationId}`;
    return this.storageAdapter.getRecord(recordId);
  }

  async getAllMemorized(): Promise<MemorizationRecord[]> {
    return this.storageAdapter.getAllRecords();
  }

  async getDueRecords(): Promise<MemorizationRecord[]> {
    return this.storageAdapter.getDueRecords();
  }

  async saveReviewLog(logEntry: Omit<ReviewLogEntry, 'id'>): Promise<void> {
    await this.storageAdapter.saveReviewLog({ id: crypto.randomUUID(), ...logEntry });
    if (this.syncService.autoSyncEnabled && this.syncService.connected) {
      await this.syncService.syncLogsToCloud();
    }
  }

  async memorizeVerse(params: {
    bookId: string;
    chapterNumber: number;
    verseNumber: number;
    translationId: string;
    verseText: string;
    referenceDisplay: string;
  }): Promise<{ success: boolean; rating: Rating; nextReviewAt: number }> {
    try {
      const newFsrsState = await this.fsrsEngine.newState(0);
      const review = await this.fsrsEngine.review(newFsrsState, Rating.GOOD);

      await this.saveMemorizedRecord({
        bookId: params.bookId,
        chapterNumber: params.chapterNumber,
        verseNumber: params.verseNumber,
        translationId: params.translationId,
        bibleVerseReference: params.referenceDisplay,
        bibleVerseText: params.verseText,
        status: 'mastered',
        fsrsState: review.state,
        nextReviewAt: review.due.getTime(),
        createdAt: Date.now(),
        lastReviewedAt: null,
        reviewCount: 0,
        totalReviewMinutes: 0,
        wordPerformance: [],
        favorite: false,
        tags: [],
      });

      return { success: true, rating: Rating.GOOD, nextReviewAt: review.due.getTime() };
    } catch (error) {
      console.error('[CloudMemorizationService] memorizeVerse failed:', error);
      return { success: false, rating: Rating.AGAIN, nextReviewAt: Date.now() };
    }
  }

  async triggerSync(): Promise<void> {
    await this.syncService.sync();
  }

  getSyncStatus() {
    return this.syncService.getStatus();
  }

  setAutoSync(enabled: boolean): void {
    this.syncService.setAutoSync(enabled);
  }
}
