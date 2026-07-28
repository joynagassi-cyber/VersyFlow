/**
 * Service Layer — Memorization orchestration
 * See MEMORY_ENGINE_SPEC.md
 */

import { SessionEngine } from './session-engine';
import { IFsrsEngine, Rating } from '@/domains/fsrs';
import { IStorage } from '@/infrastructure/storage/storage-types';
import { eventBus, DomainEventTypes } from '../index';
import { MemorizationRecord } from './entities';

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
   * Update a record after a review (FSRS state update)
   */
  async updateRecordAfterReview(
    recordId: string,
    rating: Rating,
    newFsrsState: any,
    newNextReviewAt: number,
    wordPerformance?: any[],
  ): Promise<boolean> {
    try {
      const recordStr = await this.storage.get('versyflow:record:' + recordId);
      if (!recordStr) return false;

      const record = JSON.parse(recordStr) as MemorizationRecord;
      record.fsrsState = newFsrsState;
      record.nextReviewAt = newNextReviewAt;
      record.lastReviewedAt = Date.now();
      record.reviewCount = (record.reviewCount || 0) + 1;
      if (wordPerformance) record.wordPerformance = wordPerformance;

      await this.storage.set(
        'versyflow:record:' + recordId,
        JSON.stringify(record),
      );

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
  }): Promise<{ success: boolean; rating: Rating; nextReviewAt: number }> {
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
        rating: Rating.AGAIN,
        nextReviewAt: Date.now(),
      };
    }
  }
}
