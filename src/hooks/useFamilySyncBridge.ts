/**
 * useFamilySyncBridge — reactive bridge from the data layer to
 * `useFamilySyncStore`.
 *
 * Live mode: subscribes to a watched `SELECT * FROM families WHERE owner_id = ?`
 * query so the store is re-hydrated whenever the local SQLite table changes
 * (sync pulled new families, a local CRUD op committed), and reloads on the
 * PowerSync `initialized` event.
 *
 * Mock mode: no SQL replica exists, so the families are read through the
 * family repository (mock adapter) and re-read whenever the mock DB emits a
 * change — the same store shape, without PowerSync.
 *
 * Offline-safe: when there is no user session the hook loads nothing and
 * the store keeps its persisted contents.
 */

import { useEffect } from 'react';
import { isMockMode } from '@/dev/mode';
import { mockDb } from '@/dev/mock/db';
import { peekPowerSyncDatabase } from '@/infrastructure/sync/powersync-database';
import {
  getFamilyRepository,
  getSyncUserIdProvider,
} from '@/infrastructure/repository/powersync-repositories';
import { useFamilySyncStore } from '@/store/family-sync-store';
import type { Family } from '@/domains/family';

/** Load the user's families into the store. */
async function loadFamiliesIntoStore(userId: string): Promise<void> {
  const families = await getFamilyRepository().findByOwnerId(userId);
  useFamilySyncStore.getState().setFamilies(families);
  useFamilySyncStore.getState().setLastSyncAt(Date.now());
}

export function useFamilySyncBridge(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let disposeWatcher: (() => void) | null = null;
    let disposeDbListener: (() => void) | null = null;
    let disposeMockListener: (() => void) | null = null;
    let closeWatcher: (() => void) | null = null;

    async function init() {
      const userId = await getSyncUserIdProvider().resolveUserId();
      if (cancelled || !userId) return;

      try {
        await loadFamiliesIntoStore(userId);
      } catch (error) {
        useFamilySyncStore.getState().setSyncError(String(error));
        return;
      }

      if (isMockMode()) {
        // Re-hydrate whenever a mock write lands (add member, invite, …).
        disposeMockListener = mockDb.subscribe(() => {
          if (!cancelled) void loadFamiliesIntoStore(userId);
        });
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

        closeWatcher = () => {
          void watched.close().catch(() => {});
        };
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
      }
    }

    void init();
    return () => {
      cancelled = true;
      disposeWatcher?.();
      closeWatcher?.();
      disposeDbListener?.();
      disposeMockListener?.();
    };
  }, [enabled]);
}
