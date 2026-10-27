/**
 * Jest → Vitest Polyfill
 * Provides jest globals for tests written for Jest
 */
import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Global jest mock
(globalThis as any).jest = {
  fn: vi.fn,
  mock: vi.fn,
  spyOn: vi.spyOn,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  doMock: vi.doMock,
  jest: vi,
  mocks: vi,
};
