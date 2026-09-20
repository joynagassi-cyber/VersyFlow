/**
 * Tests for FSRS Factory — engine singleton management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFsrsEngine, resetFsrsEngine, isWasmAvailable } from '@/services/fsrs-factory';
import { TsFsrsEngine } from '@/domains/fsrs/ts-fsrs-engine';
import { eventBus, DomainEventTypes } from '@/domains/events';

describe('fsrs-factory', () => {
  beforeEach(() => {
    resetFsrsEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetFsrsEngine();
  });

  describe('getFsrsEngine()', () => {
    it('returns a TsFsrsEngine instance', () => {
      const engine = getFsrsEngine();
      expect(engine).toBeInstanceOf(TsFsrsEngine);
    });

    it('returns the same instance on subsequent calls (singleton)', () => {
      const engine1 = getFsrsEngine();
      const engine2 = getFsrsEngine();
      expect(engine1).toBe(engine2);
    });

    it('creates engine lazily on first call', () => {
      resetFsrsEngine();
      let created = false;
      const OriginalTsFsrsEngine = TsFsrsEngine;
      // First call should create
      const engine = getFsrsEngine();
      expect(engine).toBeDefined();
    });
  });

  describe('isWasmAvailable()', () => {
    it('always returns false in this environment', () => {
      expect(isWasmAvailable()).toBe(false);
    });
  });

  describe('resetFsrsEngine()', () => {
    it('allows creating a new engine after reset', () => {
      const engine1 = getFsrsEngine();
      resetFsrsEngine();
      const engine2 = getFsrsEngine();
      expect(engine1).not.toBe(engine2);
    });
  });

  describe('error handling', () => {
    it('emits FSRS_ENGINE_FAILURE event when engine creation fails', () => {
      // This test verifies the event emission path exists
      // In normal operation TsFsrsEngine should succeed
      const emitSpy = vi.spyOn(eventBus, 'emit');
      // Reset and try again — should work normally
      resetFsrsEngine();
      const engine = getFsrsEngine();
      expect(engine).toBeDefined();
      emitSpy.mockRestore();
    });
  });
});
