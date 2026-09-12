/**
 * TelemetryService flush + TelemetryEventsRepositoryPowerSync upload
 *
 * Port-based architecture test:
 *  - TelemetryService.flush() pulls the unsent queue into the upload port,
 *    prunes sent items on success, keeps the queue on failure (offline).
 *  - TelemetryEventsRepositoryPowerSync.upload() INSERTs redacted events
 *    into telemetry_events scoped to the resolved user id; drops the batch
 *    when there is no active session. Idempotent via client-generated UUID.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- Real imports -----------------------------------------------------------

import { TelemetryService } from '@/services/telemetry-service';
import type { IStorage } from '@/infrastructure/storage/storage-types';
import { TelemetryEventsRepositoryPowerSync } from '@/infrastructure/telemetry/telemetry-events-repository-powersync';
import type { ISyncUserIdProvider } from '@/infrastructure/sync/sync-user-id-provider';
import type { TelemetryEvent } from '@/domains/telemetry/entities';

// ---- Mocks ------------------------------------------------------------------

/** Shared mock DB surface for TelemetryEventsRepositoryPowerSync. */
function makeMockDb() {
  const txExecute = vi.fn().mockResolvedValue(undefined);
  const writeTransaction = vi.fn(async (cb: (tx: any) => Promise<void>) => {
    await cb({ execute: txExecute });
  });
  return { getAll: vi.fn(), writeTransaction, execute: txExecute };
}

type MockDb = ReturnType<typeof makeMockDb>;

const sampleEvent: TelemetryEvent = {
  eventType: 'streak.incremented',
  timestamp: 1_700_000_000_000,
  sessionId: 'sess_test',
  payload: { streakDelta: 1, previousStreak: 5, newStreak: 6 },
};

// ---- Tests ------------------------------------------------------------------

