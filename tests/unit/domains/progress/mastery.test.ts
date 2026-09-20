/**
 * Tests for Progress Domain — calculateMasteryLevel and isMastered
 * Verifies mastery level computation from FSRS state
 */

import { describe, it, expect } from 'vitest';
import { calculateMasteryLevel, isMastered, MasteryLevel } from '@/domains/progress/entities';
import type { MemorizationRecord } from '@/domains/memorization/entities';

function makeRecord(overrides: Partial<MemorizationRecord> = {}): MemorizationRecord {
  return {
    id: 'test:1',
    learnerProfileId: 'profile-1',
    bookId: 'joh',
    chapterNumber: 3,
    verseNumber: 16,
    translationId: 'lsg',
    bibleVerseReference: 'Jean 3:16',
    bibleVerseText: 'Car Dieu a tant aimé le monde',
    status: 'in-progress',
    fsrsState: {
      stability: 5,
      difficulty: 5,
      recallProbability: 0.8,
      lastInterval: 3,
      nextInterval: 5,
      elapsedDays: 1,
      repetitions: 3,
      requestedRetention: 0.9,
    },
    nextReviewAt: null,
    createdAt: Date.now(),
    lastReviewedAt: Date.now(),
    reviewCount: 3,
    totalReviewMinutes: 10,
    wordPerformance: [],
    favorite: false,
    tags: [],
    ...overrides,
  } as MemorizationRecord;
}

describe('calculateMasteryLevel()', () => {
  it('returns MASTERED when status is already mastered', () => {
    const record = makeRecord({ status: 'mastered' });
    expect(calculateMasteryLevel(record)).toBe(MasteryLevel.MASTERED);
  });

  it('returns MASTERED for high stability + enough repetitions + high recall', () => {
    const record = makeRecord({
      fsrsState: {
        stability: 35,
        difficulty: 3,
        recallProbability: 0.95,
        lastInterval: 30,
        nextInterval: 60,
        elapsedDays: 30,
        repetitions: 6,
        requestedRetention: 0.9,
      },
    });
    expect(calculateMasteryLevel(record)).toBe(MasteryLevel.MASTERED);
  });

  it('returns IN_PROGRESS_STRONG for stability between 7 and 30 days', () => {
    const record = makeRecord({
      fsrsState: {
        stability: 15,
        difficulty: 4,
        recallProbability: 0.85,
        lastInterval: 7,
        nextInterval: 14,
        elapsedDays: 7,
        repetitions: 4,
        requestedRetention: 0.9,
      },
    });
    expect(calculateMasteryLevel(record)).toBe(MasteryLevel.IN_PROGRESS_STRONG);
  });

  it('returns IN_PROGRESS for stability between 1 and 7 days', () => {
    const record = makeRecord({
      fsrsState: {
        stability: 3,
        difficulty: 5,
        recallProbability: 0.7,
        lastInterval: 1,
        nextInterval: 3,
        elapsedDays: 1,
        repetitions: 2,
        requestedRetention: 0.9,
      },
    });
    expect(calculateMasteryLevel(record)).toBe(MasteryLevel.IN_PROGRESS);
  });

  it('returns IN_PROGRESS_WEAK for stability below 1 day', () => {
    const record = makeRecord({
      fsrsState: {
        stability: 0.5,
        difficulty: 6,
        recallProbability: 0.6,
        lastInterval: 0,
        nextInterval: 1,
        elapsedDays: 0,
        repetitions: 1,
        requestedRetention: 0.9,
      },
    });
    expect(calculateMasteryLevel(record)).toBe(MasteryLevel.IN_PROGRESS_WEAK);
  });

  it('returns IN_PROGRESS_WEAK for zero stability', () => {
    const record = makeRecord({
      fsrsState: {
        stability: 0,
        difficulty: 5,
        recallProbability: 0.5,
        lastInterval: 0,
        nextInterval: 1,
        elapsedDays: 0,
        repetitions: 0,
        requestedRetention: 0.9,
      },
    });
    expect(calculateMasteryLevel(record)).toBe(MasteryLevel.IN_PROGRESS_WEAK);
  });

  it('does not return MASTERED when recallProb is too low despite high stability', () => {
    const record = makeRecord({
      fsrsState: {
        stability: 40,
        difficulty: 8,
        recallProbability: 0.85, // < 0.9
        lastInterval: 30,
        nextInterval: 60,
        elapsedDays: 30,
        repetitions: 6,
        requestedRetention: 0.9,
      },
    });
    // stability > 30 and reps >= 5 but recallProb <= 0.9 → falls through
    expect(calculateMasteryLevel(record)).not.toBe(MasteryLevel.MASTERED);
  });

  it('does not return MASTERED when repetitions < 5 despite high stability', () => {
    const record = makeRecord({
      fsrsState: {
        stability: 40,
        difficulty: 3,
        recallProbability: 0.95,
        lastInterval: 30,
        nextInterval: 60,
        elapsedDays: 30,
        repetitions: 4, // < 5
        requestedRetention: 0.9,
      },
    });
    expect(calculateMasteryLevel(record)).not.toBe(MasteryLevel.MASTERED);
  });

  it('boundary: stability exactly 7 returns IN_PROGRESS_STRONG', () => {
    const record = makeRecord({
      fsrsState: {
        stability: 7.0001,
        difficulty: 5,
        recallProbability: 0.8,
        lastInterval: 3,
        nextInterval: 7,
        elapsedDays: 3,
        repetitions: 2,
        requestedRetention: 0.9,
      },
    });
    expect(calculateMasteryLevel(record)).toBe(MasteryLevel.IN_PROGRESS_STRONG);
  });

  it('boundary: stability exactly 1 returns IN_PROGRESS', () => {
    const record = makeRecord({
      fsrsState: {
        stability: 1.0001,
        difficulty: 5,
        recallProbability: 0.7,
        lastInterval: 1,
        nextInterval: 2,
        elapsedDays: 1,
        repetitions: 1,
        requestedRetention: 0.9,
      },
    });
    expect(calculateMasteryLevel(record)).toBe(MasteryLevel.IN_PROGRESS);
  });
});

