/**
 * FSRS Service Factory — Creates appropriate IFsrsEngine based on availability
 * Attempts to use WasmFsrsEngine (Rust WASM) first, falls back to Sm2FallbackEngine
 */

import { WasmFsrsEngine } from '@/domains/fsrs/wasm-engine';
import { Sm2FallbackEngine } from '@/domains/fsrs/fallback-engine';
import { IFsrsEngine } from '@/domains/fsrs/engine';

// Singleton for the FSRS engine
let _engine: IFsrsEngine | null = null;
let _wasmLoaded = false;

/**
 * Get the available FSRS engine instance
 * Uses WASM if available, otherwise falls back to SM-2 JS
 */
export function getFsrsEngine(): IFsrsEngine {
  if (_engine) {
    return _engine;
  }

  // Try to load WASM engine first
  try {
    _engine = new WasmFsrsEngine();
    _wasmLoaded = true;
  } catch (error) {
    console.warn('WASM FSRS engine failed to initialize, falling back to SM-2:', error);
    _engine = new Sm2FallbackEngine();
  }

  return _engine;
}

/**
 * Check if WASM engine was successfully loaded
 */
export function isWasmAvailable(): boolean {
  return _wasmLoaded;
}

/**
 * Force reset the FSRS engine (for testing)
 */
export function resetFsrsEngine(): void {
  _engine = null;
  _wasmLoaded = false;
}
