/**
 * Isolation de stockage du mode DÉMO.
 *
 * Problème résolu
 * ---------------
 * Le mode mock branchait déjà des *repositories* isolés (versets, révisions,
 * familles…), mais tout le reste de l'application continuait d'écrire dans les
 * mêmes clés `localStorage` que l'application réelle : collections, historique
 * de recherche, profil (nom + photo), préférences famille (zustand persist),
 * apparence, rappels… Ouvrir la démo suffisait donc à modifier les vraies
 * préférences de l'utilisateur — exactement ce que le chantier devait éviter.
 *
 * Principe
 * --------
 * En mode mock, **toute** lecture/écriture `localStorage` est redirigée sous un
 * préfixe dédié (`versyflow:mock-scope:v1:`). L'application n'a pas besoin de
 * connaître ce détail : les écrans, les stores Zustand persistés et les
 * adaptateurs de stockage continuent d'utiliser leurs clés habituelles, et
 * retrouvent leurs données réelles dès que la démo est quittée.
 *
 *  - `getItem('versyflow:collections')` en démo → lit
 *    `versyflow:mock-scope:v1:versyflow:collections` ;
 *  - la clé réelle `versyflow:collections` n'est jamais lue, jamais écrite ;
 *  - `clear()` en démo ne supprime QUE les clés préfixées (jamais un
 *    `localStorage.clear()` global) ;
 *  - les clés de **contrôle** (`versyflow:data-mode`, état de démo) restent
 *    hors périmètre : c'est ce qui permet de sortir de la démo.
 *
 * Limites assumées (documentées dans `docs/design/demo-mode.md`)
 *  - `localStorage.length` / `localStorage.key(i)` exposent encore l'énumération
 *    brute (aucune valeur réelle n'est lisible pour autant, puisque `getItem`
 *    est redirigé). Aucun écran de l'application ne s'en sert pour lire un
 *    contenu utilisateur.
 *  - `sessionStorage` n'est pas redirigé : l'application n'y stocke que
 *    l'identifiant de session du collecteur de test (clé `versyflow:mock:*`).
 *  - IndexedDB / SQLite / PowerSync ne sont jamais ouverts en mode mock
 *    (`MockModeGuardError` dans `powersync-database.ts`).
 */

import { getDataMode, isMockMode } from '@/dev/mode';

/** Préfixe de toutes les clés écrites pendant la démo. */
export const MOCK_STORAGE_PREFIX = 'versyflow:mock-scope:v1:';

/**
 * Clés qui gardent leur emplacement réel même en démo : sans elles, impossible
 * de savoir qu'on est en démo ni d'en sortir (et le bandeau « démo » ne
 * survivrait pas à un rechargement).
 */
export const DEMO_CONTROL_KEYS: ReadonlySet<string> = new Set([
  'versyflow:data-mode',
  'versyflow:demo:started-at',
  'versyflow:demo:version',
]);

const STORAGE_METHODS = ['getItem', 'setItem', 'removeItem', 'clear'] as const;
type StorageMethod = (typeof STORAGE_METHODS)[number];

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
};

let originals: Record<StorageMethod, (...args: never[]) => unknown> | null = null;
let installed = false;

function readWindow(): (Window & typeof globalThis) | null {
  try {
    return typeof window === 'undefined' ? null : window;
  } catch {
    return null;
  }
}

function isLocalStorageReceiver(receiver: unknown): boolean {
  const win = readWindow();
  if (!win) return false;
  try {
    return receiver === win.localStorage;
  } catch {
    return false;
  }
}

/** `true` quand les accès doivent être redirigés vers l'espace de démo. */
export function isDemoScopeActive(): boolean {
  return isMockMode();
}

/**
 * Clé réellement utilisée dans `localStorage` pour une clé applicative.
 * Retourne `null` quand la clé doit rester telle quelle (clé de contrôle).
 */
export function resolveScopedKey(key: string): string | null {
  if (!key) return null;
  if (!isDemoScopeActive()) return null;
  if (key.startsWith(MOCK_STORAGE_PREFIX)) return null;
  if (DEMO_CONTROL_KEYS.has(key)) return null;
  return `${MOCK_STORAGE_PREFIX}${key}`;
}

