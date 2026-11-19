/**
 * Telemetry service composition — single place that wires the
 * `TelemetryService` with its `ITelemetryUploadPort`.
 *
 * Returns a `TelemetryService` whose `flush()` delegates to the local upload
 * port (`MockTelemetryUploadPort` → `telemetry_events`, the single write
 * path). Falls back to `NoOpTelemetryUploadAdapter` when the port cannot be
 * resolved (e.g. no session yet) so the service remains usable offline.
 */

import { TelemetryService } from '@/services/telemetry-service';
import type { IStorage } from '@/infrastructure/storage/storage-types';
import { MmkvStorage } from '@/infrastructure/storage/mmkv-storage';
import {
  getTelemetryUploadPort,
} from '@/infrastructure/repository/mode-repositories';
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
      // No session / store not ready — fall back to no-op (local-only).
      port = new NoOpTelemetryUploadAdapter();
    }
    _instance = new TelemetryService(storage, port);
  }
  return _instance;
}
