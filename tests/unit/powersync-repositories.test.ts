/**
 * PowerSync repositories — mocked DB unit tests
 *
 * Verifies the repository write/read SQL surface (parameter binding,
 * upsert-on-conflict for records, insert-only for review logs) without
 * opening a real SQLite database. The PowerSync DB is mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MemorizationRepositoryPowerSync,
} from '@/infrastructure/repository/memorization-repository-powersync';
import {
  ReviewLogRepositoryPowerSync,
} from '@/infrastructure/repository/review-log-repository-powersync';

type SqlRow = Record<string, unknown>;

function makeMockDb(rows: SqlRow[] = []) {
  const store: SqlRow[] = rows;
  const executed: Array<{ sql: string; params: unknown[] }> = [];

  const db = {
    getAll: vi.fn(async () => store),
    getOptional: vi.fn(async () => store),
    writeTransaction: vi.fn(async (cb: (tx: any) => Promise<void>) => {
      const tx = {
        execute: vi.fn(async (sql: string, params: unknown[] = []) => {
          executed.push({ sql, params });
        }),
      };
      await cb(tx);
    }),
    __executed: executed,
    __store: store,
  };
  return db;
}

const fakeUserId = 'user-1';

const sampleRecord = {
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

describe('MemorizationRepositoryPowerSync', () => {
  let db: ReturnType<typeof makeMockDb>;
  let repo: MemorizationRepositoryPowerSync;
  const provider = { resolveUserId: async () => fakeUserId };

  beforeEach(() => {
    db = makeMockDb();
    repo = new MemorizationRepositoryPowerSync(provider, () => db as never);
  });

  it('upsert issues a plain INSERT (NOT an ON CONFLICT upsert) with all columns bound positionally', async () => {
    await repo.upsert(fakeUserId, sampleRecord as any);
    expect(db.writeTransaction).toHaveBeenCalled();
    const { sql, params } = db.__executed[0];
    expect(sql).toContain('INSERT INTO memorization_records');
    // PowerSync v2.x schema tables are read-only views over ps_data__*; a plain
    // INSERT with the deterministic `id` is intercepted by the SDK and rewritten
    // into the JSON store, and enqueued in ps_crud. An `ON CONFLICT` clause
    // against the view fails with "cannot UPSERT a view".
    expect(sql).not.toContain('ON CONFLICT');
    // 21 columns bound positionally (id + 20 payload columns).
    expect(params).toHaveLength(21);
  });

  it('getById maps rows to entities', async () => {
    const row = {
      id: 'abc',
      user_id: fakeUserId,
      book_id: 'joh',
      chapter_number: 3,
      verse_number: 16,
      end_verse: null,
      translation_id: 'lsg',
      bible_verse_reference: 'Jean 3:16',
      bible_verse_text: 'text',
      status: 'new',
      fsrs_state: JSON.stringify(sampleRecord.fsrsState),
      stability: 1,
      difficulty: 5,
      next_review_at: null,
      created_at: '2023-11-14T22:13:20.000Z',
      updated_at: '2023-11-14T22:13:20.000Z',
      last_reviewed_at: null,
      review_count: 0,
      total_review_minutes: 0,
      favorite: 0,
      tags: '[]',
    };
    db.getAll.mockResolvedValueOnce([row]);
    const result = await repo.getById(fakeUserId, 'abc');
    expect(result?.bookId).toBe('joh');
    expect(result?.fsrsState.stability).toBe(1);
  });

  it('computeId is stable and differs by translation', () => {
    const a = repo.computeId(fakeUserId, sampleRecord);
    const b = repo.computeId(fakeUserId, sampleRecord);
    const c = repo.computeId(fakeUserId, { ...sampleRecord, translationId: 'kjv' });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('ReviewLogRepositoryPowerSync', () => {
  let db: ReturnType<typeof makeMockDb>;
  let repo: ReviewLogRepositoryPowerSync;
  const provider = { resolveUserId: async () => fakeUserId };

  beforeEach(() => {
    db = makeMockDb();
    repo = new ReviewLogRepositoryPowerSync(provider, () => db as never);
  });

  it('append issues a plain INSERT (no ON CONFLICT clause) with 15 positional params', async () => {
    const entry = {
      id: crypto.randomUUID(),
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
    await repo.append(fakeUserId, entry);
    const { sql, params } = db.__executed[0];
    expect(sql).toContain('INSERT INTO review_logs');
    // PowerSync v2.x: the schema table is a read-only view; a plain INSERT
    // with the random `id` is intercepted by the SDK. `ON CONFLICT` is not
    // supported against a view.
    expect(sql).not.toContain('ON CONFLICT');
    expect(params).toHaveLength(15);
  });

  it('listByRecord queries by memorization_record_id', async () => {
    db.getAll.mockResolvedValue([]);
    await repo.listByRecord('rec-1');
    await repo.listByRecord('rec-1');
    const firstArg = (db.getAll as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string | undefined;
    expect(firstArg).toContain('memorization_record_id = ?');
  });
});
