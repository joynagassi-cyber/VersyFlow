/**
 * CloudMemorizationService — Offline-first memorization with cloud sync
 *
 * Maintains compatibility with MemorizationService interface while adding
 * cloud synchronization via CloudSyncService. Uses MmkvStorage as primary
 * (offline-first) storage.
 */

import { MmkvStorage } from '@/infrastructure/storage';
import { CloudSyncService } from './CloudSyncService';
import {
  MemorizationRecord,
  ReviewLogEntry,
  WordPerformance,
} from '@/domains/memorization/entities';
import { IFsrsEngine, Rating } from '@/domains/fsrs';

export class CloudMemorizationService {
  private storage: MmkvStorage;
  private syncService: CloudSyncService;
  private fsrsEngine: IFsrsEngine;

  constructor(syncEnabled = true, fsrsEngine: IFsrsEngine) {
    this.storage = new MmkvStorage();
    this.syncService = new CloudSyncService(syncEnabled);
    this.fsrsEngine = fsrsEngine;
  }

  /**
   * Save a memorized record to local storage, then sync to cloud if enabled
   */
  async saveMemorizedRecord(record: Omit<MemorizationRecord, 'id'>): Promise<void> {
    const recordId = `${record.bookId}:${record.chapterNumber}:${record.verseNumber}:${record.translationId}`;
    const fullRecord: MemorizationRecord = { id: recordId, ...record, updatedAt: Date.now() };

    // Save locally first (offline-first)
    await this.storage.set('versyflow:record:' + recordId, JSON.stringify(fullRecord));

    // Sync to cloud if enabled and connected
    if (this.syncService.autoSync && this.syncService.isConnected) {
      await this.syncService.syncRecordsToCloud();
    }
  }

  /**
   * Get review logs for a record from local storage
   */
  async getReviewLogsForRecord(recordId: string): Promise<ReviewLogEntry[]> {
    const arrayKey = `versyflow:reviewlogs:${recordId}`;
    const logsStr = await this.storage.get(arrayKey);
    if (logsStr) {
      return JSON.parse(logsStr) as ReviewLogEntry[];
    }
    return [];
  }

  /**
   * Get all review logs from local storage (can be merged with cloud data if needed)
   */
  async getAllReviewLogs(): Promise<ReviewLogEntry[]> {
    const allKeys = await this.storage.getAllKeys();
    const logKeys = allKeys.filter(key => key.startsWith('versyflow:reviewlog:'));

    const logs: ReviewLogEntry[] = [];
    for (const key of logKeys) {
      const str = await this.storage.get(key);
      if (str) logs.push(JSON.parse(str) as ReviewLogEntry);
    }

    // Sort by timestamp (answeredAt) descending
    return logs.sort((a, b) => b.answeredAt - a.answeredAt);
  }

