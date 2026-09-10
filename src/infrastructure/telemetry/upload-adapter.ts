/**
 * Telemetry Upload Port — Infrastructure layer
 * Defines the contract for uploading anonymized telemetry events.
 * No real endpoint is wired in this slice — implementations use no-op or in-memory adapters.
 */

import type { TelemetryEvent } from '@/domains/telemetry/entities';

/**
 * Port for uploading telemetry events to a remote endpoint.
 * Implementations must not contain verse text or PII.
 */
export interface ITelemetryUploadPort {
  /**
   * Upload a batch of anonymized telemetry events.
   * The adapter should handle retries and backpressure internally.
   */
  upload(events: TelemetryEvent[]): Promise<void>;
}

/**
 * No-op implementation — accepts events without persisting or transmitting them.
 * Used when no upload endpoint is configured.
 */
export class NoOpTelemetryUploadAdapter implements ITelemetryUploadPort {
  async upload(_events: TelemetryEvent[]): Promise<void> {
    // No-op: telemetry stays local only
  }
}
