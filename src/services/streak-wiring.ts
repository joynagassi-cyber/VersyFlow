/**
 * Streak wiring — composition root for the StreakCoordinator.
 *
 * Builds the `ProgressService` once (PowerSync memorization service + FSRS
 * engine + insertOnly streak repository + shared user id provider) and starts
 * the event-driven {@link startStreakCoordinator} so that every
 * `VERSE_MEMORIZED` / `TARGET_MEMORIZED` domain event increments the streak
 * and persists the daily fact.
 *
 * Offline-safe: `StreakService.recordDailyStreak` no-ops when
 * `resolveUserId()` returns null or throws, so this wiring adds no crash
 * path on the memorization flow.
 */

import { getMemorizationService } from './memorization-service-factory';
import { getFsrsEngine } from './fsrs-factory';
import {
  getStreakRepository,
  getSyncUserIdProvider,
} from '@/infrastructure/repository/powersync-repositories';
import { ProgressService } from './progress-service';
import { startStreakCoordinator } from './streak-coordinator';

let _stopping: (() => void) | null = null;

/** Idempotent: registers the event handlers on the first call only. */
export function wireStreakCoordinator(): void {
  if (_stopping) return;

  const progressService = new ProgressService(
    getMemorizationService('default'),
    getFsrsEngine(),
    undefined,
    'default',
    getStreakRepository(),
    async () => {
      try {
        return await getSyncUserIdProvider().resolveUserId();
      } catch {
        // Resolver failure is treated as "no session" — skip the sync write
        // (matches the telemetry repository behaviour; never crash the
        // memorization flow).
        return null;
      }
    },
  );

  _stopping = startStreakCoordinator(progressService);
}

/** Test/teardown helper: unregister all coordinator handlers. */
export function unwireStreakCoordinator(): void {
  _stopping?.();
  _stopping = null;
}
