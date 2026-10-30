/**
 * powersync-database — Singleton factory for the app's PowerSync database.
 *
 * One `PowerSyncDatabase` instance per app (single-sync invariant). The
 * instance is lazily created on first access and shared across the whole app
 * so that the CRUD queue, watched queries, and sync stream stay consistent.
 *
 * `closePowerSyncDatabase()` must be called on logout to release the SQLite
 * connection and clear synced data; subsequent access creates a fresh
 * instance.
 *
 * Local reads (SYNCED data) MUST go through this PowerSync SQLite database,
 * never directly through `supabase-js` — that is the offline-first rule.
 */

import { PowerSyncDatabase } from '@powersync/capacitor';
import type { CommonPowerSyncDatabase } from '@powersync/common';

import { buildPowerSyncSchema } from './powersync-schema';
import { isDemoMode } from '@/dev/demo-mode';

/**
 * Nom de la base locale.
 *
 * En prévisualisation (`preview-frame.html`), deux iframes tournent en même
 * temps : si elles ouvraient le même fichier SQLite, la seconde échouerait ou
 * verrait les données de la première. Chaque cadre reçoit donc **sa** base,
 * dérivée du rôle posé par la page hôte. Hors prévisualisation, le nom est
 * exactement celui d'avant — aucune migration, aucune donnée déplacée.
 */
function databaseFilename(): string {
  if (isDemoMode) return 'versyflow-demo-isolated.db';
  const role =
    typeof window !== 'undefined'
      ? (window as unknown as { __VF_PREVIEW_ROLE__?: unknown }).__VF_PREVIEW_ROLE__
      : undefined;
  return typeof role === 'string' && role.length > 0
    ? `versyflow-preview-${role}.db`
    : 'versyflow.db';
}

const DB_FILENAME = databaseFilename();

/**
 * URL of the pre-bundled PowerSync web worker, copied into `public/` from
 * `@powersync/web/dist/worker/worker.js` by `scripts/patch-powersync-worker.cjs`
 * (postinstall). Referencing it by plain relative URL (instead of letting
 * the SDK spawn its internal `new Worker(new URL('./worker.js', import.meta.url))`)
 * keeps Vite from trying to re-bundle that worker — an IIFE worker is
 * incompatible with the code-splitting main build. The SDK's `sync.worker`
 * option accepts a URL string and spawns `new Worker(url, { type: 'module' })`
 * internally.
 *
 * `publicDir` is copied as-is into `www/` at the root of the build output,
 * so the worker is served at `/{base}worker/powersync-worker.js`. The
 * `import.meta.url` resolution points inside the bundled chunk (a hash-named
 * file), so the reference must be relative to the page, not to the chunk.
 */
const POWERSYNC_WORKER_URL = 'worker/powersync-worker.js';

let instance: CommonPowerSyncDatabase | null = null;

/**
 * Get (or lazily create) the shared PowerSync database.
 *
 * The database is auto-initialized on creation; `await db.waitForReady()`
 * guarantees the SQLite schema is available before the first query.
 */
export function getPowerSyncDatabase(): CommonPowerSyncDatabase {
  if (!instance) {
    instance = new PowerSyncDatabase({
      schema: buildPowerSyncSchema(),
      database: { dbFilename: DB_FILENAME },
      sync: { worker: POWERSYNC_WORKER_URL },
    });
  }
  return instance;
}

/**
 * Close and dispose the shared database. Call on logout or fatal error.
 * The next call to `getPowerSyncDatabase()` creates a fresh instance.
 */
export async function closePowerSyncDatabase(): Promise<void> {
  if (instance) {
    await instance.close();
    instance = null;
  }
}

/**
 * The currently shared database instance, or `null` if not yet created or
 * already closed. Useful for lifecycle-aware cleanup.
 */
export function peekPowerSyncDatabase(): CommonPowerSyncDatabase | null {
  return instance;
}
