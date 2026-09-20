/**
 * Bible Infrastructure — On-demand dataset cache
 *
 * Persists downloaded Bible translation datasets locally so that the
 * "available translations" screen can offer download-on-demand without
 * re-fetching on every app start.
 *
 * - Primary store: PowerSync SQLite table `bible_datasets`
 *   (survives restarts, offline-first).
 * - Fallback: localStorage (web when PowerSync is not initialized).
 *
 * This module performs I/O only — the domain layer (`bible-text-service`)
 * decides which dataset to fetch and validates the checksum.
 */

import {
  peekPowerSyncDatabase,
  getPowerSyncDatabase,
} from '@/infrastructure/sync/powersync-database';

export interface CachedBibleDataset {
  id: string;
  checksum: string;
  /** Raw JSON text of the dataset (same shape as `data/bible/<id>.json`). */
  text: string;
  downloadedAt: number;
}

/** Storage port for the dataset cache — implemented by SQLite and localStorage. */
export interface IBibleDatasetCache {
  get(id: string, checksum: string): Promise<CachedBibleDataset | null>;
  set(dataset: CachedBibleDataset): Promise<void>;
}

const TABLE = `CREATE TABLE IF NOT EXISTS bible_datasets (
  id TEXT PRIMARY KEY,
  checksum TEXT NOT NULL,
  text TEXT NOT NULL,
  downloaded_at INTEGER NOT NULL
)`;

async function ensureTable(db: ReturnType<typeof getPowerSyncDatabase>): Promise<void> {
  await db.waitForReady();
  await db.database.execute(TABLE);
}

/**
 * PowerSync-backed cache. Returns null (caller falls back to localStorage)
 * when no database instance is available yet.
 */
export class PowerSyncBibleDatasetCache implements IBibleDatasetCache {
  private readonly db: ReturnType<typeof getPowerSyncDatabase>;
  private readonly ready: Promise<void>;

  constructor() {
    this.db = peekPowerSyncDatabase() ?? getPowerSyncDatabase();
    this.ready = ensureTable(this.db);
  }

  async get(id: string, checksum: string): Promise<CachedBibleDataset | null> {
    await this.ready;
    const row = await this.db.database.get<{
      id: string;
      checksum: string;
      text: string;
      downloaded_at: number;
    }>(
      'SELECT id, checksum, text, downloaded_at FROM bible_datasets WHERE id = ? AND checksum = ?',
      [id, checksum],
    );
    if (!row) return null;
    return {
      id: row.id,
      checksum: row.checksum,
      text: row.text,
      downloadedAt: row.downloaded_at,
    };
  }

  async set(dataset: CachedBibleDataset): Promise<void> {
    await this.ready;
    await this.db.database.execute(
      'INSERT OR REPLACE INTO bible_datasets (id, checksum, text, downloaded_at) VALUES (?, ?, ?, ?)',
      [dataset.id, dataset.checksum, dataset.text, dataset.downloadedAt],
    );
  }
}

const LS_PREFIX = 'versyflow.bible-dataset.';

/** localStorage fallback (web, or when PowerSync is unavailable). */
export class LocalStorageBibleDatasetCache implements IBibleDatasetCache {
  async get(id: string, checksum: string): Promise<CachedBibleDataset | null> {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(`${LS_PREFIX}${id}`);
    if (!raw) return null;
    try {
      const cached: CachedBibleDataset = JSON.parse(raw);
      return cached.checksum === checksum ? cached : null;
    } catch {
      return null;
    }
  }

  async set(dataset: CachedBibleDataset): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(`${LS_PREFIX}${dataset.id}`, JSON.stringify(dataset));
  }
}

/**
 * Best-effort cache: PowerSync when a database exists, otherwise localStorage.
 */
export function createBibleDatasetCache(): IBibleDatasetCache {
  if (peekPowerSyncDatabase() != null) {
    try {
      return new PowerSyncBibleDatasetCache();
    } catch {
      // Fall through to localStorage.
    }
  }
  return new LocalStorageBibleDatasetCache();
}
