/**
 * Memorization Domain — Barrel Exports
 */

export {
  SessionEngine,
} from './session-engine';
export {
  DEFAULT_MVP_STRATEGY,
  MEMORIZATION_STATUS_ORDER,
  RATING_LABELS,
  STRATEGIES_BY_VERSION,
  calculateMasteryLevel,
  canTransition,
  getMaskingConfigForStability,
  isMastered,
} from './entities';
export type {
  BibleVerse,
  ExerciseStrategy,
  FsrsReview,
  FsrsState,
  MasteryLevel,
  MaskingConfig,
  MemorizationRecord,
  MemorizationStatus,
  ModeOptions,
  ParsedReference,
  ReviewLogEntry,
  SessionPhase,
  SessionState,
  VerificationResult,
  WordPerformance,
  WordPerformanceSnapshot,
} from './entities';
export { IFsrsEngine, Rating } from '../fsrs/engine';
export type { IFsrsEngine } from '../fsrs/engine';
