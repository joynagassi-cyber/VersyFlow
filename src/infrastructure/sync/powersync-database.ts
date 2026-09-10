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

const DB_FILENAME = 'versyflow.db';

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
