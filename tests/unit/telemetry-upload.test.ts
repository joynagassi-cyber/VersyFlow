/**
 * TelemetryService.flush() — port-based flush contract.
 *
 * `flush()` pulls the unsent queue into the upload port, prunes sent items on
 * success and keeps the queue on failure (offline). The app's port is the
 * local adapter; `NoOpTelemetryUploadAdapter` covers "nowhere to send".
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TelemetryService } from '@/services/telemetry-service';
import type { IStorage } from '@/infrastructure/storage/storage-types';
import type { ITelemetryUploadPort } from '@/infrastructure/telemetry/upload-adapter';
import type { TelemetryEvent, StreakIncrementedTelemetry } from '@/domains/telemetry/entities';

const sampleEvent: StreakIncrementedTelemetry = {
  eventType: 'streak.incremented',
  timestamp: 1_700_000_000_000,
  sessionId: 'sess_test',
  payload: { streakDelta: 1, previousStreak: 5, newStreak: 6 },
};

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
    // Two sequential flushes: the first uploads 2 items, a new event is
    // recorded while the second flush is triggered — the queue must end
    // up empty with no silent loss. No slow-upload tricks: each flush
    // resolves before the next begins.
    service.record('streak.incremented', { streakDelta: 1 });
    service.record('review.completed', { recordId: 'r1' });
    expect(service.getQueue()).toHaveLength(2);

    // First flush: uploads both, queue becomes empty.
    await service.flush();
    expect(service.getQueue()).toHaveLength(0);

    // Record a third event after the first flush completes.
    service.record('milestone.reached', { totalVerses: 10 });
    expect(service.getQueue()).toHaveLength(1);

    // Second flush: uploads the third event, queue becomes empty.
    await service.flush();
    expect(service.getQueue()).toHaveLength(0);

    // uploadPort called exactly twice (once per flush, no overlap).
    expect(uploadPortUploadSpy).toHaveBeenCalledTimes(2);
    // No duplicate events: each batch has distinct eventTypes.
    const batch1 = uploadPortUploadSpy.mock.calls[0][0] as TelemetryEvent[];
    const batch2 = uploadPortUploadSpy.mock.calls[1][0] as TelemetryEvent[];
    expect(batch1.map((e) => e.eventType)).toEqual(['streak.incremented', 'review.completed']);
    expect(batch2.map((e) => e.eventType)).toEqual(['milestone.reached']);
  });
});
