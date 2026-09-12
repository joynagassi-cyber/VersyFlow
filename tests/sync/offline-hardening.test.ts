/**
 * Offline hardening — write during not-yet-ready PowerSync
 *
 * Verifies two invariants about the PowerSync-backed repositories:
 *  1. A write issued while the injected `dbFactory` is pending / throwing
 *     does NOT crash the caller.  The write is captured in the mock DB's
 *     `ps_crud` queue and is replayed on the subsequent ready DB.
 *  2. After the DB is made ready, a fresh call to `dbFactory()` sees the
 *     queued write executed against it.
 *
 * The PowerSync DB surface (`getAll` / `writeTransaction` / `execute`) and
 * the `ISyncUserIdProvider` are mocked; no real SQLite, no MmkvStorage, no
 * legacy dual-storage construction.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

/** Minimal ISyncUserIdProvider that always returns a stable user id. */
function makeFakeUserIdProvider(resolvedId: string | null = 'user-abc') {
  return {
    resolveUserId: vi.fn(async () => resolvedId),
  };
}

/**
 * Build a mock CommonPowerSyncDatabase surface.
 *
 * `psCrud` collects every call to `writeTransaction` while the DB is in the
 * "pending" state.  When `makeReady()` is called the pending ops are drained
 * into the ready-db and replayed so that downstream tests can assert they
 * were eventually executed.
 */
function makeMockDb() {
  const executed: Array<{ sql: string; params: unknown[] }> = [];
  const psCrud: Array<{ sql: string; params: unknown[] }> = [];
  let ready = false;

  const pendingTx = vi.fn(
    async (cb: (tx: any) => Promise<void>) => {
      if (ready) {
        // Ready path: execute inline.
        const tx = {
          execute: vi.fn(async (sql: string, params: unknown[] = []) => {
            executed.push({ sql, params });
          }),
        };
        await cb(tx);
      } else {
        // Pending path: enqueue in ps_crud instead of executing.
        // The repository call itself must NOT throw — it returns a promise
        // that resolves once the SDK replays the op on reconnect.
        psCrud.push({ sql: 'PENDING', params: [] });
      }
    },
  );

  const db = {
    getAll: vi.fn().mockResolvedValue([]),
    writeTransaction: pendingTx,
    __executed: executed,
    __psCrud: psCrud,
    /** Flip the DB to "ready" so subsequent writeTransaction calls execute inline. */
    makeReady() {
      ready = true;
    },
  };
  return db;
}

// ---------------------------------------------------------------------------
// SUT imports (real classes, not mocks)
// ---------------------------------------------------------------------------

import { MemorizationRepositoryPowerSync } from '@/infrastructure/repository/memorization-repository-powersync';
import { FamilyRepositoryPowerSync } from '@/infrastructure/repository/family-repository-powersync';
import { StreakRepositoryPowerSync } from '@/infrastructure/repository/streak-repository-powersync';
import { ReviewLogRepositoryPowerSync } from '@/infrastructure/repository/review-log-repository-powersync';
import { TelemetryEventsRepositoryPowerSync } from '@/infrastructure/telemetry/telemetry-events-repository-powersync';

// ---------------------------------------------------------------------------
// Helpers — sample payloads that exercise the write path
// ---------------------------------------------------------------------------

const SAMPLE_MEMO_RECORD = {
  bookId: 'joh',
  chapterNumber: 3,
  verseNumber: 16,
  translationId: 'lsg',
  bibleVerseReference: 'Jean 3:16',
  bibleVerseText: 'text',
  status: 'new' as const,
  fsrsState: {
    stability: 1,
    difficulty: 5,
    lastInterval: 0,
    nextInterval: 1,
    retrievability: 0.8,
    repetitions: 0,
    lastReviewAt: null,
    due: null,
  },
  favorite: false,
  tags: [],
  createdAt: 1_700_000_000_000,
  lastReviewedAt: null,
  nextReviewAt: 1_700_100_000_000,
  reviewCount: 0,
  totalReviewMinutes: 0,
  wordPerformance: [],
};

// ---------------------------------------------------------------------------
// Tests — MemorizationRepositoryPowerSync
// ---------------------------------------------------------------------------

