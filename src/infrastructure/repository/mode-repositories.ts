/**
 * Repository composition root — the single place that decides where data
 * lives.
 *
 * VersyFlow is frontend-only: every port is implemented by the local
 * (browser, localStorage-backed, seed-filled) adapters in
 * `src/dev/mock/repositories.ts`. Screens, hooks and domain services only see
 * the interfaces in `./ports`, so a future backend is a change to THIS file
 * and nothing else.
 *
 * Each repository is a lazy singleton — the first access creates it,
 * subsequent calls return the same instance (single-store invariant).
 */

import { getAuthService } from '@/auth';
import type { IAuthService } from '@/auth/types';
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
import type {
  IMemorizationRepository,
  IReviewLogRepository,
  ITranslationPreferenceRepository,
} from './ports';
import type { ITelemetryUploadPort } from '@/infrastructure/telemetry/upload-adapter';
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

export interface IUserIdProvider {
  /** The owning `user_id` for local writes, or `null` when signed out. */
  resolveUserId: () => Promise<string | null>;
  /** Drop the cached value (call on logout). */
  invalidate: () => void;
}

class CachingUserIdProvider implements IUserIdProvider {
  private cached: string | null = null;
  private resolved = false;

  constructor(private readonly read: () => Promise<string | null>) {}

  async resolveUserId(): Promise<string | null> {
    if (this.resolved) return this.cached;
    try {
      this.cached = await this.read();
      this.resolved = true;
    } catch {
      return null;
    }
    return this.cached;
  }

  invalidate(): void {
    this.cached = null;
    this.resolved = false;
  }
}

let _userIdProvider: IUserIdProvider | null = null;

/**
 * Resolves the `user_id` used to scope every local write.
 *
 * The identity is available immediately (the local one is created on first
 * boot), so the app is usable — and writable — before any account screen.
 */
export function getSyncUserIdProvider(): IUserIdProvider {
  if (!_userIdProvider) {
    _userIdProvider = new CachingUserIdProvider(async () => {
      const user = await authService().getCurrentUser();
      return user?.id ?? getMockUserId();
    });
  }
  return _userIdProvider;
}

/**
 * Invalidate the cached user id. Call on logout so that no in-flight
 * write can resolve a stale user id after sign-out.
 */
export function invalidateSyncUserIdProvider(): void {
  _userIdProvider?.invalidate();
}

// ------------------------------------------------------------------
// Repository singletons
// ------------------------------------------------------------------

let _memorizationRepo: IMemorizationRepository | null = null;
export function getMemorizationRepository(): IMemorizationRepository {
  if (!_memorizationRepo) _memorizationRepo = new MockMemorizationRepository();
  return _memorizationRepo;
}

let _reviewLogRepo: IReviewLogRepository | null = null;
export function getReviewLogRepository(): IReviewLogRepository {
  if (!_reviewLogRepo) _reviewLogRepo = new MockReviewLogRepository();
  return _reviewLogRepo;
}

let _familyRepo: IFamilyRepository | null = null;
export function getFamilyRepository(): IFamilyRepository {
  if (!_familyRepo) _familyRepo = new MockFamilyRepository();
  return _familyRepo;
}

let _familyInvitationRepo: IFamilyInvitationRepository | null = null;
export function getFamilyInvitationRepository(): IFamilyInvitationRepository {
  if (!_familyInvitationRepo) _familyInvitationRepo = new MockFamilyInvitationRepository();
  return _familyInvitationRepo;
}

let _learnerProfileRepo: ILearnerProfileRepository | null = null;
export function getLearnerProfileRepository(): ILearnerProfileRepository {
  if (!_learnerProfileRepo) _learnerProfileRepo = new MockLearnerProfileRepository();
  return _learnerProfileRepo;
}

let _telemetryUploadPort: ITelemetryUploadPort | null = null;
export function getTelemetryUploadPort(): ITelemetryUploadPort {
  if (!_telemetryUploadPort) _telemetryUploadPort = new MockTelemetryUploadPort();
  return _telemetryUploadPort;
}

let _streakRepo: IStreakRepository | null = null;
export function getStreakRepository(): IStreakRepository {
  if (!_streakRepo) _streakRepo = new MockStreakRepository();
  return _streakRepo;
}

let _translationPreferenceRepo: ITranslationPreferenceRepository | null = null;
export function getTranslationPreferenceRepository(): ITranslationPreferenceRepository {
  if (!_translationPreferenceRepo) {
    _translationPreferenceRepo = new MockTranslationPreferenceRepository();
  }
  return _translationPreferenceRepo;
}
