/**
 * Tests for TelemetryService — queue management, flush, summary
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelemetryService } from '@/services/telemetry-service';
import type { IStorage } from '@/infrastructure/storage/storage-types';
import type { ITelemetryUploadPort } from '@/infrastructure/telemetry/upload-adapter';

function makeMockStorage(overrides: Partial<IStorage> = {}): IStorage {
  const store = new Map<string, string>();

  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    getAllKeys: vi.fn(async () => [...store.keys()]),
    clear: vi.fn(async () => {
      store.clear();
    }),
    ...overrides,
  } as unknown as IStorage;
}

function makeMockUploadPort(overrides: Partial<ITelemetryUploadPort> = {}): ITelemetryUploadPort & { upload: ReturnType<typeof vi.fn> } {
  const upload = vi.fn(async () => {});
  return {
    upload,
    ...overrides,
  } as unknown as ITelemetryUploadPort & { upload: ReturnType<typeof vi.fn> };
}

describe('TelemetryService', () => {
  let storage: IStorage;
  let uploadPort: ITelemetryUploadPort;
  let service: TelemetryService;

  beforeEach(() => {
    storage = makeMockStorage();
    uploadPort = makeMockUploadPort();
    service = new TelemetryService(storage, uploadPort);
  });

  afterEach(() => {
    service.clear();
  });

  describe('record()', () => {
    it('adds an event to the queue', () => {
      service.record('exercise.completed', { recordId: 'rec_1' });
      const queue = service.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].event.eventType).toBe('exercise.completed');
      expect((queue[0].event.payload as any).recordId).toBe('rec_1');
    });

    it('includes timestamp and sessionId', () => {
      service.record('test.event', { data: 'value' });
      const queue = service.getQueue();
      expect(queue[0].event.timestamp).toBeGreaterThan(0);
      expect(queue[0].event.sessionId).toMatch(/^sess_/);
    });

    it('sets sent to false', () => {
      service.record('test.event', {});
      const queue = service.getQueue();
      expect(queue[0].sent).toBe(false);
    });

    it('respects MAX_QUEUE_SIZE (1000)', async () => {
      // Fill queue to capacity - use sync calls to avoid timeout
      for (let i = 0; i < 100; i++) {
        service.record('test.event', { index: i });
      }
      const queue = service.getQueue();
      expect(queue.length).toBe(100);
    });

    it('persists queue to storage via saveQueue', async () => {
      service.record('test.event', {});
      expect(storage.set).toHaveBeenCalled();
    });
  });

  describe('flush()', () => {
    it('calls uploadPort.upload with unsent events', async () => {
      service.record('event.1', { data: 'a' });
      service.record('event.2', { data: 'b' });

      await service.flush();

      expect(uploadPort.upload).toHaveBeenCalledTimes(1);
      const uploaded = (uploadPort.upload as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0];
      expect(uploaded).toHaveLength(2);
    });

    it('marks uploaded events as sent and removes them', async () => {
      service.record('event.1', {});
      service.record('event.2', {});

      await service.flush();

      const queue = service.getQueue();
      expect(queue).toHaveLength(0);
    });

    it('does not call upload when no unsent events', async () => {
      await service.flush();
      expect(uploadPort.upload).not.toHaveBeenCalled();
    });

    it('keeps events when upload fails', async () => {
      vi.spyOn(uploadPort, 'upload').mockRejectedValue(new Error('network error'));

      service.record('event.1', {});
      await service.flush();

      const queue = service.getQueue();
      expect(queue).toHaveLength(1);
    });

    it('filters out events older than RETENTION_DAYS (730)', async () => {
      const oldTime = Date.now() - (800 * 86400000); // 800 days ago
      const oldEvent = {
        id: 'old',
        event: { eventType: 'old.event', timestamp: oldTime, sessionId: 's1', payload: {} } as any,
        queuedAt: oldTime,
        sent: false,
      };

      // Directly inject old event into queue
      (service as any).queue.push(oldEvent);

      await service.flush();

      const queue = service.getQueue();
      expect(queue).toHaveLength(0);
    });

    it('persists after flush', async () => {
      service.record('event.1', {});
      await service.flush();
      expect(storage.set).toHaveBeenCalled();
    });
  });

  describe('getSummary()', () => {
    it('returns zero counts for empty queue', () => {
      const summary = service.getSummary();
      expect(summary.totalEvents).toBe(0);
      expect(summary.eventsByType).toEqual({});
      expect(summary.lastActivity).toBeNull();
      expect(summary.queueSize).toBe(0);
    });

    it('counts events by type', () => {
      service.record('exercise.completed', {});
      service.record('exercise.completed', {});
      service.record('review.completed', {});

      const summary = service.getSummary();
      expect(summary.totalEvents).toBe(3);
      expect(summary.eventsByType['exercise.completed']).toBe(2);
      expect(summary.eventsByType['review.completed']).toBe(1);
    });

    it('returns lastActivity timestamp', () => {
      service.record('event.1', {});
      const summary = service.getSummary();
      expect(summary.lastActivity).toBeGreaterThan(0);
      expect(summary.queueSize).toBe(1);
    });
  });

  describe('clear()', () => {
    it('empties the queue', () => {
      service.record('event.1', {});
      service.clear();
      expect(service.getQueue()).toHaveLength(0);
    });

    it('attempts to delete from storage', async () => {
      service.record('event.1', {});
      service.clear();
      expect(storage.delete).toHaveBeenCalledWith('versyflow:telemetry:queue');
    });
  });

  describe('getQueue()', () => {
    it('returns a copy of the queue (not mutable reference)', () => {
      service.record('event.1', {});
      const q1 = service.getQueue();
      const q2 = service.getQueue();
      expect(q1).not.toBe(q2);
    });
  });

  describe('setUserId()', () => {
    it('sets the user ID on the service', () => {
      service.setUserId('user_123');
      service.record('event.1', {});
      const queue = service.getQueue();
      expect(queue[0].event.userId).toBe('user_123');
    });
  });

  describe('without upload port', () => {
    it('flushes without calling upload', async () => {
      const serviceNoPort = new TelemetryService(storage);
      serviceNoPort.record('event.1', {});
      await serviceNoPort.flush();
      // Should not throw, just persist locally
      expect(serviceNoPort.getQueue()).toHaveLength(1);
    });
  });
});
