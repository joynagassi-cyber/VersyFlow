/**
 * Telemetry Listener — Subscribes to domain events and records anonymized telemetry
 *
 * Reuses the existing eventBus; never creates a second event bus.
 * All events are redacted before being recorded (no verse text or PII).
 */

import { eventBus, DomainEventTypes } from '@/domains/events';
import type { TelemetryEvent } from '@/domains/telemetry/entities';
import { redact } from '@/domains/telemetry/entities';
import type { ITelemetry } from '@/domains/telemetry/it telemetry';

/**
 * Map a DomainEvent to a TelemetryEvent, returning null if the event should not be tracked.
 */
function mapDomainEventToTelemetry(event: { type: string; payload: Record<string, unknown> }): TelemetryEvent | null {
  const now = Date.now();

  switch (event.type) {
    case DomainEventTypes.VERSE_MEMORIZED:
      return {
        eventType: 'exercise.completed',
        timestamp: now,
        sessionId: '',
        payload: {
          recordId: (event.payload.recordId as string) ?? '',
          durationMs: (event.payload.durationMs as number) ?? 0,
          rating: (event.payload.rating as number) ?? 0,
          verification: event.payload.verification as { score: number; correctWords: number; missingWords: number; extraWords: number; substitutedWords: number },
          fsrsBefore: event.payload.fsrsBefore as { stability: number; difficulty: number; recallProbability: number; lastInterval: number; nextInterval: number; elapsedDays: number; repetitions: number; requestedRetention: number },
          fsrsAfter: event.payload.fsrsAfter as { stability: number; difficulty: number; recallProbability: number; lastInterval: number; nextInterval: number; elapsedDays: number; repetitions: number; requestedRetention: number },
          context: event.payload.context as { bookId: string; chapterNumber: number; verseNumber: number; translationId: string },
          exerciseType: (event.payload.exerciseType as string) ?? 'active-recall',
        },
      };

    case DomainEventTypes.TARGET_MEMORIZED:
      return {
        eventType: 'memory.session.completed',
        timestamp: now,
        sessionId: '',
        payload: {
          recordId: (event.payload.recordId as string) ?? '',
          rating: (event.payload.rating as number) ?? 0,
          sessionDurationMs: (event.payload.sessionDurationMs as number) ?? 0,
          wordsRevealed: (event.payload.wordsRevealed as number) ?? 0,
          totalWords: (event.payload.totalWords as number) ?? 0,
          fsrsBefore: event.payload.fsrsBefore as { stability: number; difficulty: number; recallProbability: number; lastInterval: number; nextInterval: number; elapsedDays: number; repetitions: number; requestedRetention: number },
          fsrsAfter: event.payload.fsrsAfter as { stability: number; difficulty: number; recallProbability: number; lastInterval: number; nextInterval: number; elapsedDays: number; repetitions: number; requestedRetention: number },
          context: event.payload.context as { bookId: string; chapterNumber: number; verseNumber: number; translationId: string },
        },
      };

    case DomainEventTypes.PASSAGE_STARTED:
      return {
        eventType: 'passage.started',
        timestamp: now,
        sessionId: '',
        payload: {
          targetId: (event.payload.targetId as string) ?? '',
          displayReference: (event.payload.displayReference as string) ?? '',
          passageLength: (event.payload.passageLength as number) ?? 0,
          exerciseType: (event.payload.exerciseType as string) ?? 'active-recall',
          context: event.payload.context as { bookId: string; chapterNumber: number; startVerse: number; endVerse: number; translationId: string },
        },
      };

    case DomainEventTypes.SEGMENT_COMPLETED:
      return {
        eventType: 'passage.segment.completed',
        timestamp: now,
        sessionId: '',
        payload: {
          targetId: (event.payload.targetId as string) ?? '',
          verseNumber: (event.payload.verseNumber as number) ?? 0,
          segmentIndex: (event.payload.segmentIndex as number) ?? 0,
          totalSegments: (event.payload.totalSegments as number) ?? 0,
          wordsRevealed: (event.payload.wordsRevealed as number) ?? 0,
          totalWords: (event.payload.totalWords as number) ?? 0,
          segmentDurationMs: (event.payload.segmentDurationMs as number) ?? 0,
        },
      };

    case DomainEventTypes.REVIEW_SESSION_STARTED:
      return {
        eventType: 'review.started',
        timestamp: now,
        sessionId: '',
        payload: {
          versesCount: (event.payload.versesCount as number) ?? 0,
          overdueCount: (event.payload.overdueCount as number) ?? 0,
          scheduledCount: (event.payload.scheduledCount as number) ?? 0,
        },
      };

    case DomainEventTypes.REVIEW_COMPLETED:
      return {
        eventType: 'review.completed',
        timestamp: now,
        sessionId: '',
        payload: {
          recordId: (event.payload.recordId as string) ?? '',
          rating: (event.payload.rating as number) ?? 0,
          previousStability: (event.payload.previousStability as number) ?? 0,
          newStability: (event.payload.newStability as number) ?? 0,
          previousDifficulty: (event.payload.previousDifficulty as number) ?? 0,
          newDifficulty: (event.payload.newDifficulty as number) ?? 0,
          predictedInterval: (event.payload.predictedInterval as number) ?? 0,
          timeSpentMs: (event.payload.timeSpentMs as number) ?? 0,
          exerciseType: (event.payload.exerciseType as string) ?? undefined,
        },
      };

    case DomainEventTypes.STREAK_INCREMENTED:
      return {
        eventType: 'streak.incremented',
        timestamp: now,
        sessionId: '',
        payload: {
          streakDelta: (event.payload.streakDelta as number) ?? 0,
          previousStreak: (event.payload.previousStreak as number) ?? 0,
          newStreak: (event.payload.newStreak as number) ?? 0,
        },
      };

    case DomainEventTypes.PROGRESS_MILESTONE_REACHED:
      return {
        eventType: 'milestone.reached',
        timestamp: now,
        sessionId: '',
        payload: {
          milestoneType: (event.payload.milestoneType as string) ?? '',
          totalVerses: (event.payload.totalVerses as number) ?? 0,
          totalMastered: (event.payload.totalMastered as number) ?? 0,
        },
      };

    default:
      return null;
  }
}

