/**
 * Tests for StreakCoordinator — event-driven bridge from memorization
 * completion events to ProgressService.incrementStreak().
 *
 * The coordinator lives in src/services/streak-coordinator.ts and is a pure
 * composition-root helper: subscribe to the shared eventBus, delegate to
 * the progress service, and expose a disposer.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { eventBus, DomainEventTypes } from '@/domains/events';
import { startStreakCoordinator } from '@/services/streak-coordinator';
import type { ProgressService } from '@/services/progress-service';

function makeMockProgressService(overrides: Partial<ProgressService> = {}): ProgressService {
  return {
    incrementStreak: vi.fn(async () => true),
    ...overrides,
  } as unknown as ProgressService;
}

describe('startStreakCoordinator()', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribes to both VERSE_MEMORIZED and TARGET_MEMORIZED', () => {
    const onSpy = vi.spyOn(eventBus, 'on');
    const mockService = makeMockProgressService();

    const stop = startStreakCoordinator(mockService);
    stop();

    expect(onSpy).toHaveBeenCalledWith(DomainEventTypes.VERSE_MEMORIZED, expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith(DomainEventTypes.TARGET_MEMORIZED, expect.any(Function));
  });

  it('delegates to progressService.incrementStreak() on VERSE_MEMORIZED', () => {
    const mockService = makeMockProgressService();
    const stop = startStreakCoordinator(mockService);

    eventBus.emit({
      id: 'coord-1',
      type: DomainEventTypes.VERSE_MEMORIZED,
      timestamp: Date.now(),
      payload: { recordId: 'rec_1' },
    });

    // incrementStreak is fire-and-forget; flush microtasks so the void
    // promise resolves before asserting.
    return Promise.resolve().then(() => {
      expect(mockService.incrementStreak).toHaveBeenCalledTimes(1);
      stop();
    });
  });

  it('delegates to progressService.incrementStreak() on TARGET_MEMORIZED', () => {
    const mockService = makeMockProgressService();
    const stop = startStreakCoordinator(mockService);

    eventBus.emit({
      id: 'coord-2',
      type: DomainEventTypes.TARGET_MEMORIZED,
      timestamp: Date.now(),
      payload: { recordId: 'rec_2' },
    });

    return Promise.resolve().then(() => {
      expect(mockService.incrementStreak).toHaveBeenCalledTimes(1);
      stop();
    });
  });

  it('does not throw when incrementStreak rejects (offline-safe fire-and-forget)', () => {
    const mockService = makeMockProgressService({
      incrementStreak: vi.fn(async () => {
        throw new Error('db error');
      }),
    });
    const stop = startStreakCoordinator(mockService);

    eventBus.emit({
      id: 'coord-3',
      type: DomainEventTypes.VERSE_MEMORIZED,
      timestamp: Date.now(),
      payload: { recordId: 'rec_3' },
    });

    return Promise.resolve().then(() => {
      expect(mockService.incrementStreak).toHaveBeenCalledTimes(1);
      // no unhandled rejection: the coordinator swallows it
      stop();
    });
  });

  it('returned disposer removes both handlers (no leak across re-wires)', () => {
    const offSpy = vi.spyOn(eventBus, 'off');
    const mockService = makeMockProgressService();

    const stop = startStreakCoordinator(mockService);
    stop();

    expect(offSpy).toHaveBeenCalledWith(DomainEventTypes.VERSE_MEMORIZED, expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith(DomainEventTypes.TARGET_MEMORIZED, expect.any(Function));
  });

  it('is safe to wire + unwire repeatedly without throwing', () => {
    const mockService = makeMockProgressService();

    const stop1 = startStreakCoordinator(mockService);
    stop1();
    const stop2 = startStreakCoordinator(mockService);
    stop2();
    stop2(); // re-dispose is safe: off() on already-removed handlers is a no-op
    expect(mockService.incrementStreak).not.toHaveBeenCalled();
  });
});
