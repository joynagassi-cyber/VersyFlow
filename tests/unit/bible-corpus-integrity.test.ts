/**
 * Bible corpus integrity — la source, la projection et l'index disent la même
 * chose.
 *
 * Trois artefacts décrivent le même corpus :
 *   - `data/bible/lsg.json`            la source (6,9 Mo) ;
 *   - `public/data/bible/lsg/**`       la projection par chapitre que lit l'app ;
 *   - `public/…/lsg/index.json`        la structure chargée à l'ouverture.
 *
 * Ces tests couvrent un écart qui n'apparaissait nulle part : une projection
 * fraîche peut annoncer un nombre de versets faux dans l'index, ou contenir un
 * chapitre que la source n'a pas. `npm run build` appelle déjà `--check` ; ici
 * on vérifie la **validité** du corpus (versets vides, doublons, trous) et la
 * cohérence index ↔ chapitres, ce que `--check` ne regarde pas.
 *
 * Le corpus réel est lu depuis le disque : ces contrôles portent sur les
 * fichiers livrés, pas sur une fixture qui pourrait diverger d'eux.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildProjection,
  validateDataset,
  type RawDataset,
} from '../../scripts/bible/split-lsg.mjs';
import { parseSplitIndex } from '@/domains/bible/split-index';
import { SplitBibleTextSource } from '@/infrastructure/bible/split-bible-source';

const ROOT = process.cwd();
const SOURCE = resolve(ROOT, 'data/bible/lsg.json');
const BASE_DIR = resolve(ROOT, 'public/data/bible');
const PROJECTION = resolve(BASE_DIR, 'lsg');

const dataset = JSON.parse(readFileSync(SOURCE, 'utf8')) as RawDataset;
const index = parseSplitIndex(JSON.parse(readFileSync(resolve(PROJECTION, 'index.json'), 'utf8')));

/** Corpus de la projection, reconstruit par la couche qui le lit en production. */
const projected = new SplitBibleTextSource({ useNodeFs: true, baseDir: BASE_DIR });

describe('corpus LSG — validité de la source', () => {
  it('ne contient aucun défaut structurel', () => {
    expect(validateDataset(dataset)).toEqual([]);
  });

  it('compte 66 livres, 1 189 chapitres et 31 170 versets', () => {
    const chapters = dataset.books.reduce((n, b) => n + b.chapters.length, 0);
    const verses = dataset.books.reduce(
      (n, b) => n + b.chapters.reduce((m, c) => m + c.verses.length, 0),
      0,
    );
    expect({ books: dataset.books.length, chapters, verses }).toEqual({
      books: 66,
      chapters: 1189,
      verses: 31170,
    });
  });
});

describe('validateDataset — ce qu’il refuse', () => {
  /** Corpus minimal valide, puis un défaut injecté par test. */
  const base = (): RawDataset => ({
    books: [
      {
        id: 'gen',
        chapterCount: 1,
        chapters: [{ number: 1, verses: [{ number: 1, text: 'Au commencement.' }] }],
      },
    ],
  });

  it('accepte un corpus sain', () => {
    expect(validateDataset(base())).toEqual([]);
  });

  it('signale un verset vide ou blanchi, avec sa référence', () => {
    const data = base();
    data.books[0].chapters[0].verses = [
      { number: 1, text: 'Texte' },
      { number: 2, text: '   ' },
    ];
    expect(validateDataset(data)).toContain('gen/1:2 : verset vide');
  });

  it('signale un doublon de livre et un doublon de chapitre', () => {
    const duplicatedBook = base();
    const [first] = base().books;
    duplicatedBook.books.push({ ...first, chapters: first.chapters.map((c) => ({ ...c })) });
    expect(validateDataset(duplicatedBook)).toContain('livre en double : gen');

    const duplicatedChapter = base();
    duplicatedChapter.books[0].chapters.push({ number: 1, verses: [] });
    duplicatedChapter.books[0].chapterCount = 2;
    expect(validateDataset(duplicatedChapter)).toContain('chapitre en double : gen/1');
  });

  it('signale un trou dans les chapitres et une numérotation de versets rompue', () => {
    const data = base();
    data.books[0].chapters.push({
      number: 3,
      verses: [{ number: 2, text: 'Deuxième' }],
    });
    data.books[0].chapterCount = 2;
    const problems = validateDataset(data);
    expect(problems).toContain('gen/2 : chapitre absent');
    expect(problems).toContain('gen/3:2 : verset attendu 1');
  });

  it('signale un chapterCount qui ment et un caractère de contrôle', () => {
    const data = base();
    data.books[0].chapterCount = 2;
    data.books[0].chapters[0].verses[0].text = 'Texte\u0000corrompu';
    const problems = validateDataset(data);
    expect(problems).toContain('gen : chapterCount 2 ≠ 1 chapitres');
    expect(problems).toContain('gen/1:1 : caractère de contrôle');
  });
});

