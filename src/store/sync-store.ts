/**
 * Sync Store — Zustand store exposing the PowerSync sync service to the UI.
 *
 * Holds the single `ISyncService` instance (PowerSync) and mirrors its status
 * for the UI (e.g. a sync indicator in the app bar).
 */

import { create } from 'zustand';
import type { ISyncService, SyncStatus } from '@/sync/ISyncService';
import { PowerSyncSyncService } from '@/sync/PowerSyncSyncService';
import { SupabaseAuthService } from '@/auth';
import { getSyncUserIdProvider } from '@/infrastructure/repository/powersync-repositories';
import { migrateMmkvToPowerSync } from '@/sync/migration-mmkv-powersync';

const POWERSYNC_URL = import.meta.env.VITE_POWERSYNC_URL || import.meta.env.POWERSYNC_URL;

const authService = new SupabaseAuthService();

/**
 * The app's single sync service. PowerSync is the only sync implementation.
 * Exported so composition roots (and tests) can access it without re-creating
 * the instance.
 */
export const syncService: ISyncService = new PowerSyncSyncService(
  authService,
  POWERSYNC_URL ?? '',
);

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
   * No-op if already ran, or if there is no authenticated user.
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
  isConfigured: (syncService as PowerSyncSyncService).isConfigured(),
  isLive: (syncService as PowerSyncSyncService).isLive(),

  refreshStatus: () => set({ status: syncService.getStatus() }),

  setAutoSync: (enabled) => {
    syncService.setAutoSync(enabled);
    set({ status: syncService.getStatus() });
  },

  syncNow: async () => {
    // Resolve the current user before opening the user-scoped on-demand
    // streams (O-1). If there is no session, `sync()` still runs but the
    // streams will receive no rows (RLS + `user_id = auth.user_id()`).
    const userId = await getSyncUserIdProvider().resolveUserId();
    if (userId) {
      await (syncService as PowerSyncSyncService).startUserStreams(userId);
    }
    await syncService.sync();
    set({ status: syncService.getStatus() });
  },

  runMmkvMigrationOnce: async () => {
    if (mmkvMigrationRan) {
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
