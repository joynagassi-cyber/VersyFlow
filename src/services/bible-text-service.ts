/**
 * BibleTextService — multi-translation loader for Bible text.
 *
 * Resolution order for each requested translation id:
 *   1. In-memory `Map` cache (fastest, populated on first load per id).
 *   2. PowerSync SQLite cache (survives app restarts; populated by the
 *      dataset distribution service when a remote download succeeded).
 *   3. Bundled local JSON via `BibleJsonFileSource` (the 1–2 default
 *      translations are still embedded in the app binary).
 *
 * Resolution to `null` is per-dataset so screens degrade gracefully when a
 * translation has not been downloaded yet and is not bundled either.
 */

import {
  LocalBibleRepository,
  type ILocalBibleRepository,
  type BibleBookData,
  type IBibleTextSource,
  parseTranslationData,
} from '@/domains/bible/repository-local';
import { BibleJsonFileSource } from '@/infrastructure/bible/bible-json-source';
import { DEFAULT_TRANSLATION_ID } from '@/domains/bible/registry';
import {
  BibleDatasetDistributionService,
  defaultBibleDatasetBucketUrl,
  type RemoteDatasetCatalogEntry,
} from '@/infrastructure/bible/bible-dataset-distribution';
import { PowerSyncBibleDatasetCache } from '@/infrastructure/bible/bible-dataset-cache';

/**
 * Static dataset catalogue — built once per release by `scripts/bible/build-bible.ts`.
 * Lists every remote dataset hosted in the Supabase Storage public bucket
 * (checksum + size, so the UI can show download cost and verify integrity).
 */
import datasetCatalogJson from '../../data/bible/dataset-catalog.json';

export interface BibleDatasetCatalogEntry extends RemoteDatasetCatalogEntry {
  builtAt?: string;
}

/** The remote dataset catalogue, embedded in the app binary at build time. */
export const BIBLE_DATASET_CATALOG: BibleDatasetCatalogEntry[] = datasetCatalogJson as unknown as BibleDatasetCatalogEntry[];

/** Look up a remote dataset entry by translation id, or `null` when absent. */
export function findRemoteDatasetEntry(
  translationId: string,
): BibleDatasetCatalogEntry | null {
  return BIBLE_DATASET_CATALOG.find((e) => e.id === translationId) ?? null;
}

let repo: ILocalBibleRepository | null = null;
let distribution: BibleDatasetDistributionService | null = null;

/** Cache of loaded books, keyed by translation id. */
const cache = new Map<string, Promise<BibleBookData[] | null>>();

function ensureRepo(): ILocalBibleRepository {
  if (!repo) repo = new LocalBibleRepository(new BibleJsonFileSource());
  return repo;
}

function ensureDistribution(): BibleDatasetDistributionService {
  if (!distribution) {
    distribution = new BibleDatasetDistributionService(
      defaultBibleDatasetBucketUrl(),
      new PowerSyncBibleDatasetCache(),
    );
  }
  return distribution;
}

/**
 * Load (once per translation) the book corpus for a translation id.
 * Resolution order:
 *   1. Bundled local JSON (zero network) — the default translations are still
 *      embedded in the app binary.
 *   2. PowerSync local cache — a remote dataset downloaded earlier (offline).
 *   3. `null` — the translation is not available locally yet. The "Traductions
 *      disponibles" screen is responsible for the explicit download.
 */
export async function loadTranslationBooks(
  translationId: string = DEFAULT_TRANSLATION_ID,
): Promise<BibleBookData[] | null> {
  let promise = cache.get(translationId);
  if (!promise) {
    promise = (async (): Promise<BibleBookData[] | null> => {
      // 1) Bundled / local file first.
      try {
        return await ensureRepo().getBooks(translationId);
      } catch {
        // Not bundled locally — fall through to the download cache.
      }

      // 2) Previously downloaded remote dataset (offline-first).
      const entry = findRemoteDatasetEntry(translationId);
      if (entry) {
        try {
          const cached = await ensureDistribution().peekLocal(entry.id);
          if (cached) {
            return parseBooksFromText(translationId, cached.text);
          }
        } catch {
          // Cache read failed — fall through to null.
        }
      }

      // 3) Not available locally yet.
      return null;
    })();
    cache.set(translationId, promise);
  }
  return promise;
}

/**
 * Explicitly download + cache a remote dataset, then load and return its
 * books. Used by the "Traductions disponibles" settings screen when the user
 * taps "Télécharger" on a translation that is not yet available locally.
 *
 * On success the in-memory cache is invalidated for this id so subsequent
 * `loadTranslationBooks()` calls resolve instantly.
 */
export async function downloadAndLoadTranslationBooks(
  entry: RemoteDatasetCatalogEntry,
  onProgress?: (receivedBytes: number, totalBytes: number) => void,
): Promise<BibleBookData[] | null> {
  const distribution = ensureDistribution();
  const text = await distribution.ensureDataset(entry, onProgress);
  const books = await parseBooksFromText(entry.id, text);
  cache.set(entry.id, Promise.resolve(books));
  return books;
}

/**
 * Parse a downloaded JSON payload into books, routing everything else to the
 * bundled source. Wraps the `LocalBibleRepository` so the standard book
 * schema resolution (`books`/`book_id`/…) is applied uniformly.
 */
async function parseBooksFromText(
  id: string,
  text: string,
): Promise<BibleBookData[]> {
  const source = new BibleJsonFileSource();
  const wrapped: IBibleTextSource = {
    async load(requestedId: string) {
      if (requestedId === id) {
        return parseTranslationData(JSON.parse(text) as never);
      }
      return source.load(requestedId);
    },
  };
  const repo = new LocalBibleRepository(wrapped);
  return repo.getBooks(id);
}
