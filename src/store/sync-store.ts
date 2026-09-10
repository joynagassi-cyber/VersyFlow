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

const POWERSYNC_URL = (import.meta.env.VITE_POWERSYNC_URL || import.meta.env.POWERSYNC_URL) as
  | string
  | undefined;

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

export interface SyncStore {
  status: SyncStatus;
  isConfigured: boolean;
  refreshStatus: () => void;
  setAutoSync: (enabled: boolean) => void;
  syncNow: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>()((set, get) => ({
  status: syncService.getStatus(),
  isConfigured: Boolean(POWERSYNC_URL),

  refreshStatus: () => set({ status: syncService.getStatus() }),

  setAutoSync: (enabled) => {
    syncService.setAutoSync(enabled);
    set({ status: syncService.getStatus() });
  },

  syncNow: async () => {
    await syncService.sync();
    set({ status: syncService.getStatus() });
  },
}));
