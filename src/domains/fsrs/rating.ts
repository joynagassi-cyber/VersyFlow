/**
 * FSRS Domain — Review Rating Rule (Phase 3 / Step 3.4)
 * Pure domain rule: maps the 4 review rating buttons to the FSRS engine
 * quality scale and to the REVIEW_COMPLETED event payload.
 * No I/O — domain layer only.
 * See docs/13-fsrs-domain.md and src/domains/events.ts
 */

import { Rating } from './entities';

/**
 * Review rating button — the 4 buttons shown in the review UI.
 * AGAIN / HARD / GOOD / EASY (SM-2 / FSRS convention).
 */
export enum ReviewRatingButton {
  AGAIN = 'again',
  HARD = 'hard',
  GOOD = 'good',
  EASY = 'easy',
}

export const REVIEW_RATING_BUTTONS: ReviewRatingButton[] = [
  ReviewRatingButton.AGAIN,
  ReviewRatingButton.HARD,
  ReviewRatingButton.GOOD,
  ReviewRatingButton.EASY,
];

/**
 * Map a rating button to the IFsrsEngine Rating scale (1-4).
 * The IFsrsEngine quality scale is the 1-4 rating enum,
 * derived from the classic SM-2 0-5 quality scale (0=forgot → 5=easy).
 */
export function ratingButtonToFsrsRating(
  button: ReviewRatingButton,
): Rating {
  switch (button) {
    case ReviewRatingButton.AGAIN:
      return Rating.AGAIN; // 1
    case ReviewRatingButton.HARD:
      return Rating.HARD; // 2
    case ReviewRatingButton.GOOD:
      return Rating.GOOD; // 3
    case ReviewRatingButton.EASY:
      return Rating.EASY; // 4
  }
}

/**
 * Map a rating button to the legacy SM-2 0-5 quality scale
 * (0=forgot, 5=effortless) for compatibility with SM-2 fallback paths.
 */
export function ratingButtonToSm2Quality(button: ReviewRatingButton): number {
  switch (button) {
    case ReviewRatingButton.AGAIN:
      return 0;
    case ReviewRatingButton.HARD:
      return 2;
    case ReviewRatingButton.GOOD:
      return 4;
    case ReviewRatingButton.EASY:
      return 5;
  }
}

/**
 * i18n key for a rating button label.
 * Buttons: review.again, review.hard, review.good, review.easy
 */
export function ratingButtonI18nKey(button: ReviewRatingButton): string {
  return `review.${button}`;
}

/**
 * Build the REVIEW_COMPLETED event payload from a rating button.
 * Shape: { rating, fsrsRating, sm2Quality, i18nKey }
 */
export function buildReviewCompletedPayload(
  button: ReviewRatingButton,
): Record<string, unknown> {
  return {
    rating: button,
    fsrsRating: ratingButtonToFsrsRating(button),
    sm2Quality: ratingButtonToSm2Quality(button),
    i18nKey: ratingButtonI18nKey(button),
  };
}
