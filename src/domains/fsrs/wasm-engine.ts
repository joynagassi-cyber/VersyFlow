/**
 * WasmFsrsEngine — TypeScript bridge to Rust WASM FSRS engine
 * Implements IFsrsEngine interface
 * See docs/13-fsrs-domain.md
 *
 * NOTE: In this MVP, the WASM is mocked. When the actual Rust WASM is compiled,
 * replace the initializeWasm() method with the real WASM import.
 */

import { IFsrsEngine, Rating, FsrsState, FsrsReview } from './engine';

// Export the WasmFsrsEngine class
export class WasmFsrsEngine implements IFsrsEngine {
  private engine: any;
  private initialized: boolean = false;

  constructor() {
    this.initializeWasm();
  }

  private initializeWasm(): void {
    // Try to load real WASM first (uncomment when available)
    // this.engine = new (require('../../rust/fsrs-wasm/pkg/fsrs-wasm')).WasmFsrsEngine();
    // this.initialized = true;

    // Fallback to mock implementation for MVP
    this.engine = this.createMockWasmEngine();
    this.initialized = true;
    console.log('WasmFsrsEngine: Using mock implementation (WASM not yet compiled)');
  }

  private createMockWasmEngine(): any {
    // Mock WASM engine that mimics the real API
    // This will be replaced with the real WASM when compiled
    return {
      new_state(_requestedRetries: number) {
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
        // Simplified review calculation (mimics real FSRS behavior)
        const multiplier = rating === 4 ? 1.5 : rating === 3 ? 1.2 : rating === 2 ? 0.9 : 0.5;
        const newStability = state.stability * multiplier;
        return {
          state: {
            ...state,
            stability: newStability,
            repetitions: state.repetitions + 1,
          },
          due: new Date(Date.now() + 3 * 86400000), // Default 3 days
          stability: newStability,
          scheduledDays: 3,
          recurring: true,
        };
      },

      explain(_state: any, _rating: number) {
        return {
          stability: 'Days until P(recall) = 0.9',
          difficulty: '0-10 scale, higher = harder',
          recallProbability: 'Current recall probability at last review',
        };
      },

      get_due_items(_states: any[], _now: number) {
        return [];
      },
    };
  }

  /**
   * Create a new FSRS state for a new verse
   */
  async newState(requestedRetries: number): Promise<FsrsState> {
    await this.ensureLoaded();
    const raw = this.engine.new_state(requestedRetries);
    return this.parseState(raw);
  }

  /**
   * Get the current FSRS state (for display/preview)
   */
  currentState(state: FsrsState): FsrsState {
    return { ...state };
  }

  /**
   * Process a review rating and return updated state
   */
  async review(state: FsrsState, rating: Rating): Promise<FsrsReview> {
    await this.ensureLoaded();
    const result = this.engine.review(this.stringifyState(state), rating);
    return this.parseReview(result);
  }

  /**
   * Explain what each parameter means (for UI tooltips)
   */
  explain(state: FsrsState, rating: Rating): Record<string, string> {
    // In a real WASM implementation, this would call into the engine
    // For the mock, return static explanations
    return {
      stability: 'Days until P(recall) = 0.9',
      difficulty: '0-10 scale, higher = harder',
      recallProbability: 'Current recall probability at last review',
    };
  }

  /**
   * Get verses needing review based on nextReviewAt
   */
  getDueItems(states: FsrsState[], now: Date): string[] {
    // Simplified implementation - in real WASM this would be more sophisticated
    return states
      .filter(s => s.lastInterval > 0 && s.elapsedDays >= s.lastInterval)
      .map((_, i) => `verse-${i}`);
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.initialized) {
      // Initialization happens in constructor
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow async to complete
    }
  }

  private stringifyState(state: FsrsState): any {
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

  private parseState(raw: any): FsrsState {
    return {
      stability: raw.stability,
      difficulty: raw.difficulty,
      recallProbability: raw.recallProbability,
      lastInterval: raw.lastInterval,
      nextInterval: raw.nextInterval,
      elapsedDays: raw.elapsedDays,
      repetitions: raw.repetitions,
      requestedRetention: raw.requestedRetention,
    };
  }

  private parseReview(raw: any): FsrsReview {
    return {
      state: this.parseState(raw.state),
      due: raw.due instanceof Date ? raw.due : new Date(raw.due),
      stability: raw.stability,
      scheduledDays: raw.scheduledDays,
      recurring: raw.recurring,
    };
  }
}
