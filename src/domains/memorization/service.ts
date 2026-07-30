/**
 * Service Layer — Memorization orchestration
 * See MEMORY_ENGINE_SPEC.md
 */

import { SessionEngine } from './session-engine';
import { IFsrsEngine, Rating as FsrsRating } from '@/domains/fsrs';
import { IStorage } from '@/infrastructure/storage/storage-types';
import { eventBus, DomainEventTypes } from '../index';
import { MemorizationRecord, ReviewLogEntry, WordPerformance, WordPerformanceSnapshot } from './entities';

// Mapping from FSRS Rating enum to string representation for logging
const fsrsRatingToString = (rating: FsrsRating): 'again' | 'hard' | 'good' | 'easy' => {
  switch (rating) {
    case FsrsRating.AGAIN: return 'again';
    case FsrsRating.HARD: return 'hard';
    case FsrsRating.GOOD: return 'good';
    case FsrsRating.EASY: return 'easy';
  }
};

export class MemorizationService {
  constructor(
    private storage: IStorage,
    private fsrsEngine: IFsrsEngine,
  ) {}

  /**
   * Save a memorized record to storage
   */
  async saveMemorizedRecord(record: Omit<MemorizationRecord, 'id'>): Promise<void> {
    const recordId = `${record.bookId}:${record.chapterNumber}:${record.verseNumber}:${record.translationId}`;
    const fullRecord: MemorizationRecord = { id: recordId, ...record };
    await this.storage.set('versyflow:record:' + recordId, JSON.stringify(fullRecord));
  }

  /**
   * Save a review log entry for a memorization record
   */
  async saveReviewLog(logEntry: Omit<ReviewLogEntry, 'id'>): Promise<void> {
    const logId = crypto.randomUUID();
    const fullLog: ReviewLogEntry = { id: logId, ...logEntry };

    // Store as individual entries with key pattern: versyflow:reviewlog:{recordId}:{timestamp}
    const recordKey = `versyflow:reviewlog:${fullLog.memorizationRecordId}:${fullLog.answeredAt}`;
    await this.storage.set(recordKey, JSON.stringify(fullLog));

    // Also store in an array for easy retrieval - use atomic update pattern
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
        return; // Success

      } catch (error) {
        retries++;
        if (retries >= MAX_RETRIES) {
          // Re-throw on last retry
          console.error('[MemorizationService] saveReviewLog failed after multiple attempts:', error);
          throw error;
        }
        // Brief pause before retry
        await new Promise(resolve => setTimeout(resolve, 100 * retries));
      }
    }
  }

  /**
   * Get all review logs for a memorization record
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
   * Get all review logs across all records (for analytics/history view)
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
   * Get a memorized record by its composite key (bookId, chapter, verse, translationId)
   */
  async getMemorizedRecord(bookId: string, chapter: number, verse: number, translationId: string): Promise<MemorizationRecord | null> {
    const recordId = `${bookId}:${chapter}:${verse}:${translationId}`;
    const recordStr = await this.storage.get('versyflow:record:' + recordId);
    return recordStr ? JSON.parse(recordStr) as MemorizationRecord : null;
  }

  /**
   * Get all memorized records from storage
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
      console.error('[MemorizationService] getDueRecords failed:', error);
      return [];
    }
  }

  /**
   * Update a record after a review (FSRS state update) AND save review log
   */
  async updateRecordAfterReview(
    recordId: string,
    rating: FsrsRating,
    newFsrsState: FsrsState,
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

      // Create and save review log entry - convert Rating enum to string for logging
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
        // Convert WordPerformance to WordPerformanceSnapshot (empty array for MVP)
        wordPerformance: (wordPerformance as any) || [],
      };
      await this.saveReviewLog(reviewLog);

      // Emit review event
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.RECORD_REVIEWED,
        timestamp: Date.now(),
        payload: { recordId, rating },
      });

      return true;
    } catch (error) {
      console.error('[MemorizationService] updateRecordAfterReview failed:', error);
      return false;
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
  }): Promise<{ success: boolean; rating: FsrsRating; nextReviewAt: number }> {
    try {
      // Create session engine
      const engine = new SessionEngine(params.verseText);

      // Start preview phase
      engine.startPreview();

      // In UI, user would reveal words through interaction
      // Here we assume all words are revealed (for full session completion)

      // Verify completion
      const isComplete = engine.isComplete();
      if (!isComplete) {
        throw new Error('Session not complete — user must reveal all words');
      }

      // End session and get rating (default to GOOD if complete)
      const { rating } = engine.endSession(true);

      // Calculate next review using FSRS
      const newFsrsState = await this.fsrsEngine.newState(0);
      const review = await this.fsrsEngine.review(newFsrsState, rating);

      // Save the memorized record using the new persistence method
      await this.saveMemorizedRecord({
        bookId: params.bookId,
        chapterNumber: params.chapterNumber,
        verseNumber: params.verseNumber,
        translationId: params.translationId,
        bibleVerseReference: params.referenceDisplay,
        bibleVerseText: params.verseText,
        status: isComplete ? 'mastered' : 'in-progress',
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

      // Emit domain event
      const recordId = params.bookId + ':' + params.chapterNumber + ':' + params.verseNumber + ':' + params.translationId;
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.VERSE_MEMORIZED,
        timestamp: Date.now(),
        payload: {
          recordId,
          rating,
          stability: review.state.stability,
          nextReviewAt: review.due.getTime(),
        },
      });

      return {
        success: true,
        rating,
        nextReviewAt: review.due.getTime(),
      };
    } catch (error) {
      console.error('[MemorizationService] Memorize failed:', error);
      return {
        success: false,
        rating: FsrsRating.AGAIN,
        nextReviewAt: Date.now(),
      };
    }
  }
}