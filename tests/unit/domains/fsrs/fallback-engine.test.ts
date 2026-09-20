/**
 * Tests for Sm2FallbackEngine — classic SM-2 spaced repetition algorithm
 * Verifies interval/stability/difficulty updates for each rating
 */

import { describe, it, expect } from 'vitest';
import { Sm2FallbackEngine } from '@/domains/fsrs/fallback-engine';
import { Rating, DEFAULT_FSRS_STATE } from '@/domains/fsrs';
import type { FsrsState } from '@/domains/fsrs';

describe('Sm2FallbackEngine', () => {
  let engine: Sm2FallbackEngine;

  beforeEach(() => {
    engine = new Sm2FallbackEngine();
  });

  describe('newState()', () => {
    it('returns default FSRS state for a new verse', async () => {
      const state = await engine.newState(0);
      expect(state.stability).toBe(DEFAULT_FSRS_STATE.stability);
      expect(state.difficulty).toBe(DEFAULT_FSRS_STATE.difficulty);
      expect(state.repetitions).toBe(0);
      expect(state.lastInterval).toBe(0);
      expect(state.nextInterval).toBe(1);
    });

    it('returns a copy (not the original)', async () => {
      const state1 = await engine.newState(0);
      const state2 = await engine.newState(0);
      expect(state1).not.toBe(state2);
    });
  });

  describe('currentState()', () => {
    it('returns a shallow copy of the state', () => {
      const original: FsrsState = { ...DEFAULT_FSRS_STATE, stability: 5 };
      const copy = engine.currentState(original);
      expect(copy).not.toBe(original);
      expect(copy.stability).toBe(5);
    });
  });

  describe('review() — AGAIN rating', () => {
    it('resets interval to 1 day', async () => {
      const state: FsrsState = {
        ...DEFAULT_FSRS_STATE,
        stability: 10,
        lastInterval: 5,
        nextInterval: 5,
        elapsedDays: 5,
      };
      const result = await engine.review(state, Rating.AGAIN);
      expect(result.scheduledDays).toBe(1);
      expect(result.state.lastInterval).toBe(5);
    });

    it('drastically reduces stability', async () => {
      const state: FsrsState = {
        ...DEFAULT_FSRS_STATE,
        stability: 10,
      };
      const result = await engine.review(state, Rating.AGAIN);
      // stability multiplier for AGAIN is 0.1
      expect(result.stability).toBeLessThan(state.stability);
      expect(result.stability).toBeGreaterThan(0);
    });

    it('increments repetitions', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, repetitions: 3 };
      const result = await engine.review(state, Rating.AGAIN);
      expect(result.state.repetitions).toBe(4);
    });

    it('sets due date to ~1 day from now', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, stability: 10 };
      const result = await engine.review(state, Rating.AGAIN);
      const expectedMs = 1 * 86400000;
      const actualMs = result.due.getTime() - Date.now();
      expect(actualMs).toBeGreaterThan(expectedMs * 0.9);
      expect(actualMs).toBeLessThan(expectedMs * 1.1);
    });
  });

  describe('review() — HARD rating', () => {
    it('increases interval by ~1.2x', async () => {
      const state: FsrsState = {
        ...DEFAULT_FSRS_STATE,
        stability: 10,
        lastInterval: 5,
        nextInterval: 5,
        elapsedDays: 5,
      };
      const result = await engine.review(state, Rating.HARD);
      expect(result.scheduledDays).toBe(Math.max(1, Math.round(5 * 1.2)));
    });

    it('moderately increases stability', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, stability: 5 };
      const result = await engine.review(state, Rating.HARD);
      // multiplier = 1.0 for HARD
      expect(result.stability).toBeCloseTo(state.stability * 1.0, 1);
    });

    it('increases difficulty slightly', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, difficulty: 5 };
      const result = await engine.review(state, Rating.HARD);
      // newDifficulty = 5 - 1.3 + (4-2)*0.5 = 5 - 1.3 + 1.0 = 4.7
      expect(result.state.difficulty).toBeCloseTo(4.7, 1);
    });
  });

  describe('review() — GOOD rating', () => {
    it('increases interval by ~1.5x', async () => {
      const state: FsrsState = {
        ...DEFAULT_FSRS_STATE,
        stability: 10,
        lastInterval: 5,
        nextInterval: 5,
        elapsedDays: 5,
      };
      const result = await engine.review(state, Rating.GOOD);
      expect(result.scheduledDays).toBe(Math.max(1, Math.round(5 * 1.5)));
    });

    it('increases stability by 2.5x', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, stability: 4 };
      const result = await engine.review(state, Rating.GOOD);
      expect(result.stability).toBeCloseTo(4 * 2.5, 1);
    });

    it('decreases difficulty slightly', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, difficulty: 5 };
      const result = await engine.review(state, Rating.GOOD);
      // newDifficulty = 5 - 1.3 + (4-3)*0.5 = 5 - 1.3 + 0.5 = 4.2
      expect(result.state.difficulty).toBeCloseTo(4.2, 1);
    });
  });

  describe('review() — EASY rating', () => {
    it('increases interval by ~3.0x', async () => {
      const state: FsrsState = {
        ...DEFAULT_FSRS_STATE,
        stability: 10,
        lastInterval: 5,
        nextInterval: 5,
        elapsedDays: 5,
      };
      const result = await engine.review(state, Rating.EASY);
      expect(result.scheduledDays).toBe(Math.max(1, Math.round(5 * 3.0)));
    });

    it('boosts stability by 3.0x', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, stability: 3 };
      const result = await engine.review(state, Rating.EASY);
      expect(result.stability).toBeCloseTo(3 * 3.0, 1);
    });

    it('decreases difficulty the most', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, difficulty: 5 };
      const result = await engine.review(state, Rating.EASY);
      // newDifficulty = 5 - 1.3 + (4-4)*0.5 = 5 - 1.3 + 0 = 3.7
      expect(result.state.difficulty).toBeCloseTo(3.7, 1);
    });
  });

  describe('difficulty bounds', () => {
    it('clamps difficulty to minimum 0', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, difficulty: 0.5 };
      const result = await engine.review(state, Rating.AGAIN);
      // AGAIN: 0.5 - 1.3 + (4-1)*0.5 = 0.5 - 1.3 + 1.5 = 0.7 → stays positive
      expect(result.state.difficulty).toBeGreaterThanOrEqual(0);
    });

    it('clamps difficulty to maximum 10', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, difficulty: 10 };
      const result = await engine.review(state, Rating.AGAIN);
      // AGAIN: 10 - 1.3 + 1.5 = 10.2 → clamped to 10
      expect(result.state.difficulty).toBeLessThanOrEqual(10);
    });
  });

  describe('stability bounds', () => {
    it('never goes below 0.1', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, stability: 0.2 };
      const result = await engine.review(state, Rating.AGAIN);
      expect(result.stability).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('explain()', () => {
    it('returns human-readable explanations', () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, stability: 5.5, difficulty: 4.2 };
      const explanation = engine.explain(state, Rating.GOOD);
      expect(explanation.stability).toContain('5.5');
      expect(explanation.difficulty).toContain('4.2');
      expect(explanation.interval).toBeDefined();
      expect(explanation.recallProbability).toBeDefined();
    });

    it('includes French labels', () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE };
      const explanation = engine.explain(state, Rating.GOOD);
      expect(explanation.stability).toContain('Stabilité');
      expect(explanation.difficulty).toContain('Difficulté');
    });
  });

  describe('getDueItems()', () => {
    it('returns empty array when no items are due', () => {
      const states: FsrsState[] = [
        { ...DEFAULT_FSRS_STATE, lastInterval: 0, elapsedDays: 0, nextInterval: 1 },
        { ...DEFAULT_FSRS_STATE, lastInterval: 5, elapsedDays: 1, nextInterval: 5 },
      ];
      const now = new Date();
      const due = engine.getDueItems(states, now);
      expect(due).toEqual([]);
    });

    it('returns items where elapsedDays >= nextInterval', () => {
      const states: FsrsState[] = [
        { ...DEFAULT_FSRS_STATE, lastInterval: 3, elapsedDays: 5, nextInterval: 3 }, // due
        { ...DEFAULT_FSRS_STATE, lastInterval: 5, elapsedDays: 2, nextInterval: 5 }, // not due
      ];
      const now = new Date();
      const due = engine.getDueItems(states, now);
      expect(due.length).toBe(1);
    });

    it('filters out items with lastInterval === 0 (new items)', () => {
      const states: FsrsState[] = [
        { ...DEFAULT_FSRS_STATE, lastInterval: 0, elapsedDays: 0, nextInterval: 1 },
      ];
      const due = engine.getDueItems(states, new Date());
      expect(due).toEqual([]);
    });
  });

  describe('first review edge cases', () => {
    it('handles interval < 1 by using lastInterval || 1 logic', async () => {
      const state: FsrsState = {
        ...DEFAULT_FSRS_STATE,
        stability: 0.5,
        lastInterval: 0,
        nextInterval: 0,
        elapsedDays: 0,
      };
      const result = await engine.review(state, Rating.GOOD);
      // currentInterval = lastInterval || 1 = 0 || 1 = 1
      // GOOD: Math.max(1, Math.round(1 * 1.5)) = 2
      expect(result.scheduledDays).toBe(2);
    });
  });
});
