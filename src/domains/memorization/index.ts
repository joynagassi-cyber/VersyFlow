/**
 * Memorization Domain — Barrel Exports
 */

export {
  MemorizationService,
} from './service';
export {
  SessionEngine,
  MemorizationSessionEngine,
} from './session-engine';
export {
  DEFAULT_MVP_STRATEGY,
  MEMORIZATION_STATUS_ORDER,
  STRATEGIES_BY_VERSION,
  calculateMasteryLevel,
  canTransition,
  fsrsRatingToString,
  getMaskingConfigForStability,
  isMastered,
} from './entities';
export type {
  ExerciseStrategy,
  MasteryLevel,
  MaskingConfig,
  MemorizationRecord,
  MemorizationStatus,
  ReviewLogEntry,
  SessionPhase,
  SessionState,
  VerificationResult,
  WordPerformance,
  WordPerformanceSnapshot,
} from './entities';
export type {
  VerseData,
  PassageTargetParams,
  IMemorizationSessionEngine,
  PassageStartOptions,
} from './session-engine';
export type { IWordFailureTracker } from './tracker';
export type { MemorizationStorageAdapter } from './storage-adapter';
export type { IFatigueDetector } from './fatigue-detector';
export type { IStrategyRecommendor, Recommendation, RecommendationContext } from './strategy-recommendor';
export type { IFsrsEngine } from '../fsrs/engine';
export { Rating } from '../fsrs/engine';