/** Toutes les clés de l'espace de démo présentes dans `localStorage`. */
export function listDemoStorageKeys(): string[] {
  const win = readWindow();
  if (!win) return [];
  try {
    const keys: string[] = [];
    for (let i = 0; i < win.localStorage.length; i += 1) {
      const key = win.localStorage.key(i);
      if (key && key.startsWith(MOCK_STORAGE_PREFIX)) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
}

/**
 * Clés logiques visibles par l'application (`MmkvStorage.getAllKeys()`, notes,
 * export local). En mode démo, seules les clés préfixées sont exposées (sans
 * leur préfixe interne) et les clés réelles restent invisibles ; en mode live,
 * les clés de démo sont filtrées pour ne jamais polluer l'inventaire réel.
 */
export function listLogicalStorageKeys(): string[] {
  const win = readWindow();
  if (!win) return [];
  try {
    const demoActive = isDemoScopeActive();
    const seen = new Set<string>();
    for (let i = 0; i < win.localStorage.length; i += 1) {
      const rawKey = win.localStorage.key(i);
      if (!rawKey) continue;
      if (demoActive) {
        if (rawKey.startsWith(MOCK_STORAGE_PREFIX)) {
          seen.add(rawKey.slice(MOCK_STORAGE_PREFIX.length));
        } else if (DEMO_CONTROL_KEYS.has(rawKey)) {
          seen.add(rawKey);
        }
      } else if (!rawKey.startsWith(MOCK_STORAGE_PREFIX)) {
        seen.add(rawKey);
      }
    }
    return [...seen];
  } catch {
    return [];
  }
}

/** Nombre de clés + octets approximatifs occupés par la démo (pour l'UI). */
export function demoStorageFootprint(): { keys: number; bytes: number } {
  const win = readWindow();
  if (!win) return { keys: 0, bytes: 0 };
  let bytes = 0;
  const keys = listDemoStorageKeys();
  for (const key of keys) {
    try {
      bytes += key.length + (win.localStorage.getItem(key)?.length ?? 0);
    } catch {
      /* ignore */
    }
  }
  return { keys: keys.length, bytes };
}

/**
 * Supprime **uniquement** les données de démo. Les clés réelles ne sont pas
 * touchées : c'est la garantie testée par `tests/design/demo-isolation.test.ts`.
 */
export function clearDemoStorage(): number {
  const win = readWindow();
  if (!win) return 0;
  const keys = listDemoStorageKeys();
  for (const key of keys) {
    try {
      win.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  return keys.length;
}

/**
 * Installe la redirection. Idempotent. Ne fait rien hors mode mock : en mode
 * live le stockage doit rester strictement natif.
 */
export function installStorageIsolation(): boolean {
  if (installed) return true;
  const win = readWindow();
  if (!win || !isDemoScopeActive()) return false;

  const proto = Object.getPrototypeOf(win.localStorage) as StorageLike;
  const saved = {} as Record<StorageMethod, (...args: never[]) => unknown>;

  const wrapGetItem = function (this: Storage, key: string): string | null {
    const scoped = resolveScopedKey(String(key));
    return (originals!.getItem as unknown as (this: Storage, k: string) => string | null).call(
      this,
      scoped ?? String(key),
    );
  };
  const wrapSetItem = function (this: Storage, key: string, value: string): void {
    const scoped = resolveScopedKey(String(key));
    (originals!.setItem as unknown as (this: Storage, k: string, v: string) => void).call(
      this,
      scoped ?? String(key),
      value,
    );
  };
  const wrapRemoveItem = function (this: Storage, key: string): void {
    const scoped = resolveScopedKey(String(key));
    (originals!.removeItem as unknown as (this: Storage, k: string) => void).call(
      this,
      scoped ?? String(key),
    );
  };
  const wrapClear = function (this: Storage): void {
    // En démo, `clear()` ne doit jamais effacer les données réelles.
    for (const key of listDemoStorageKeys()) {
      (originals!.removeItem as unknown as (this: Storage, k: string) => void).call(this, key);
    }
  };

  const wrapped: Record<StorageMethod, (...args: never[]) => unknown> = {
    getItem: wrapGetItem as unknown as (...args: never[]) => unknown,
    setItem: wrapSetItem as unknown as (...args: never[]) => unknown,
    removeItem: wrapRemoveItem as unknown as (...args: never[]) => unknown,
    clear: wrapClear as unknown as (...args: never[]) => unknown,
  };

  const applied: StorageMethod[] = [];
  try {
    for (const method of STORAGE_METHODS) {
      const original = proto[method] as unknown as (...args: never[]) => unknown;
      saved[method] = original;
      const wrappedMethod = wrapped[method];
      (proto as unknown as Record<string, unknown>)[method] = function (
        this: unknown,
        ...args: unknown[]
      ) {
        // Seul `window.localStorage` est redirigé : `sessionStorage` et les
        // instances de test restent intactes.
        if (!isLocalStorageReceiver(this)) {
          return (original as (...a: unknown[]) => unknown).apply(this, args);
        }
        return (wrappedMethod as (...a: unknown[]) => unknown).apply(this, args);
      };
      applied.push(method);
    }
  } catch (error) {
    // Un navigateur exotique peut refuser la réécriture du prototype : on
    // restaure ce qui a été posé et on laisse l'application démarrer (le
    // panneau Démo signale alors l'isolation indisponible).
    for (const method of applied) {
      try {
        (proto as unknown as Record<string, unknown>)[method] = saved[method];
      } catch {
        /* ignore */
      }
    }
    console.error('[démo] isolation du stockage indisponible', error);
    originals = null;
    return false;
  }

  originals = saved;
  installed = true;
  return true;
}

/** Retire la redirection (tests, et sortie de démo sans rechargement). */
export function uninstallStorageIsolation(): void {
  if (!installed) return;
  const win = readWindow();
  if (!win || !originals) {
    installed = false;
    return;
  }
  const proto = Object.getPrototypeOf(win.localStorage) as unknown as Record<string, unknown>;
  for (const method of STORAGE_METHODS) {
    proto[method] = originals[method];
  }
  originals = null;
  installed = false;
}

/** État lisible par l'UI / les tests. */
export function getStorageIsolationState(): {
  mode: ReturnType<typeof getDataMode>;
  installed: boolean;
  scopeActive: boolean;
} {
  return {
    mode: getDataMode(),
    installed,
    scopeActive: isDemoScopeActive(),
  };
}
