/**
 * Service Layer — Memorization orchestration
 * See MEMORY_ENGINE_SPEC.md
 */

import { SessionEngine } from './session-engine';
import { IFsrsEngine, Rating } from '@/domains/fsrs';
import { IStorage } from '@/infrastructure/storage/storage-types';
import { eventBus, DomainEventTypes } from '../index';

export class MemorizationService {
  constructor(
    private storage: IStorage,
    private fsrsEngine: IFsrsEngine,
  ) {}

  /**
   * Complete flow: start session → reveal words → verify → save
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
      // 1. Create session engine
      const engine = new SessionEngine(params.verseText);

      // 2. Start preview phase
      engine.startPreview();

      // 3. User reveals all words through interaction
      // (handled in UI layer — engine tracks revealed words)

      // 4. Verify completion
      const isComplete = engine.isComplete();
      if (!isComplete) {
        throw new Error('Session not complete — user must reveal all words');
      }

      // 5. End session and get rating
      const { rating } = engine.endSession(true);

      // 6. Calculate next review using FSRS
      const newFsrsState = await this.fsrsEngine.newState(0);
      const review = await this.fsrsEngine.review(newFsrsState, rating);

      // 7. Persist record
      const recordId = params.bookId + ':' + params.chapterNumber + ':' + params.verseNumber + ':' + params.translationId;
      await this.storage.set(
        'versyflow:user:memorized:' + recordId,
        JSON.stringify({
          id: recordId,
          bookId: params.bookId,
          chapterNumber: params.chapterNumber,
          verseNumber: params.verseNumber,
          translationId: params.translationId,
          bibleVerseReference: params.referenceDisplay,
          bibleVerseText: params.verseText,
          status: 'in-progress',
          fsrsState: review.state,
          nextReviewAt: review.due.getTime(),
          createdAt: Date.now(),
        })
      );

      // 8. Emit domain event
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
