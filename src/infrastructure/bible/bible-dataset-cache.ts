/**
 * Bible Infrastructure — On-demand dataset cache
 *
 * Persists downloaded Bible translation datasets locally so that the
 * "available translations" screen can offer download-on-demand without
 * re-fetching on every app start.
 *
 * The store is `localStorage` (survives restarts, works offline, no native
 * binding). This module performs I/O only — the domain layer
 * (`bible-text-service`) decides which dataset to fetch and validates the
 * checksum.
 */

export interface CachedBibleDataset {
  id: string;
  checksum: string;
  /** Raw JSON text of the dataset (same shape as `data/bible/<id>.json`). */
  text: string;
  downloadedAt: number;
}

/** Storage port for the dataset cache. */
export interface IBibleDatasetCache {
  get(id: string, checksum: string): Promise<CachedBibleDataset | null>;
  set(dataset: CachedBibleDataset): Promise<void>;
}

const LS_PREFIX = 'versyflow.bible-dataset.';

/**
 * `localStorage` cache. The checksum is part of the lookup, so a stale
 * download (catalogue bumped) is a miss, not a wrong answer.
 */
export class LocalStorageBibleDatasetCache implements IBibleDatasetCache {
  async get(id: string, checksum: string): Promise<CachedBibleDataset | null> {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(`${LS_PREFIX}${id}`);
    if (!raw) return null;
    try {
      const cached = JSON.parse(raw) as CachedBibleDataset;
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

/** The app's dataset cache. */
export function createBibleDatasetCache(): IBibleDatasetCache {
  return new LocalStorageBibleDatasetCache();
}
