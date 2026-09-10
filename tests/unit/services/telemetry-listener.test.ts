/**
 * Tests for TelemetryListener — verifies bus events map to redacted telemetry records
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus, DomainEventTypes } from '@/domains/events';
import { TelemetryListener } from '@/services/telemetry-listener';
import type { ITelemetry } from '@/domains/telemetry/it telemetry';

describe('TelemetryListener', () => {
  let mockTelemetry: ITelemetry;
  let recordSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    recordSpy = vi.fn();
    mockTelemetry = {
      record: recordSpy,
      flush: vi.fn(),
      getSummary: vi.fn(),
      clear: vi.fn(),
      getQueue: vi.fn(),
      setUserId: vi.fn(),
    } as unknown as ITelemetry;
  });

  it('maps VERSE_MEMORIZED to exercise.completed telemetry', () => {
    const listener = new TelemetryListener(mockTelemetry);
    listener.start();

    eventBus.emit({
      id: 'e1',
      type: DomainEventTypes.VERSE_MEMORIZED,
      timestamp: Date.now(),
      payload: {
        recordId: 'rec_1',
        durationMs: 5000,
        rating: 3,
        verification: { score: 0.8, correctWords: 4, missingWords: 1, extraWords: 0, substitutedWords: 0 },
        fsrsBefore: { stability: 1, difficulty: 5, recallProbability: 0.9, lastInterval: 0, nextInterval: 1, elapsedDays: 0, repetitions: 0, requestedRetention: 0.9 },
        fsrsAfter: { stability: 2, difficulty: 5, recallProbability: 0.95, lastInterval: 1, nextInterval: 3, elapsedDays: 0, repetitions: 1, requestedRetention: 0.9 },
        context: { bookId: 'john', chapterNumber: 3, verseNumber: 16, translationId: 'lsg' },
        exerciseType: 'active-recall',
        bibleVerseText: 'LE TEXTE SENSIBLE NE DOIT PAS PASER',
        verseText: '耶稣说：我就是道路',
        words: ['耶稣', '说', '我'],
        verseTexts: ['耶稣说', '我就是'],
        transcript: 'transcript data here',
        rawText: 'some raw text',
        content: 'raw verse content',
      },
    });

    expect(recordSpy).toHaveBeenCalledTimes(1);
    const callArgs = recordSpy.mock.calls[0];
    expect(callArgs[0]).toBe('exercise.completed');
    const payload = callArgs[1] as Record<string, unknown>;
    expect(payload.recordId).toBe('rec_1');
    expect(payload.bibleVerseText).toBeUndefined();
    // All SENSITIVE_FIELDS must be stripped at the pipeline level — not just bibleVerseText
    expect(payload.verseText).toBeUndefined();
    expect(payload.words).toBeUndefined();
    expect(payload.verseTexts).toBeUndefined();
    expect(payload.transcript).toBeUndefined();
    expect(payload.rawText).toBeUndefined();
    expect(payload.content).toBeUndefined();
    expect(payload.durationMs).toBe(5000);

    listener.stop();
  });

  it('maps PASSAGE_STARTED to passage.started telemetry', () => {
    const listener = new TelemetryListener(mockTelemetry);
    listener.start();

    eventBus.emit({
      id: 'e2',
      type: DomainEventTypes.PASSAGE_STARTED,
      timestamp: Date.now(),
      payload: {
        targetId: 'tgt_1',
        displayReference: 'Jean 3:16-18',
        passageLength: 3,
        exerciseType: 'active-recall',
        context: { bookId: 'john', chapterNumber: 3, startVerse: 16, endVerse: 18, translationId: 'lsg' },
      },
    });

    expect(recordSpy).toHaveBeenCalledTimes(1);
    const callArgs = recordSpy.mock.calls[0];
    expect(callArgs[0]).toBe('passage.started');
    const payload = callArgs[1] as Record<string, unknown>;
    expect(payload.targetId).toBe('tgt_1');
    expect(payload.displayReference).toBe('Jean 3:16-18');

    listener.stop();
  });

  it('maps STREAK_INCREMENTED to streak.incremented telemetry', () => {
    const listener = new TelemetryListener(mockTelemetry);
    listener.start();

    eventBus.emit({
      id: 'e3',
      type: DomainEventTypes.STREAK_INCREMENTED,
      timestamp: Date.now(),
      payload: { streakDelta: 1, previousStreak: 5, newStreak: 6 },
    });

    expect(recordSpy).toHaveBeenCalledTimes(1);
    const callArgs = recordSpy.mock.calls[0];
    expect(callArgs[0]).toBe('streak.incremented');
    const payload = callArgs[1] as Record<string, unknown>;
    expect(payload.newStreak).toBe(6);

    listener.stop();
  });

  it('maps PROGRESS_MILESTONE_REACHED to milestone.reached telemetry', () => {
    const listener = new TelemetryListener(mockTelemetry);
    listener.start();

    eventBus.emit({
      id: 'e4',
      type: DomainEventTypes.PROGRESS_MILESTONE_REACHED,
      timestamp: Date.now(),
      payload: { milestoneType: 'first_100_verses', totalVerses: 100, totalMastered: 50 },
    });

    expect(recordSpy).toHaveBeenCalledTimes(1);
    const callArgs = recordSpy.mock.calls[0];
    expect(callArgs[0]).toBe('milestone.reached');
    const payload = callArgs[1] as Record<string, unknown>;
    expect(payload.totalVerses).toBe(100);

    listener.stop();
  });

  it('does not record untracked event types', () => {
    const listener = new TelemetryListener(mockTelemetry);
    listener.start();

    eventBus.emit({
      id: 'e5',
      type: DomainEventTypes.VERSE_SELECTED,
      timestamp: Date.now(),
      payload: { bookId: 'john', chapterNumber: 1, verseNumber: 1 },
    });

    expect(recordSpy).not.toHaveBeenCalled();

    listener.stop();
  });

  it('intentionally leaves exercise.abandoned / error.occurred / feature.accessed untracked (no handler, no emission)', () => {
    // These event types exist in the telemetry schema (entities.ts) but are NOT emitted by any domain event.
    // Explicitly verify the listener does nothing when they appear on the bus.
    const listener = new TelemetryListener(mockTelemetry);
    listener.start();

    const fakeEvents = [
      { type: 'exercise.abandoned', payload: { recordId: 'x', reason: 'user_close' } },
      { type: 'error.occurred', payload: { errorType: 'fsrs_err', errorMessage: 'ok' } },
      { type: 'feature.accessed', payload: { featureName: 'comparison' } },
    ];

    for (const ev of fakeEvents) {
      recordSpy.mockClear();
      eventBus.emit({ id: 'u_' + ev.type, ...ev, timestamp: Date.now() });
      expect(recordSpy).not.toHaveBeenCalled(), `should not track ${ev.type}`;
    }

    listener.stop();
  });

  it('maps all 8 tracked event types correctly', () => {
    const listener = new TelemetryListener(mockTelemetry);
    listener.start();

    eventBus.emit({ id: 'a', type: DomainEventTypes.VERSE_MEMORIZED, timestamp: Date.now(), payload: {} });
    eventBus.emit({ id: 'b', type: DomainEventTypes.TARGET_MEMORIZED, timestamp: Date.now(), payload: {} });
    eventBus.emit({ id: 'c', type: DomainEventTypes.PASSAGE_STARTED, timestamp: Date.now(), payload: {} });
    eventBus.emit({ id: 'd', type: DomainEventTypes.SEGMENT_COMPLETED, timestamp: Date.now(), payload: {} });
    eventBus.emit({ id: 'e', type: DomainEventTypes.REVIEW_SESSION_STARTED, timestamp: Date.now(), payload: {} });
    eventBus.emit({ id: 'f', type: DomainEventTypes.REVIEW_COMPLETED, timestamp: Date.now(), payload: {} });
    eventBus.emit({ id: 'g', type: DomainEventTypes.STREAK_INCREMENTED, timestamp: Date.now(), payload: {} });
    eventBus.emit({ id: 'h', type: DomainEventTypes.PROGRESS_MILESTONE_REACHED, timestamp: Date.now(), payload: {} });

    // Each should produce a record call (even if payload is empty)
    expect(recordSpy).toHaveBeenCalledTimes(8);

    listener.stop();
  });

  it('stops all subscriptions when stop() is called', () => {
    const listener = new TelemetryListener(mockTelemetry);
    listener.start();
    listener.stop();

    eventBus.emit({
      id: 'e9',
      type: DomainEventTypes.STREAK_INCREMENTED,
      timestamp: Date.now(),
      payload: { streakDelta: 1, previousStreak: 0, newStreak: 1 },
    });

    expect(recordSpy).not.toHaveBeenCalled();
  });
});