/**
 * TelemetryListener — subscribes to the shared eventBus and records redacted telemetry.
 */
export class TelemetryListener {
  private telemetry: ITelemetry;
  private subscriptions: Set<() => void> = new Set();

  constructor(telemetry: ITelemetry) {
    this.telemetry = telemetry;
  }

  /**
   * Start listening to domain events.
   * All matched events are redacted before being recorded.
   */
  start(): void {
    const trackedEvents = [
      DomainEventTypes.VERSE_MEMORIZED,
      DomainEventTypes.TARGET_MEMORIZED,
      DomainEventTypes.PASSAGE_STARTED,
      DomainEventTypes.SEGMENT_COMPLETED,
      DomainEventTypes.REVIEW_SESSION_STARTED,
      DomainEventTypes.REVIEW_COMPLETED,
      DomainEventTypes.STREAK_INCREMENTED,
      DomainEventTypes.PROGRESS_MILESTONE_REACHED,
    ];

    for (const eventType of trackedEvents) {
      const handler = (event: { type: string; payload: Record<string, unknown> }) => {
        const telemetryEvent = mapDomainEventToTelemetry(event);
        if (telemetryEvent) {
          const redacted = redact(telemetryEvent);
          this.telemetry.record(redacted.eventType, redacted.payload);
        }
      };
      eventBus.on(eventType, handler);
      this.subscriptions.add(() => eventBus.off(eventType, handler));
    }
  }

  /**
   * Stop listening and clean up all subscriptions.
   */
  stop(): void {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
    this.subscriptions.clear();
  }
}
