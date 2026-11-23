/**
 * useProfileSyncBridge — reactive bridge from the local store to
 * `useProfileSyncStore`.
 *
 * Reloads the account's learner profiles on mount and whenever the local
 * store changes, so a profile created or renamed anywhere in the app shows up
 * in the switcher without a reload.
 *
 * Offline-safe: when there is no user identity the hook loads nothing and the
 * store keeps its persisted contents.
 */

import { useEffect } from 'react';
import { mockDb } from '@/dev/mock/db';
import { getLearnerProfileRepository, getSyncUserIdProvider } from '@/infrastructure/repository/mode-repositories';
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
    let disposeStoreListener: (() => void) | null = null;

    async function init() {
      const userId = await getSyncUserIdProvider().resolveUserId();
      if (cancelled || !userId) return;

      try {
        await loadProfilesIntoStore(userId);
      } catch (error) {
        useProfileSyncStore.getState().setSyncError(String(error));
        return;
      }

      disposeStoreListener = mockDb.subscribe(() => {
        if (!cancelled) void loadProfilesIntoStore(userId);
      });
    }

    void init();
    return () => {
      cancelled = true;
      disposeStoreListener?.();
    };
  }, [enabled]);
}
