/**
 * useFamilySyncBridge — reactive bridge from PowerSync to
 * `useFamilySyncStore`.
 *
 * Subscribes to a watched `SELECT * FROM families WHERE owner_id = ?` query
 * so the store is re-hydrated whenever the local SQLite table changes
 * (sync pulled new families, a local CRUD op committed). Also re-loads on
 * the PowerSync `initialized` event so a replica refresh shows up in the
 * store.
 *
 * Offline-safe: when there is no user session the hook loads nothing and
 * the store keeps its persisted contents.
 */

import { useEffect } from 'react';
import { getPowerSyncDatabase, peekPowerSyncDatabase } from '@/infrastructure/sync/powersync-database';
import { getSyncUserIdProvider } from '@/infrastructure/repository/powersync-repositories';
import { useFamilySyncStore } from '@/store/family-sync-store';
import type { Family } from '@/domains/family';

/** Load the user's families into the store. */
async function loadFamiliesIntoStore(userId: string): Promise<void> {
  const db = getPowerSyncDatabase();
  const rows = await db.getAll<Family>(
    'SELECT * FROM families WHERE owner_id = ? ORDER BY created_at DESC',
    [userId],
  );
  useFamilySyncStore.getState().setFamilies(rows);
  useFamilySyncStore.getState().setLastSyncAt(Date.now());
}

export function useFamilySyncBridge(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let disposeWatcher: (() => void) | null = null;
    let disposeDbListener: (() => void) | null = null;

    async function init() {
      const userId = await getSyncUserIdProvider().resolveUserId();
      if (cancelled || !userId) return;

      try {
        await loadFamiliesIntoStore(userId);
      } catch (error) {
        useFamilySyncStore.getState().setSyncError(String(error));
        return;
      }

      // Watched query: re-emits whenever the families table changes.
      const db = peekPowerSyncDatabase();
      if (db) {
        const watched = db
          .query<Family>({
            sql: 'SELECT * FROM families WHERE owner_id = ?',
            parameters: [userId],
          })
          .watch();

        disposeWatcher = watched.registerListener({
          onData: (data) => {
            if (cancelled) return;
            useFamilySyncStore.getState().setFamilies([...data]);
            useFamilySyncStore.getState().setLastSyncAt(Date.now());
          },
        });

        // Reload when PowerSync finishes initializing (replica ready).
        disposeDbListener = db.registerListener({
          initialized: () => {
            if (!cancelled) void loadFamiliesIntoStore(userId);
          },
        });

        return () => {
          if (cancelled) return;
          cancelled = true;
          disposeWatcher?.();
          watched.close().catch(() => {});
          disposeDbListener?.();
        };
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
