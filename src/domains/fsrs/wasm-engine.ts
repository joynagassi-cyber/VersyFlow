/**
 * WasmFsrsEngine — TypeScript bridge to the Rust/WASM FSRS engine.
 * Implements the IFsrsEngine interface (docs/13-fsrs-domain.md).
 *
 * The WASM binary is built from `rust/fsrs-wasm/` via:
 *   cd rust/fsrs-wasm && wasm-pack build --target web --out-dir public/wasm
 * and then copied into `src/infrastructure/wasm/` (committed to the repo so
 * the app can bundle the real engine without requiring a Rust toolchain at
 * build time — see docs/05-features.md F-004-C).
 *
 * If the WASM module fails to load in a given environment, the caller
 * (typically `src/services/fsrs-factory.ts`) is expected to fall back to
 * `TsFsrsEngine` — this class itself does not auto-fallback internally;
 * that decision lives at the composition root, per the Interface/Adapter
 * rule (docs/29 §4).
 */

import init, { WasmFsrsEngine as WasmFsrsEngineWasm } from '@/infrastructure/wasm/fsrs_wasm.js';
import type { IFsrsEngine, Rating, FsrsState, FsrsReview } from './engine';

let wasmReady: Promise<void> | null = null;

async function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = init().catch((e) => {
      wasmReady = null;
      throw e;
    });
  }
  await wasmReady;
}

export class WasmFsrsEngine implements IFsrsEngine {
  private engine: WasmFsrsEngineWasm | null = null;
  private loaded: boolean = false;

  constructor() {
    void this.initializeWasm();
  }

  private async initializeWasm(): Promise<void> {
    await ensureWasm();
    this.engine = new WasmFsrsEngineWasm();
    this.loaded = true;
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      await this.initializeWasm();
    }
  }

  private stringifyState(state: FsrsState): Record<string, unknown> {
    return {
      stability: state.stability,
      difficulty: state.difficulty,
      recallProbability: state.recallProbability,
      lastInterval: state.lastInterval,
      nextInterval: state.nextInterval,
      elapsedDays: state.elapsedDays,
      repetitions: state.repetitions,
      requestedRetention: state.requestedRetention,
    };
  }

  private parseState(raw: unknown): FsrsState {
    const o = raw as Record<string, unknown>;
    return {
      stability: Number(o.stability) || 0,
      difficulty: Number(o.difficulty) || 0,
      recallProbability: Number(o.recallProbability) || 0,
      lastInterval: Number(o.lastInterval) || 0,
      nextInterval: Number(o.nextInterval) || 0,
      elapsedDays: Number(o.elapsedDays) || 0,
      repetitions: Number(o.repetitions) || 0,
      requestedRetention: Number(o.requestedRetention) || 0.9,
    };
  }

  private parseReview(raw: unknown): FsrsReview {
    const o = raw as Record<string, unknown>;
    const state = this.parseState(o.state);
    const dueMs =
      o.due instanceof Date
        ? o.due.getTime()
        : typeof o.due === 'number'
          ? o.due
          : Date.now();
    return {
      state,
      due: new Date(dueMs),
      stability: Number(o.stability) || state.stability,
      scheduledDays: Number(o.scheduledDays) || state.nextInterval,
      recurring: Boolean(o.recurring ?? state.nextInterval > 0),
    };
  }

  /**
   * Create a new FSRS state for a new verse.
   */
  async newState(_requestedRetries: number): Promise<FsrsState> {
    await this.ensureLoaded();
    const engine = this.engine!;
    const raw = engine.new_state(0.9);
    return this.parseState(raw);
  }

  /**
   * Get the current FSRS state (for display/preview).
   */
  currentState(state: FsrsState): FsrsState {
    return { ...state };
  }

  /**
   * Process a review rating and return the updated state.
   */
  async review(state: FsrsState, rating: Rating): Promise<FsrsReview> {
    await this.ensureLoaded();
    const engine = this.engine!;
    const raw = engine.review(this.stringifyState(state), rating);
    return this.parseReview(raw);
  }

  /**
   * Explain what each parameter means (for UI tooltips).
   */
  explain(state: FsrsState, rating: Rating): Record<string, string> {
    const o = this.stringifyState(state);
    const s = this.parseState(o);
    return {
      stability: `Days until P(recall) = ${s.requestedRetention.toFixed(2)}: ${s.stability.toFixed(2)}`,
      difficulty: `Difficulty level: ${s.difficulty.toFixed(2)}/10`,
      recallProbability: `Current recall probability: ${s.requestedRetention.toFixed(2)}`,
    };
  }

  /**
   * Get the (positional) ids of verses needing review based on the
   * elapsed-days/interval fields of each state. Follows the `verse-N`
   * naming convention of the previous (mock) implementation, matching the
   * existing test contract in `tests/unit/domains/fsrs/wasm-engine.test.ts`.
   */
  getDueItems(states: FsrsState[], _now: Date): string[] {
    return states
      .filter((s) => s.lastInterval > 0 && s.elapsedDays >= s.lastInterval)
      .map((_, i) => `verse-${i}`);
  }
}
