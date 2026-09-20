/**
 * Unit Tests — Phase 3 / Step 3.4: Review rating system
 *
 * Asserts each of the 4 review buttons maps to the correct FSRS rating
 * (IFsrsEngine quality scale) and that the i18n key is present in all 5
 * locales (ar, de, en, fr, zh).
 *
 * Tests target:
 *  - src/domains/fsrs/rating.ts          (pure domain rule)
 *  - src/services/review-rating-service.ts (service facade)
 *  - src/i18n/locales/*.ts               (i18n keys)
 */

import {
  ReviewRatingButton,
  REVIEW_RATING_BUTTONS,
  ratingButtonToFsrsRating,
  ratingButtonToSm2Quality,
  ratingButtonI18nKey,
  buildReviewCompletedPayload,
} from '@/domains/fsrs/rating';
import { Rating } from '@/domains/fsrs/engine';
import { ReviewRatingService } from '@/services/review-rating-service';

// Locale imports — verify i18n keys exist in all 5 locales
import { en } from '@/i18n/locales/en';
import { fr } from '@/i18n/locales/fr';
import { ar } from '@/i18n/locales/ar';
import { de } from '@/i18n/locales/de';
import { zh } from '@/i18n/locales/zh';

/** Expected mapping: button → (fsrsRating, sm2Quality, i18nKey) */
const EXPECTED: Array<{
  button: ReviewRatingButton;
  fsrs: Rating;
  sm2: number;
  i18nKey: string;
}> = [
  { button: ReviewRatingButton.AGAIN, fsrs: Rating.AGAIN, sm2: 0, i18nKey: 'review.again' },
  { button: ReviewRatingButton.HARD, fsrs: Rating.HARD, sm2: 2, i18nKey: 'review.hard' },
  { button: ReviewRatingButton.GOOD, fsrs: Rating.GOOD, sm2: 4, i18nKey: 'review.good' },
  { button: ReviewRatingButton.EASY, fsrs: Rating.EASY, sm2: 5, i18nKey: 'review.easy' },
];

/** All 5 locales to check i18n key presence */
const LOCALES = [en, fr, ar, de, zh] as const;

describe('Phase 3 / Step 3.4 — Review rating system', () => {
  describe('Domain rule: button → FSRS rating (IFsrsEngine quality scale)', () => {
    it.each(EXPECTED)('maps $button to FSRS Rating.$name', ({ button, fsrs }) => {
      expect(ratingButtonToFsrsRating(button)).toBe(fsrs);
    });

    it.each(EXPECTED)('maps $button to SM-2 quality $sm2', ({ button, sm2 }) => {
      expect(ratingButtonToSm2Quality(button)).toBe(sm2);
    });

    it.each(EXPECTED)('$button i18n key is $i18nKey', ({ button, i18nKey }) => {
      expect(ratingButtonI18nKey(button)).toBe(i18nKey);
    });

    it('exposes all 4 buttons in display order', () => {
      expect(REVIEW_RATING_BUTTONS).toEqual([
        ReviewRatingButton.AGAIN,
        ReviewRatingButton.HARD,
        ReviewRatingButton.GOOD,
        ReviewRatingButton.EASY,
      ]);
    });
  });

  describe('Domain rule: REVIEW_COMPLETED payload', () => {
    it.each(EXPECTED)('$button builds the correct payload', ({ button, fsrs, sm2, i18nKey }) => {
      const payload = buildReviewCompletedPayload(button);
      expect(payload).toEqual({
        rating: button,
        fsrsRating: fsrs,
        sm2Quality: sm2,
        i18nKey,
      });
    });
  });

  describe('i18n: keys present in all 5 locales', () => {
    const KEYS = ['again', 'hard', 'good', 'easy'];

    it.each(EXPECTED)('$i18nKey exists in all 5 locales', ({ i18nKey }) => {
      for (const locale of LOCALES) {
        const review = locale.review as unknown as Record<string, unknown>;
        const key = i18nKey.split('.')[1];
        expect(review[key]).toBeDefined();
        expect(typeof review[key]).toBe('string');
      }
    });

    it('every locale has a non-empty review.{again,hard,good,easy}', () => {
      for (const locale of LOCALES) {
        const review = locale.review as Record<string, unknown>;
        for (const key of KEYS) {
          expect(review[key]).toBeTruthy();
        }
      }
    });
  });

  describe('Service: ReviewRatingService', () => {
    const service = new ReviewRatingService();

    it.each(EXPECTED)('$button maps correctly via service.map()', ({ button, fsrs, sm2, i18nKey }) => {
      const result = service.map(button);
      expect(result.button).toBe(button);
      expect(result.fsrsRating).toBe(fsrs);
      expect(result.sm2Quality).toBe(sm2);
      expect(result.i18nKey).toBe(i18nKey);
    });

    it.each(EXPECTED)('$button maps correctly via service.toFsrsRating()', ({ button, fsrs }) => {
      expect(service.toFsrsRating(button)).toBe(fsrs);
    });

    it.each(EXPECTED)('$button maps correctly via service.toSm2Quality()', ({ button, sm2 }) => {
      expect(service.toSm2Quality(button)).toBe(sm2);
    });

    it.each(EXPECTED)('$button maps correctly via service.i18nKeyFor()', ({ button, i18nKey }) => {
      expect(service.i18nKeyFor(button)).toBe(i18nKey);
    });

    it.each(EXPECTED)('$button builds the correct payload via service', ({ button, fsrs, sm2, i18nKey }) => {
      const payload = service.buildCompletedPayload(button);
      expect(payload).toEqual({
        rating: button,
        fsrsRating: fsrs,
        sm2Quality: sm2,
        i18nKey,
      });
    });

    it('getButtons() returns all 4 buttons', () => {
      expect(service.getButtons()).toEqual(REVIEW_RATING_BUTTONS);
    });

    it('reviewWithEngine() hands off to the IFsrsEngine interface', async () => {
      let received: unknown = null;
      const fakeEngine = {
        newState: async () => ({}),
        currentState: (s: unknown) => s,
        review: async (_state: unknown, rating: unknown) => {
          received = rating;
          return { due: new Date() };
        },
        explain: () => ({}),
        getDueItems: () => [],
      };
      await service.reviewWithEngine(
        fakeEngine as unknown as import('@/domains/fsrs').IFsrsEngine,
        ReviewRatingButton.EASY,
        {} as import('@/domains/fsrs').FsrsState,
      );
      expect(received).toBe(Rating.EASY);
    });
  });
});
