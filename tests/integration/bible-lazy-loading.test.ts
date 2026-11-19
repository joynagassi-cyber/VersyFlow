/**
 * Chargement paresseux de la Bible — preuve d'intégrité et de coût.
 *
 * Le lecteur ne doit jamais parser 6,9 Mo pour afficher un psaume. Ces tests
 * vérifient les deux faces de la promesse :
 *
 *   - intégrité : 66 livres, 1 189 chapitres, 31 170 versets, aucun verset
 *     vide, texte bien typographié (apostrophes, guillemets, aucun marqueur
 *     USFM résiduel) ;
 *   - coût : ouvrir un chapitre ne lit que l'index + le chapitre demandé
 *     (3 requêtes maximum), et l'index seul suffit à la navigation.
 */

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  loadBibleChapter,
  loadBibleIndex,
  loadTranslationBooks,
  resetBibleCaches,
} from '@/services/bible-text-service';
import { indexChapterCount, indexVerseCount } from '@/domains/bible/split-index';

const requested: string[] = [];

beforeAll(() => {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = String(input);
    requested.push(url);
    try {
      return new Response(readFileSync(resolve(process.cwd(), `public${url}`), 'utf8'), { status: 200 });
    } catch {
      return new Response('not found', { status: 404 });
    }
  });
});

describe('intégrité du texte livré', () => {
  it('les 66 livres, 1 189 chapitres et 31 170 versets sont présents', async () => {
    resetBibleCaches();
    const index = await loadBibleIndex('lsg');
    expect(index).not.toBeNull();
    expect(index!.books.length).toBe(66);
    expect(indexChapterCount(index!)).toBe(1189);
    expect(indexVerseCount(index!)).toBe(31170);

    const books = await loadTranslationBooks('lsg');
    expect(books!.length).toBe(66);
    const chapters = books!.reduce((n, b) => n + b.chapters.length, 0);
    const verses = books!.reduce(
      (n, b) => n + b.chapters.reduce((m, c) => m + c.verses.length, 0),
      0,
    );
    expect(chapters).toBe(1189);
    expect(verses).toBe(31170);
  }, 60_000);

  it('aucun verset vide, aucun texte non typographié', async () => {
    const books = await loadTranslationBooks('lsg');
    const texts = books!.flatMap((b) => b.chapters.flatMap((c) => c.verses.map((v) => v.text)));

    // Aucun verset vide : un trou dans le canon n'est jamais du « contenu ».
    expect(texts.filter((t) => t.trim().length === 0)).toEqual([]);

    // Apostrophes : typographiques, jamais suivies d'une espace (élision
    // française) et jamais droites.
    const badApostrophe = texts.filter((t) => /’ /.test(t) || t.includes("'"));
    expect(badApostrophe).toEqual([]);

    // Guillemets : français (« … »), pas de guillemets anglais résiduels.
    expect(texts.filter((t) => /[“”]/.test(t))).toEqual([]);

    // Aucun marqueur USFM ne doit atteindre le lecteur.
    expect(texts.filter((t) => t.includes('\\'))).toEqual([]);

    // Espaces doubles / bords : le rendu justifié les transformerait en trous.
    expect(texts.filter((t) => / {2}/.test(t) || t !== t.trim())).toEqual([]);
  }, 60_000);

  it('les passages connus sont exacts', async () => {
    resetBibleCaches();
    const gen1 = await loadBibleChapter('lsg', 'gen', 1);
    expect(gen1?.verses[0].text).toBe('Au commencement, Dieu créa les cieux et la terre.');

    const psa23 = await loadBibleChapter('lsg', 'psa', 23);
    expect(psa23?.verses[0].text).toContain('L’Éternel est mon berger');
    expect(psa23?.verses[0].text).toContain('je ne manquerai de rien');
  }, 60_000);
});

describe('coût du chargement', () => {
  it('ouvrir un chapitre ne demande que l’index et ce chapitre', async () => {
    resetBibleCaches();
    requested.length = 0;

    const index = await loadBibleIndex('lsg');
    expect(index).not.toBeNull();
    const chapter = await loadBibleChapter('lsg', 'psa', 23);
    expect(chapter?.verses.length).toBe(6);

    expect(requested).toEqual([
      '/data/bible/lsg/index.json',
      '/data/bible/lsg/psa/23.json',
    ]);
    // L'index est mis en cache : le second chapitre ne le redemande pas.
    await loadBibleChapter('lsg', 'psa', 24);
    expect(requested.filter((url) => url.endsWith('index.json'))).toHaveLength(1);
  });

  it('l’index seul ne transporte aucun verset', async () => {
    resetBibleCaches();
    const raw = readFileSync(resolve(process.cwd(), 'public/data/bible/lsg/index.json'), 'utf8');
    expect(raw).not.toContain('berger');
    expect(raw.length).toBeLessThan(60_000);
  });
});
