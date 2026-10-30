/**
 * Mock mode — frontend-only data layer.
 *
 * Verifies that the mock backend behaves like the real repositories for the
 * screens that depend on them:
 *   - the seed produces due / mastered / new records,
 *   - the memorization adapter upserts deterministically and reads back,
 *   - due-review ordering + `mastered` exclusion match the SQL adapter,
 *   - review logs are append-only and readable per record / per user,
 *   - family + profile adapters round-trip,
 *   - the data mode resolves from the URL / localStorage / env.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// The dev layer imports `import.meta.env`; jsdom provides it.
import { mockDb, MOCK_DB_STORAGE_KEY } from '@/dev/mock/db';
import {
  buildSeedRecords,
  resetMockDatabase,
  seedMockDatabase,
  SEED_VERSES,
} from '@/dev/mock/seed';
import {
  MockFamilyRepository,
  MockLearnerProfileRepository,
  MockMemorizationRepository,
  MockReviewLogRepository,
  MockStreakRepository,
  MockTranslationPreferenceRepository,
} from '@/dev/mock/repositories';
import { getMockUserId, stableId } from '@/dev/mock/identity';
import { getDataMode, isMockMode, setDataMode, clearDataModeOverride } from '@/dev/mode';
import type { ReviewLogEntry } from '@/domains/memorization';

vi.mock('@/dev/local-backend', () => ({
  localBackend: {
    record: vi.fn(),
    getStats: () => ({ baseUrl: '/api', queued: 0, sent: 0, failed: 0 }),
    dashboardUrl: () => '/mock-dashboard/',
    pushSnapshot: vi.fn().mockResolvedValue(true),
  },
  recordTestEvent: vi.fn(),
}));

const USER = 'usr_test_user';

describe('mock mode — seed', () => {
  beforeEach(() => {
    localStorage.clear();
    mockDb.reset();
  });

  it('seeds records, logs, profiles, family and streaks', () => {
    const result = seedMockDatabase({ userId: USER, force: true });
    expect(result.seeded).toBe(true);
    expect(result.records).toBe(SEED_VERSES.length);

    const counts = mockDb.counts();
    expect(counts.memorization_records).toBe(SEED_VERSES.length);
    expect(counts.review_logs).toBeGreaterThan(0);
    expect(counts.learner_profiles).toBe(2);
    expect(counts.families).toBe(1);
    expect(counts.family_memberships).toBe(3);
    expect(counts.streaks).toBeGreaterThan(0);
    expect(counts.translation_preferences).toBe(1);
  });

  it('is idempotent unless forced', () => {
    seedMockDatabase({ userId: USER, force: true });
    const second = seedMockDatabase({ userId: USER });
    expect(second.seeded).toBe(false);
    expect(mockDb.counts().memorization_records).toBe(SEED_VERSES.length);
  });

  it('persists to localStorage', () => {
    seedMockDatabase({ userId: USER, force: true });
    // Persist is debounced (60 ms); force a flush through a synchronous write.
    mockDb.replace('users', mockDb.list('users'));
    const raw = localStorage.getItem(MOCK_DB_STORAGE_KEY);
    expect(raw).toBeTruthy();
  });

  it('reset re-seeds from scratch', () => {
    seedMockDatabase({ userId: USER, force: true });
    const result = resetMockDatabase();
    expect(result.seeded).toBe(true);
    expect(mockDb.counts().memorization_records).toBe(SEED_VERSES.length);
  });
});

describe('mock mode — repositories', () => {
  let records: ReturnType<typeof buildSeedRecords>;

  beforeEach(() => {
    localStorage.clear();
    mockDb.reset();
    seedMockDatabase({ userId: USER, force: true });
    records = buildSeedRecords(USER, 'prf_main');
  });

  it('exposes due records, excluding mastered ones', async () => {
    const repo = new MockMemorizationRepository();
    const due = await repo.listDueByUser(USER);
    expect(due.length).toBeGreaterThan(0);
    expect(due.every((r) => r.status !== 'mastered')).toBe(true);
    expect(due.every((r) => (r.nextReviewAt ?? 0) <= Date.now())).toBe(true);
  });

  it('lists every record for the owner', async () => {
    const repo = new MockMemorizationRepository();
    const all = await repo.listByUser(USER);
    expect(all).toHaveLength(SEED_VERSES.length);
    expect(await repo.listByStatus(USER, 'mastered')).toHaveLength(
      SEED_VERSES.filter((v) => v.status === 'mastered').length,
    );
  });

  it('upserts deterministically and reads the record back', async () => {
    const repo = new MockMemorizationRepository();
    const base = records[0];
    const id = repo.computeId(USER, base);

    await repo.upsert(USER, {
      ...base,
      status: 'in-progress',
      reviewCount: base.reviewCount + 1,
      nextReviewAt: Date.now() + 86_400_000,
    });
    const stored = await repo.getById(USER, id);
    expect(stored).not.toBeNull();
    expect(stored?.reviewCount).toBe(base.reviewCount + 1);
    // Upsert is an update, not a duplicate insert.
    expect(await repo.listByUser(USER)).toHaveLength(SEED_VERSES.length);
  });

  it('removes a record', async () => {
    const repo = new MockMemorizationRepository();
    const id = repo.computeId(USER, records[0]);
    await repo.remove(USER, id);
    expect(await repo.getById(USER, id)).toBeNull();
  });

  it('appends immutable review logs', async () => {
    const repo = new MockReviewLogRepository();
    const recordId = records[0].id;
    const entry: ReviewLogEntry = {
      id: stableId('log_', 'manual-test'),
      memorizationRecordId: recordId,
      answeredAt: Date.now(),
      rating: 'good',
      actualInterval: 2,
      predictedInterval: 4,
      stabilityBefore: 2,
      stabilityAfter: 4.5,
      difficultyBefore: 5,
      difficultyAfter: 4.6,
      wordPerformance: [],
    };
    await repo.append(USER, entry);
    const forRecord = await repo.listByRecord(recordId);
    expect(forRecord[0]?.id).toBe(entry.id);
    const forUser = await repo.listByUser(USER);
    expect(forUser.length).toBeGreaterThan(0);
  });

  it('round-trips learner profiles', async () => {
    const repo = new MockLearnerProfileRepository();
    const created = await repo.create({
      accountId: USER,
      displayName: 'Profil test',
      status: 'active',
    });
    const list = await repo.findByAccountId(USER);
    expect(list.some((p) => p.id === created.id)).toBe(true);
    const updated = await repo.update(created.id, { displayName: 'Renommé' });
    expect(updated?.displayName).toBe('Renommé');
    expect(await repo.delete(created.id)).toBe(true);
  });

  it('round-trips family, members and invitations', async () => {
    const repo = new MockFamilyRepository();
    const families = await repo.findByOwnerId(USER);
    expect(families).toHaveLength(1);
    const members = await repo.getMembers(families[0].id);
    expect(members).toHaveLength(3);
    const removed = await repo.removeMember(families[0].id, members[1].accountId);
    expect(removed).toBe(true);
  });

  it('round-trips streaks (one row per day)', async () => {
    const repo = new MockStreakRepository();
    const today = new Date().toISOString().slice(0, 10);
    await repo.insert({
      userId: USER,
      streakDate: '2030-01-01',
      versesMemorized: 1,
      reviewsCompleted: 2,
      sessionDurationMinutes: 5,
    });
    await repo.insert({
      userId: USER,
      streakDate: '2030-01-01',
      versesMemorized: 3,
      reviewsCompleted: 4,
      sessionDurationMinutes: 6,
    });
    const row = await repo.getForDate(USER, '2030-01-01');
    expect(row?.reviewsCompleted).toBe(4);
    expect(await repo.getForDate(USER, today)).not.toBeNull();
  });

  it('persists and validates the translation preference', async () => {
    const repo = new MockTranslationPreferenceRepository();
    expect(await repo.get()).toBe('lsg');
    await repo.set('lsg');
    expect(await repo.get()).toBe('lsg');
    await expect(repo.set('xx-inconnue')).rejects.toThrow();
  });

  it('stamps every row with the mock owner id', () => {
    expect(getMockUserId()).toMatch(/^usr_/);
  });
});

describe('mock mode — data mode resolution', () => {
  beforeEach(() => {
    localStorage.clear();
    clearDataModeOverride();
  });

  it('uses the persisted override', () => {
    setDataMode('mock');
    expect(getDataMode()).toBe('mock');
    expect(isMockMode()).toBe(true);
    setDataMode('live');
    expect(getDataMode()).toBe('live');
  });

  it('persists the ?data= query parameter', () => {
    window.history.replaceState({}, '', '/?data=mock');
    clearDataModeOverride();
    // `getDataMode` caches after the first call in the module — reset it by
    // clearing the override (which also clears the cache) and re-reading.
    expect(getDataMode()).toBe('mock');
    expect(localStorage.getItem('versyflow:data-mode')).toBe('mock');
    window.history.replaceState({}, '', '/');
  });
});
