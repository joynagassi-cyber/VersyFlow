/**
 * Domain Barrel Exports
 */

// Bible Domain
export { BIBLE_BOOKS, BOOK_ALIASES, resolveBookId } from './bible';
export { parseReference, buildReference } from './bible';
export type { BibleBook, ParsedReference } from './bible';

// FSRS Domain
export { Rating, DEFAULT_FSRS_STATE, RATING_LABELS } from './fsrs';
export type { FsrsState, FsrsReview, IFsrsEngine } from './fsrs';

// Progress Domain
export { calculateMasteryLevel, isMastered, MasteryLevel } from './progress';

// Domain Events (Shared)
export { DomainEventTypes, eventBus, DomainEvent } from './events';

// Telemetry Domain
export { redact } from './telemetry/entities';
export type {
  TelemetryEvent,
  TelemetryQueueItem,
  TelemetrySummary,
  ExerciseCompletedTelemetry,
  ExerciseAbandonedTelemetry,
  ReviewStartedTelemetry,
  ReviewCompletedTelemetry,
  MemorySessionStartedTelemetry,
  MemorySessionCompletedTelemetry,
  PassageStartedTelemetry,
  PassageSegmentCompletedTelemetry,
  ErrorOccurredTelemetry,
  FeatureAccessedTelemetry,
  StreakIncrementedTelemetry,
  MilestoneReachedTelemetry,
  EventType,
  ExerciseStrategy,
} from './telemetry/entities';
export type { ITelemetry, TelemetryEventType } from './telemetry/it telemetry';
