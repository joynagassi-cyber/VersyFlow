/**
 * App telemetry wiring — composition root for the TelemetryService.
 *
 * Singleton:
 *   - one `TelemetryListener` instance per app boot (subscribes to eventBus)
 *   - a periodic flush timer (30 s) + a `pagehide` flush hook
 *
 * Offline-safe: when the PowerSync upload port cannot be resolved the
 * service falls back to `NoOpTelemetryUploadAdapter` and the queue simply
 * accumulates locally; on reconnect the next flush uploads everything.
 */

import { getTelemetryService } from '@/services/telemetry-service-factory';
import { TelemetryListener } from '@/services/telemetry-listener';

let _wired = false;
let _listener: TelemetryListener | null = null;
let _flushTimer: ReturnType<typeof setInterval> | null = null;
const FLUSH_INTERVAL_MS = 30_000;

/**
 * Wire the telemetry service once (idempotent).
 *
 *  1. Instantiate the singleton `TelemetryService` (with PowerSync port).
 *  2. Start the `TelemetryListener` (subscribes to domain events).
 *  3. Schedule a periodic flush + a `pagehide` one-shot flush.
 */
export function wireAppTelemetry(): void {
  if (_wired) return;
  _wired = true;

  const service = getTelemetryService();

  _listener = new TelemetryListener(service);
  _listener.start();

  _flushTimer = setInterval(() => {
    service.flush().catch(() => {
      /* offline — queue stays; retried on next tick */
    });
  }, FLUSH_INTERVAL_MS);

  const onUnload = () => {
    service.flush().catch(() => {});
    if (_flushTimer) clearInterval(_flushTimer);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', onUnload, { once: true });
  }
}

/** Test helper: stop the periodic timer. */
export function unwireAppTelemetry(): void {
  _listener?.stop();
  _listener = null;
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
  _wired = false;
}
