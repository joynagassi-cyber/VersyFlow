/**
 * Memorization Domain — Barrel Exports
 */

export {
  SessionEngine,
  MemorizationService,
} from './service';
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
export type { IWordFailureTracker } from './tracker';
export type { WordFailure } from '@/services/word-failure-tracker';
export type { MemorizationStorageAdapter } from './storage-adapter';
export type { IFatigueDetector } from './fatigue-detector';
export type { IStrategyRecommendor, Recommendation, RecommendationContext } from './strategy-recommendor';
export { IFsrsEngine, Rating } from '../fsrs/engine';
export type { IFsrsEngine } from '../fsrs/engine';
