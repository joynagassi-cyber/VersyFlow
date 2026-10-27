/**
 * MemorizationMapper — round-trip + deterministic UUID tests
 */

import { describe, it, expect } from 'vitest';
import {
  recordUuid,
  memorizationRecordToRow,
  memorizationRowToRecord,
  reviewLogToRow,
  reviewLogRowToEntry,
} from '@/infrastructure/sync/memorization-mapper';

const sampleRecord = {
  bookId: 'joh',
  chapterNumber: 3,
  verseNumber: 16,
  translationId: 'lsg',
  bibleVerseReference: 'Jean 3:16',
  bibleVerseText: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique.",
  status: 'new' as const,
  fsrsState: {
    stability: 2,
    difficulty: 5,
    recallProbability: 0.7,
    lastInterval: 0,
    nextInterval: 2,
    elapsedDays: 0,
    repetitions: 0,
    requestedRetention: 0.9,
  },
  favorite: false,
  tags: ['amour'],
  createdAt: 1_700_000_000_000,
  lastReviewedAt: null,
  nextReviewAt: 1_700_100_000_000,
  reviewCount: 0,
  totalReviewMinutes: 0,
  wordPerformance: [],
};

describe('recordUuid', () => {
  it('is deterministic for the same input tuple', () => {
    const a = recordUuid('user1', sampleRecord);
    const b = recordUuid('user1', sampleRecord);
    expect(a).toBe(b);
  });

  it('differs when the user id changes', () => {
    const a = recordUuid('user1', sampleRecord);
    const b = recordUuid('user2', sampleRecord);
    expect(a).not.toBe(b);
  });

  it('differs when the translation id changes', () => {
    const a = recordUuid('user1', sampleRecord);
    const b = recordUuid('user1', {
      ...sampleRecord,
      translationId: 'kjv',
    });
    expect(a).not.toBe(b);
  });

  it('normalises endVerse=0 with endVerse=undefined', () => {
    const withZero = recordUuid('u', { ...sampleRecord, endVerse: 0 });
    const withUndefined = recordUuid('u', { ...sampleRecord, endVerse: undefined });
    expect(withZero).toBe(withUndefined);
  });

  it('matches the RFC 4122 UUIDv5 layout (8-4-4-4-12, version=5, variant=10)', () => {
    const id = recordUuid('user1', sampleRecord);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('memorizationRecordToRow / memorizationRowToRecord round-trip', () => {
  it('preserves all business fields across entity → row → entity', () => {
    const userId = 'user1';
    const full = { ...sampleRecord, id: 'placeholder', learnerProfileId: '' };
    const row = memorizationRecordToRow(userId, full);
    expect(row.id).toBe(recordUuid(userId, sampleRecord));
    const back = memorizationRowToRecord(row);
    expect(back.bookId).toBe(sampleRecord.bookId);
    expect(back.chapterNumber).toBe(sampleRecord.chapterNumber);
    expect(back.verseNumber).toBe(sampleRecord.verseNumber);
    expect(back.translationId).toBe(sampleRecord.translationId);
    expect(back.status).toBe('new');
    expect(back.favorite).toBe(false);
    expect(back.tags).toEqual(['amour']);
    expect(back.fsrsState.stability).toBe(2);
    expect(back.fsrsState.difficulty).toBe(5);
    expect(back.nextReviewAt).toBe(1_700_100_000_000);
    expect(back.lastReviewedAt).toBeNull();
    expect(back.reviewCount).toBe(0);
  });

  it('converts null nextReviewAt to null on the row side', () => {
    const row = memorizationRecordToRow('u', {
      ...sampleRecord,
      id: 'x',
      learnerProfileId: '',
      nextReviewAt: null,
    });
    expect(row.next_review_at).toBeNull();
  });

  it('coerces unknown status to "new"', () => {
    const row = memorizationRecordToRow('u', {
      ...sampleRecord,
      id: 'x',
      learnerProfileId: '',
      status: 'broken' as any,
    });
    expect(memorizationRowToRecord(row).status).toBe('new');
  });
});

describe('reviewLogToRow / reviewLogRowToEntry round-trip', () => {
  it('round-trips a review log entry', () => {
    const entry = {
      id: crypto.randomUUID(),
      memorizationRecordId: recordUuid('user1', sampleRecord),
      answeredAt: 1_700_200_000_000,
      rating: 'good' as const,
      actualInterval: 1,
      predictedInterval: 2,
      stabilityBefore: 1,
      stabilityAfter: 3,
      difficultyBefore: 5,
      difficultyAfter: 5.5,
      wordPerformance: [],
    };
    const row = reviewLogToRow('user1', entry);
    expect(row.id).toBe(entry.id);
    expect(row.memorization_record_id).toBe(entry.memorizationRecordId);
    expect(row.rating).toBe('good');
    expect(row.stability_after).toBe(3);
    const back = reviewLogRowToEntry(row);
    expect(back.memorizationRecordId).toBe(entry.memorizationRecordId);
    expect(back.stabilityAfter).toBe(3);
  });

  it('coerces unknown rating to "again"', () => {
    const row = reviewLogToRow('user1', {
      id: crypto.randomUUID(),
      memorizationRecordId: 'r',
      answeredAt: 1,
      rating: 'broken' as any,
      actualInterval: null,
      predictedInterval: 0,
      stabilityBefore: 0,
      stabilityAfter: 0,
      difficultyBefore: 0,
      difficultyAfter: 0,
      wordPerformance: [],
    });
    expect(reviewLogRowToEntry(row).rating).toBe('again');
  });
});
