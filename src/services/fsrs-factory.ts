/**
 * FSRS Engine Factory - Creates IFsrsEngine instances
 *
 * Uses TsFsrsEngine (ts-fsrs library) as the single production engine.
 * In tests: call resetFsrsEngine() between tests.
 */

import { TsFsrsEngine } from '@/domains/fsrs/ts-fsrs-engine';
import type { IFsrsEngine } from '@/domains/fsrs/engine';
import { eventBus, DomainEventTypes } from '@/domains/events';

let _engine: IFsrsEngine | null = null;

export function getFsrsEngine(): IFsrsEngine {
  if (_engine) return _engine;
  try {
    _engine = new TsFsrsEngine();
    return _engine;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    eventBus.emit({
      id: crypto.randomUUID(),
      type: DomainEventTypes.FSRS_ENGINE_FAILURE,
      timestamp: Date.now(),
      payload: {
        engineType: 'ts',
        error: msg,
        attemptNumber: 1,
        fallbackActivated: false,
      },
    });
    throw error;
  }
}

/** Returns false: WASM engine is not compiled in this environment */
export function isWasmAvailable(): boolean {
  return false;
}

/** Reset the engine singleton (for testing) */
export function resetFsrsEngine(): void {
  _engine = null;
}
