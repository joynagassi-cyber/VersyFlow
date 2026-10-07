/**
 * Tests for WasmFsrsEngine — the TypeScript bridge to the Rust/WASM engine.
 *
 * The underlying WASM binary (`src/infrastructure/wasm/fsrs_wasm.js`) is
 * mocked here so these tests exercise the bridge layer (state mapping,
 * due-item filtering, tooltip strings) deterministically, without needing a
 * real WebAssembly runtime or a static file server in the test environment.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Deterministic stand-in for the real WASM engine's behaviour, matching what
// the compiled `rust/fsrs-wasm` package produces for the simple states used
// in these tests (see `docs/13-fsrs-domain.md`).
const mockWasmEngineClass = vi.fn().mockImplementation(
  function () {
    return {
      new_state() {
        return {
          stability: 1.0,
          difficulty: 5.0,
          recallProbability: 0.9,
          lastInterval: 0,
          nextInterval: 1,
          elapsedDays: 0,
          repetitions: 0,
          requestedRetention: 0.9,
        };
      },
      review(state: any, rating: number) {
        const multiplier = rating === 4 ? 1.5 : rating === 3 ? 1.2 : rating === 2 ? 0.9 : 0.5;
        const newStability = state.stability * multiplier;
        return {
          state: {
            ...state,
            stability: newStability,
            repetitions: state.repetitions + 1,
          },
          due: new Date(Date.now() + 3 * 86400000),
          stability: newStability,
          scheduledDays: 3,
          recurring: true,
        };
      },
      explain() {
        return {
          stability: 'Days until P(recall) = 0.9',
          difficulty: '0-10 scale, higher = harder',
          recallProbability: 'Current recall probability at last review',
        };
      },
      get_due_items() {
        return [];
      },
    };
  },
);

vi.mock('@/infrastructure/wasm/fsrs_wasm.js', () => ({
  default: vi.fn(async () => {}),
  WasmFsrsEngine: mockWasmEngineClass,
}));

const { WasmFsrsEngine } = await import('@/domains/fsrs/wasm-engine');
const { Rating, DEFAULT_FSRS_STATE } = await import('@/domains/fsrs');
const fsrsModule = await import('@/domains/fsrs');
type FsrsState = import('@/domains/fsrs').FsrsState;
void fsrsModule;

describe('WasmFsrsEngine', () => {
  // `WasmFsrsEngine` is a class (value): the instance type is
  // `InstanceType<typeof WasmFsrsEngine>`, not the constructor itself.
  let engine: InstanceType<typeof WasmFsrsEngine>;

  beforeEach(() => {
    mockWasmEngineClass.mockClear();
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
