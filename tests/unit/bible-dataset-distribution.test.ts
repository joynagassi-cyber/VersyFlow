/**
 * Bible dataset distribution — service tests
 *
 * Covers the local distribution pipeline:
 *  - catalogue lookup (`findRemoteDatasetEntry`)
 *  - split projection: index (structure only) then chapter by chapter
 *  - full-corpus reconstruction and stats read from the index
 *  - failure paths (unknown id, absent chapter)
 */

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BIBLE_DATASET_CATALOG,
  findRemoteDatasetEntry,
  loadBibleIndex,
  loadBibleChapter,
  loadTranslationBooks,
  downloadAndLoadTranslationBooks,
  getTranslationStats,
  resetBibleCaches,
} from '@/services/bible-text-service';
import { SplitBibleTextSource } from '@/infrastructure/bible/split-bible-source';
import { indexChapterCount, indexVerseCount } from '@/domains/bible/split-index';

const SPLIT_DIR = resolve(process.cwd(), 'public/data/bible');

/** Node-fs source over the real projection shipped with the app. */
function nodeSource(): SplitBibleTextSource {
  return new SplitBibleTextSource({ useNodeFs: true, baseDir: SPLIT_DIR });
}

/**
 * Le service lit ses fichiers par `fetch` (même origine en production). En
 * test, `fetch` sert le disque : mêmes chemins, aucun réseau.
 */
beforeAll(() => {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = String(input);
    try {
      const body = readFileSync(resolve(process.cwd(), `public${url}`), 'utf8');
      return new Response(body, { status: 200 });
    } catch {
      return new Response('not found', { status: 404 });
    }
  });
});

describe('findRemoteDatasetEntry', () => {
  it('finds a known id in the static catalogue', () => {
    expect(findRemoteDatasetEntry('lsg')).toMatchObject({
      id: 'lsg',
      checksum: expect.stringContaining('sha256:'),
    });
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

describe('split projection (lazy loading)', () => {
  it('the index carries the structure without any verse text', () => {
    const raw = JSON.parse(
      readFileSync(`${SPLIT_DIR}/lsg/index.json`, 'utf8'),
    ) as { books: Array<{ id: string; chapterVerseCounts: unknown[] }>; };
    expect(raw.books.length).toBe(66);
    // Aucun texte : la sérialisation de l'index ne contient pas le premier
    // verset de la Genèse.
    const serialized = JSON.stringify(raw);
    expect(serialized).not.toContain('Au commencement');
    expect(raw.books[0].chapterVerseCounts.length).toBe(50);
  });

  it('the index announces 1189 chapters and 31 170 verses', async () => {
    const index = await nodeSource().loadIndex('lsg');
    expect(index.books.length).toBe(66);
    expect(indexChapterCount(index)).toBe(1189);
    expect(indexVerseCount(index)).toBe(31170);
  });

  it('a chapter loads alone, with its verses', async () => {
    const chapter = await nodeSource().loadChapter('lsg', 'gen', 1);
    expect(chapter?.number).toBe(1);
    expect(chapter?.verses.length).toBe(31);
    expect(chapter?.verses[0].text).toBe('Au commencement, Dieu créa les cieux et la terre.');
  });

  it('loads the psalm of the demo passage', async () => {
    const chapter = await nodeSource().loadChapter('lsg', 'psa', 23);
    expect(chapter?.verses[0].text).toContain('L’Éternel est mon berger');
  });

  it('returns null for an absent chapter instead of throwing', async () => {
    await expect(nodeSource().loadChapter('lsg', 'gen', 999)).resolves.toBeNull();
    await expect(nodeSource().loadChapter('lsg', 'nope', 1)).resolves.toBeNull();
  });

  it('rejects a traversal-style path', async () => {
    await expect(nodeSource().loadChapter('lsg', '../etc', 1)).resolves.toBeNull();
    await expect(nodeSource().loadChapter('lsg', 'gen', -1)).resolves.toBeNull();
  });

  it('reconstructs the full corpus, canon intact', async () => {
    const data = await nodeSource().load('lsg');
    expect(data.books.length).toBe(66);
    expect(data.books.reduce((n, b) => n + b.chapters.length, 0)).toBe(1189);
    expect(
      data.books.reduce(
        (n, b) => n + b.chapters.reduce((m, c) => m + c.verses.length, 0),
        0,
      ),
    ).toBe(31170);
  });
});

describe('service level', () => {
  beforeEach(() => {
    resetBibleCaches();
  });

  it('loadBibleIndex returns the structure', async () => {
    const index = await loadBibleIndex('lsg');
    expect(index?.books.length).toBe(66);
  });

  it('loadBibleChapter returns one chapter', async () => {
    const chapter = await loadBibleChapter('lsg', 'joh', 3);
    expect(chapter?.verses.some((v) => v.number === 16)).toBe(true);
  });

  it('loadTranslationBooks returns the whole canon', async () => {
    const books = await loadTranslationBooks('lsg');
    expect(books?.length).toBe(66);
  });

  it('stats come from the index (chapters, verses, year)', async () => {
    const stats = await getTranslationStats('lsg');
    expect(stats).toEqual({ chapters: 1189, verses: 31170, year: 1910 });
  });

  it('stats are null for an id that is not delivered', async () => {
    await expect(getTranslationStats('nope')).resolves.toBeNull();
  });

  it('downloadAndLoadTranslationBooks reports real progress and yields the canon', async () => {
    const percents: number[] = [];
    const books = await downloadAndLoadTranslationBooks('lsg', (percent) => percents.push(percent));
    expect(books.length).toBe(66);
    expect(percents.length).toBeGreaterThan(0);
    expect(percents.at(-1)).toBe(100);
  });

  it('rejects a translation id with no catalogue entry', async () => {
    await expect(downloadAndLoadTranslationBooks('not-a-dataset')).rejects.toThrow(
      /No remote dataset registered/,
    );
  });

  it('rejects traversal-style ids', async () => {
    await expect(downloadAndLoadTranslationBooks('../evil')).rejects.toThrow();
  });
});
