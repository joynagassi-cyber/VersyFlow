/**
 * Bible Dataset Distribution Service
 *
 * Handles the remote (Supabase Storage public bucket) + local-first lifecycle
 * for Bible translation datasets that are NOT bundled into the app binary.
 *
 * Pattern:
 *   1. First launch for a given translation → check local cache (Capacitor
 *      Filesystem).
 *   2. If missing or stale (checksum mismatch) → fetch JSON from Supabase
 *      Storage public URL (`<VITE_SUPABASE_URL>/storage/v1/object/public/
 *      bible-datasets/<id>.json`), verify checksum, write to local cache.
 *   3. Subsequent loads → read from cache only (offline-first).
 *
 * This service lives in the infrastructure layer (I/O: fetch + filesystem).
 * The domain layer never sees it — only `BibleTextService` (service layer)
 * orchestrates the download-then-load sequence.
 */

export interface RemoteDatasetCatalogEntry {
  id: string;
  /** Size in bytes (est. download cost shown to the user). */
  sizeBytes: number;
  /** SHA-256 of the canonical JSON payload. */
  checksum: string;
}

export type DownloadProgress = (receivedBytes: number, totalBytes: number) => void;

export interface IBibleDatasetCache {
  get(id: string): Promise<{ text: string; checksum: string } | null>;
  set(id: string, text: string, checksum: string): Promise<void>;
}

export class BibleDatasetDistributionService {
  private readonly baseBucketUrl: string;
  private readonly cache: IBibleDatasetCache;
  private readonly fetchImpl: typeof fetch;

  constructor(
    baseBucketUrl: string,
    cache: IBibleDatasetCache,
    fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
  ) {
    this.baseBucketUrl = baseBucketUrl.replace(/\/$/, '');
    this.cache = cache;
    this.fetchImpl = fetchImpl;
  }

  private datasetUrl(id: string): string {
    if (!/^[a-z0-9_-]+$/.test(id)) {
      throw new Error(`Invalid dataset id "${id}"`);
    }
    return `${this.baseBucketUrl}/${id}.json`;
  }

  /**
   * Ensure the dataset is available locally. Returns the JSON text.
   * Downloads only when the local cache is missing or its checksum differs
   * from `expected` (allows in-place dataset updates).
   */
  async ensureDataset(
    entry: RemoteDatasetCatalogEntry,
    _onProgress?: DownloadProgress,
  ): Promise<string> {
    const cached = await this.cache.get(entry.id);
    if (cached && cached.checksum === entry.checksum) {
      return cached.text;
    }

    const url = this.datasetUrl(entry.id);
    const response = await this.fetchImpl(url);
    if (!response.ok) {
      throw new Error(
        `Failed to download dataset "${entry.id}" (HTTP ${response.status})`,
      );
    }
    const text = await response.text();
    await this.cache.set(entry.id, text, entry.checksum);
    _onProgress?.(text.length, text.length);
    return text;
  }

  /**
   * Best-effort local read (never hits the network). Returns `null` when the
   * dataset was never downloaded, so callers can fall back gracefully.
   */
  async peekLocal(id: string): Promise<{ text: string; checksum: string } | null> {
    return this.cache.get(id);
  }
}

/**
 * Default public-bucket base URL, resolved from the Vite env (build-time).
 * Falls back to a placeholder when the env var is missing (e.g. in tests).
 */
export function defaultBibleDatasetBucketUrl(): string {
  const supabaseUrl =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
    'https://placeholder.supabase.co';
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/bible-datasets`;
}
