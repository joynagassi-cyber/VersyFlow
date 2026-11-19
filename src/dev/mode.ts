/**
 * Data mode — "démo" vs "réel", both 100 % local.
 *
 * VersyFlow is frontend-only: there is no backend to talk to. The two modes
 * differ only in WHICH browser store is used:
 *
 *   - `mock` : the demo scope — a separate localStorage namespace
 *              (`versyflow:mock-scope:v1:*`) seeded with fictitious data, so
 *              a tester can explore every screen without touching their real
 *              data. This is the default (see `DEMO_IS_DEFAULT`).
 *   - `live` : the real local scope — the same screens on the user's own
 *              data, still entirely on the device.
 *
 * Resolution order (first match wins):
 *   1. `?data=mock|live` in the URL — persisted.
 *   2. `localStorage['versyflow:data-mode']` — set by the in-app Dev panel.
 *   3. `VITE_DATA_MODE` (see `.env.mock` + `npm run dev:mock`).
 *   4. `mock` unless `VITE_DEMO_DEFAULT=off`.
 *
 * A future backend will add a third mode; the composition root
 * (`@/infrastructure/repository/mode-repositories`) is the only file that has
 * to learn about it.
 */

export type DataMode = 'mock' | 'live';

/** localStorage key holding the user's explicit override (Dev panel). */
export const DATA_MODE_STORAGE_KEY = 'versyflow:data-mode';

/**
 * Chantier « démo » (2026-10-30) : le mode DÉMO est le mode par défaut.
 *
 * Raison : l'utilisateur veut tester toutes les fonctions (dont Famille) sans
 * toucher à ses vraies données, dès l'ouverture de l'application.
 *
 * Sortie explicite et sûre (les données réelles n'ont jamais été modifiées,
 * l'isolation de stockage s'en charge — voir `src/dev/mock/storage-scope.ts`) :
 *   - `?data=live` dans l'URL,
 *   - ou le bouton « Revenir aux données réelles » de `/settings/data` et `/dev`.
 *
 * `VITE_DEMO_DEFAULT=off` ouvre directement les données réelles de
 * l'appareil.
 */
export const DEMO_IS_DEFAULT = true;

/**
 * `true` sauf si l'environnement désactive explicitement la démo par défaut.
 * `env` est injectable pour les tests (l'environnement Vite n'est pas
 * modifiable de façon fiable après chargement du module).
 */
export function isDemoDefaultEnabled(
  env: Record<string, string | undefined> = readEnv(),
): boolean {
  const raw = env.VITE_DEMO_DEFAULT;
  if (!raw) return DEMO_IS_DEFAULT;
  const value = raw.trim().toLowerCase();
  if (['off', 'false', '0', 'no', 'live'].includes(value)) return false;
  if (['on', 'true', '1', 'yes', 'mock'].includes(value)) return true;
  return DEMO_IS_DEFAULT;
}

function readEnv(): Record<string, string | undefined> {
  try {
    return (
      (import.meta as unknown as { env?: Record<string, string | undefined> })
        .env ?? {}
    );
  } catch {
    return {};
  }
}

function readLocalStorage(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — ignore */
  }
}

function normalizeMode(value: string | null | undefined): DataMode | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === 'mock' || v === 'local' || v === 'frontend') return 'mock';
  if (v === 'live' || v === 'cloud' || v === 'real') return 'live';
  return null;
}

/** Read the `?data=` query parameter (and persist it for the session). */
function readUrlOverride(): DataMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const mode = normalizeMode(params.get('data'));
    if (mode) writeLocalStorage(DATA_MODE_STORAGE_KEY, mode);
    return mode;
  } catch {
    return null;
  }
}

/** True when an external data source is configured (none today: local only). */
export function isExternalSourceConfigured(): boolean {
  return false;
}

let cachedMode: DataMode | null = null;

/**
 * Current data mode. Cached after the first resolution because switching
 * mode requires a reload anyway (the composition roots create singletons).
 */
export function getDataMode(): DataMode {
  if (cachedMode) return cachedMode;

  const fromUrl = readUrlOverride();
  if (fromUrl) {
    cachedMode = fromUrl;
    return cachedMode;
  }

  const fromStorage = normalizeMode(readLocalStorage(DATA_MODE_STORAGE_KEY));
  if (fromStorage) {
    cachedMode = fromStorage;
    return cachedMode;
  }

  const fromEnv = normalizeMode(readEnv().VITE_DATA_MODE);
  if (fromEnv) {
    cachedMode = fromEnv;
    return cachedMode;
  }

  // Chantier démo : par défaut on ouvre en démo. `VITE_DEMO_DEFAULT=off`
  // ouvre directement les données réelles de l'appareil.
  cachedMode = 'mock';
  return cachedMode;
}

/** `true` when the app runs on the in-browser mock backend. */
export function isMockMode(): boolean {
  return getDataMode() === 'mock';
}

/** `true` when the app runs on the user's real local data (not the demo scope). */
export function isLiveMode(): boolean {
  return getDataMode() === 'live';
}

/** Persist an explicit mode override. Takes effect after a reload. */
export function setDataMode(mode: DataMode): void {
  writeLocalStorage(DATA_MODE_STORAGE_KEY, mode);
  cachedMode = mode;
}

/** Drop the override and fall back to env / auto-detection on next boot. */
export function clearDataModeOverride(): void {
  writeLocalStorage(DATA_MODE_STORAGE_KEY, null);
  cachedMode = null;
}

/** Switch mode and reload the app (composition roots are singletons). */
export function reloadWithDataMode(mode: DataMode): void {
  // Keep the current mode and storage scope active until navigation finishes.
  // A stale URL override otherwise wins over the user's explicit choice.
  writeLocalStorage(DATA_MODE_STORAGE_KEY, mode);
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    // If storage is unavailable, keep an explicit URL override rather than
    // accidentally reopening live after requesting demo.
    if (readLocalStorage(DATA_MODE_STORAGE_KEY) === mode) url.searchParams.delete('data');
    else url.searchParams.set('data', mode);
    window.history.replaceState(window.history.state, '', url.toString());
    window.location.reload();
  }
}

/** Human readable summary, shown in the Dev panel / console banner. */
export function describeDataMode(): string {
  const mode = getDataMode();
  if (mode === 'mock') return 'DÉMO — données fictives locales, isolées de vos données réelles';
  return 'RÉEL — vos données locales sur cet appareil';
}

/**
 * Kept for the demo guards: a feature that only makes sense with a backend
 * throws this instead of pretending to work.
 */
export class MockModeGuardError extends Error {
  constructor(what: string) {
    super(`[data-mode] ${what} n'est pas disponible sans backend.`);
    this.name = 'MockModeGuardError';
  }
}
