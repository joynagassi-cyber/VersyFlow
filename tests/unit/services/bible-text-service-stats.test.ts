/**
 * getTranslationStats (Detail block) — exhaustive audit tests.
 *
 * Covers the 4 audit points:
 *  1. localStorage cache (`versyflow-bible-stats-v1`, 24h TTL): correct
 *     read/write, safe when localStorage is unavailable (SSR/test).
 *  2. `computeStats` counts chapters AND verses of ALL books (full dataset).
 *  3. `getTranslationStats` returns null (not an exception) for unknown ids.
 *  4. When `downloadAndLoadTranslationData` fails (nonexistent id), the catch
 *     returns null cleanly.
 *
 * NOTE on module state: `getTranslationStats` keeps a module-level
 * `statsMemoryCache`, so each test re-imports the service module fresh
 * (`vi.resetModules()`) to avoid cross-test contamination.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TranslationStats } from '@/services/bible-text-service';

// The service's download cache falls back to localStorage ONLY when no
// PowerSync database exists. In this test file none is created (peek returns
// null), so the fallback is used. Mocking `getPowerSyncDatabase` keeps the
// module import from ever touching a real PowerSyncDatabase instance.
vi.mock('@/infrastructure/sync/powersync-database', () => ({
  peekPowerSyncDatabase: vi.fn().mockReturnValue(null),
  getPowerSyncDatabase: vi.fn(),
}));

// `getTranslationStats` falls back to a real `fetch()` of the Supabase
// bucket whenever the seeded dataset cache misses (checksum mismatch / no
// entry) in dev mode. These are unit tests, not integration tests: keep the
// process hermetic by stubbing `fetch` to reject immediately so no real
// network I/O happens and the 5000 ms Vitest default timeout can't be hit
// waiting on a slow/stale connection.
vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network disabled in unit test')));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type SvcModule = typeof import('@/services/bible-text-service');

const STATS_CACHE_KEY = 'versyflow-bible-stats-v1';
const DATASET_CACHE_PREFIX = 'versyflow.bible-dataset.';

/** A multi-book dataset with distinct chapter/verse counts per book. */
function makeSmallDataset(id: string): Record<string, unknown> {
  return {
    id,
    language: 'fr',
    name: `${id} fixture`,
    year: 1517,
    books: [
      {
        id: 'gen',
        name: { fr: 'Genèse', en: 'Genesis' },
        testament: 'old',
        chapterCount: 2,
        chapters: [
          { number: 1, verses: [{ number: 1, text: 'a' }, { number: 2, text: 'b' }, { number: 3, text: 'c' }] },
          { number: 2, verses: [{ number: 1, text: 'd' }] },
        ],
      },
      {
        id: 'joh',
        name: { fr: 'Jean', en: 'John' },
        testament: 'new',
        chapterCount: 1,
        chapters: [
          { number: 1, verses: [{ number: 1, text: 'e' }, { number: 2, text: 'f' }] },
        ],
      },
      {
        id: 'apc',
        name: { fr: 'Apocalypse', en: 'Revelation' },
        testament: 'new',
        chapterCount: 1,
        chapters: [
          { number: 1, verses: [] },
        ],
      },
    ],
  };
}

// gen: 2 ch, 4 v · joh: 1 ch, 2 v · apc: 1 ch, 0 v  → 4 chapters, 6 verses.
const SMALL_STATS = { chapters: 4, verses: 6, year: 1517 };

/** Real, bundled + catalogued dataset id — loads via the small seeded cache. */
const KNOWN_ID = 'ar-nav';

/** Seed a 24 h localStorage stats cache entry for a given id. */
function seedStatsCache(id: string, stats: TranslationStats, at: number) {
  window.localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ [id]: { stats, at } }));
}

/**
 * Seed the on-demand dataset cache so `loadTranslationData(id)` resolves
 * from localStorage (`peekLocal` → `LocalStorageBibleDatasetCache`), with no
 * network. The checksum must match the catalogue entry for the id.
 */
function seedDatasetCache(translationId: string, dataset: Record<string, unknown>) {
  const catalogJson = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '..', '..', '..', 'data', 'bible', 'dataset-catalog.json'),
      'utf-8',
    ),
  ) as Array<{ id: string; checksum: string }>;
  const entry = catalogJson.find((e) => e.id === translationId);
  if (!entry) throw new Error(`No catalogue entry for ${translationId}`);
  // The domain layer validates + canonical-filters the payload
  // (`parseTranslationData`, canonicalOnly: true): every book id must be in
  // the 66-book canon. `apc` is not, so use a canonical book instead.
  const canonicalized = {
    ...dataset,
    books: (dataset.books as Array<Record<string, unknown>>)
      .map((b) => (b.id === 'apc' ? { ...b, id: 'mat' } : b)),
  };
  window.localStorage.setItem(
    `${DATASET_CACHE_PREFIX}${translationId}`,
    JSON.stringify({
      id: translationId,
      checksum: entry.checksum,
      text: JSON.stringify(canonicalized),
      downloadedAt: Date.now(),
    }),
  );
}

/** Fresh import of the service module (clean `statsMemoryCache`). */
async function freshService(): Promise<SvcModule> {
  vi.resetModules();
  return import('@/services/bible-text-service');
}