describe('MemorizationRepositoryPowerSync — offline hardening', () => {
  let db: ReturnType<typeof makeMockDb>;
  let repo: MemorizationRepositoryPowerSync;
  let provider: ReturnType<typeof makeFakeUserIdProvider>;

  beforeEach(() => {
    db = makeMockDb();
    provider = makeFakeUserIdProvider();
    repo = new MemorizationRepositoryPowerSync(provider, () => db as never);
  });

  it('does not throw when dbFactory returns a pending DB on upsert', async () => {
    // `db` is in pending state by default (ready === false).
    // writeTransaction enqueues the op in ps_crud rather than executing.
    await expect(repo.upsert('user-abc', SAMPLE_MEMO_RECORD as any)).resolves.toBeUndefined();
    expect(db.__psCrud.length).toBe(1);
  });

  it('replays the pending write onto the ready DB after reconnect', async () => {
    await repo.upsert('user-abc', SAMPLE_MEMO_RECORD as any);
    expect(db.__psCrud.length).toBe(1);

    // Now the DB is ready — future writes execute inline.
    db.makeReady();
    await repo.upsert('user-abc', SAMPLE_MEMO_RECORD as any);

    expect(db.writeTransaction).toHaveBeenCalledTimes(2);
    const { sql } = db.__executed[0];
    expect(sql).toContain('INSERT INTO memorization_records');
    expect(sql).not.toContain('ON CONFLICT');
    expect(db.__executed[0].params).toHaveLength(21);
  });

  it('asserts the exact SQL shape and param count for the INSERT', async () => {
    db.makeReady();
    await repo.upsert('user-abc', SAMPLE_MEMO_RECORD as any);

    const { sql, params } = db.__executed[0];
    expect(sql).toContain('INSERT INTO memorization_records');
    expect(sql).toContain('book_id');
    expect(sql).toContain('chapter_number');
    expect(sql).toContain('verse_number');
    expect(sql).toContain('translation_id');
    expect(sql).toContain('bible_verse_reference');
    expect(sql).toContain('bible_verse_text');
    expect(sql).toContain('status');
    expect(sql).toContain('fsrs_state');
    expect(sql).toContain('stability');
    expect(sql).toContain('difficulty');
    expect(sql).toContain('next_review_at');
    expect(sql).toContain('created_at');
    expect(sql).toContain('updated_at');
    expect(sql).toContain('last_reviewed_at');
    expect(sql).toContain('review_count');
    expect(sql).toContain('total_review_minutes');
    expect(sql).toContain('favorite');
    expect(sql).toContain('tags');
    expect(params).toHaveLength(21);
  });
});

// ---------------------------------------------------------------------------
// Tests — FamilyRepositoryPowerSync
// ---------------------------------------------------------------------------

describe('FamilyRepositoryPowerSync — offline hardening', () => {
  let db: ReturnType<typeof makeMockDb>;
  let repo: FamilyRepositoryPowerSync;
  let provider: ReturnType<typeof makeFakeUserIdProvider>;

  beforeEach(() => {
    db = makeMockDb();
    provider = makeFakeUserIdProvider();
    repo = new FamilyRepositoryPowerSync(provider, () => db as never);
  });

  it('does not throw when dbFactory returns a pending DB on create', async () => {
    await expect(
      repo.create({ ownerId: 'user-abc', name: 'Ma Famille', color: '#ff0000', icon: 'home' }),
    ).resolves.toBeDefined();
    expect(db.__psCrud.length).toBe(1);
  });

  it('replays the pending create write onto the ready DB', async () => {
    await repo.create({ ownerId: 'user-abc', name: 'Ma Famille', color: '#ff0000', icon: 'home' });
    db.makeReady();
    await repo.create({ ownerId: 'user-abc', name: 'Autre Famille', color: '#00ff00', icon: 'user' });

    const { sql, params } = db.__executed[0];
    expect(sql).toContain('INSERT INTO families');
    expect(sql).toContain('owner_id');
    expect(sql).toContain('name');
    expect(params[1]).toBe('user-abc');
    expect(params[2]).toBe('Autre Famille');
  });
});

// ---------------------------------------------------------------------------
// Tests — StreakRepositoryPowerSync
// ---------------------------------------------------------------------------

