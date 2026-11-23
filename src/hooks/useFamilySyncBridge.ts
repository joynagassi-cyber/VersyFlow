/**
 * useFamilySyncBridge — reactive bridge from the data layer to
 * `useFamilySyncStore`.
 *
 * The families are read through the family repository (local adapter) and
 * re-read whenever the local store emits a change — so an invite, a member
 * added elsewhere in the app, or a fresh seed shows up without a reload.
 *
 * Offline-safe: when there is no user identity the hook loads nothing and the
 * store keeps its persisted contents.
 */

import { useEffect } from 'react';
import { mockDb } from '@/dev/mock/db';
import {
  getFamilyRepository,
  getSyncUserIdProvider,
} from '@/infrastructure/repository/mode-repositories';
import { useFamilySyncStore } from '@/store/family-sync-store';

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
    let disposeStoreListener: (() => void) | null = null;

    async function init() {
      const userId = await getSyncUserIdProvider().resolveUserId();
      if (cancelled || !userId) return;

      try {
        await loadFamiliesIntoStore(userId);
      } catch (error) {
        useFamilySyncStore.getState().setSyncError(String(error));
        return;
      }

      // Re-hydrate whenever a local write lands (add member, invite, …).
      disposeStoreListener = mockDb.subscribe(() => {
        if (!cancelled) void loadFamiliesIntoStore(userId);
      });
    }

    void init();
    return () => {
      cancelled = true;
      disposeStoreListener?.();
    };
  }, [enabled]);
}
