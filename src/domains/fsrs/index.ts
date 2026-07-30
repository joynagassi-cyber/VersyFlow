/**
 * FSRS Domain — Barrel Exports
 */

export { Rating, DEFAULT_FSRS_STATE, RATING_LABELS } from './entities';
export type { FsrsState, FsrsReview } from './entities';
export type { IFsrsEngine } from './engine';
export { Sm2FallbackEngine } from './fallback-engine';
export { WasmFsrsEngine } from './wasm-engine';