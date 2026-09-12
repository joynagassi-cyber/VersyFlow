/**
 * StreakCoordinator — event-driven bridge from memorization/completion
 * domain events to `ProgressService.incrementStreak()`.
 *
 * Subscribes to the shared {@link eventBus} and reacts to
 * `VERSE_MEMORIZED` / `TARGET_MEMORIZED` by asking the progress service to
 * increment the streak. The progress service owns the actual persistence
 * (insertOnly `streaks` fact through `StreakService`) and the
 * `STREAK_INCREMENTED` domain event.
 *
 * Composition root responsibilities only — no business logic. Offline-safe:
 * `incrementStreak()` is a no-op without a user session (see
 * `StreakService.recordDailyStreak`), so wiring it here adds no new crash
 * paths.
 */

import { eventBus, DomainEventTypes } from '@/domains/events';
import type { ProgressService } from './progress-service';

/**
 * Start listening for memorization-completion events. Idempotent — safe to
 * call repeatedly; only the first call registers handlers.
 */
export function startStreakCoordinator(progressService: ProgressService): () => void {
  const onMemorized = () => {
    // Fire-and-forget: streak increment must never block the user's
    // critical path. The service itself swallows errors and returns a
    // boolean instead of throwing.
    void progressService.incrementStreak().catch(() => {
      /* never block — errors are logged inside StreakService */
    });
  };

  eventBus.on(DomainEventTypes.VERSE_MEMORIZED, onMemorized);
  eventBus.on(DomainEventTypes.TARGET_MEMORIZED, onMemorized);

  return () => {
    eventBus.off(DomainEventTypes.VERSE_MEMORIZED, onMemorized);
    eventBus.off(DomainEventTypes.TARGET_MEMORIZED, onMemorized);
  };
}
