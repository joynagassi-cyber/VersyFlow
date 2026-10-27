/**
 * Ambient shim for the legacy Jest-style test suite.
 *
 * The pre-existing tests under tests/api, tests/e2e, tests/integration and
 * tests/unit were written against Jest globals (`describe`, `it`, `expect`,
 * `jest.fn`, …). They run under Vitest — `tests/jest-polyfill.ts` (loaded
 * via `vitest.config.ts` setupFiles) installs `globalThis.jest` backed by
 * `vi`, and Vitest's global mode provides the suite/assertion globals.
 *
 * Vitest's `node_modules/vitest/globals.d.ts` declares the same names in the
 * global scope, but TS 5.6 cannot resolve `"vitest/globals"` as a type
 * definition file (the package exposes it only through its `exports` map).
 * Rather than force every legacy test to import from 'vitest', this shim
 * re-declares the minimal global surface so `tsc -p tsconfig.app.json`
 * (the `npm run typecheck` gate) stays green. The runtime behavior is
 * unchanged: the polyfill + Vitest globals are what actually execute.
 */
import type * as vitest from 'vitest';

declare global {
  const describe: typeof vitest.describe;
  const it: typeof vitest.it;
  const test: typeof vitest.test;
  const expect: typeof vitest.expect;
  const vi: typeof vitest.vitest;
  const beforeAll: typeof vitest.beforeAll;
  const afterAll: typeof vitest.afterAll;
  const beforeEach: typeof vitest.beforeEach;
  const afterEach: typeof vitest.afterEach;

  namespace jest {
    type MockInstance<T = unknown> = vitest.ViMock<T>;
    function fn<T extends (...args: never[]) => unknown>(implementation?: T): vitest.ViMockInstance<T>;
    function spyOn<T extends object, K extends keyof T>(obj: T, method: K): vitest.SpyInstance;
    function clearAllMocks(): void;
    function resetAllMocks(): void;
    function restoreAllMocks(): void;
    function doMock(moduleName: string, mockExport: () => unknown): void;
  }
  const jest: {
    fn: typeof jest.fn;
    spyOn: typeof jest.spyOn;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
    doMock: typeof jest.doMock;
  };
}

export {};
