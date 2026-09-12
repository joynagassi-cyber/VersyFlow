/**
 * Memorization service composition — picks the PowerSync-backed service.
 *
 * This module is the single place that constructs a `MemorizationService`
 * for the review/memorization flow, so screens and hooks do not repeat the
 * wiring. It returns a {@link PowerSyncMemorizationService} that persists
 * through the PowerSync repository (the single SYNCED write path).
 *
 * The `userIdProvider` binds the record owner to the authenticated user via
 * the shared {@link getSyncUserIdProvider}.
 */

import { getFsrsEngine } from '@/services/fsrs-factory';
import { getSyncUserIdProvider } from '@/infrastructure/repository/powersync-repositories';
import { PowerSyncMemorizationService } from '@/services/powersync-memorization-service';

let _instance: PowerSyncMemorizationService | null = null;

export function getMemorizationService(profileId: string = 'default'): PowerSyncMemorizationService {
  if (!_instance) {
    _instance = new PowerSyncMemorizationService(
      getFsrsEngine(),
      profileId,
      async () => getSyncUserIdProvider().resolveUserId(),
    );
  }
  return _instance;
}
