/**
 * FSRS Domain - Barrel Exports
 */

export { DEFAULT_FSRS_STATE } from './entities';
export type { FsrsState, FsrsReview } from './engine';
export { Rating } from './engine';
export { type IFsrsEngine } from './engine';
export { TsFsrsEngine } from './ts-fsrs-engine';

/** @deprecated Use TsFsrsEngine instead. WASM build not available in this environment. */
export { WasmFsrsEngine } from './wasm-engine';

/** @deprecated Use TsFsrsEngine instead. Fallback JS engine kept for test compatibility. */
export { Sm2FallbackEngine } from './fallback-engine';
