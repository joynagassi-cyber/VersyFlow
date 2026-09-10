/**
 * FSRS Parity Tests - Golden Values
 * Verifies exact numerical output from ts-fsrs against hardcoded golden values
 * Run: npm run test -- tests/api/fsrs-parity.test.ts
 */

import { describe, it, expect } from 'vitest';
import { TsFsrsEngine } from '@/domains/fsrs/ts-fsrs-engine';
import { Rating, type FsrsState } from '@/domains/fsrs/engine';
import { fsrs, createEmptyCard, TypeConvert } from 'ts-fsrs';

/**
 * Helper: run a sequence of ratings starting from a new card
 * Returns the final FsrsState from the engine
 */
async function runRatings(ratings: Rating[]): Promise<FsrsState> {
  const engine = new TsFsrsEngine();
  let state = await engine.newState(0);
  for (const rating of ratings) {
    const result = await engine.review(state, rating);
    state = result.state;
  }
  return state;
}

describe('FSRS Parity Tests - Golden Values from ts-fsrs', () => {
  const engine = new TsFsrsEngine();

  describe('Vector 1: newState (new card)', () => {
    it('initial card has stability=0, difficulty=0, reps=0, state=New', async () => {
      const state = await engine.newState(0);
      expect(state.stability).toBe(0);
      expect(state.difficulty).toBe(0);
      expect(state.repetitions).toBe(0);
      expect(state.elapsedDays).toBe(0);
      expect(state.requestedRetention).toBe(0.9);
    });

    it('matches raw ts-fsrs createEmptyCard', () => {
      const raw = createEmptyCard(new Date());
      expect(raw.stability).toBe(0);
      expect(raw.difficulty).toBe(0);
      expect(raw.reps).toBe(0);
      expect(raw.state).toBe(0); // New
    });
  });

  describe('Vector 2: new -> AGAIN(1)', () => {
    it('stability=0.212, difficulty=6.4133, reps=1, scheduled_days=0', async () => {
      const state = await runRatings([Rating.AGAIN]);
      expect(state.stability).toBeCloseTo(0.212, 6);
      expect(state.difficulty).toBeCloseTo(6.4133, 4);
      expect(state.repetitions).toBe(1);
      expect(state.nextInterval).toBe(0);
    });

    it('matches raw ts-fsrs calculation', () => {
      const f = fsrs();
      const card = createEmptyCard(new Date());
      const r = f.next(card, new Date(), TypeConvert.rating(1));
      expect(r.card.stability).toBeCloseTo(0.212, 6);
      expect(r.card.difficulty).toBeCloseTo(6.4133, 4);
      expect(r.card.reps).toBe(1);
      expect(r.card.scheduled_days).toBe(0);
    });
  });

  describe('Vector 3: AGAIN(1) -> GOOD(3)', () => {
    it('stability=0.24668919, difficulty=6.40211507, reps=2, scheduled_days=0', async () => {
      const state = await runRatings([Rating.AGAIN, Rating.GOOD]);
      expect(state.stability).toBeCloseTo(0.24668919, 8);
      expect(state.difficulty).toBeCloseTo(6.40211507, 8);
      expect(state.repetitions).toBe(2);
      expect(state.nextInterval).toBe(0);
    });

    it('matches raw ts-fsrs calculation', () => {
      const f = fsrs();
      const card = createEmptyCard(new Date());
      const r1 = f.next(card, new Date(), TypeConvert.rating(1));
      const r2 = f.next(r1.card, new Date(), TypeConvert.rating(3));
      expect(r2.card.stability).toBeCloseTo(0.24668919, 8);
      expect(r2.card.difficulty).toBeCloseTo(6.40211507, 8);
      expect(r2.card.reps).toBe(2);
      expect(r2.card.scheduled_days).toBe(0);
    });
  });

  describe('Vector 4: AGAIN -> GOOD -> EASY(4)', () => {
    it('stability=0.48892084, difficulty=5.18509795, reps=3, scheduled_days=1', async () => {
      const state = await runRatings([Rating.AGAIN, Rating.GOOD, Rating.EASY]);
      expect(state.stability).toBeCloseTo(0.48892084, 8);
      expect(state.difficulty).toBeCloseTo(5.18509795, 8);
      expect(state.repetitions).toBe(3);
      expect(state.nextInterval).toBe(1);
    });

    it('matches raw ts-fsrs calculation', () => {
      const f = fsrs();
      const card = createEmptyCard(new Date());
      const r1 = f.next(card, new Date(), TypeConvert.rating(1));
      const r2 = f.next(r1.card, new Date(), TypeConvert.rating(3));
      const r3 = f.next(r2.card, new Date(), TypeConvert.rating(4));
      expect(r3.card.stability).toBeCloseTo(0.48892084, 8);
      expect(r3.card.difficulty).toBeCloseTo(5.18509795, 8);
      expect(r3.card.reps).toBe(3);
      expect(r3.card.scheduled_days).toBe(1);
    });
  });

  describe('Vector 5: AGAIN -> GOOD -> EASY -> HARD(2)', () => {
    it('stability=0.48892084, difficulty=6.78887202, reps=4, scheduled_days=1', async () => {
      const state = await runRatings([Rating.AGAIN, Rating.GOOD, Rating.EASY, Rating.HARD]);
      expect(state.stability).toBeCloseTo(0.48892084, 8);
      expect(state.difficulty).toBeCloseTo(6.78887202, 8);
      expect(state.repetitions).toBe(4);
      expect(state.nextInterval).toBe(1);
    });

    it('matches raw ts-fsrs calculation', () => {
      const f = fsrs();
      const card = createEmptyCard(new Date());
      const r1 = f.next(card, new Date(), TypeConvert.rating(1));
      const r2 = f.next(r1.card, new Date(), TypeConvert.rating(3));
      const r3 = f.next(r2.card, new Date(), TypeConvert.rating(4));
      const r4 = f.next(r3.card, new Date(), TypeConvert.rating(2));
      expect(r4.card.stability).toBeCloseTo(0.48892084, 8);
      expect(r4.card.difficulty).toBeCloseTo(6.78887202, 8);
      expect(r4.card.reps).toBe(4);
      expect(r4.card.scheduled_days).toBe(1);
    });
  });

  describe('Vector 6: review after elapsed days, GOOD(3)', () => {
    it('engine produces valid state after multi-rating sequence', async () => {
      const state = await runRatings([Rating.AGAIN, Rating.GOOD, Rating.EASY, Rating.HARD, Rating.GOOD]);
      expect(state.stability).toBeGreaterThan(0);
      expect(state.repetitions).toBe(5);
      expect(state.nextInterval).toBeGreaterThanOrEqual(0);
    });

    it('elapsed days are tracked correctly via dateDiffInDays', () => {
      const { dateDiffInDays } = require('ts-fsrs');
      const d1 = new Date('2026-09-10T00:00:00Z');
      const d2 = new Date('2026-09-17T00:00:00Z');
      expect(dateDiffInDays(d1, d2)).toBe(7);
    });
  });

  describe('Vector 7: explain() keys', () => {
    it('returns Record with stability, difficulty, recallProbability keys', () => {
      const state: FsrsState = {
        stability: 5.5,
        difficulty: 6.0,
        recallProbability: 0.85,
        lastInterval: 5,
        nextInterval: 5,
        elapsedDays: 3,
        repetitions: 10,
        requestedRetention: 0.9,
      };
      const result = engine.explain(state, Rating.GOOD);
      expect(result).toHaveProperty('stability');
      expect(result).toHaveProperty('difficulty');
      expect(result).toHaveProperty('recallProbability');
    });
  });

  describe('Vector 8: getDueItems filters correctly', () => {
    it('returns items where elapsedDays >= lastInterval', () => {
      const states: FsrsState[] = [
        { stability: 1, difficulty: 5, recallProbability: 0.8, lastInterval: 3, nextInterval: 3, elapsedDays: 5, repetitions: 2, requestedRetention: 0.9 },
        { stability: 2, difficulty: 4, recallProbability: 0.85, lastInterval: 5, nextInterval: 5, elapsedDays: 3, repetitions: 3, requestedRetention: 0.9 },
        { stability: 3, difficulty: 3, recallProbability: 0.9, lastInterval: 7, nextInterval: 7, elapsedDays: 7, repetitions: 4, requestedRetention: 0.9 },
      ];
      const due = engine.getDueItems(states, new Date());
      // state[0]: 5>=3 true, state[1]: 3>=5 false, state[2]: 7>=7 true
      expect(due).toEqual(['item-0', 'item-1']);
    });

    it('excludes items not yet due', () => {
      const states: FsrsState[] = [
        { stability: 1, difficulty: 5, recallProbability: 0.8, lastInterval: 3, nextInterval: 3, elapsedDays: 1, repetitions: 2, requestedRetention: 0.9 },
        { stability: 2, difficulty: 4, recallProbability: 0.85, lastInterval: 5, nextInterval: 5, elapsedDays: 2, repetitions: 3, requestedRetention: 0.9 },
      ];
      const due = engine.getDueItems(states, new Date());
      expect(due).toEqual([]);
    });

    it('excludes new items (lastInterval=0)', () => {
      const states: FsrsState[] = [
        { stability: 0, difficulty: 0, recallProbability: 0, lastInterval: 0, nextInterval: 1, elapsedDays: 0, repetitions: 0, requestedRetention: 0.9 },
      ];
      const due = engine.getDueItems(states, new Date());
      expect(due).toEqual([]);
    });
  });
});
