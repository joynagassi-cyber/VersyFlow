import { describe, expect, it, vi } from 'vitest';
import { fireAndForget } from '@/lib/fire-and-forget';

describe('fireAndForget', () => {
  it('returns void so it can be used directly in an onClick slot', () => {
    const result = fireAndForget(Promise.resolve('ok'), 'test:resolve');
    expect(result).toBeUndefined();
  });

  it('reports a rejection with its context instead of leaving it unhandled', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('boom');

    fireAndForget(Promise.reject(failure), 'test:reject');
    // Let the catch callback run before asserting.
    await Promise.resolve();
    await Promise.resolve();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe('[fireAndForget] test:reject failed:');
    expect(spy.mock.calls[0][1]).toBe(failure);

    spy.mockRestore();
  });

  it('does not report anything when the task resolves', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    fireAndForget(Promise.resolve('ok'), 'test:silent');
    await Promise.resolve();
    await Promise.resolve();

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
