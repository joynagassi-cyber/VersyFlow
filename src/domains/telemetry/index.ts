/**
 * Telemetry Domain — Barrel
 *
 * Public surface of the telemetry domain: the event entities + the
 * `redact()` pure redaction rule, the `ITelemetry` port, and the queue /
 * summary types. Import from this barrel, not from the individual files,
 * so the domain exposes one stable entry point.
 */

export {
  redact,
} from './entities';
export type {
  TelemetryEvent,
  ExerciseStrategy,
  EventType,
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
  TelemetryQueueItem,
  TelemetrySummary,
} from './entities';

export type {
  ITelemetry,
  TelemetryEventType,
} from './it-telemetry';
