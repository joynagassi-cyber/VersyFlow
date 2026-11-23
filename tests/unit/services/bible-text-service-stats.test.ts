/**
 * getTranslationStats — statistiques lues dans l'index éclaté.
 *
 * L'index (`public/data/bible/lsg/index.json`) annonce, pour chaque livre, ses
 * chapitres et leur nombre de versets. Les statistiques se calculent donc sans
 * parser un seul verset — et sans les 6,9 Mo du fichier monolithique.
 *
 * Les chiffres attendus sont ceux de la LSG 1910 livrée avec l'app : 66 livres,
 * 1 189 chapitres, 31 170 versets.
 */

import { beforeAll, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  indexChapterCount,
  indexVerseCount,
  parseSplitIndex,
} from '@/domains/bible/split-index';
import { resetBibleCaches, getTranslationStats } from '@/services/bible-text-service';

const INDEX_FILE = resolve(process.cwd(), 'public/data/bible/lsg/index.json');

/** En test, `fetch` sert le disque : mêmes chemins, aucun réseau. */
beforeAll(() => {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = String(input);
    try {
      return new Response(readFileSync(resolve(process.cwd(), `public${url}`), 'utf8'), { status: 200 });
    } catch {
      return new Response('not found', { status: 404 });
    }
  });
});

function loadIndex() {
  return parseSplitIndex(JSON.parse(readFileSync(INDEX_FILE, 'utf8')));
}

describe('index éclaté — structure', () => {
  it('annonce les 66 livres du canon', () => {
    expect(loadIndex().books.length).toBe(66);
  });

  it('annonce 1 189 chapitres et 31 170 versets', () => {
    const index = loadIndex();
    expect(indexChapterCount(index)).toBe(1189);
    expect(indexVerseCount(index)).toBe(31170);
  });

  it('ne contient aucun texte de verset', () => {
    const raw = readFileSync(INDEX_FILE, 'utf8');
    expect(raw).not.toContain('Au commencement');
    expect(raw.length).toBeLessThan(60_000);
  });

  it('normalise l’ordre canonique même si le fichier est mélangé', () => {
    const raw = JSON.parse(readFileSync(INDEX_FILE, 'utf8')) as {
      books: unknown[];
    };
    raw.books.reverse();
    const index = parseSplitIndex(raw);
    expect(index.books[0].id).toBe('gen');
    expect(index.books.at(-1)?.id).toBe('rev');
  });

  it('rejette un index qui n’est pas un index', () => {
    expect(() => parseSplitIndex({ id: 'x' })).toThrow(/Invalid split Bible index/);
  });
});

describe('getTranslationStats', () => {
  it('lit les compteurs dans l’index', async () => {
    resetBibleCaches();
    await expect(getTranslationStats('lsg')).resolves.toEqual({
      chapters: 1189,
      verses: 31170,
      year: 1910,
    });
  });

  it('renvoie null pour une traduction non livrée', async () => {
    resetBibleCaches();
    await expect(getTranslationStats('nope')).resolves.toBeNull();
  });

  it('renvoie null pour une traduction cataloguée mais non projetée', async () => {
    resetBibleCaches();
    // `kujv` figure au catalogue (56 stubs) mais aucun fichier n'est livré.
    await expect(getTranslationStats('kujv')).resolves.toBeNull();
  });
});