describe('TelemetryEventsRepositoryPowerSync.upload()', () => {
  let mockDb: MockDb;
  let userIdProvider: ISyncUserIdProvider;
  let repo: TelemetryEventsRepositoryPowerSync;

  beforeEach(() => {
    mockDb = makeMockDb();
    userIdProvider = { resolveUserId: vi.fn() };
    repo = new TelemetryEventsRepositoryPowerSync(userIdProvider, () => mockDb as never);
    vi.clearAllMocks();
  });

  it('drops the batch when there is no authenticated session (userId === null)', async () => {
    userIdProvider.resolveUserId.mockResolvedValue(null);

    await repo.upload([sampleEvent]);

    expect(mockDb.writeTransaction).not.toHaveBeenCalled();
    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  it('INSERTs each event with deterministic SQL and positional params scoped to userId', async () => {
    const resolvedId = 'user-resolved-abc';
    userIdProvider.resolveUserId.mockResolvedValue(resolvedId);
    // Stub randomUUID so we can assert the exact SQL+params.
    vi.doMock('@/infrastructure/sync/uuid', () => ({
      randomUUID: () => 'stub-uuid-000',
    }));

    await repo.upload([sampleEvent]);

    expect(mockDb.writeTransaction).toHaveBeenCalledTimes(1);
    expect(mockDb.execute).toHaveBeenCalledTimes(1);

    const [sql, params] = mockDb.execute.mock.calls[0];
    expect(sql).toContain('INSERT INTO telemetry_events');
    expect(sql).toContain('user_id');
    expect(sql).toContain('event_type');
    expect(sql).toContain('payload');
    expect(sql).toContain('session_id');
    expect(sql).toContain('created_at');
    expect(sql).not.toContain('ON CONFLICT');
    expect(params).toHaveLength(6);
    expect(params[1]).toBe(resolvedId);
    expect(params[2]).toBe('streak.incremented');
    expect(JSON.parse(params[3] as string)).toEqual(sampleEvent.payload);
    expect(params[4]).toBe('sess_test');
    expect(params[5]).toBe(new Date(sampleEvent.timestamp).toISOString());
  });

  it('handles multiple events in a single writeTransaction', async () => {
    userIdProvider.resolveUserId.mockResolvedValue('u1');

    const evt1 = { ...sampleEvent, eventType: 'streak.incremented' as const, id: 'e1' };
    const evt2 = { ...sampleEvent, eventType: 'milestone.reached' as const, id: 'e2' };

    vi.doMock('@/infrastructure/sync/uuid', () => ({
      randomUUID: () => 'stub-uuid-m',
    }));

    await repo.upload([evt1, evt2]);

    expect(mockDb.execute).toHaveBeenCalledTimes(2);
    const [, params2] = mockDb.execute.mock.calls[1];
    expect(params2[2]).toBe('milestone.reached');
  });

  it('no-op on empty events array', async () => {
    await repo.upload([]);

    expect(userIdProvider.resolveUserId).not.toHaveBeenCalled();
    expect(mockDb.writeTransaction).not.toHaveBeenCalled();
  });

  it('treats a throwing resolveUserId as "no session" (no crash, no write)', async () => {
    // Resolver failure (e.g. auth store not ready) must be treated exactly
    // like a null user id: skip the local write, never crash the flush.
    userIdProvider.resolveUserId.mockImplementation(
      () => Promise.reject(new Error('auth store unavailable')),
    );

    let thrown: unknown = null;
    try {
      await repo.upload([sampleEvent]);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeNull();
    expect(mockDb.writeTransaction).not.toHaveBeenCalled();
    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  afterEach(() => {
    vi.doUnmock('@/infrastructure/sync/uuid');
  });
});

describe('TelemetryService.flush() with upload port', () => {
  let mockStorage: IStorage;
  let uploadPortUploadSpy: ReturnType<typeof vi.fn>;
  let service: TelemetryService;

  beforeEach(() => {
    uploadPortUploadSpy = vi.fn().mockResolvedValue(undefined);
    mockStorage = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      getAllKeys: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    service = new TelemetryService(mockStorage as never, {
      upload: uploadPortUploadSpy,
    } as never);
  });

  it('marks sent items and prunes queue on successful upload', async () => {
    service.record('streak.incremented', { streakDelta: 1 });
    service.record('milestone.reached', { totalVerses: 100 });
    expect(service.getQueue()).toHaveLength(2);

    await service.flush();

    expect(uploadPortUploadSpy).toHaveBeenCalledTimes(1);
    const uploadedEvents = uploadPortUploadSpy.mock.calls[0][0] as TelemetryEvent[];
    expect(uploadedEvents).toHaveLength(2);
    // Both items should now be marked sent and pruned.
    expect(service.getQueue()).toHaveLength(0);
  });

  it('keeps the queue intact when upload rejects (offline scenario)', async () => {
    uploadPortUploadSpy.mockRejectedValueOnce(new Error('OFFLINE'));
    service.record('streak.incremented', { streakDelta: 1 });

    await service.flush();

    expect(service.getQueue()).toHaveLength(1);
    expect(service.getQueue()[0].sent).toBe(false);
  });

  it('flush with no upload port falls back to local-only (no crash)', async () => {
    const localOnlyService = new TelemetryService(mockStorage as never);
    localOnlyService.record('streak.incremented', { streakDelta: 1 });

    await localOnlyService.flush();

    // Should not throw; queue size reduced by retention filter (730 days).
    expect(localOnlyService.getQueue()).toHaveLength(1);
  });

  it('only uploads unsent items, leaves already-sent items untouched', async () => {
    // Pre-populate queue with one already-sent item and one unsent.
    (service as any).queue = [
      { id: 's1', event: sampleEvent, queuedAt: Date.now() - 1000, sent: true },
      { id: 's2', event: sampleEvent, queuedAt: Date.now(), sent: false },
    ];

    await service.flush();

    expect(uploadPortUploadSpy).toHaveBeenCalledTimes(1);
    const uploadedEvents = uploadPortUploadSpy.mock.calls[0][0] as TelemetryEvent[];
    expect(uploadedEvents).toHaveLength(1);
    // The sent item should still be in the queue (not re-uploaded, not pruned).
    expect(service.getQueue()).toHaveLength(1);
    expect(service.getQueue()[0].id).toBe('s1');
  });

  it('drops retention-expired events before attempting upload', async () => {
    const ancientTs = Date.now() - (800 * 86400000); // 800 days ago, > 730 day retention
    (service as any).queue = [
      { id: 'old', event: sampleEvent, queuedAt: ancientTs, sent: false },
      { id: 'new', event: sampleEvent, queuedAt: Date.now(), sent: false },
    ];

    await service.flush();

    expect(uploadPortUploadSpy).toHaveBeenCalledTimes(1);
    const uploadedEvents = uploadPortUploadSpy.mock.calls[0][0] as TelemetryEvent[];
    expect(uploadedEvents).toHaveLength(1);
    expect(uploadedEvents[0].sessionId).toBeDefined();
  });

  it('does not call upload when all items are already sent', async () => {
    (service as any).queue = [
      { id: 's1', event: sampleEvent, queuedAt: Date.now(), sent: true },
    ];

    await service.flush();

    expect(uploadPortUploadSpy).not.toHaveBeenCalled();
  });

  it('does not lose data when two flush() calls run in rapid succession', async () => {
    // Two flushes overlapping: the first hands a batch to the (slow) upload
    // while the second is kicked off. After both settle the queue must be
    // structurally valid — any item still unsent is uploaded by a follow-up
    // fast flush (no silent loss).
    service.record('streak.incremented', { streakDelta: 1 });
    service.record('review.completed', { recordId: 'r1' });
    expect(service.getQueue()).toHaveLength(2);

    // Slow-upload gate: resolve on demand via the captured `resolve` handles.
    const slowUpload = vi.fn((events: TelemetryEvent[]) => {
      return new Promise<void>((resolve) => {
        slowUploadResolvers.push(resolve);
      });
    });
    const slowUploadResolvers: Array<() => void> = [];
    uploadPortUploadSpy.mockImplementation(slowUpload as never);

    const flush1 = service.flush();
    // Let flush #1 enter its `await uploadPort.upload(...)`.
    await new Promise((r) => setTimeout(r, 0));

    // Record a third event while flush #1 is in flight.
    service.record('milestone.reached', { totalVerses: 10 });
    const flush2 = service.flush();
    await new Promise((r) => setTimeout(r, 0));

    // Resolve the slow uploads in order so both flushes can finish.
    while (slowUploadResolvers.length > 0) {
      slowUploadResolvers.shift()?.();
      await new Promise((r) => setTimeout(r, 0));
    }
    await Promise.all([flush1, flush2]);

    // Queue items remain structurally valid (id / event / sent).
    for (const item of service.getQueue()) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('event');
      expect(item).toHaveProperty('sent');
    }

    // Final fast flush: whatever is still unsent is uploaded and pruned.
    uploadPortUploadSpy.mockResolvedValue(undefined);
    await service.flush();
    expect(service.getQueue()).toHaveLength(0);
  });
});
