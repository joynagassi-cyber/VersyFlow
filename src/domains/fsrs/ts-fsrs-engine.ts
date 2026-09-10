/**
 * TsFsrsEngine - TypeScript adapter wrapping the ts-fsrs library
 * Implements IFsrsEngine interface using real FSRS algorithm
 * See docs/13-fsrs-domain.md
 */

import {
  fsrs,
  createEmptyCard,
  TypeConvert,
  dateDiffInDays,
  type Card,
} from 'ts-fsrs';
import type { IFsrsEngine, FsrsState, FsrsReview, Rating } from './engine';

export class TsFsrsEngine implements IFsrsEngine {
  private f = fsrs();

  /** Map ts-fsrs Card -> domain FsrsState */
  private toFsrsState(card: Card): FsrsState {
    return {
      stability: card.stability,
      difficulty: card.difficulty,
      recallProbability: this.calcRecallProb(card),
      lastInterval: card.scheduled_days,
      nextInterval: card.scheduled_days,
      elapsedDays: card.elapsed_days,
      repetitions: card.reps,
      requestedRetention: 0.9,
    };
  }

  /** Map domain FsrsState -> ts-fsrs Card */
  private fromFsrsState(state: FsrsState): Card {
    return {
      due: new Date(),
      stability: state.stability,
      difficulty: state.difficulty,
      elapsed_days: state.elapsedDays,
      scheduled_days: state.nextInterval,
      reps: state.repetitions,
      lapses: 0,
      learning_steps: 0,
      state: state.lastInterval === 0 ? 0 : 2,
      last_review: new Date(),
    };
  }

  /** Estimate recall probability from stability and elapsed days */
  private calcRecallProb(card: Card): number {
    if (card.stability <= 0) return 0;
    const exponent = -0.9 * (card.elapsed_days / card.stability);
    return Math.pow(Math.E, exponent);
  }

  async newState(_requestedRetries: number): Promise<FsrsState> {
    const card = createEmptyCard(new Date());
    return this.toFsrsState(card);
  }

  currentState(state: FsrsState): FsrsState {
    return { ...state };
  }

  async review(state: FsrsState, rating: Rating): Promise<FsrsReview> {
    const card = this.fromFsrsState(state);
    const result = this.f.next(card, new Date(), TypeConvert.rating(rating));
    const outState = this.toFsrsState(result.card);
    const daysAhead = Math.max(0, result.card.scheduled_days);
    return {
      state: outState,
      due: new Date(Date.now() + daysAhead * 86400000),
      stability: outState.stability,
      scheduledDays: outState.nextInterval,
      recurring: outState.nextInterval > 0,
    };
  }

  explain(state: FsrsState, _rating: Rating): Record<string, string> {
    return {
      stability: `${state.stability.toFixed(1)} ${'daysUntilForget'}`,
      difficulty: `${state.difficulty.toFixed(1)}/10 ${'difficultyDesc'}`,
      recallProbability: `${(state.recallProbability * 100).toFixed(0)}% ${'recallProbDesc'}`,
    };
  }

  getDueItems(states: FsrsState[], _now: Date): string[] {
    return states
      .filter(s => s.lastInterval > 0 && s.elapsedDays >= s.lastInterval)
      .map((_, i) => `item-${i}`);
  }
}
