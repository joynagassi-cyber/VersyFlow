/**
 * Repository composition root.
 *
 * Picks, per data mode, the adapter behind every domain repository port:
 *
 *   - `live` : PowerSync/SQLite adapters (`*RepositoryPowerSync`), the single
 *              cloud sync write path.
 *   - `mock` : in-browser adapters (`src/dev/mock/repositories.ts`) backed by
 *              localStorage, seeded with test data — no Supabase, no
 *              PowerSync, no network round-trip.
 *
 * Screens, hooks and domain services only ever see the interfaces
 * (`IMemorizationRepository`, `IReviewLogRepository`, …), so switching modes
 * is a one-line change in this file (and never leaks into the UI).
 *
 * Each repository is a lazy singleton — the first access creates it,
 * subsequent calls return the same instance (single-store invariant).
 */

import { getAuthService } from '@/auth';
import type { IAuthService } from '@/auth/types';
import { isMockMode } from '@/dev/mode';
import {
  CachingSyncUserIdProvider,
  type ISyncUserIdProvider,
} from '@/infrastructure/sync/sync-user-id-provider';
import { getMockUserId } from '@/dev/mock/identity';
import {
  MockFamilyInvitationRepository,
  MockFamilyRepository,
  MockLearnerProfileRepository,
  MockMemorizationRepository,
  MockReviewLogRepository,
  MockStreakRepository,
  MockTelemetryUploadPort,
  MockTranslationPreferenceRepository,
} from '@/dev/mock/repositories';
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
import {
  TelemetryEventsRepositoryPowerSync,
} from '@/infrastructure/telemetry/telemetry-events-repository-powersync';
import type { ITelemetryUploadPort } from '@/infrastructure/telemetry/upload-adapter';
import {
  StreakRepositoryPowerSync,
} from './streak-repository-powersync';
import {
  TranslationPreferenceRepositoryPowerSync,
  type ITranslationPreferenceRepository,
} from './translation-preference-repository-powersync';
import type { IStreakRepository } from '@/domains/streaks/repository';
import type { ILearnerProfileRepository } from '@/domains/learner-profile/repository';
import type { IFamilyRepository } from '@/domains/family/repository';
import type { IFamilyInvitationRepository } from '@/domains/family-invitation/repository';

// ------------------------------------------------------------------
// Auth + user id
// ------------------------------------------------------------------

function authService(): IAuthService {
  return getAuthService();
}

let _userIdProvider: ISyncUserIdProvider | null = null;

/**
 * Resolves the `user_id` used to scope every local write.
 *
 * - live : the Supabase session user (cached per session).
 * - mock : the local identity's stable id — available immediately, so the
 *          app is usable (and writable) even before the login screen.
 */
export function getSyncUserIdProvider(): ISyncUserIdProvider {
  if (!_userIdProvider) {
    if (isMockMode()) {
      _userIdProvider = new CachingSyncUserIdProvider(async () => getMockUserId());
    } else {
      _userIdProvider = new CachingSyncUserIdProvider(async () => {
        const user = await authService().getCurrentUser();
        return user?.id ?? null;
      });
    }
  }
  return _userIdProvider;
}

/**
 * Invalidate the cached user id. Call on logout so that no in-flight
 * write can resolve a stale user id after sign-out.
 * The next `resolveUserId()` call re-fetches the identity.
 */
export function invalidateSyncUserIdProvider(): void {
  if (_userIdProvider instanceof CachingSyncUserIdProvider) {
    _userIdProvider.invalidate();
  }
}

// ------------------------------------------------------------------
// Repository singletons (mode-aware)
// ------------------------------------------------------------------

let _memorizationRepo: IMemorizationRepository | null = null;
export function getMemorizationRepository(): IMemorizationRepository {
  if (!_memorizationRepo) {
    _memorizationRepo = isMockMode()
      ? new MockMemorizationRepository()
      : new MemorizationRepositoryPowerSync(getSyncUserIdProvider());
  }
  return _memorizationRepo;
}

let _reviewLogRepo: IReviewLogRepository | null = null;
export function getReviewLogRepository(): IReviewLogRepository {
  if (!_reviewLogRepo) {
    _reviewLogRepo = isMockMode()
      ? new MockReviewLogRepository()
      : new ReviewLogRepositoryPowerSync(getSyncUserIdProvider());
  }
  return _reviewLogRepo;
}

let _familyRepo: IFamilyRepository | null = null;
export function getFamilyRepository(): IFamilyRepository {
  if (!_familyRepo) {
    _familyRepo = isMockMode()
      ? new MockFamilyRepository()
      : new FamilyRepositoryPowerSync(getSyncUserIdProvider());
  }
  return _familyRepo;
}

let _familyInvitationRepo: IFamilyInvitationRepository | null = null;
export function getFamilyInvitationRepository(): IFamilyInvitationRepository {
  if (!_familyInvitationRepo) {
    _familyInvitationRepo = isMockMode()
      ? new MockFamilyInvitationRepository()
      : new FamilyInvitationRepositoryPowerSync(getSyncUserIdProvider());
  }
  return _familyInvitationRepo;
}

let _learnerProfileRepo: ILearnerProfileRepository | null = null;
export function getLearnerProfileRepository(): ILearnerProfileRepository {
  if (!_learnerProfileRepo) {
    _learnerProfileRepo = isMockMode()
      ? new MockLearnerProfileRepository()
      : new LearnerProfileRepositoryPowerSync(getSyncUserIdProvider());
  }
  return _learnerProfileRepo;
}

let _telemetryUploadPort: ITelemetryUploadPort | null = null;
export function getTelemetryUploadPort(): ITelemetryUploadPort {
  if (!_telemetryUploadPort) {
    _telemetryUploadPort = isMockMode()
      ? new MockTelemetryUploadPort()
      : new TelemetryEventsRepositoryPowerSync(getSyncUserIdProvider());
  }
  return _telemetryUploadPort;
}

let _streakRepo: IStreakRepository | null = null;
export function getStreakRepository(): IStreakRepository {
  if (!_streakRepo) {
    _streakRepo = isMockMode()
      ? new MockStreakRepository()
      : new StreakRepositoryPowerSync(getSyncUserIdProvider());
  }
  return _streakRepo;
}

let _translationPreferenceRepo: ITranslationPreferenceRepository | null = null;
export function getTranslationPreferenceRepository(): ITranslationPreferenceRepository {
  if (!_translationPreferenceRepo) {
    _translationPreferenceRepo = isMockMode()
      ? new MockTranslationPreferenceRepository()
      : new TranslationPreferenceRepositoryPowerSync(getSyncUserIdProvider());
  }
  return _translationPreferenceRepo;
}
