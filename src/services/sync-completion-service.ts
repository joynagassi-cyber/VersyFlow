/**
 * SyncCompletionService — marks the persisted sync stores as fresh.
 *
 * Local-only app: there is no replica to wait for, so "sync completed" means
 * the browser store was written successfully. Mounted once at app boot via
 * `main.tsx`, it stamps both stores (`useFamilySyncStore` /
 * `useProfileSyncStore`) so `useSyncStatus` — the single read-side source of
 * truth consumed by `SyncStatusIndicator` — always has a timestamp to show.
 */

import { useFamilySyncStore } from '@/store/family-sync-store';
import { useProfileSyncStore } from '@/store/profile-sync-store';

let _attached = false;

/** Stamp both stores as synced. Idempotent — safe to call repeatedly. */
export function attachSyncCompletionHandlers(): void {
  if (_attached) return;
  _attached = true;
  const now = Date.now();
  useFamilySyncStore.getState().setLastSyncAt(now);
  useFamilySyncStore.getState().setSyncError(null);
  useProfileSyncStore.getState().setLastSyncAt(now);
  useProfileSyncStore.getState().setSyncError(null);
}

/** Inverse of `attachSyncCompletionHandlers`. */
export function detachSyncCompletionHandlers(): void {
  _attached = false;
}
