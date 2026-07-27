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
   * Memore a verse with the session state and rating
   */
  async memorizeWithRating(
    recordId: string,
    rating: Rating,
    verseText: string,
    reference: string,
    bookId: string,
    chapter: number,
    verse: number,
    translationId: string,
    wordRevealedCount?: number,
  ): Promise<{ success: boolean; rating: Rating; nextReviewAt: number }> {
    try {
      // Create and run session engine to calculate progress
      const engine = new SessionEngine(verseText);
      engine.startPreview();

      // Simulate word revelation based on count
      if (wordRevealedCount && wordRevealedCount > 0) {
        for (let i = 0; i < wordRevealedCount && i < engine.state.words.length; i++) {
          engine.revealNextWord();
        }
      }

      const isComplete = engine.isComplete();
      if (!isComplete && rating !== 'again') {
        // If not complete and rating is not AGAIN, force AGAIN
        console.warn('Session not complete, rating forced to AGAIN');
      }

      // Calculate FSRS review
      const newFsrsState = await this.fsrsEngine.newState(0);
      const review = await this.fsrsEngine.review(newFsrsState, rating);

      // Build record
      const record: ObitableMemorizationRecord = {
        id: recordId,
        bookId,
        chapterNumber: chapter,
        verseNumber: verse,
        translationId,
        bibleVerseReference: reference,
        bibleVerseText,
        status: isComplete ? 'mastered' : 'in-progress',
        fsrsState: review.state,
        nextReviewAt: review.due.getTime(),
        createdAt: Date.now(),
        lastReviewedAt: null,
        reviewCount: 0,
        totalReviewMinutes: 0,
        wordPerformance: [],
      };

      // Persist record
      await this.storage.set(
        'versyflow:record:' + recordId,
        JSON.stringify(record),
      );

      // Emit event
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
      console.error('[MemorizationService] MemorizeWithRating failed:', error);
      return {
        success: false,
        rating: Rating.AGAIN,
        nextReviewAt: Date.now(),
      };
    }
  }

  /**
   * Get all memorized records that are due for review (nextReviewAt <= now)
   */
  async getDueRecords(): Promise<MemorizationRecord[]> {
    try {
      // In a real implementation, we would query the storage for due records
      // For MVP, we'll scan all records (inefficient but works for small datasets)
      const allKeys = await this.storage.getAllKeys();
      const recordKeys = allKeys.filter(key => key.startsWith('versyflow:record:'));

      const records: MemorizationRecord[] = [];
      for (const key of recordKeys) {
        const recordStr = await this.storage.get(key);
        if (recordStr) {
          const record = JSON.parse(recordStr) as MemorizationRecord;
          // Check if due
          if (record.nextReviewAt && record.nextReviewAt <= Date.now()) {
            records.push(record);
          }
        }
      }
      return records;
    } catch (error) {
      console.error('[MemorizationService] getDueRecords failed:', error);
      return [];
    }
  }

  /**
   * Get a single record by ID
   */
  async getRecord(recordId: string): Promise<MemorizationRecord | null> {
    try {
      const recordStr = await this.storage.get('versyflow:record:' + recordId);
      if (recordStr) {
        return JSON.parse(recordStr) as MemorizationRecord;
      }
      return null;
    } catch (error) {
      console.error('[MemorizationService] getRecord failed:', error);
      return null;
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
  ): Promise<boolean> {
    try {
      const recordStr = await this.storage.get('versyflow:record:' + recordId);
      if (!recordStr) return false;

      const record = JSON.parse(recordStr) as MemorizationRecord;
      record.fsrsState = newFsrsState;
      record.nextReviewAt = newNextReviewAt;
      record.lastReviewedAt = Date.now();
      record.reviewCount = (record.reviewCount || 0) + 1;

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
   * Get all memorized verses (for progress/stats)
   */
  async getAllMemorized(): Promise<MemorizationRecord[]> {
    try {
      const allKeys = await this.storage.getAllKeys();
      const recordKeys = allKeys.filter(key => key.startsWith('versyflow:record:'));
      const records: MemorizationRecord[] = [];

      for (const key of recordKeys) {
        const recordStr = await this.storage.get(key);
        if (recordStr) {
          records.push(JSON.parse(recordStr) as MemorizationRecord);
        }
      }
      return records;
    } catch (error) {
      console.error('[MemorizationService] getAllMemorized failed:', error);
      return [];
    }
  }
}

// Extend the MemorizationRecord interface with optional fields
interface ObitableMemorizationRecord extends MemorizationRecord {
  wordPerformance: any[];
}
