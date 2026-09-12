/**
 * SyncCompletionService — bridges PowerSync lifecycle events to the
 * persisted sync stores (`useFamilySyncStore` / `useProfileSyncStore`).
 *
 * Single call site (mounted once at app boot via `main.tsx`) wires:
 *   - `initialized`    → `setLastSyncAt(now)` (replica snapshot applied)
 *   - `statusChanged`  → error / connecting → store state
 *
 * Both stores are updated on each event so `useSyncStatus` (the single
 * read-side source of truth consumed by `SyncStatusIndicator`) always
 * reflects the freshest state.
 *
 * Offline-safe: when PowerSync is not available yet the service polls
 * until a live instance appears, then attaches permanently.
 */

import { useFamilySyncStore } from '@/store/family-sync-store';
import { useProfileSyncStore } from '@/store/profile-sync-store';
import {
  peekPowerSyncDatabase,
} from '@/infrastructure/sync/powersync-database';
import type { CommonPowerSyncDatabase } from '@powersync/common';

type Subscribers = Array<() => void>;

let _subscribers: Subscribers | null = null;
let _pollTimer: ReturnType<typeof setTimeout> | null = null;

/** Attach to the PowerSync lifecycle. Idempotent — safe to call repeatedly. */
export function attachSyncCompletionHandlers(): void {
  if (_subscribers) return;

  const db = peekPowerSyncDatabase();
  if (db) {
    _subscribers = [attachToDb(db)];
    return;
  }

  // No live DB yet — retry on a short interval. PowerSync initialises
  // lazily on first write / read; once it does, `registerListener` works.
  const tryAttach = () => {
    if (_subscribers) return;
    const live = peekPowerSyncDatabase();
    if (!live) {
      _pollTimer = setTimeout(tryAttach, 2000);
      return;
    }
    _subscribers = [attachToDb(live)];
  };
  tryAttach();
}

/** Detach all lifecycle listeners. Inverse of `attachSyncCompletionHandlers`. */
export function detachSyncCompletionHandlers(): void {
  _subscribers?.forEach((fn) => fn());
  _subscribers = null;
  if (_pollTimer) {
    clearTimeout(_pollTimer);
    _pollTimer = null;
  }
}

function attachToDb(db: CommonPowerSyncDatabase): () => void {
  const listeners: Parameters<typeof db.registerListener>[0] = {
    initialized: () => {
      const now = Date.now();
      useFamilySyncStore.getState().setLastSyncAt(now);
      useFamilySyncStore.getState().setSyncError(null);
      useFamilySyncStore.getState().setSyncInProgress(false);
      useProfileSyncStore.getState().setLastSyncAt(now);
      useProfileSyncStore.getState().setSyncError(null);
      useProfileSyncStore.getState().setSyncInProgress(false);
    },
    statusChanged: (status) => {
      // PowerSync `SyncStatus`: { status: 'connecting' | 'connected' |
      // 'syncing' | 'error' | 'stopped', ... }
      const s = (status as { status?: string; message?: string })?.status;
      if (s === 'syncing' || s === 'connecting') {
        useFamilySyncStore.getState().setSyncInProgress(true);
        useProfileSyncStore.getState().setSyncInProgress(true);
      } else if (s === 'error') {
        const msg = (status as { message?: string })?.message ?? 'sync error';
        useFamilySyncStore.getState().setSyncError(msg);
        useProfileSyncStore.getState().setSyncError(msg);
      } else if (s === 'connected') {
        // Snapshot synced — treat as "last successful sync".
        const now = Date.now();
        useFamilySyncStore.getState().setLastSyncAt(now);
        useProfileSyncStore.getState().setLastSyncAt(now);
      }
    },
  };
  return db.registerListener(listeners);
}
