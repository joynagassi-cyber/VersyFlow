/**
 * powersync-repositories — Composition root for PowerSync-backed repositories.
 *
 * Builds every PowerSync repository on a shared `ISyncUserIdProvider` wired
 * to `SupabaseAuthService`. The provider caches the last resolved user id so
 * that repeated writes within a session do not hit `getSession()`.
 *
 * Each repository is exported as a lazy singleton — the first access
 * creates it, subsequent calls return the same instance. This matches the
 * single-sync invariant (one PowerSync DB, one set of repositories).
 */

import { SupabaseAuthService } from '@/auth';
import {
  CachingSyncUserIdProvider,
  type ISyncUserIdProvider,
} from '@/infrastructure/sync/sync-user-id-provider';
import {
  MemorizationRepositoryPowerSync,
  type IMemorizationRepository,
} from './memorization-repository-powersync';
import {
  ReviewLogRepositoryPowerSync,
  type IReviewLogRepository,
} from './review-log-repository-powersync';
import {
  FamilyRepositoryPowerSync,
} from './family-repository-powersync';
import {
  FamilyInvitationRepositoryPowerSync,
} from './family-invitation-repository-powersync';
import {
  LearnerProfileRepositoryPowerSync,
} from './learner-profile-repository-powersync';

let _auth: SupabaseAuthService | null = null;
function getAuthService(): SupabaseAuthService {
  if (!_auth) _auth = new SupabaseAuthService();
  return _auth;
}

let _userIdProvider: ISyncUserIdProvider | null = null;
export function getSyncUserIdProvider(): ISyncUserIdProvider {
  if (!_userIdProvider) {
    _userIdProvider = new CachingSyncUserIdProvider(async () => {
      const user = await getAuthService().getCurrentUser();
      return user?.id ?? null;
    });
  }
  return _userIdProvider;
}

// ------------------------------------------------------------------
// Repository singletons
// ------------------------------------------------------------------

let _memorizationRepo: IMemorizationRepository | null = null;
export function getMemorizationRepository(): IMemorizationRepository {
  if (!_memorizationRepo) {
    _memorizationRepo = new MemorizationRepositoryPowerSync(
      getSyncUserIdProvider(),
    );
  }
  return _memorizationRepo;
}

let _reviewLogRepo: IReviewLogRepository | null = null;
export function getReviewLogRepository(): IReviewLogRepository {
  if (!_reviewLogRepo) {
    _reviewLogRepo = new ReviewLogRepositoryPowerSync(
      getSyncUserIdProvider(),
    );
  }
  return _reviewLogRepo;
}

let _familyRepo: FamilyRepositoryPowerSync | null = null;
export function getFamilyRepository(): FamilyRepositoryPowerSync {
  if (!_familyRepo) {
    _familyRepo = new FamilyRepositoryPowerSync(getSyncUserIdProvider());
  }
  return _familyRepo;
}

let _familyInvitationRepo: FamilyInvitationRepositoryPowerSync | null = null;
export function getFamilyInvitationRepository(): FamilyInvitationRepositoryPowerSync {
  if (!_familyInvitationRepo) {
    _familyInvitationRepo = new FamilyInvitationRepositoryPowerSync(
      getSyncUserIdProvider(),
    );
  }
  return _familyInvitationRepo;
}

let _learnerProfileRepo: LearnerProfileRepositoryPowerSync | null = null;
export function getLearnerProfileRepository(): LearnerProfileRepositoryPowerSync {
  if (!_learnerProfileRepo) {
    _learnerProfileRepo = new LearnerProfileRepositoryPowerSync(
      getSyncUserIdProvider(),
    );
  }
  return _learnerProfileRepo;
}