  /**
   * Update a record after a review (FSRS state update) AND save review log
   * then sync review log to cloud
   */
  async updateRecordAfterReview(
    recordId: string,
    rating: Rating,
    newFsrsState: any, // FsrsState
    newNextReviewAt: number,
    wordPerformance?: WordPerformance[],
    stabilityBefore?: number,
    difficultyBefore?: number,
    predictedInterval?: number,
    actualInterval?: number | null,
  ): Promise<boolean> {
    try {
      const recordStr = await this.storage.get('versyflow:record:' + recordId);
      if (!recordStr) return false;

      const record = JSON.parse(recordStr) as MemorizationRecord;

      // Capture state before update
      const stabilityBeforeValue = stabilityBefore ?? record.fsrsState.stability;
      const difficultyBeforeValue = difficultyBefore ?? record.fsrsState.difficulty;
      const actualIntervalValue = actualInterval !== undefined ? actualInterval : (record.fsrsState.lastInterval ?? null);
      const predictedIntervalValue = predictedInterval !== undefined ? predictedInterval : record.fsrsState.nextInterval ?? 0;

      record.fsrsState = newFsrsState;
      record.nextReviewAt = newNextReviewAt;
      record.lastReviewedAt = Date.now();
      record.reviewCount = (record.reviewCount || 0) + 1;
      if (wordPerformance) record.wordPerformance = wordPerformance;

      await this.storage.set(
        'versyflow:record:' + recordId,
        JSON.stringify(record),
      );

      // Create and save review log entry — convert Rating enum to string for logging
      const fsrsRatingToString = (r: Rating): 'again' | 'hard' | 'good' | 'easy' => {
        switch (r) {
          case Rating.AGAIN: return 'again';
          case Rating.HARD: return 'hard';
          case Rating.GOOD: return 'good';
          case Rating.EASY: return 'easy';
          default: return 'good';
        }
      };

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

      const logId = crypto.randomUUID();
      const fullLog: ReviewLogEntry = { id: logId, ...reviewLog };

      // Store as individual entries with key pattern: versyflow:reviewlog:{recordId}:{timestamp}
      const recordKey = `versyflow:reviewlog:${fullLog.memorizationRecordId}:${fullLog.answeredAt}`;
      await this.storage.set(recordKey, JSON.stringify(fullLog));

      // Also store in an array for easy retrieval
      const arrayKey = `versyflow:reviewlogs:${fullLog.memorizationRecordId}`;

      // Read-modify-write with retry to handle race conditions
      const MAX_RETRIES = 3;
      let retries = 0;

      while (retries < MAX_RETRIES) {
        try {
          const existingLogsStr = await this.storage.get(arrayKey);
          const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) as ReviewLogEntry[] : [];

          // Check if this log already exists (prevent duplicates)
          const exists = existingLogs.some(log => log.id === fullLog.id);
          if (!exists) {
            existingLogs.push(fullLog);
          }

          await this.storage.set(arrayKey, JSON.stringify(existingLogs));
          break; // Success

        } catch (error) {
          retries++;
          if (retries >= MAX_RETRIES) {
            console.error('[CloudMemorizationService] saveReviewLog failed after multiple attempts:', error);
            throw error;
          }
          // Brief pause before retry
          await new Promise(resolve => setTimeout(resolve, 100 * retries));
        }
      }

      // Sync review log to cloud if enabled and connected
      if (this.syncService.autoSync && this.syncService.isConnected) {
        await this.syncService.syncLogsToCloud();
      }

      return true;
    } catch (error) {
      console.error('[CloudMemorizationService] updateRecordAfterReview failed:', error);
      return false;
    }
  }

  /**
   * Get a memorized record by its composite key (bookId, chapter, verse, translationId)
   */
  async getMemorizedRecord(bookId: string, chapter: number, verse: number, translationId: string): Promise<MemorizationRecord | null> {
    const recordId = `${bookId}:${chapter}:${verse}:${translationId}`;
    const recordStr = await this.storage.get('versyflow:record:' + recordId);
    return recordStr ? JSON.parse(recordStr) as MemorizationRecord : null;
  }

  /**
   * Get all memorized records from local storage
   */
  async getAllMemorized(): Promise<MemorizationRecord[]> {
    const allKeys = await this.storage.getAllKeys();
    const recordKeys = allKeys.filter(key => key.startsWith('versyflow:record:'));
    const records: MemorizationRecord[] = [];
    for (const key of recordKeys) {
      const str = await this.storage.get(key);
      if (str) records.push(JSON.parse(str) as MemorizationRecord);
    }
    return records;
  }

  /**
   * Get all memorized records that are due for review (nextReviewAt <= now)
   */
  async getDueRecords(): Promise<MemorizationRecord[]> {
    try {
      const all = await this.getAllMemorized();
      const now = Date.now();
      return all.filter(r => r.nextReviewAt && r.nextReviewAt <= now && r.status !== 'mastered');
    } catch (error) {
      console.error('[CloudMemorizationService] getDueRecords failed:', error);
      return [];
    }
  }

  /**
   * Save a review log entry to local storage, then sync to cloud if enabled
   */
  async saveReviewLog(logEntry: Omit<ReviewLogEntry, 'id'>): Promise<void> {
    const logId = crypto.randomUUID();
    const fullLog: ReviewLogEntry = { id: logId, ...logEntry };

    // Store as individual entries
    const recordKey = `versyflow:reviewlog:${fullLog.memorizationRecordId}:${fullLog.answeredAt}`;
    await this.storage.set(recordKey, JSON.stringify(fullLog));

    // Also store in an array for easy retrieval
    const arrayKey = `versyflow:reviewlogs:${fullLog.memorizationRecordId}`;

    const MAX_RETRIES = 3;
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const existingLogsStr = await this.storage.get(arrayKey);
        const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) as ReviewLogEntry[] : [];

        const exists = existingLogs.some(log => log.id === fullLog.id);
        if (!exists) {
          existingLogs.push(fullLog);
        }

        await this.storage.set(arrayKey, JSON.stringify(existingLogs));
        break;

      } catch (error) {
        retries++;
        if (retries >= MAX_RETRIES) {
          console.error('[CloudMemorizationService] saveReviewLog failed after multiple attempts:', error);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * retries));
      }
    }

    // Sync to cloud if enabled and connected
    if (this.syncService.autoSync && this.syncService.isConnected) {
      await this.syncService.syncLogsToCloud();
    }
  }

  /**
   * Complete memorization flow: start session → reveal words → verify → save to storage
   */
  async memorizeVerse(params: {
    bookId: string;
    chapterNumber: number;
    verseNumber: number;
    translationId: string;
    verseText: string;
    referenceDisplay: string;
  }): Promise<{ success: boolean; rating: Rating; nextReviewAt: number }> {
    try {
      // In a real implementation, this would use a SessionEngine
      // For now, we'll just save the record with initial FSRS state
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

      return {
        success: true,
        rating: Rating.GOOD,
        nextReviewAt: review.due.getTime(),
      };
    } catch (error) {
      console.error('[CloudMemorizationService] memorizeVerse failed:', error);
      return {
        success: false,
        rating: Rating.AGAIN,
        nextReviewAt: Date.now(),
      };
    }
  }

  /**
   * Method to trigger manual sync
   */
  async triggerSync(): Promise<void> {
    await this.syncService.sync();
  }

  /**
   * Get current sync status
   */
  getSyncStatus() {
    return this.syncService.getStatus();
  }

  /**
   * Enable or disable auto-sync
   */
  setAutoSync(enabled: boolean): void {
    this.syncService.setAutoSync(enabled);
  }
}