describe('isMastered()', () => {
  it('returns true when status is mastered AND stability > 30 with 5+ reps', () => {
    const record = makeRecord({
      status: 'mastered',
      fsrsState: {
        stability: 35,
        difficulty: 3,
        recallProbability: 0.95,
        lastInterval: 30,
        nextInterval: 60,
        elapsedDays: 30,
        repetitions: 6,
        requestedRetention: 0.9,
      },
    });
    expect(isMastered(record)).toBe(true);
  });

  it('returns false when status is in-progress', () => {
    const record = makeRecord({ status: 'in-progress' });
    expect(isMastered(record)).toBe(false);
  });

  it('returns false when status is new', () => {
    const record = makeRecord({ status: 'new' });
    expect(isMastered(record)).toBe(false);
  });

  it('returns false when stability is too low despite mastered status', () => {
    const record = makeRecord({
      status: 'mastered',
      fsrsState: {
        stability: 5, // < 30
        difficulty: 5,
        recallProbability: 0.8,
        lastInterval: 3,
        nextInterval: 5,
        elapsedDays: 1,
        repetitions: 3,
        requestedRetention: 0.9,
      },
    });
    // isMastered checks stability > 30 AND repetitions >= 5
    expect(isMastered(record)).toBe(false);
  });

  it('returns false when repetitions < 5 despite high stability', () => {
    const record = makeRecord({
      status: 'mastered',
      fsrsState: {
        stability: 40,
        difficulty: 3,
        recallProbability: 0.95,
        lastInterval: 30,
        nextInterval: 60,
        elapsedDays: 30,
        repetitions: 4, // < 5
        requestedRetention: 0.9,
      },
    });
    expect(isMastered(record)).toBe(false);
  });
});

describe('MasteryLevel enum', () => {
  it('has all expected members', () => {
    expect(MasteryLevel.IN_PROGRESS_WEAK).toBe('in-progress-weak');
    expect(MasteryLevel.IN_PROGRESS).toBe('in-progress');
    expect(MasteryLevel.IN_PROGRESS_STRONG).toBe('in-progress-strong');
    expect(MasteryLevel.MASTERED).toBe('mastered');
  });
});
