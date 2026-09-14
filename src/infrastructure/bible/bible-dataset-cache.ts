/**
 * PowerSync SQLite-backed cache for downloaded Bible datasets.
 *
 * Reuses the app's existing PowerSync database (a hard dependency, already
 * embedded in the Capacitor WebView) — no new native plugin required.
 * Downloaded JSON payloads live in a dedicated `bible_datasets` table,
 * keyed by translation id, so re-launching the app never re-downloads.
 *
 * Falls back to `localStorage` on web builds where the native database
 * plugin is not available.
 */

import type { IBibleDatasetCache } from './bible-dataset-distribution';
import type { CommonPowerSyncDatabase } from '@powersync/common';

const NS = 'bible-dataset:';

/**
 * Run a read callback against the shared PowerSync database. Creates the
 * `bible_datasets` table idempotently before each use so the cache is
 * self-sufficient (no migration dependency).
 */
async function withDb(fn: (db: CommonPowerSyncDatabase) => Promise<void>): Promise<void> {
  const { getPowerSyncDatabase, peekPowerSyncDatabase } = await import(
    '@/infrastructure/sync/powersync-database'
  );
  const db = peekPowerSyncDatabase() ?? getPowerSyncDatabase();
  await db.waitForReady();
  const sqlAdapter = db.database;
  await sqlAdapter.execute(
    `CREATE TABLE IF NOT EXISTS bible_datasets (
       translation_id TEXT PRIMARY KEY,
       json           TEXT    NOT NULL,
       checksum       TEXT    NOT NULL,
       downloaded_at  INTEGER NOT NULL
     )`
  );
  await fn(db);
}

export class PowerSyncBibleDatasetCache implements IBibleDatasetCache {
  async get(id: string): Promise<{ text: string; checksum: string } | null> {
    try {
      let result: string | null = null;
      let checksum: string | null = null;
      await withDb(async (db) => {
        const row = (await db.database.get<{ json: string; checksum: string } | null>(
          `SELECT json, checksum FROM bible_datasets WHERE translation_id = ?`,
          [id],
        )) ?? null;
        result = row?.json ?? null;
        checksum = row?.checksum ?? null;
      });
      if (result == null || checksum == null) return null;
      return { text: result, checksum };
    } catch {
      // Native DB unavailable (web build, or not yet open) — try localStorage.
      const text = localStorage.getItem(`${NS}${id}`);
      const cs = localStorage.getItem(`${NS}${id}:checksum`);
      if (text == null || cs == null) return null;
      return { text, checksum: cs };
    }
  }

  async set(id: string, text: string, checksum: string): Promise<void> {
    try {
      await withDb(async (db) => {
        await db.database.execute(
          `INSERT OR REPLACE INTO bible_datasets
             (translation_id, json, checksum, downloaded_at)
           VALUES (?, ?, ?, ?)`,
          [id, text, checksum, Date.now()],
        );
      });
    } catch {
      localStorage.setItem(`${NS}${id}`, text);
      localStorage.setItem(`${NS}${id}:checksum`, checksum);
    }
  }
}
