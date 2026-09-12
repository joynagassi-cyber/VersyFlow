/**
 * ReviewRatingService — Maps the 4 review rating buttons (Again/Hard/Good/Easy)
 * to the IFsrsEngine quality scale and to the REVIEW_COMPLETED event payload.
 * Phase 3 / Step 3.4 — Review rating system.
 *
 * Service layer: no business logic; delegates the pure mapping to
 * the fsrs domain rule (src/domains/fsrs/rating.ts).
 * Offline-first: mapping is pure and always works offline.
 */

import { IFsrsEngine, Rating } from '@/domains/fsrs';
import {
  ReviewRatingButton,
  REVIEW_RATING_BUTTONS,
  ratingButtonToFsrsRating,
  ratingButtonToSm2Quality,
  ratingButtonI18nKey,
  buildReviewCompletedPayload,
} from '@/domains/fsrs';

export interface ReviewRatingResult {
  /** The button the user tapped */
  button: ReviewRatingButton;
  /** IFsrsEngine quality scale value (1-4) */
  fsrsRating: Rating;
  /** Legacy SM-2 0-5 quality scale value */
  sm2Quality: number;
  /** i18n key for the button label, e.g. "review.easy" */
  i18nKey: string;
  /** REVIEW_COMPLETED event payload */
  payload: Record<string, unknown>;
}

export class ReviewRatingService {
  /**
   * Map a rating button to the IFsrsEngine quality scale.
   */
  toFsrsRating(button: ReviewRatingButton): Rating {
    return ratingButtonToFsrsRating(button);
  }

  /**
   * Map a rating button to the legacy SM-2 0-5 quality scale.
   */
  toSm2Quality(button: ReviewRatingButton): number {
    return ratingButtonToSm2Quality(button);
  }

  /**
   * Get the i18n key for a rating button label.
   */
  i18nKeyFor(button: ReviewRatingButton): string {
    return ratingButtonI18nKey(button);
  }

  /**
   * Compute the full mapping for a rating button.
   */
  map(button: ReviewRatingButton): ReviewRatingResult {
    return {
      button,
      fsrsRating: ratingButtonToFsrsRating(button),
      sm2Quality: ratingButtonToSm2Quality(button),
      i18nKey: ratingButtonI18nKey(button),
      payload: buildReviewCompletedPayload(button),
    };
  }

  /**
   * Compute the REVIEW_COMPLETED event payload for a rating button.
   */
  buildCompletedPayload(button: ReviewRatingButton): Record<string, unknown> {
    return buildReviewCompletedPayload(button);
  }

  /**
   * All review rating buttons, in display order.
   */
  getButtons(): ReviewRatingButton[] {
    return REVIEW_RATING_BUTTONS;
  }

  /**
   * Process a review through the engine: maps button → rating, then
   * hands off to the IFsrsEngine (never the concrete engine).
   */
  async reviewWithEngine(
    engine: IFsrsEngine,
    button: ReviewRatingButton,
    state: import('@/domains/fsrs').FsrsState,
  ): Promise<import('@/domains/fsrs').FsrsReview> {
    const rating = this.toFsrsRating(button);
    return engine.review(state, rating);
  }
}
