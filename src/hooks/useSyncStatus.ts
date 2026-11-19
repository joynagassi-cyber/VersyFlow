/**
 * useSyncStatus — Single source of truth for the app's sync state.
 *
 * VersyFlow is local-only: "sync" is the snapshot pushed to the local test
 * collector, so the phase is derived from the persisted sync stores
 * (`useFamilySyncStore` / `useProfileSyncStore`) rather than from a network
 * connection. Screens consume THIS hook — they never branch on transport
 * details themselves.
 */

import { useMemo } from 'react';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { useProfileSyncStore } from '@/store/profile-sync-store';

export type SyncPhase = 'idle' | 'connecting' | 'ready' | 'error';

export interface SyncStatus {
  phase: SyncPhase;
  /** Last successful local snapshot timestamp (unix ms) across both stores */
  lastSyncAt: number | null;
  /** Aggregate error message, or null */
  error: string | null;
  /** How long ago the last sync happened (ms), null when never */
  elapsedMs: number | null;
  /** True when the local store is initialised and ready */
  isReady: boolean;
}

export function useSyncStatus(): SyncStatus {
  const familyLastSyncAt = useFamilySyncStore((s) => s.lastSyncAt);
  const familySyncError = useFamilySyncStore((s) => s.syncError);
  const familyInProgress = useFamilySyncStore((s) => s.syncInProgress);
  const profileLastSyncAt = useProfileSyncStore((s) => s.lastSyncAt);
  const profileSyncError = useProfileSyncStore((s) => s.syncError);
  const profileInProgress = useProfileSyncStore((s) => s.syncInProgress);

  return useMemo(() => {
    const error = familySyncError ?? profileSyncError ?? null;
    const lastSyncAt = Math.max(familyLastSyncAt ?? 0, profileLastSyncAt ?? 0) || null;
    const phase: SyncPhase = error
      ? 'error'
      : familyInProgress || profileInProgress
        ? 'connecting'
        : lastSyncAt
          ? 'ready'
          : 'idle';
    return {
      phase,
      lastSyncAt,
      error,
      elapsedMs: lastSyncAt ? Date.now() - lastSyncAt : null,
      isReady: phase === 'ready',
    };
  }, [familyLastSyncAt, profileLastSyncAt, familySyncError, profileSyncError, familyInProgress, profileInProgress]);
}
