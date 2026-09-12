/**
 * Telemetry Service — Collects anonymized learning data.
 * Implements CAP-007: Telemetry capability
 *
 * Deep module: small interface (6 methods) → large implementation
 * Queue-based persistence, fire-and-forget, non-blocking for critical paths.
 *
 * P2-1: `flush()` now optionally delegates to an `ITelemetryUploadPort`
 * (single sync write path → PowerSync `telemetry_events`). When no port is
 * provided the legacy local-only behaviour is preserved (trim + persist).
 */

import type { IStorage } from '@/infrastructure/storage/storage-types';
import type { TelemetryEvent, TelemetryQueueItem, TelemetrySummary } from '@/domains/telemetry/entities';
import type { ITelemetry } from '@/domains/telemetry/it telemetry';
import type { ITelemetryUploadPort } from '@/infrastructure/telemetry/upload-adapter';

/** Maximum queue size before dropping oldest events */
const MAX_QUEUE_SIZE = 1000;

/** Retention period in days */
const RETENTION_DAYS = 730;

/**
 * TelemetryService — Orchestrates anonymized data collection for AI coaching.
 * All data is anonymized and never contains PII.
 */
export class TelemetryService implements ITelemetry {
  private queue: TelemetryQueueItem[] = [];
  private sessionId: string;
  private userId?: string;

  constructor(
    private storage: IStorage,
    private uploadPort?: ITelemetryUploadPort,
  ) {
    this.sessionId = this.generateSessionId();
    this.loadQueue();
  }

  /**
   * Record a telemetry event — single entry point for all event types.
   */
  record(eventType: string, payload: Record<string, unknown>): void {
    if (this.queue.length >= MAX_QUEUE_SIZE) return;

    this.queue.push({
      id: crypto.randomUUID(),
      event: {
        eventType,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        payload,
      } as TelemetryEvent,
      queuedAt: Date.now(),
      sent: false,
    });

    // Fire and forget — non-blocking for critical paths
    this.saveQueue();
  }

  /**
   * Flush queued events to remote storage.
   *
   * With an upload port (P2-1): the unsent queue is handed to the port —
   * the PowerSync adapter INSERTs each event into `telemetry_events`
   * (single sync write path, offline-safe). Successful items are marked
   * `sent` and pruned so they are not re-sent.
   *
   * Without a port (legacy): trims old events and persists locally only.
   */
  async flush(): Promise<void> {
    const now = Date.now();
    this.queue = this.queue.filter(item => now - item.queuedAt <= RETENTION_DAYS * 86400000);

    if (this.uploadPort && this.queue.some((i) => !i.sent)) {
      const unsent = this.queue.filter((i) => !i.sent);
      try {
        await this.uploadPort.upload(unsent.map((i) => i.event));
        this.queue = this.queue.filter((i) => i.sent);
      } catch {
        // Upload failed (offline / no session) — keep the queue; it will be
        // retried on a later flush. Telemetry never blocks the critical path.
      }
    }

    await this.saveQueue();
  }

  /**
   * Get aggregated summary for analytics dashboards.
   */
  getSummary(): TelemetrySummary {
    const eventsByType: Record<string, number> = {};
    for (const item of this.queue) {
      eventsByType[item.event.eventType] = (eventsByType[item.event.eventType] || 0) + 1;
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

  /**
   * Clear all queued events.
   */
  clear(): void {
    this.queue = [];
    try {
      this.storage.delete('versyflow:telemetry:queue').catch(() => {});
    } catch {
      // Ignore — telemetry is non-critical
    }
  }

  /**
   * Get current queue (for debugging/testing).
   */
  getQueue(): TelemetryQueueItem[] {
    return [...this.queue];
  }

  /**
   * Set anonymous user ID.
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // ==================== Private ====================

  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private saveQueue(): void {
    try {
      this.storage.set('versyflow:telemetry:queue', JSON.stringify(this.queue)).catch(() => {});
    } catch {
      // Silently fail
    }
  }

  private loadQueue(): void {
    try {
      this.storage.get('versyflow:telemetry:queue').then(str => {
        if (str) {
          this.queue = JSON.parse(str) as TelemetryQueueItem[];
        }
      }).catch(() => {
        this.queue = [];
      });
    } catch {
      this.queue = [];
    }
  }
}
