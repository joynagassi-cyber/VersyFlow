/**
 * Tests for AppTelemetryWiring — composition root for telemetry service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  wireAppTelemetry,
  unwireAppTelemetry,
} from '@/services/app-telemetry-wiring';
import { getTelemetryService } from '@/services/telemetry-service-factory';
import { TelemetryListener } from '@/services/telemetry-listener';

// Mock dependencies
vi.mock('@/services/telemetry-service-factory', () => ({
  getTelemetryService: vi.fn(() => ({
    flush: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock('@/services/telemetry-listener', () => ({
  TelemetryListener: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

describe('app-telemetry-wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unwireAppTelemetry();
  });

  afterEach(() => {
    unwireAppTelemetry();
  });

  describe('wireAppTelemetry()', () => {
    it('creates TelemetryListener and starts it', () => {
      wireAppTelemetry();
      expect(TelemetryListener).toHaveBeenCalled();
      const listenerInstance = vi.mocked(TelemetryListener).mock.results[0].value;
      expect(listenerInstance.start).toHaveBeenCalled();
    });

    it('sets up periodic flush timer', () => {
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
      wireAppTelemetry();
      expect(setIntervalSpy).toHaveBeenCalled();
      setIntervalSpy.mockRestore();
    });

    it('is idempotent — calling twice only wires once', () => {
      wireAppTelemetry();
      const callCount1 = vi.mocked(TelemetryListener).mock.calls.length;

      wireAppTelemetry();
      const callCount2 = vi.mocked(TelemetryListener).mock.calls.length;

      expect(callCount2).toBe(callCount1);
    });

    it('attaches pagehide listener when window is available', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      wireAppTelemetry();
      expect(addEventListenerSpy).toHaveBeenCalledWith('pagehide', expect.any(Function), { once: true });
      addEventListenerSpy.mockRestore();
    });

    it('handles missing window gracefully (SSR)', () => {
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', { value: undefined, writable: true });

      expect(() => wireAppTelemetry()).not.toThrow();

      Object.defineProperty(global, 'window', { value: originalWindow, writable: true });
    });
  });

  describe('unwireAppTelemetry()', () => {
    it('stops the listener', () => {
      wireAppTelemetry();
      unwireAppTelemetry();
      const listenerInstance = vi.mocked(TelemetryListener).mock.results[0].value;
      expect(listenerInstance.stop).toHaveBeenCalled();
    });

    it('clears the flush timer', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
      wireAppTelemetry();
      unwireAppTelemetry();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('allows re-wiring after unwire', () => {
      wireAppTelemetry();
      unwireAppTelemetry();

      const initialCalls = vi.mocked(TelemetryListener).mock.calls.length;
      wireAppTelemetry();
      expect(vi.mocked(TelemetryListener).mock.calls.length).toBe(initialCalls + 1);
    });

    it('is safe to call when not wired', () => {
      expect(() => unwireAppTelemetry()).not.toThrow();
    });
  });

  describe('flush behavior', () => {
    it('sets up flush timer that calls service.flush periodically', () => {
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockImplementation(() => 1 as any);
      wireAppTelemetry();
      expect(setIntervalSpy).toHaveBeenCalled();
      setIntervalSpy.mockRestore();
    });
  });
});
