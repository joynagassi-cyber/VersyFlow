/**
 * Streak → Telemetry chain (integration)
 *
 * Emits `VERSE_MEMORIZED` on the shared `eventBus` and asserts the two
 * independent consumers:
 *   (a) the `TelemetryListener` records a *redacted* telemetry event, and
 *   (b) the `StreakService` (via `StreakCoordinator`) persists a daily
 *       streak fact through the insertOnly repository with a deterministic
 *       (user, day) id.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { eventBus, DomainEventTypes } from '@/domains/events';
import { TelemetryListener } from '@/services/telemetry-listener';
import { startStreakCoordinator } from '@/services/streak-coordinator';
import { ProgressService } from '@/services/progress-service';
import type { MemorizationService } from '@/domains/memorization';
import type { IFsrsEngine } from '@/domains/fsrs';
import type { ITelemetry } from '@/domains/telemetry/it telemetry';
import type { IStreakRepository } from '@/domains/streaks/repository';

// ---------------------------------------------------------------------------
// Deterministic clock
// ---------------------------------------------------------------------------

const TEST_NOW_MS = 1_718_409_600_000; // 2024-06-15T00:00:00.000Z
const TEST_USER_ID = 'user-abc';

/**
 * Three consecutive days of review activity so `calculateStreak()` ≥ 1 and
 * `incrementStreak()` performs the write.
 */
function makeReviewTimestamps(streakLength: number): number[] {
  return Array.from({ length: streakLength }, (_, i) => Date.now() - i * 86_400_000);
}

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

function makeFakeMemorizationService(): MemorizationService {
  const reviewTimes = makeReviewTimestamps(3);
  return {
    getAllMemorized: vi.fn().mockResolvedValue([
      { id: 'rec-1', lastReviewedAt: reviewTimes[0] },
    ]),
    getReviewLogsForRecord: vi.fn().mockResolvedValue(
      reviewTimes.slice(1).map((ts) => ({ answeredAt: ts })),
    ),
  } as unknown as MemorizationService;
}

/** ITelemetry stub that captures `record(eventType, payload)` calls. */
function makeTelemetryStub() {
  const calls: Array<{ eventType: string; payload: Record<string, unknown> }> = [];
  const record = vi.fn((eventType: string, payload: Record<string, unknown>) => {
    calls.push({ eventType, payload });
    return Promise.resolve();
  });
  return {
    calls,
    record,
  } as unknown as ITelemetry & { calls: Array<{ eventType: string; payload: Record<string, unknown> }>; record: typeof record };
}

/** insertOnly stub: captures the `insert` record (asserts deterministic id). */
function makeStreakRepoStub() {
  const inserts: Array<{ userId: string; streakDate: string; reviewsCompleted: number }> = [];
  const repo: IStreakRepository = {
    insert: vi.fn(async (record: { userId: string; streakDate: string; reviewsCompleted: number }) => {
      inserts.push(record);
    }),
    getForDate: vi.fn().mockResolvedValue(null),
  };
  return { repo, inserts };
}

// ---------------------------------------------------------------------------
// Fixture wiring
// ---------------------------------------------------------------------------

function makeFixture() {
  const memorizationService = makeFakeMemorizationService();
  const fsrsEngine = {} as IFsrsEngine; // unused by the streak path
  const telemetry = makeTelemetryStub();
  const { repo, inserts } = makeStreakRepoStub();
  const userIdResolver = vi.fn().mockResolvedValue(TEST_USER_ID);

  const progressService = new ProgressService(
    memorizationService,
    fsrsEngine,
    undefined, // no telemetry needed for streak increment
    'default',
    repo,
    userIdResolver,
  );

  return { progressService, telemetry, inserts, repo, userIdResolver };
}

function verseMemorizedEvent(): { id: string; type: string; timestamp: number; payload: Record<string, unknown> } {
  return {
    id: 'evt-1',
    type: DomainEventTypes.VERSE_MEMORIZED,
    timestamp: Date.now(),
    payload: {
      recordId: 'joh:3:16-lsg',
      durationMs: 42_000,
      rating: 3,
      verseText: 'RAW VERSE TEXT MUST NOT LEAK',
      context: { bookId: 'joh', chapterNumber: 3, verseNumber: 16, translationId: 'lsg' },
      exerciseType: 'active-recall',
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Streak → Telemetry chain (integration)', () => {
  let restoreDate: () => void;
  let teardown: (() => void) | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(TEST_NOW_MS);
    restoreDate = () => {
      vi.useRealTimers();
    };
  });

  afterEach(() => {
    teardown?.();
    teardown = null;
    restoreDate();
  });

  it('(a) VERSE_MEMORIZED reaches TelemetryListener.record() with a redacted event', () => {
    const { telemetry } = makeFixture();
    const listener = new TelemetryListener(telemetry);
    listener.start();
    teardown = () => listener.stop();

    eventBus.emit(verseMemorizedEvent());

    // The listener recorded exactly one event, of the mapped type.
    expect(telemetry.record).toHaveBeenCalledTimes(1);
    const [eventType, payload] = telemetry.record.mock.calls[0];
    expect(eventType).toBe('exercise.completed');
    // Redaction: raw verse text never reaches the telemetry queue.
    expect(JSON.stringify(payload)).not.toContain('RAW VERSE TEXT MUST NOT LEAK');
    // The structured payload is preserved.
    expect(payload).toMatchObject({ recordId: 'joh:3:16-lsg', rating: 3 });
  });

  it('(b) VERSE_MEMORIZED triggers StreakService.incrementStreak() write with a deterministic (user, day) id', async () => {
    const { progressService, inserts, repo, userIdResolver } = makeFixture();
    teardown = startStreakCoordinator(progressService);

    eventBus.emit(verseMemorizedEvent());

    // The coordinator is fire-and-forget: let the microtasks settle.
    await vi.advanceTimersByTimeAsync(0);

    expect(userIdResolver).toHaveBeenCalled();
    expect(repo.insert).toHaveBeenCalledTimes(1);
    expect(inserts).toHaveLength(1);
    // Deterministic (user, day) id: one fact per user per day, reviewsCompleted = 1.
    expect(inserts[0].userId).toBe(TEST_USER_ID);
    expect(inserts[0].streakDate).toBe(new Date(TEST_NOW_MS).toISOString().slice(0, 10));
    expect(inserts[0].reviewsCompleted).toBe(1);
  });

  it('is a no-op write path when there is no user session (resolver → null)', async () => {
    const { progressService, inserts, repo, userIdResolver } = makeFixture();
    userIdResolver.mockResolvedValue(null);
    teardown = startStreakCoordinator(progressService);

    eventBus.emit(verseMemorizedEvent());
    await vi.advanceTimersByTimeAsync(0);

    // No write, no crash.
    expect(repo.insert).not.toHaveBeenCalled();
    expect(inserts).toHaveLength(0);
  });

  it('is a no-op write path when the resolver throws', async () => {
    const { progressService, inserts, repo, userIdResolver } = makeFixture();
    userIdResolver.mockRejectedValue(new Error('auth store unavailable'));
    teardown = startStreakCoordinator(progressService);

    eventBus.emit(verseMemorizedEvent());
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.insert).not.toHaveBeenCalled();
    expect(inserts).toHaveLength(0);
  });
});
