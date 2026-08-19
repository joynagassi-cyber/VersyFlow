/**
 * Service Layer — Memorization orchestration
 * See MEMORY_ENGINE_SPEC.md
 */

import { SessionEngine } from './session-engine';
import { MemorizationStorageAdapter } from './storage-adapter';
import { fsrsRatingToString } from './entities';
import { IFsrsEngine, Rating as FsrsRating } from '@/domains/fsrs';
import { IStorage } from '@/infrastructure/storage/storage-types';
import { eventBus, DomainEventTypes } from '../index';
import { MemorizationRecord, ReviewLogEntry, WordPerformance, MemorizationTarget, MemorizationTargetType, ContentReference } from './entities';

export class MemorizationService {
  private storageAdapter: MemorizationStorageAdapter;

  constructor(
    storage: IStorage,
    private fsrsEngine: IFsrsEngine,
    private profileId: string = 'default',
  ) {
    this.storageAdapter = new MemorizationStorageAdapter(storage, `versyflow:${profileId}:`);
  }

  /**
   * Generate storage key prefix for a learner profile
   */
  private profileKeyPrefix(profileId: string): string {
    return `versyflow:${profileId}:`;
  }

  /**
   * Save a memorized record to storage (profile-scoped)
   */
  async saveMemorizedRecord(record: Omit<MemorizationRecord, 'id'>, profileId?: string): Promise<void> {
    const effectiveId = profileId || this.profileId;
    const recordId = `${record.bookId}:${record.chapterNumber}:${record.verseNumber}:${record.translationId}`;
    const fullRecord: MemorizationRecord = { id: recordId, learnerProfileId: effectiveId, ...record };
    await this.storageAdapter.saveRecord(fullRecord);
  }

  /**
   * Save a review log entry for a memorization record (profile-scoped)
   */
  async saveReviewLog(logEntry: Omit<ReviewLogEntry, 'id'>, profileId?: string): Promise<void> {
    const effectiveId = profileId || this.profileId;
    const logId = crypto.randomUUID();
    const fullLog: ReviewLogEntry = { id: logId, learnerProfileId: effectiveId, ...logEntry };
    await this.storageAdapter.saveReviewLog(fullLog);
  }

  /**
   * Get all review logs for a memorization record (profile-scoped)
   */
  async getReviewLogsForRecord(recordId: string, profileId?: string): Promise<ReviewLogEntry[]> {
    return this.storageAdapter.getReviewLogs(recordId);
  }

  /**
   * Get all review logs across all records for a profile (profile-scoped)
   */
  async getAllReviewLogs(profileId?: string): Promise<ReviewLogEntry[]> {
    return this.storageAdapter.getAllReviewLogs();
  }

  /**
   * Get a memorized record by its composite key (profile-scoped)
   */
  async getMemorizedRecord(bookId: string, chapter: number, verse: number, translationId: string, profileId?: string): Promise<MemorizationRecord | null> {
    const recordId = `${bookId}:${chapter}:${verse}:${translationId}`;
    return this.storageAdapter.getRecord(recordId);
  }

  /**
   * Get all memorized records for a profile (profile-scoped)
   */
  async getAllMemorized(profileId?: string): Promise<MemorizationRecord[]> {
    return this.storageAdapter.getAllRecords();
  }

  /**
   * Get all memorized records that are due for review (profile-scoped)
   */
  async getDueRecords(profileId?: string): Promise<MemorizationRecord[]> {
    return this.storageAdapter.getDueRecords();
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
    profileId?: string,
  ): Promise<boolean> {
    try {
      const effectiveProfileId = profileId || this.profileId;
      const recordStr = await this.storageAdapter.getRecord(recordId);
      if (!recordStr) return false;

      const record = recordStr;

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

      await this.storageAdapter.saveRecord(record);

      // Create and save review log entry
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
      await this.saveReviewLog(reviewLog, effectiveProfileId);

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
    profileId: string;
  }): Promise<{ success: boolean; rating: FsrsRating; nextReviewAt: number }> {
    try {
      const engine = new SessionEngine(params.verseText);
      engine.startPreview();
      const isComplete = engine.isComplete();
      if (!isComplete) throw new Error('Session not complete — user must reveal all words');

      const { rating } = engine.endSession(true);
      const newFsrsState = await this.fsrsEngine.newState(0);
      const review = await this.fsrsEngine.review(newFsrsState, rating);

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
      }, params.profileId);

      const recordId = `${params.bookId}:${params.chapterNumber}:${params.verseNumber}:${params.translationId}`;
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.VERSE_MEMORIZED,
        timestamp: Date.now(),
        payload: { recordId, rating, stability: review.state.stability, nextReviewAt: review.due.getTime() },
      });

      return { success: true, rating, nextReviewAt: review.due.getTime() };
    } catch (error) {
      console.error('[MemorizationService] Memorize failed:', error);
      return { success: false, rating: FsrsRating.AGAIN, nextReviewAt: Date.now() };
    }
  }

  /**
   * Memorize a target (single verse or passage)
   * Main entry point for the new target-oriented architecture
   */
  async memorizeTarget(target: MemorizationTarget, verseText: string, verseTexts?: string[], profileId?: string): Promise<{ success: boolean; rating: FsrsRating; nextReviewAt: number; recordId: string }> {
    try {
      const engine = new SessionEngine(verseText);
      engine.startPreview();
      const isComplete = engine.isComplete();
      if (!isComplete) throw new Error('Session not complete — user must reveal all words');

      const { rating } = engine.endSession(true);
      const newFsrsState = await this.fsrsEngine.newState(0);
      const review = await this.fsrsEngine.review(newFsrsState, rating);

      const isPassage = target.type === 'passage';
      const recordId = this.generateTargetId(target);
      const record: Omit<MemorizationRecord, 'id'> = {
        bookId: target.reference.bookId,
        chapterNumber: target.reference.chapter,
        verseNumber: target.reference.startVerse,
        endVerse: target.reference.endVerse,
        translationId: target.reference.translationId,
        bibleVerseReference: target.displayReference,
        bibleVerseText: verseText,
        verseTexts,
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
        targetId: recordId,
        targetType: target.type,
      };

      await this.saveMemorizedRecord(record, profileId);

      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.TARGET_MEMORIZED,
        timestamp: Date.now(),
        payload: {
          targetId: recordId,
          targetType: target.type,
          rating,
          stability: review.state.stability,
          nextReviewAt: review.due.getTime(),
          verseCount: isPassage ? (target.reference.endVerse! - target.reference.startVerse! + 1) : 1,
        },
      });

      return { success: true, rating, nextReviewAt: review.due.getTime(), recordId };
    } catch (error) {
      console.error('[MemorizationService] memorizeTarget failed:', error);
      return { success: false, rating: FsrsRating.AGAIN, nextReviewAt: Date.now(), recordId: '' };
    }
  }

  /**
   * Generate a stable target ID from a MemorizationTarget
   */
  private generateTargetId(target: MemorizationTarget): string {
    if (target.type === 'single-verse') {
      return `${target.reference.bookId}:${target.reference.chapter}:${target.reference.startVerse}:${target.reference.translationId}`;
    }
    return target.id;
  }
}
