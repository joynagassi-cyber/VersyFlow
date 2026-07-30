/**
 * Telemetry Service — Collects anonymized learning data (MVP version)
 * Implements CAP-007: Telemetry capability
 * Simple queue-based implementation for storing events locally
 */

import { IFsrsEngine } from '@/domains/fsrs';
import { MemorizationService } from '@/domains/memorization/service';
import { IStorage } from '@/infrastructure/storage/storage-types';
import { eventBus } from '@/domains';

/**
 * TelemetryEvent — Generic telemetry event structure
 */
interface TelemetryEventBase {
  eventType: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

/**
 * Simple telemetry event (any payload)
 */
interface TelemetryEvent extends TelemetryEventBase {
  payload: Record<string, unknown>;
}

/**
 * Queue item for persistence
 */
interface TelemetryQueueItem {
  id: string;
  event: TelemetryEvent;
  queuedAt: number;
}

/**
 * TelemetryService — Orchestrates data collection for future AI coaching
 * All data is anonymized and never contains PII (Personally Identifiable Information)
 */
export class TelemetryService {
  private readonly MAX_QUEUE_SIZE = 1000;
  private readonly RETENTION_DAYS = 730; // 2 years
  private queue: TelemetryQueueItem[] = [];
  private sessionId: string;
  private userId?: string;

  constructor(
    private storage: IStorage,
    private memorizationService: MemorizationService,
    private fsrsEngine: IFsrsEngine,
  ) {
    this.sessionId = this.generateSessionId();
    this.loadQueue();
  }

  /**
   * Generate a random session ID (anonymous, not linked to user)
   */
  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Set an optional anonymous user ID for cross-session tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Record a generic telemetry event
   */
  record(eventType: string, payload: Record<string, unknown>): void {
    const event: TelemetryEvent = {
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      payload,
    };
    this.enqueue(event);
  }

  /**
   * Record an exercise completion event
   */
  recordExerciseCompleted(payload: Record<string, unknown>): void {
    this.record('exercise.completed', payload);
  }

  /**
   * Record an exercise abandonment event
   */
  recordExerciseAbandoned(payload: Record<string, unknown>): void {
    this.record('exercise.abandoned', payload);
  }

  /**
   * Record a review completion event
   */
  recordReviewCompleted(payload: Record<string, unknown>): void {
    this.record('review.completed', payload);
  }

  /**
   * Record a memory session completion event
   */
  recordMemorySessionCompleted(payload: Record<string, unknown>): void {
    this.record('memory.session.completed', payload);
  }

  /**
   * Record an error occurrence
   */
  recordError(payload: Record<string, unknown>): void {
    this.record('error.occurred', payload);
  }

  /**
   * Record a feature access event
   */
  recordFeatureAccessed(payload: Record<string, unknown>): void {
    this.record('feature.accessed', payload);
  }

  /**
   * Enqueue a telemetry event for local storage
   */
  private enqueue(event: TelemetryEvent): void {
    // Skip if queue is full (safety cap)
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      return;
    }

    const queueItem: TelemetryQueueItem = {
      id: crypto.randomUUID(),
      event,
      queuedAt: Date.now(),
    };

    this.queue.push(queueItem);
    this.saveQueue();
  }

  /**
   * Save the telemetry queue to persistent storage
   */
  private saveQueue(): void {
    try {
      const queueKey = 'versyflow:telemetry:queue';
      // Fire and forget - don't await in constructor or critical paths
      this.storage.set(queueKey, JSON.stringify(this.queue)).catch(() => {});
    } catch (error) {
      console.error('[TelemetryService] Failed to save queue:', error);
    }
  }

  /**
   * Load the telemetry queue from persistent storage
   * Fire and forget - constructor cannot be async
   */
  private loadQueue(): void {
    try {
      const queueKey = 'versyflow:telemetry:queue';
      // Fire and forget
      this.storage.get(queueKey).then(str => {
        if (str) {
          this.queue = JSON.parse(str) as TelemetryQueueItem[];
        }
      }).catch(() => {
        // Silently fail
      });
    } catch (error) {
      console.error('[TelemetryService] Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Send all queued events to the server (placeholder for future implementation)
   * In MVP, this is a no-op (events are stored locally for now)
   */
  async flush(): Promise<void> {
    const now = Date.now();
    this.queue = this.queue.filter(item => {
      // Remove old events after retention period
      const age = now - item.queuedAt;
      const isTooOld = age > this.RETENTION_DAYS * 86400000;
      return !isTooOld;
    });
    this.saveQueue();
  }

  /**
   * Get all queued events (for debugging/testing)
   */
  getQueue(): TelemetryQueueItem[] {
    return [...this.queue];
  }

  /**
   * Clear the telemetry queue (for reset progress action)
   */
  clearQueue(): void {
    this.queue = [];
    try {
      this.storage.delete('versyflow:telemetry:queue').catch(() => {});
    } catch (error) {
      console.error('[TelemetryService] Failed to clear queue:', error);
    }
  }

  /**
   * Generate a summary of collected data (for analytics dashboard)
   */
  generateSummary(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    lastActivity: number | null;
    queueSize: number;
  } {
    const eventsByType: Record<string, number> = {};

    for (const item of this.queue) {
      const eventType = item.event.eventType;
      eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;
    }

    const lastActivity = this.queue.length > 0
      ? Math.max(...this.queue.map(item => item.event.timestamp))
      : null;

    return {
      totalEvents: this.queue.length,
      eventsByType,
      lastActivity,
      queueSize: this.queue.length,
    };
  }
}