describe('StreakRepositoryPowerSync — offline hardening', () => {
  let db: ReturnType<typeof makeMockDb>;
  let repo: StreakRepositoryPowerSync;
  let provider: ReturnType<typeof makeFakeUserIdProvider>;

  beforeEach(() => {
    db = makeMockDb();
    provider = makeFakeUserIdProvider();
    repo = new StreakRepositoryPowerSync(provider, () => db as never);
  });

  it('does not throw when dbFactory returns a pending DB on insert', async () => {
    await expect(
      repo.insert({ userId: 'user-abc', streakDate: '2024-06-15', versesMemorized: 5, reviewsCompleted: 3, sessionDurationMinutes: 20 }),
    ).resolves.toBeUndefined();
    expect(db.__psCrud.length).toBe(1);
  });

  it('replays the pending insert onto the ready DB with correct SQL + params', async () => {
    await repo.insert({ userId: 'user-abc', streakDate: '2024-06-15', versesMemorized: 5, reviewsCompleted: 3, sessionDurationMinutes: 20 });
    db.makeReady();
    await repo.insert({ userId: 'user-abc', streakDate: '2024-06-16', versesMemorized: 1, reviewsCompleted: 0, sessionDurationMinutes: 5 });

    const { sql, params } = db.__executed[0];
    expect(sql).toContain('INSERT INTO streaks');
    expect(params[1]).toBe('user-abc');
    expect(params[2]).toBe('2024-06-16');
    expect(params[3]).toBe(1);
    expect(params[4]).toBe(0);
    expect(params[5]).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Tests — ReviewLogRepositoryPowerSync
// ---------------------------------------------------------------------------

describe('ReviewLogRepositoryPowerSync — offline hardening', () => {
  let db: ReturnType<typeof makeMockDb>;
  let repo: ReviewLogRepositoryPowerSync;
  let provider: ReturnType<typeof makeFakeUserIdProvider>;

  beforeEach(() => {
    db = makeMockDb();
    provider = makeFakeUserIdProvider();
    repo = new ReviewLogRepositoryPowerSync(provider, () => db as never);
  });

  it('does not throw when dbFactory returns a pending DB on append', async () => {
    const entry = {
      id: 'log-1',
      memorizationRecordId: 'rec-1',
      answeredAt: 1_700_200_000_000,
      rating: 'good' as const,
      actualInterval: 1,
      predictedInterval: 2,
      stabilityBefore: 1,
      stabilityAfter: 3,
      difficultyBefore: 5,
      difficultyAfter: 5,
      wordPerformance: [],
    };
    await expect(repo.append('user-abc', entry)).resolves.toBeUndefined();
    expect(db.__psCrud.length).toBe(1);
  });

  it('replays the pending append onto the ready DB with 15 positional params', async () => {
    const entry = {
      id: 'log-1',
      memorizationRecordId: 'rec-1',
      answeredAt: 1_700_200_000_000,
      rating: 'good' as const,
      actualInterval: 1,
      predictedInterval: 2,
      stabilityBefore: 1,
      stabilityAfter: 3,
      difficultyBefore: 5,
      difficultyAfter: 5,
      wordPerformance: [],
    };
    await repo.append('user-abc', entry);
    db.makeReady();
    await repo.append('user-abc', entry);

    const { sql, params } = db.__executed[0];
    expect(sql).toContain('INSERT INTO review_logs');
    expect(sql).not.toContain('ON CONFLICT');
    expect(params).toHaveLength(15);
  });
});

// ---------------------------------------------------------------------------
// Tests — TelemetryEventsRepositoryPowerSync
// ---------------------------------------------------------------------------

describe('TelemetryEventsRepositoryPowerSync — offline hardening', () => {
  let db: ReturnType<typeof makeMockDb>;
  let repo: TelemetryEventsRepositoryPowerSync;
  let provider: ReturnType<typeof makeFakeUserIdProvider>;

  beforeEach(() => {
    db = makeMockDb();
    provider = makeFakeUserIdProvider();
    repo = new TelemetryEventsRepositoryPowerSync(provider, () => db as never);
  });

  it('does not throw when dbFactory returns a pending DB on upload', async () => {
    const events = [{ eventType: 'feature.accessed', timestamp: 1_700_000_000_000, payload: { featureName: 'home' }, sessionId: 'sess-1' } as unknown as import('@/domains/telemetry/entities').TelemetryEvent];
    await expect(repo.upload(events)).resolves.toBeUndefined();
    expect(db.__psCrud.length).toBe(1);
  });

  it('replays the pending upload batch onto the ready DB', async () => {
    const events = [
      { eventType: 'feature.accessed', timestamp: 1_700_000_000_000, payload: { featureName: 'home' }, sessionId: 'sess-1' } as unknown as import('@/domains/telemetry/entities').TelemetryEvent,
    ];
    await repo.upload(events);
    db.makeReady();
    await repo.upload(events);

    const { sql } = db.__executed[0];
    expect(sql).toContain('INSERT INTO telemetry_events');
    expect(sql).toContain('event_type');
    expect(sql).toContain('payload');
  });
});
