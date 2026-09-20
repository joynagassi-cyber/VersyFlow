/**
 * Tests for WasmFsrsEngine — the mock WASM bridge
 * Tests the TypeScript layer that wraps the (currently mocked) WASM engine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WasmFsrsEngine } from '@/domains/fsrs/wasm-engine';
import { Rating, DEFAULT_FSRS_STATE } from '@/domains/fsrs';
import type { FsrsState } from '@/domains/fsrs';

describe('WasmFsrsEngine', () => {
  let engine: WasmFsrsEngine;

  beforeEach(() => {
    engine = new WasmFsrsEngine();
  });

  describe('newState()', () => {
    it('returns a valid FsrsState', async () => {
      const state = await engine.newState(0);
      expect(state).toBeDefined();
      expect(typeof state.stability).toBe('number');
      expect(typeof state.difficulty).toBe('number');
      expect(typeof state.recallProbability).toBe('number');
      expect(typeof state.repetitions).toBe('number');
    });

    it('returns state with positive stability', async () => {
      const state = await engine.newState(0);
      expect(state.stability).toBeGreaterThan(0);
    });

    it('returns state with difficulty around 5', async () => {
      const state = await engine.newState(0);
      expect(state.difficulty).toBeGreaterThan(0);
      expect(state.difficulty).toBeLessThan(10);
    });
  });

  describe('currentState()', () => {
    it('returns a copy of the input state', () => {
      const original: FsrsState = { ...DEFAULT_FSRS_STATE, stability: 7 };
      const copy = engine.currentState(original);
      expect(copy).not.toBe(original);
      expect(copy.stability).toBe(7);
    });
  });

  describe('review()', () => {
    it('returns an FsrsReview with updated state', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, stability: 5 };
      const result = await engine.review(state, Rating.GOOD);
      expect(result).toBeDefined();
      expect(result.state).toBeDefined();
      expect(result.stability).toBeDefined();
      expect(result.scheduledDays).toBeDefined();
      expect(typeof result.recurring).toBe('boolean');
    });

    it('increases repetitions after review', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, repetitions: 3 };
      const result = await engine.review(state, Rating.GOOD);
      expect(result.state.repetitions).toBe(4);
    });

    it('returns a due date in the future', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, stability: 5 };
      const result = await engine.review(state, Rating.GOOD);
      expect(result.due.getTime()).toBeGreaterThan(Date.now());
    });

    it('handles ALL ratings without error', async () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE, stability: 5 };
      for (const rating of [Rating.AGAIN, Rating.HARD, Rating.GOOD, Rating.EASY]) {
        const result = await engine.review(state, rating);
        expect(result.state).toBeDefined();
        expect(result.scheduledDays).toBeGreaterThan(0);
      }
    });
  });

  describe('explain()', () => {
    it('returns explanation object with expected keys', () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE };
      const explanation = engine.explain(state, Rating.GOOD);
      expect(explanation.stability).toBeDefined();
      expect(explanation.difficulty).toBeDefined();
      expect(explanation.recallProbability).toBeDefined();
    });

    it('returns string values', () => {
      const state: FsrsState = { ...DEFAULT_FSRS_STATE };
      const explanation = engine.explain(state, Rating.GOOD);
      for (const value of Object.values(explanation)) {
        expect(typeof value).toBe('string');
      }
    });
  });

  describe('getDueItems()', () => {
    it('returns empty array when no items are due', () => {
      const states: FsrsState[] = [
        { ...DEFAULT_FSRS_STATE, lastInterval: 0, elapsedDays: 0 },
      ];
      const due = engine.getDueItems(states, new Date());
      expect(due).toEqual([]);
    });

    it('returns items when elapsedDays >= lastInterval', () => {
      const states: FsrsState[] = [
        { ...DEFAULT_FSRS_STATE, lastInterval: 3, elapsedDays: 5 },
        { ...DEFAULT_FSRS_STATE, lastInterval: 5, elapsedDays: 2 },
      ];
      const due = engine.getDueItems(states, new Date());
      expect(due.length).toBe(1);
      expect(due[0]).toBe('verse-0');
    });

    it('uses verse-N naming convention', () => {
      const states: FsrsState[] = [
        { ...DEFAULT_FSRS_STATE, lastInterval: 1, elapsedDays: 1 },
        { ...DEFAULT_FSRS_STATE, lastInterval: 2, elapsedDays: 2 },
      ];
      const due = engine.getDueItems(states, new Date());
      expect(due).toEqual(['verse-0', 'verse-1']);
    });
  });

  describe('constructor behavior', () => {
    it('initializes with mock engine (no crash)', () => {
      // Constructor calls initializeWasm which logs a message
      // If it threw, the test would fail here
      expect(engine).toBeDefined();
    });
  });
});
