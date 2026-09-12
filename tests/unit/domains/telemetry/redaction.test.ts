/**
 * Tests for telemetry redaction — ensures no verse text or PII leaks into telemetry
 */

import { describe, it, expect } from 'vitest';
import { redact } from '@/domains/telemetry/entities';
import type { TelemetryEvent } from '@/domains/telemetry/entities';

describe('redact()', () => {
  it('strips sensitive fields like bibleVerseText, verseText, words', () => {
    const event = {
      eventType: 'exercise.completed',
      timestamp: 1000,
      sessionId: 'sess_1',
      payload: {
        recordId: 'rec_1',
        exerciseType: 'active-recall' as const,
        durationMs: 5000,
        rating: 3,
        verification: { score: 0.8, correctWords: 4, missingWords: 1, extraWords: 0, substitutedWords: 0 },
        fsrsBefore: { stability: 1, difficulty: 5, recallProbability: 0.9, lastInterval: 0, nextInterval: 1, elapsedDays: 0, repetitions: 0, requestedRetention: 0.9 },
        fsrsAfter: { stability: 2, difficulty: 5, recallProbability: 0.95, lastInterval: 1, nextInterval: 3, elapsedDays: 0, repetitions: 1, requestedRetention: 0.9 },
        context: { bookId: 'john', chapterNumber: 3, verseNumber: 16, translationId: 'lsg' },
        bibleVerseText: 'Le Logos était avec Dieu, et le Logos était Dieu.',
        verseText: 'Jésus répondit',
        words: ['Le', 'Logos', 'était'],
        transcript: 'transcript data',
        content: 'raw verse content',
        rawText: 'some raw text',
      },
    } as unknown as TelemetryEvent;

    const redacted = redact(event);

    // Sensitive fields must be removed
    expect((redacted.payload as any).bibleVerseText).toBeUndefined();
    expect((redacted.payload as any).verseText).toBeUndefined();
    expect((redacted.payload as any).words).toBeUndefined();
    expect((redacted.payload as any).transcript).toBeUndefined();
    expect((redacted.payload as any).content).toBeUndefined();
    expect((redacted.payload as any).rawText).toBeUndefined();

    // Non-sensitive fields must be preserved
    expect((redacted.payload as any).recordId).toBe('rec_1');
    expect((redacted.payload as any).durationMs).toBe(5000);
    expect((redacted.payload as any).rating).toBe(3);
    expect((redacted.payload as any).exerciseType).toBe('active-recall');
    expect((redacted.payload as any).context).toEqual({ bookId: 'john', chapterNumber: 3, verseNumber: 16, translationId: 'lsg' });
    expect((redacted.payload as any).fsrsAfter).toEqual({ stability: 2, difficulty: 5, recallProbability: 0.95, lastInterval: 1, nextInterval: 3, elapsedDays: 0, repetitions: 1, requestedRetention: 0.9 });
  });

  it('passes through an event with no sensitive fields unchanged', () => {
    const event: TelemetryEvent = {
      eventType: 'streak.incremented',
      timestamp: 2000,
      sessionId: 'sess_2',
      payload: {
        streakDelta: 1,
        previousStreak: 5,
        newStreak: 6,
      },
    };

    const redacted = redact(event);

    expect(redacted.eventType).toBe('streak.incremented');
    expect((redacted.payload as any).streakDelta).toBe(1);
    expect((redacted.payload as any).previousStreak).toBe(5);
    expect((redacted.payload as any).newStreak).toBe(6);
  });

  it('strips deeply nested sensitive fields', () => {
    const event = {
      eventType: 'exercise.completed',
      timestamp: 3000,
      sessionId: 'sess_3',
      payload: {
        recordId: 'rec_3',
        exerciseType: 'cloze-deletion' as const,
        durationMs: 12000,
        rating: 2,
        verification: { score: 0.5, correctWords: 2, missingWords: 2, extraWords: 0, substitutedWords: 1, verseText: 'L\'Éternel est mon berger' },
        fsrsBefore: { stability: 1, difficulty: 5, recallProbability: 0.9, lastInterval: 0, nextInterval: 1, elapsedDays: 0, repetitions: 0, requestedRetention: 0.9 },
        fsrsAfter: { stability: 1.5, difficulty: 5, recallProbability: 0.92, lastInterval: 1, nextInterval: 2, elapsedDays: 0, repetitions: 1, requestedRetention: 0.9 },
        context: { bookId: 'psa', chapterNumber: 23, verseNumber: 1, translationId: 'lsg' },
      },
    } as unknown as TelemetryEvent;

    const redacted = redact(event);
    const nestedPayload = (redacted.payload as any).verification;
    expect(nestedPayload.verseText).toBeUndefined();
    expect(nestedPayload.score).toBe(0.5);
  });
});
