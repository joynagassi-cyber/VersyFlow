/**
 * Unit Tests — SessionEngine IWordFailureTracker injection
 * Tests SE-001 through SE-004: dependency injection seam validation
 */

import { SessionEngine } from '@/domains/memorization/session-engine';
import { IWordFailureTracker } from '@/domains/memorization/tracker';
import { WordFailure } from '@/services/word-failure-tracker';

describe('SessionEngine — IWordFailureTracker injection', () => {
  // Mock tracker implementing IWordFailureTracker
  function createMockTracker(overrides: Partial<IWordFailureTracker> = {}): IWordFailureTracker {
    const failures = new Map<string, WordFailure>();

    return {
      recordFailure(word: string, position: number, now: number): void {
        const key = word.toLowerCase();
        if (failures.has(key)) {
          const f = failures.get(key)!;
          f.failCount++;
          f.lastFailedAt = now;
        } else {
          failures.set(key, { word, failCount: 1, lastFailedAt: now, position });
        }
      },
      getMostForgottenWords(count = 3): WordFailure[] {
        const list = Array.from(failures.values());
        list.sort((a, b) => b.failCount - a.failCount);
        return list.slice(0, count);
      },
      getFailureRate(word: string): number {
        const f = failures.get(word.toLowerCase());
        return f ? f.failCount : 0;
      },
      clear(): void {
        failures.clear();
      },
      getUniqueForgottenCount(): number {
        return failures.size;
      },
      ...overrides,
    };
  }

  it('SE-001: should accept a mock IWordFailureTracker via constructor', () => {
    const mockTracker = createMockTracker();
    const engine = new SessionEngine('Dieu créa les cieux et la terre', undefined, mockTracker);

    expect(engine.getState().verseText).toBe('Dieu créa les cieux et la terre');
    expect(engine.getState().phase).toBe('idle');
  });

  it('SE-002: should forward recordFailure to injected tracker', () => {
    const recorded: Array<{ word: string; position: number }> = [];
    const mockTracker = createMockTracker({
      recordFailure(word: string, position: number, now: number): void {
        recorded.push({ word, position });
      },
    });

    const engine = new SessionEngine('Le Seigneur est mon berger', undefined, mockTracker);
    engine.startPreview();

    // Simulate verification with missing words
    const verification = engine.verifyAnswer('Le berger');
    engine.recordWordFailures(verification, Date.now());

    // Should have recorded failures for missing words
    expect(recorded.length).toBeGreaterThan(0);
  });

  it('SE-003: should return most forgotten words from injected tracker', () => {
    const mockTracker = createMockTracker();
    const engine = new SessionEngine('Au commencement était la parole', undefined, mockTracker);

    // Pre-populate tracker with failures
    mockTracker.recordFailure('commencement', 1, Date.now());
    mockTracker.recordFailure('commencement', 1, Date.now());
    mockTracker.recordFailure('parole', 5, Date.now());

    const forgotten = engine.getMostForgottenWords(3);
    expect(forgotten.length).toBe(2);
    expect(forgotten[0].word).toBe('commencement');
    expect(forgotten[0].failCount).toBe(2);
  });

  it('SE-004: should clear tracker on resetSession', () => {
    const mockTracker = createMockTracker();
    const engine = new SessionEngine('Psaume de test', undefined, mockTracker);

    mockTracker.recordFailure('test', 0, Date.now());
    expect(mockTracker.getUniqueForgottenCount()).toBe(1);

    engine.resetSession();
    expect(mockTracker.getUniqueForgottenCount()).toBe(0);
  });

  it('SE-005: backward compatibility — no tracker param uses default', () => {
    // Existing callers without 3rd param must still work
    const engine = new SessionEngine('Au commencement était la parole');
    expect(engine.getState().verseText).toBe('Au commencement était la parole');
    engine.startPreview();
    engine.revealNextWord();
    expect(engine.getState().phase).toBe('revealing');
  });

  it('SE-006: backward compatibility — strategy param still works', () => {
    const engine = new SessionEngine('Parole de Dieu', 'active-recall');
    expect(engine.getState().verseText).toBe('Parole de Dieu');
  });

  it('SE-007: isWordForgotten delegates to injected tracker', () => {
    const mockTracker = createMockTracker();
    mockTracker.recordFailure('Dieu', 0, Date.now());
    mockTracker.recordFailure('Dieu', 0, Date.now());

    const engine = new SessionEngine('Dieu est amour', undefined, mockTracker);
    expect(engine.isWordForgotten('Dieu', 2)).toBe(true);
    expect(engine.isWordForgotten('amour', 2)).toBe(false);
  });
});
