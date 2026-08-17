/**
 * ITelemetry — Domain-level abstraction for telemetry collection
 *
 * Séam entre les services (ProgressService, etc.) et TelemetryService.
 * Small interface: 6 methods. All events flow through a single record() method.
 */

import { TelemetryQueueItem } from './entities';
import { TelemetrySummary } from './entities';

export type TelemetryEventType =
  | 'exercise.completed'
  | 'exercise.abandoned'
  | 'review.completed'
  | 'memory.session.completed'
  | 'passage.started'
  | 'passage.segment.completed'
  | 'error.occurred'
  | 'feature.accessed'
  | 'milestone.reached'
  | 'streak.incremented';

export interface ITelemetry {
  /**
   * Record a telemetry event — single entry point for all event types
   */
  record(eventType: TelemetryEventType, payload: Record<string, unknown>): void;

  /**
   * Flush queued events (async, may be no-op in MVP)
   */
  flush(): Promise<void>;

  /**
   * Get aggregated summary for dashboards
   */
  getSummary(): TelemetrySummary;

  /**
   * Clear all queued events (reset progress action)
   */
  clear(): void;

  /**
   * Get current queue (for debugging/testing)
   */
  getQueue(): TelemetryQueueItem[];

  /**
   * Set anonymous user ID for cross-session tracking
   */
  setUserId(userId: string): void;
}
