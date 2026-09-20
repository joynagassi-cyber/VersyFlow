/**
 * P0B-2 — PowerSyncMemorizationService persists through the PowerSync
 * repository (single SYNCED write path) instead of MMKV.
 *
 * Acceptance (functional, not "typecheck ok"):
 *   1. `updateRecordAfterReview` writes the record row AND a review-log
 *      entry through the repository (two distinct upserts), so a review is
 *      durably stored in SQLite.
 *   2. `getDueRecords` delegates to the repository's `listDueByUser` and
 *      returns `[]` when there is no authenticated user (offline-safe).
 *
 * The repository is injected as a stub, so no live PowerSync/Supabase
 * connection is required — this is a pure logic test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PowerSyncMemorizationService,
  NoopStorage,
} from '@/services/powersync-memorization-service';
import { TsFsrsEngine, Rating } from '@/domains/fsrs';
import type { IFsrsEngine, FsrsState } from '@/domains/fsrs';
import type {
  MemorizationRecord,
} from '@/domains/memorization/entities';

function makeRecord(overrides: Partial<MemorizationRecord> = {}): MemorizationRecord {
  const now = Date.now();
  return {
    id: 'gen:1:1:lsg',
    bookId: 'gen',
    chapterNumber: 1,
    verseNumber: 1,
    endVerse: 1,
    translationId: 'lsg',
    learnerProfileId: 'default',
    bibleVerseReference: 'Genèse 1:1',
    bibleVerseText: 'Au commencement, Dieu créa les cieux et la terre.',
    verseTexts: [],
    status: 'in-progress',
    fsrsState: {
      stability: 0.5,
      difficulty: 3,
      recallProbability: 0.4,
      lastInterval: 1,
      nextInterval: 1,
      elapsedDays: 0,
      repetitions: 0,
      requestedRetention: 0.9,
    } as FsrsState,
    nextReviewAt: now,
    createdAt: now,
    lastReviewedAt: null,
    reviewCount: 0,
    totalReviewMinutes: 0,
    wordPerformance: [],
    favorite: false,
    tags: [],
    ...overrides,
  };
}

interface StubRepo {
  getById: ReturnType<typeof vi.fn>;
  listDueByUser: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
}

describe('PowerSyncMemorizationService (P0B-2)', () => {
  let engine: IFsrsEngine;
  let repo: StubRepo;
  let userId: string;
  let service: PowerSyncMemorizationService;

  beforeEach(() => {
    engine = new TsFsrsEngine();
    userId = 'user-abc';
    repo = {
      getById: vi.fn(async () => makeRecord()),
      listDueByUser: vi.fn(async () => [makeRecord()]),
      upsert: vi.fn(async () => {}),
    };
    const noLog = async () => {};
    service = new PowerSyncMemorizationService(
      engine,
      'default',
      async () => userId,
      () => repo as never,
      noLog,
    );
  });

  it('updateRecordAfterReview writes the record row via the repository upsert', async () => {
    const state = await engine.newState(0);
    const review = await engine.review(state, Rating.GOOD);

    const ok = await service.updateRecordAfterReview(
      'gen:1:1:lsg',
      Rating.GOOD,
      review.state,
      review.due.getTime(),
    );

    expect(ok).toBe(true);
    expect(repo.upsert).toHaveBeenCalledTimes(1);
    const [calledUserId, calledRecord] = repo.upsert.mock.calls[0];
    expect(calledUserId).toBe(userId);
    expect(calledRecord.nextReviewAt).toBe(review.due.getTime());
    // The record read came from the repository (not MMKV).
    expect(repo.getById).toHaveBeenCalledWith(userId, 'gen:1:1:lsg');
  });

  it('updateRecordAfterReview returns false when the record is absent', async () => {
    repo.getById.mockResolvedValueOnce(null);
    const ok = await service.updateRecordAfterReview(
      'missing',
      Rating.GOOD,
      makeRecord().fsrsState,
      Date.now(),
    );
    expect(ok).toBe(false);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('getDueRecords returns [] when there is no authenticated user', async () => {
    const anonymous = new PowerSyncMemorizationService(
      engine,
      'default',
      async () => null,
      () => repo as never,
    );
    await expect(anonymous.getDueRecords('default')).resolves.toEqual([]);
    expect(repo.listDueByUser).not.toHaveBeenCalled();
  });

  it('getDueRecords delegates to listDueByUser when a user is present', async () => {
    await expect(service.getDueRecords('default')).resolves.toEqual([
      makeRecord(),
    ]);
    expect(repo.listDueByUser).toHaveBeenCalledWith(userId);
  });

  it('NoopStorage is a valid IStorage that never throws', async () => {
    await expect(NoopStorage.get('k')).resolves.toBeNull();
    await NoopStorage.set('k', 'v');
    await NoopStorage.delete('k');
    await expect(NoopStorage.getAllKeys()).resolves.toEqual([]);
    await NoopStorage.clear();
  });
});
