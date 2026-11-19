import { describe, expect, it, vi } from 'vitest';
import { localBackend, localBackendEnabled, recordTestEvent } from '@/dev/local-backend';

describe('collecteur de démo désactivé', () => {
  it('ne transmet ni événements ni instantané, même si le collecteur est configuré', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(localBackendEnabled()).toBe(false);
    recordTestEvent('demo.test', { text: 'privé' });
    expect(await localBackend.flush()).toEqual({ sent: 0 });
    expect(await localBackend.checkHealth()).toBe('offline');
    expect(await localBackend.recentEvents()).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
