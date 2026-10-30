/**
 * Sync Store — Zustand store exposing the app's sync service to the UI.
 *
 * Holds the single `ISyncService` instance and mirrors its status for the UI
 * (sync indicator in the app bar, settings screen).
 *
 * Two implementations, picked at boot by the data mode:
 *   - live : `PowerSyncSyncService` (Supabase ↔ PowerSync, cloud sync)
 *   - mock : `MockSyncService` (no cloud — pushes a snapshot to the local
 *            test collector so manual sessions can be inspected)
 */

import { create } from 'zustand';
import type { ISyncService, SyncStatus } from '@/sync/ISyncService';
import { isMockMode } from '@/dev/mode';
import { MockSyncService } from '@/dev/mock/sync';
import { getAuthService } from '@/auth';
import { recordTestEvent } from '@/dev/local-backend';
import { PowerSyncSyncService } from '@/sync/PowerSyncSyncService';
import { getSyncUserIdProvider } from '@/infrastructure/repository/powersync-repositories';
import { migrateMmkvToPowerSync } from '@/sync/migration-mmkv-powersync';

const POWERSYNC_URL = import.meta.env.VITE_POWERSYNC_URL || import.meta.env.POWERSYNC_URL;

function createSyncService(): ISyncService {
  if (isMockMode()) return new MockSyncService();
  return new PowerSyncSyncService(getAuthService(), POWERSYNC_URL ?? '');
}

/**
 * The app's single sync service. Exported so composition roots (and tests)
 * can access it without re-creating the instance.
 */
export const syncService: ISyncService = createSyncService();

/** Live-only capabilities, absent on the mock implementation. */
function liveSyncService(): PowerSyncSyncService | null {
  return syncService instanceof PowerSyncSyncService ? syncService : null;
}

/**
 * Module-level flag for the idempotent MMKV → PowerSync migration.
 * `true` when the migration has run successfully for the current session.
 * Reset to `false` on `invalidate` / logout so the next login re-runs it.
 */
let mmkvMigrationRan = false;

export interface SyncStore {
  status: SyncStatus;
  isConfigured: boolean;
  isLive: boolean;
  refreshStatus: () => void;
  setAutoSync: (enabled: boolean) => void;
  syncNow: () => Promise<void>;
  /**
   * Run the idempotent MMKV → PowerSync migration once per session.
   * No-op if already ran, if there is no authenticated user, or in mock mode.
   * Returns the number of records/logs migrated (0 when nothing to do).
   */
  runMmkvMigrationOnce: () => Promise<{ migratedRecords: number; migratedLogs: number }>;
  /** Reset the "already ran" flag. Call on logout. */
  invalidateMigration: () => void;
}

export const useSyncStore = create<SyncStore>()((set, get) => ({
  status: syncService.getStatus(),
  // Honesty (O-3): a configured service must actually point at a PowerSync
  // endpoint; an empty URL means "not configured", not "configured but offline".
  // Mock mode is always "configured": the browser store is the backend.
  isConfigured: isMockMode()
    ? true
    : (liveSyncService()?.isConfigured() ?? false),
  isLive: !isMockMode() && (liveSyncService()?.isLive() ?? false),

  refreshStatus: () => set({ status: syncService.getStatus() }),

  setAutoSync: (enabled) => {
    syncService.setAutoSync(enabled);
    set({ status: syncService.getStatus() });
  },

  syncNow: async () => {
    // Resolve the current user before opening the user-scoped on-demand
    // streams (O-1). In mock mode there is no stream — the mock service
    // simply snapshots the local store.
    const live = liveSyncService();
    if (live) {
      const userId = await getSyncUserIdProvider().resolveUserId();
      if (userId) await live.startUserStreams(userId);
    }
    await syncService.sync();
    set({ status: syncService.getStatus() });
  },

  runMmkvMigrationOnce: async () => {
    if (mmkvMigrationRan) {
      return { migratedRecords: 0, migratedLogs: 0 };
    }
    // Mock mode has no legacy MMKV data to reconcile with a cloud replica.
    if (isMockMode()) {
      mmkvMigrationRan = true;
      recordTestEvent('sync.migration.skipped', { reason: 'mock-mode' });
      return { migratedRecords: 0, migratedLogs: 0 };
    }
    const result = await migrateMmkvToPowerSync(getSyncUserIdProvider());
    if (result.migratedRecords > 0 || result.migratedLogs > 0) {
      mmkvMigrationRan = true;
      // Sync the migrated rows to the cloud so the user's legacy data is
      // not left stranded in MMKV on the next device.
      await get().syncNow();
    }
    return {
      migratedRecords: result.migratedRecords,
      migratedLogs: result.migratedLogs,
    };
  },

  invalidateMigration: () => {
    mmkvMigrationRan = false;
  },
}));
