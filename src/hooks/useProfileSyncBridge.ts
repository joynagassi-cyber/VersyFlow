/**
 * useProfileSyncBridge — reactive bridge from PowerSync to
 * `useProfileSyncStore`.
 *
 * Subscribes to a watched `SELECT * FROM learner_profiles WHERE user_id = ?`
 * query so the store is re-hydrated whenever a local SQLite table change
 * happens (sync pull, local CRUD). Also re-loads on the PowerSync
 * `initialized` event so a replica refresh shows up in the store.
 *
 * Offline-safe: when there is no user session the hook loads nothing and
 * the store keeps its persisted contents.
 */

import { useEffect } from 'react';
import { peekPowerSyncDatabase } from '@/infrastructure/sync/powersync-database';
import { getLearnerProfileRepository, getSyncUserIdProvider } from '@/infrastructure/repository/powersync-repositories';
import { useProfileSyncStore } from '@/store/profile-sync-store';

/** Load the user's learner profiles into the store. */
async function loadProfilesIntoStore(userId: string): Promise<void> {
  const profiles = await getLearnerProfileRepository().findByAccountId(userId);
  const store = useProfileSyncStore.getState();
  store.setProfiles(profiles);
  store.autoSelectIfSingle();
  store.setLastSyncAt(Date.now());
}

export function useProfileSyncBridge(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let disposeWatcher: (() => void) | null = null;
    let disposeDbListener: (() => void) | null = null;

    async function init() {
      const userId = await getSyncUserIdProvider().resolveUserId();
      if (cancelled || !userId) return;

      try {
        await loadProfilesIntoStore(userId);
      } catch (error) {
        useProfileSyncStore.getState().setSyncError(String(error));
        return;
      }

      // Watched query: re-emits whenever the learner_profiles table changes.
      const db = peekPowerSyncDatabase();
      if (db) {
        const watched = db
          .query({
            sql: 'SELECT * FROM learner_profiles WHERE user_id = ?',
            parameters: [userId],
          })
          .watch();

        disposeWatcher = watched.registerListener({
          onData: async () => {
            if (cancelled) return;
            await loadProfilesIntoStore(userId);
          },
        });

        // Reload when PowerSync finishes initializing (replica ready).
        disposeDbListener = db.registerListener({
          initialized: () => {
            if (!cancelled) void loadProfilesIntoStore(userId);
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
