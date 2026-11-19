/**
 * Memorization service composition — the single place that constructs the
 * service used by the review and memorization flows.
 *
 * Returns a {@link LocalMemorizationService} that persists through the
 * memorization repository (the single write path), bound to the active
 * identity via `getSyncUserIdProvider()`.
 *
 * A module-level instance is shared across profiles: the `profileId` only
 * feeds the parent's local bookkeeping, while the repository write is
 * uniform — per-profile caching would not produce different behaviour.
 */

import { getFsrsEngine } from '@/services/fsrs-factory';
import { getSyncUserIdProvider } from '@/infrastructure/repository/mode-repositories';
import { LocalMemorizationService } from '@/services/local-memorization-service';

let _instance: LocalMemorizationService | null = null;

export function getMemorizationService(profileId: string = 'default'): LocalMemorizationService {
  if (!_instance) {
    _instance = new LocalMemorizationService(
      getFsrsEngine(),
      profileId,
      async () => getSyncUserIdProvider().resolveUserId(),
    );
  }
  return _instance;
}
