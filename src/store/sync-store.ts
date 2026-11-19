/**
 * Sync Store — Zustand store exposing the app's sync service to the UI.
 *
 * VersyFlow is frontend-only: there is no cloud to talk to, so "sync" means
 * "push a snapshot of the browser store to the local test collector" and
 * report a friendly status. The store keeps the same shape it had when a
 * backend existed, so the sync indicator and the settings screen keep working
 * unchanged — and a future backend only has to swap the service instance.
 */

import { create } from 'zustand';
import type { ISyncService, SyncStatus } from '@/sync/ISyncService';
import { MockSyncService } from '@/dev/mock/sync';
import { recordTestEvent } from '@/dev/local-backend';

/**
 * The app's single sync service. Exported so composition roots (and tests)
 * can access it without re-creating the instance.
 */
export const syncService: ISyncService = new MockSyncService();

/** Legacy MMKV → cloud migration: there is no cloud, so nothing to migrate. */
let mmkvMigrationRan = false;

export interface SyncStore {
  status: SyncStatus;
  isConfigured: boolean;
  isLive: boolean;
  refreshStatus: () => void;
  setAutoSync: (enabled: boolean) => void;
  syncNow: () => Promise<void>;
  /**
   * Kept for callers that still ask: there is no cloud replica to migrate
   * into, so this resolves to `{0, 0}` once per session.
   */
  runMmkvMigrationOnce: () => Promise<{ migratedRecords: number; migratedLogs: number }>;
  /** Reset the "already ran" flag. Call on logout. */
  invalidateMigration: () => void;
}

export const useSyncStore = create<SyncStore>()((set) => ({
  status: syncService.getStatus(),
  // The browser store IS the backend here, so the service is always
  // configured — and never "live": nothing leaves the device.
  isConfigured: true,
  isLive: false,

  refreshStatus: () => set({ status: syncService.getStatus() }),

  setAutoSync: (enabled) => {
    syncService.setAutoSync(enabled);
    set({ status: syncService.getStatus() });
  },

  syncNow: async () => {
    await syncService.sync();
    set({ status: syncService.getStatus() });
  },

  runMmkvMigrationOnce: async () => {
    if (mmkvMigrationRan) {
      return { migratedRecords: 0, migratedLogs: 0 };
    }
    // No cloud replica to reconcile with: the browser store is the only
    // store, so there is nothing to migrate and nothing to strand.
    mmkvMigrationRan = true;
    recordTestEvent('sync.migration.skipped', { reason: 'local-only' });
    return { migratedRecords: 0, migratedLogs: 0 };
  },

  invalidateMigration: () => {
    mmkvMigrationRan = false;
  },
}));
