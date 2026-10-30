/**
 * Data mode — "mock" vs "live".
 *
 * VersyFlow ships with two interchangeable backends behind the same domain
 * ports:
 *
 *   - `live` : Supabase + PowerSync (cloud sync, real SQLite replicas)
 *   - `mock` : 100 % frontend. Everything is served from an in-browser
 *              store (localStorage) seeded with realistic test data, and
 *              every write/event is mirrored to the small local API
 *              (`server/mock-api.mjs`) so manual test sessions can be
 *              inspected and exported.
 *
 * Resolution order (first match wins):
 *   1. `?data=mock|live` in the URL — persisted for the session.
 *   2. `localStorage['versyflow:data-mode']` — set by the in-app Dev panel.
 *   3. `VITE_DATA_MODE` (see `.env.mock` + `npm run dev:mock`).
 *   4. Auto: `mock` when no Supabase project is configured, `live` otherwise.
 *
 * The UI never needs to know about this: the composition roots
 * (`@/infrastructure/repository/powersync-repositories`, `@/auth`,
 * `@/store/sync-store`) pick the right adapter at call time, and the
 * PowerSync/Supabase modules are only *imported dynamically* on the live
 * path — so a mock build never even loads the cloud SDK.
 */

export type DataMode = 'mock' | 'live';

/** localStorage key holding the user's explicit override (Dev panel). */
export const DATA_MODE_STORAGE_KEY = 'versyflow:data-mode';

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
  if (v === 'live' || v === 'cloud' || v === 'supabase') return 'live';
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

/** True when a Supabase project is configured (see `.env.example`). */
export function isSupabaseConfigured(): boolean {
  const env = readEnv();
  return Boolean(
    (env.VITE_SUPABASE_URL || env.SUPABASE_URL) &&
      (env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY),
  );
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

  cachedMode = isSupabaseConfigured() ? 'live' : 'mock';
  return cachedMode;
}

/** `true` when the app runs on the in-browser mock backend. */
export function isMockMode(): boolean {
  return getDataMode() === 'mock';
}

/** `true` when the app runs on Supabase + PowerSync. */
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
  setDataMode(mode);
  if (typeof window !== 'undefined') window.location.reload();
}

/** Human readable summary, shown in the Dev panel / console banner. */
export function describeDataMode(): string {
  const mode = getDataMode();
  if (mode === 'mock') return 'MOCK — données locales + API de test (aucun backend)';
  return 'LIVE — Supabase + PowerSync';
}

/**
 * Throw a clear, actionable error when cloud-only code is reached while the
 * app runs in mock mode. Used as a guard inside the PowerSync singleton so a
 * stray import cannot start a real sync stack in a frontend-only session.
 */
export class MockModeGuardError extends Error {
  constructor(what: string) {
    super(
      `[data-mode] ${what} est indisponible en mode MOCK. ` +
        'Passez en mode LIVE (?data=live ou VITE_DATA_MODE=live) pour utiliser Supabase/PowerSync.',
    );
    this.name = 'MockModeGuardError';
  }
}
