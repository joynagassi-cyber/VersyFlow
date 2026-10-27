/**
 * Bible dataset distribution — service tests
 *
 * Covers the download-on-demand pipeline:
 *  - catalogue lookup (`findRemoteDatasetEntry`)
 *  - checksum-based cache hit / miss / staleness
 *  - download + cache write
 *  - failure paths (HTTP errors, invalid ids)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BIBLE_DATASET_CATALOG,
  findRemoteDatasetEntry,
  downloadAndLoadTranslationBooks,
  type BibleDatasetCatalogEntry,
} from '@/services/bible-text-service';
import type { IBibleDatasetCache, CachedBibleDataset } from '@/infrastructure/bible/bible-dataset-cache';

/** In-memory cache stub implementing `IBibleDatasetCache`. */
class InMemoryBibleDatasetCache implements IBibleDatasetCache {
  readonly store = new Map<string, CachedBibleDataset>();

  async get(id: string, checksum: string) {
    const entry = this.store.get(id);
    return entry?.checksum === checksum ? entry : null;
  }

  async set(dataset: CachedBibleDataset) {
    this.store.set(dataset.id, dataset);
  }

  reset(): void {
    this.store.clear();
  }
}

/** Minimal valid dataset matching `BibleTranslationDataSchema`. */
function makeDatasetJson(id: string): string {
  return JSON.stringify({
    id,
    language: 'fr',
    name: `${id} test`,
    books: [
      {
        id: 'gen',
        name: { fr: 'Genèse', en: 'Genesis' },
        testament: 'old',
        chapterCount: 1,
        chapters: [
          {
            number: 1,
            verses: [
              { number: 1, text: 'Au commencement' },
              { number: 2, text: 'témoin' },
            ],
          },
        ],
      },
    ],
  });
}

function mockFetch(body: string, status: number): typeof fetch {
  return vi.fn(async () =>
    new Response(body, {
      status,
      statusText: status === 200 ? 'OK' : 'Not Found',
      headers: { 'content-type': 'application/json' },
    }),
  ) as typeof fetch;
}

describe('findRemoteDatasetEntry', () => {
  it('finds a known id in the static catalogue', () => {
    expect(findRemoteDatasetEntry('lsg')).toMatchObject({ id: 'lsg', checksum: expect.stringContaining('sha256:') });
  });

  it('returns null for an unknown id', () => {
    expect(findRemoteDatasetEntry('nope')).toBeNull();
  });

  it('every catalogue entry has id/checksum/sizeBytes/builtAt', () => {
    for (const entry of BIBLE_DATASET_CATALOG) {
      expect(entry.id).toMatch(/^[a-z0-9_-]+$/);
      expect(entry.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(entry.sizeBytes).toBeGreaterThan(0);
      expect(entry.builtAt).toBeTruthy();
    }
  });
});

describe('downloadAndLoadTranslationBooks', () => {
  let cache: InMemoryBibleDatasetCache;
  let entry: BibleDatasetCatalogEntry;

  beforeEach(() => {
    cache = new InMemoryBibleDatasetCache();
    entry = findRemoteDatasetEntry('lsg')!;
  });

  it('downloads, caches, and returns the books', async () => {
    const body = makeDatasetJson('lsg');
    const fetchImpl = mockFetch(body, 200);

    const books = await downloadAndLoadTranslationBooks('lsg', undefined, {
      fetchImpl,
      cacheOverride: cache,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(books.map((b) => b.id)).toEqual(['gen']);
    expect(books[0].chapters[0].verses.map((v) => v.text)).toEqual([
      'Au commencement',
      'témoin',
    ]);
    // Cached under the catalogue checksum.
    expect(await cache.get('lsg', entry.checksum)).not.toBeNull();
  });

  it('serves from cache without hitting the network when the checksum matches', async () => {
    const body = makeDatasetJson('lsg');
    await cache.set({
      id: 'lsg',
      checksum: entry.checksum,
      text: body,
      downloadedAt: 1,
    });

    const fetchImpl: typeof fetch = vi.fn();
    const books = await downloadAndLoadTranslationBooks('lsg', undefined, {
      fetchImpl,
      cacheOverride: cache,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(books[0].id).toBe('gen');
  });

  it('re-downloads when the cached checksum is stale (catalogue bumped)', async () => {
    const staleBody = makeDatasetJson('lsg');
    await cache.set({
      id: 'lsg',
      checksum: `sha256:${'0'.repeat(64)}`, // stale
      text: staleBody,
      downloadedAt: 1,
    });

    const freshBody = makeDatasetJson('lsg');
    const fetchImpl = mockFetch(freshBody, 200);

    await downloadAndLoadTranslationBooks('lsg', undefined, {
      fetchImpl,
      cacheOverride: cache,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    // Cache now holds the fresh checksum.
    expect(await cache.get('lsg', entry.checksum)).not.toBeNull();
  });

  it('throws a descriptive error on HTTP 404', async () => {
    const fetchImpl = mockFetch('nope', 404);
    await expect(
      downloadAndLoadTranslationBooks('lsg', undefined, {
        fetchImpl,
        cacheOverride: cache,
      }),
    ).rejects.toThrow(/HTTP 404/);
    expect(await cache.get('lsg', entry.checksum)).toBeNull();
  });

  it('rejects a translation id with no catalogue entry', async () => {
    await expect(
      downloadAndLoadTranslationBooks('not-a-dataset', undefined, {
        fetchImpl: vi.fn(),
        cacheOverride: cache,
      }),
    ).rejects.toThrow(/No remote dataset registered/);
  });

  it('rejects traversal-style ids', async () => {
    await expect(
      downloadAndLoadTranslationBooks('../evil', undefined, {
        fetchImpl: vi.fn(),
        cacheOverride: cache,
      }),
    ).rejects.toThrow();
  });
});
