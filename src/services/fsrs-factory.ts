/**
 * FSRS Engine Factory - Creates IFsrsEngine instances
 *
 * Uses TsFsrsEngine (ts-fsrs library) as the single production engine.
 * In tests: call resetFsrsEngine() between tests.
 */

import { TsFsrsEngine } from '@/domains/fsrs/ts-fsrs-engine';
import type { IFsrsEngine } from '@/domains/fsrs/engine';

let _engine: IFsrsEngine | null = null;

export function getFsrsEngine(): IFsrsEngine {
  if (_engine) return _engine;
  _engine = new TsFsrsEngine();
  return _engine;
}

/** Returns false: WASM engine is not compiled in this environment */
export function isWasmAvailable(): boolean {
  return false;
}

/** Reset the engine singleton (for testing) */
export function resetFsrsEngine(): void {
  _engine = null;
}
