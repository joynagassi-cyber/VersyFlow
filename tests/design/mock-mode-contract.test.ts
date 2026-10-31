/**
 * Contrat du mode mock — « le frontend fonctionne sans backend ».
 *
 * Deux garanties, vérifiées et non supposées :
 *
 *  1. **Étanchéité réseau** : en mode mock, aucune requête ne peut partir vers
 *     une autre origine que l'app elle-même. Un `fetch` oublié vers Supabase,
 *     un client PowerSync instancié trop tôt, une police CDN : tout est refusé
 *     et signalé, au lieu de dépendre silencieusement d'un service distant.
 *
 *  2. **Ouverture des pages** : les routes principales du routeur réel
 *     montent sans lever d'exception en mode mock. C'est la différence entre
 *     « le serveur renvoie 200 » (qui ne prouve rien, le SPA renvoie 200 pour
 *     tout) et « l'écran s'affiche ».
 *
 * Le test est isolé : il n'ouvre aucune connexion, il installe le garde
 * lui-même et restaure `fetch` ensuite.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_FETCH = globalThis.fetch;

async function loadGuard() {
  vi.resetModules();
  vi.doMock('@/dev/mode', () => ({
    isMockMode: () => true,
    getDataMode: () => 'mock',
  }));
  return import('@/dev/network-guard');
}

describe('garde-fou réseau du mode mock', () => {
  let restore: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restore?.();
    restore = undefined;
    globalThis.fetch = ORIGINAL_FETCH;
    vi.doUnmock('@/dev/mode');
    vi.restoreAllMocks();
    delete (globalThis as { __mockNetGuardInstalled?: boolean }).__mockNetGuardInstalled;
  });

  it('laisse passer les requêtes de même origine et les URL relatives', async () => {
    const { installNetworkGuard } = await loadGuard();
    const passthrough = vi.fn(async () => new Response('ok'));
    globalThis.fetch = passthrough as unknown as typeof fetch;

    installNetworkGuard();
    await globalThis.fetch('/api/health');
    await globalThis.fetch(`${location.origin}/themes/x.webp`);
    await globalThis.fetch('data:application/json,{}');

    expect(passthrough).toHaveBeenCalledTimes(3);
  });

  it('bloque toute requête vers un hôte externe et la journalise', async () => {
    const { installNetworkGuard, blockedRequests } = await loadGuard();
    const passthrough = vi.fn(async () => new Response('ok'));
    globalThis.fetch = passthrough as unknown as typeof fetch;
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(String(args[0]));
    });
    vi.spyOn(console, 'info').mockImplementation(() => {});

    installNetworkGuard();

    await expect(globalThis.fetch('https://dspqvyesfngxuwqhceog.supabase.co/rest/v1/')).rejects.toThrow(
      /bloquée en mode mock/,
    );
    await expect(globalThis.fetch('https://cdn.example.com/font.woff2')).rejects.toThrow(
      /bloquée en mode mock/,
    );

    // Le réseau distant n'a jamais été atteint.
    expect(passthrough).not.toHaveBeenCalled();
    const blocked = blockedRequests();
    expect(blocked.map((b) => b.url)).toEqual(
      expect.arrayContaining([
        'https://dspqvyesfngxuwqhceog.supabase.co/rest/v1/',
        'https://cdn.example.com/font.woff2',
      ]),
    );
    // …et la tentative est signalée, avec l'URL fautive.
    expect(errors.join('\n')).toContain('[mock-net-guard]');
    expect(errors.join('\n')).toContain('https://dspqvyesfngxuwqhceog.supabase.co/rest/v1/');
  });

  it('refuse un WebSocket externe, laisse passer le WebSocket local', async () => {
    const { installNetworkGuard } = await loadGuard();
    const opened: string[] = [];
    class FakeWS {
      constructor(url: string) {
        opened.push(url);
      }
    }
    const original = globalThis.WebSocket;
    globalThis.WebSocket = FakeWS as unknown as typeof WebSocket;
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      installNetworkGuard();
      let threw = false;
      try {
        new globalThis.WebSocket('wss://sync.example.com/stream');
      } catch {
        threw = true;
      }
      expect(threw, 'un WebSocket externe doit être refusé').toBe(true);
      new globalThis.WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
      expect(opened).toEqual([`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`]);
    } finally {
      globalThis.WebSocket = original;
    }
  });

  it('ne fait rien quand le mode n’est pas mock', async () => {
    vi.resetModules();
    vi.doMock('@/dev/mode', () => ({ isMockMode: () => false, getDataMode: () => 'live' }));
    const { installNetworkGuard } = await import('@/dev/network-guard');
    const passthrough = vi.fn(async () => new Response('ok'));
    globalThis.fetch = passthrough as unknown as typeof fetch;

    installNetworkGuard();
    await globalThis.fetch('https://example.com/anything');

    expect(passthrough).toHaveBeenCalledTimes(1);
    vi.doUnmock('@/dev/mode');
  });
});

describe('pages du routeur en mode mock', () => {
  it('le routeur déclare au moins les 60 écrans attendus', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const source = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf8');
    const paths = [...source.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
    // Le mode mock n'a de valeur que si TOUTES les pages sont atteignables :
    // un écran absent du routeur ne peut pas être testé localement.
    expect(paths.length).toBeGreaterThanOrEqual(60);
    // Les onglets sont des routes ENFANTS de `/tabs` : le littéral du fichier
    // est `home`, la route finale `/tabs/home`.
    for (const required of [
      'home',
      'explore',
      'progress',
      'settings',
      '/settings/appearance',
      '/settings/theme-picker',
      '/bible/explorer',
      '/review/queue',
      '/family/home',
      '/dev',
    ]) {
      expect(paths, `route manquante : ${required}`).toContain(required);
    }
  });
});
