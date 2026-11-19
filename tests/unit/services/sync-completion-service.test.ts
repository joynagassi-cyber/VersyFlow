/**
 * SyncCompletionService — stamps both persisted sync stores.
 *
 * Local-only app: "sync completed" means the browser store accepted the write,
 * so the service must leave `useSyncStatus` with a timestamp for both stores
 * and no lingering error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  attachSyncCompletionHandlers,
  detachSyncCompletionHandlers,
} from '@/services/sync-completion-service';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { useProfileSyncStore } from '@/store/profile-sync-store';

describe('SyncCompletionService', () => {
  beforeEach(() => {
    detachSyncCompletionHandlers();
    vi.restoreAllMocks();
  });

  it('stamps both stores as freshly synced, with no error', () => {
    const family = vi.spyOn(useFamilySyncStore.getState(), 'setLastSyncAt');
    const familyError = vi.spyOn(useFamilySyncStore.getState(), 'setSyncError');
    const profile = vi.spyOn(useProfileSyncStore.getState(), 'setLastSyncAt');
    const profileError = vi.spyOn(useProfileSyncStore.getState(), 'setSyncError');

    attachSyncCompletionHandlers();

    expect(family).toHaveBeenCalledWith(expect.any(Number));
    expect(profile).toHaveBeenCalledWith(expect.any(Number));
    expect(familyError).toHaveBeenCalledWith(null);
    expect(profileError).toHaveBeenCalledWith(null);
  });

  it('is idempotent — a second call does not re-stamp', () => {
    const family = vi.spyOn(useFamilySyncStore.getState(), 'setLastSyncAt');
    attachSyncCompletionHandlers();
    attachSyncCompletionHandlers();
    expect(family).toHaveBeenCalledTimes(1);
  });

  it('detach lets the next attach run again', () => {
    const family = vi.spyOn(useFamilySyncStore.getState(), 'setLastSyncAt');
    attachSyncCompletionHandlers();
    detachSyncCompletionHandlers();
    attachSyncCompletionHandlers();
    expect(family).toHaveBeenCalledTimes(2);
  });
});
