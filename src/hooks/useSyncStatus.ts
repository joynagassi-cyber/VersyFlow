/**
 * useSyncStatus — Single source of truth for the app's sync state.
 *
 * Aggregates the PowerSync DB lifecycle (`registerListener({ initialized })`)
 * with the persisted sync stores (`useFamilySyncStore` / `useProfileSyncStore`)
 * and exposes a derived, token-only status. Screens consume THIS hook — they
 * never branch on `if (offline)` / `if (familyMode)` themselves.
 *
 * Offline-safe: the store values persist across a reload; the DB listener is
 * only attached when PowerSync has a live instance.
 */

import { useEffect, useMemo, useState } from 'react';
import { peekPowerSyncDatabase } from '@/infrastructure/sync/powersync-database';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { useProfileSyncStore } from '@/store/profile-sync-store';

export type SyncPhase = 'idle' | 'connecting' | 'ready' | 'error';

export interface SyncStatus {
  phase: SyncPhase;
  /** Last successful sync timestamp (unix ms) across family + profile stores */
  lastSyncAt: number | null;
  /** Aggregate error message, or null */
  error: string | null;
  /** How long ago the last sync happened (ms), null when never */
  elapsedMs: number | null;
  /** True when a PowerSync instance is initialised and ready */
  isReady: boolean;
}

export function useSyncStatus(): SyncStatus {
  const familyLastSyncAt = useFamilySyncStore((s) => s.lastSyncAt);
  const familySyncError = useFamilySyncStore((s) => s.syncError);
  const profileLastSyncAt = useProfileSyncStore((s) => s.lastSyncAt);
  const profileSyncError = useProfileSyncStore((s) => s.syncError);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const db = peekPowerSyncDatabase();
    if (!db) return;
    setDbReady(true);
    // Re-check on initialization so a late replica-ready event flips state.
    const unsub = db.registerListener({
      initialized: () => setDbReady(true),
    });
    return () => unsub();
  }, []);

  const lastSyncAt = useMemo(() => {
    if (familyLastSyncAt && profileLastSyncAt) return Math.max(familyLastSyncAt, profileLastSyncAt);
    return familyLastSyncAt ?? profileLastSyncAt ?? null;
  }, [familyLastSyncAt, profileLastSyncAt]);

  const error = familySyncError ?? profileSyncError ?? null;

  const phase: SyncPhase = error
    ? 'error'
    : dbReady && lastSyncAt
      ? 'ready'
      : dbReady
        ? 'connecting'
        : 'idle';

  const now = Date.now();
  const elapsedMs = lastSyncAt ? now - lastSyncAt : null;

  return { phase, lastSyncAt, error, elapsedMs, isReady: dbReady };
}
