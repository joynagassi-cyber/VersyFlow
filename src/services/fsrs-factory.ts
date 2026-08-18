/**
 * FSRS Engine Factory — Creates IFsrsEngine instances
 *
 * Factory function with optional reset for testing.
 * In production: singleton pattern (WASM init is expensive).
 * In tests: call resetFsrsEngine() between tests.
 */

import { WasmFsrsEngine } from '@/domains/fsrs/wasm-engine';
import { Sm2FallbackEngine } from '@/domains/fsrs/fallback-engine';
import { IFsrsEngine } from '@/domains/fsrs/engine';

let _engine: IFsrsEngine | null = null;
let _wasmLoaded = false;

/**
 * Get or create the FSRS engine instance
 * Uses WASM if available, falls back to SM-2 JS
 */
export function getFsrsEngine(): IFsrsEngine {
  if (_engine) return _engine;

  try {
    _engine = new WasmFsrsEngine();
    _wasmLoaded = true;
  } catch (error) {
    console.warn('WASM FSRS engine failed, falling back to SM-2:', error);
    _engine = new Sm2FallbackEngine();
  }

  return _engine;
}

export function isWasmAvailable(): boolean {
  return _wasmLoaded;
}

/**
 * Reset the engine singleton (for testing)
 * Call between tests to ensure clean state
 */
export function resetFsrsEngine(): void {
  _engine = null;
  _wasmLoaded = false;
}
