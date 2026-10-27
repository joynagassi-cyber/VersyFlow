/**
 * Telemetry service composition — single place that wires the
 * `TelemetryService` with its `ITelemetryUploadPort`.
 *
 * Returns a `TelemetryService` whose `flush()` delegates to the PowerSync
 * upload port (`TelemetryEventsRepositoryPowerSync` → `telemetry_events`,
 * the single sync write path). Falls back to `NoOpTelemetryUploadAdapter`
 * when the PowerSync port cannot be resolved (e.g. no session yet) so the
 * service remains usable offline-first.
 */

import { TelemetryService } from '@/services/telemetry-service';
import type { IStorage } from '@/infrastructure/storage/storage-types';
import { MmkvStorage } from '@/infrastructure/storage/mmkv-storage';
import {
  getTelemetryUploadPort,
} from '@/infrastructure/repository/powersync-repositories';
import { NoOpTelemetryUploadAdapter } from '@/infrastructure/telemetry/upload-adapter';

let _instance: TelemetryService | null = null;
let _storage: IStorage | null = null;

function getStorage(): IStorage {
  if (!_storage) _storage = new MmkvStorage();
  return _storage;
}

export function getTelemetryService(storage: IStorage = getStorage()): TelemetryService {
  if (!_instance) {
    let port;
    try {
      port = getTelemetryUploadPort();
    } catch {
      // No session / PowerSync not ready — fall back to no-op (local-only).
      port = new NoOpTelemetryUploadAdapter();
    }
    _instance = new TelemetryService(storage, port);
  }
  return _instance;
}
