/**
 * MockSyncService — `ISyncService` implementation for mock mode.
 *
 * There is no cloud to talk to, so "sync" means: push the current mock
 * dataset to the local test collector (`POST /api/snapshot`) and report a
 * friendly status. This keeps the sync indicator, the settings screen and
 * `useSyncStatus` fully functional without a backend.
 */

import type { ISyncService, SyncStatus } from '@/sync/ISyncService';
import { mockDb } from './db';
import { localBackend } from '../local-backend';
import { recordTestEvent } from '../local-backend';

export class MockSyncService implements ISyncService {
  private autoSync = true;
  private lastSyncAt: number | null = null;
  private pendingOperations = 0;

  get connected(): boolean {
    // In mock mode the "backend" is always the browser itself.
    return true;
  }

  get autoSyncEnabled(): boolean {
    return this.autoSync;
  }

  async sync(): Promise<void> {
    this.pendingOperations = 1;
    const ok = await localBackend.pushSnapshot(mockDb.snapshot());
    this.lastSyncAt = Date.now();
    this.pendingOperations = 0;
    recordTestEvent('sync.mock', { ok, at: this.lastSyncAt });
  }

  async syncRecordsToCloud(): Promise<void> {
    await this.sync();
  }

  async syncLogsToCloud(): Promise<void> {
    await this.sync();
  }

  setAutoSync(enabled: boolean): void {
    this.autoSync = enabled;
    recordTestEvent('sync.auto', { enabled });
  }

  getStatus(): SyncStatus {
    return {
      connected: true,
      autoSyncEnabled: this.autoSync,
      lastSyncAt: this.lastSyncAt,
      pendingOperations: this.pendingOperations,
    };
  }
}