describe('projection — même corpus que la source, chapitre par chapitre', () => {
  it('projette exactement un fichier par chapitre, plus l’index', () => {
    const expected = buildProjection(dataset);
    const chapters = dataset.books.reduce((n, b) => n + b.chapters.length, 0);
    expect(expected.size).toBe(chapters + 1);
    expect(expected.has('index.json')).toBe(true);
    expect(expected.has('psa/119.json')).toBe(true);
  });

  it('le chapitre projeté porte le texte de la source, verset par verset', () => {
    const expected = buildProjection(dataset);
    for (const [bookId, chapter] of [
      ['gen', 1],
      ['psa', 119],
      ['joh', 3],
      ['rev', 22],
    ] as const) {
      const fromSource = dataset.books.find((b) => b.id === bookId)?.chapters.find((c) => c.number === chapter);
      const fromProjection = JSON.parse(
        expected.get(`${bookId}/${chapter}.json`) as string,
      ) as unknown;
      expect(fromProjection).toEqual(fromSource);
    }
  });

  it('ne perd ni n’ajoute aucun verset sur l’ensemble du corpus', async () => {
    const all = await projected.load('lsg');
    const sourceVerses = dataset.books.flatMap((b) =>
      b.chapters.flatMap((c) => c.verses.map((v) => `${b.id}/${c.number}:${v.number}`)),
    );
    const projectedVerses = all.books.flatMap((b) =>
      b.chapters.flatMap((c) => c.verses.map((v) => `${b.id}/${c.number}:${v.number}`)),
    );
    expect(projectedVerses).toEqual(sourceVerses);
  });
});

describe('index ↔ chapitres', () => {
  it('annonce le même nombre de chapitres que la source, livre par livre', () => {
    expect(index.books.map((b) => [b.id, b.chapterVerseCounts.length])).toEqual(
      dataset.books.map((b) => [b.id, b.chapters.length]),
    );
  });

  it('annonce le même nombre de versets que la source, chapitre par chapitre', () => {
    const announced = index.books.flatMap((book) =>
      book.chapterVerseCounts.map((c) => `${book.id}/${c.number}:${c.verses}`),
    );
    const actual = dataset.books.flatMap((book) =>
      book.chapters.map((c) => `${book.id}/${c.number}:${c.verses.length}`),
    );
    expect(announced).toEqual(actual);
  });

  it('ne déclare aucun chapitre que la projection ne sache pas servir', async () => {
    // Un échantillon large mais borné : un contrôle complet ferait 1 189
    // lectures de fichier. Les chapitres limites de chaque livre suffisent à
    // attraper une grille décalée ou un dernier chapitre absent.
    const targets = index.books.flatMap((book) => [
      { bookId: book.id, chapter: 1 },
      { bookId: book.id, chapter: book.chapterVerseCounts.at(-1)?.number ?? 1 },
    ]);
    const results = await Promise.all(
      targets.map((t) => projected.loadChapter('lsg', t.bookId, t.chapter)),
    );
    const missing = targets.filter((_t, i) => results[i] === null);
    expect(missing).toEqual([]);
  });
});