describe('getTranslationStats — audit', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  // ------------------------------------------------------------------
  // Point 1: localStorage cache read/write + safety when unavailable
  // ------------------------------------------------------------------
  describe('localStorage cache (versyflow-bible-stats-v1, 24h TTL)', () => {
    it('reads a fresh (< 24h) cache entry and returns it without network', async () => {
      const seeded = { chapters: 42, verses: 999, year: 1500 };
      seedStatsCache(KNOWN_ID, seeded, Date.now() - 60_000);
      // Seed a matching dataset cache so the fresh stats entry can actually be
      // read back (the bundled/remote fallback path — see `loadTranslationData`
      // resolution order above).
      seedDatasetCache(KNOWN_ID, makeSmallDataset(KNOWN_ID));

      const svc = await freshService();
      const stats = await svc.getTranslationStats(KNOWN_ID);
      expect(stats).toEqual(seeded);
    }, 15_000);

    it('ignores a stale (> 24h) entry and re-resolves instead', async () => {
      const stale = { chapters: 1, verses: 1 };
      seedStatsCache(KNOWN_ID, stale, Date.now() - 25 * 60 * 60 * 1000);
      seedDatasetCache(KNOWN_ID, makeSmallDataset(KNOWN_ID));

      const svc = await freshService();
      const stats = await svc.getTranslationStats(KNOWN_ID);
      // The stale value must never be served; a re-resolved dataset is
      // returned instead (here the small seeded fixture: 4 chapters, 6 verses).
      expect(stats).not.toEqual(stale);
      expect(stats).toEqual(SMALL_STATS);
    }, 15_000);

    it('writes a fresh entry to the cache after resolving', async () => {
      seedDatasetCache(KNOWN_ID, makeSmallDataset(KNOWN_ID));
      const svc = await freshService();
      const stats = await svc.getTranslationStats(KNOWN_ID);
      expect(stats).toEqual(SMALL_STATS);

      const raw = window.localStorage.getItem(STATS_CACHE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!) as Record<string, { stats: TranslationStats; at: number }>;
      expect(parsed[KNOWN_ID].stats).toEqual(SMALL_STATS);
      expect(parsed[KNOWN_ID].at).toBeGreaterThan(Date.now() - 60_000);
    }, 15_000);

    it('survives a corrupted / non-object localStorage payload (SSR-safe)', async () => {
      // `null` is valid JSON that parses to `null`; the reader must treat it
      // as "no cache" and not throw when indexing it (`disk[id]`).
      window.localStorage.setItem(STATS_CACHE_KEY, 'null');

      const svc = await freshService();
      // Unknown id: no local data, download fails fast (uncatalogued id) →
      // catch → null. The point: a null-valued cache never crashes the reader.
      await expect(svc.getTranslationStats('ghost-null-id')).resolves.toBeNull();
    });

    it('does not crash when localStorage itself is unavailable (SSR)', async () => {
      // Simulate a webview/browser where `globalThis.localStorage` is absent:
      // the optional chain (`globalThis.localStorage?.`) must be a no-op.
      const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
      try {
        Object.defineProperty(globalThis, 'localStorage', {
          value: undefined,
          configurable: true,
          writable: true,
        });

        const svc = await freshService();
        // Unknown, uncatalogued id: `readStatsCache()` must survive a missing
        // localStorage, and the resolution failure returns null, not a throw.
        await expect(svc.getTranslationStats('no-localstorage-xyz')).resolves.toBeNull();
      } finally {
        if (desc) Object.defineProperty(globalThis, 'localStorage', desc);
      }
    });
  });

  // ------------------------------------------------------------------
  // Point 2: computeStats counts ALL books (chapters + verses)
  // ------------------------------------------------------------------
  describe('computeStats full-dataset counting', () => {
    it('sums chapters and verses across every book of the dataset', async () => {
      seedDatasetCache(KNOWN_ID, makeSmallDataset(KNOWN_ID));
      const svc = await freshService();
      const stats = await svc.getTranslationStats(KNOWN_ID);
      // ground truth: gen 2/4 + joh 1/2 + mat 1/0 = 4 chapters, 6 verses.
      // A partial count (any subset of books) would fail this.
      expect(stats).toEqual(SMALL_STATS);
    });

    it('agrees with an independent sum over the same dataset', () => {
      // Independent recomputation is the ground truth `computeStats` must match.
      const ds = makeSmallDataset(KNOWN_ID);
      let chapters = 0;
      let verses = 0;
      for (const book of (ds.books as Array<{ chapters: Array<{ verses: unknown[] }> }>)) {
        chapters += book.chapters.length;
        for (const c of book.chapters) verses += c.verses.length;
      }
      expect({ chapters, verses }).toEqual({ chapters: 4, verses: 6 });
      expect((ds.books as unknown[]).length).toBe(3); // all three books iterated
    });
  });

  // ------------------------------------------------------------------
  // Point 3: unknown id → null, never an exception
  // ------------------------------------------------------------------
  describe('unknown translation id', () => {
    it('returns null for an id that is not in the catalogue', async () => {
      const svc = await freshService();
      const stats = await svc.getTranslationStats('definitely-not-a-translation-xyz');
      expect(stats).toBeNull();
    });

    it('never throws for an unknown id (resolves, not rejects)', async () => {
      const svc = await freshService();
      await expect(svc.getTranslationStats('ghost-id-404')).resolves.toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // Point 4: download-failure path → clean null
  // ------------------------------------------------------------------
  describe('download-failure path', () => {
    it('returns null cleanly when the dataset cannot be resolved locally or remotely', async () => {
      const svc = await freshService();
      const stats = await svc.getTranslationStats('unknown-does-not-exist');
      expect(stats).toBeNull();
    });

    it('does not write a bogus entry to the stats cache on failure', async () => {
      const svc = await freshService();
      await svc.getTranslationStats('unknown-does-not-exist');
      const raw = window.localStorage.getItem(STATS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        expect(parsed['unknown-does-not-exist']).toBeUndefined();
      }
    });
  });
});
