import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.doUnmock('@/dev/mock/storage-scope');
  vi.resetModules();
  document.body.innerHTML = '';
});

describe('échec de l’isolation au démarrage', () => {
  it('arrête le démarrage au lieu de lire les préférences réelles', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.doMock('@/dev/mock/storage-scope', () => ({ installStorageIsolation: () => false }));
    vi.doMock('@/dev/mode', () => ({ isMockMode: () => true }));
    await expect(import('@/dev/mock/install-isolation')).rejects.toThrow('Isolation du stockage');
    expect(document.getElementById('root')?.textContent).toContain('Démo indisponible');
    vi.doUnmock('@/dev/mode');
  });
});
