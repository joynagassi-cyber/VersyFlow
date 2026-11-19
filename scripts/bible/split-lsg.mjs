#!/usr/bin/env node
/**
 * scripts/bible/split-lsg.mjs — projette `data/bible/lsg.json` en fichiers
 * **par livre et par chapitre** pour un chargement paresseux.
 *
 * Pourquoi : le dataset complet pèse 6,9 Mo / 31 170 versets. Le charger en
 * entier à l'ouverture du lecteur coûte plusieurs secondes de parse sur mobile
 * et garde tout le corpus en mémoire. Le lecteur n'a besoin que d'un chapitre
 * (~10 Ko) pour afficher du texte, et des métadonnées (~25 Ko) pour construire
 * la navigation.
 *
 * Arborescence produite sous `public/data/bible/lsg/` :
 *   index.json            métadonnées des 66 livres + nombre de versets par
 *                         chapitre — aucun texte de verset.
 *   <bookId>/<n>.json     le chapitre `n`, seul fichier qui porte du texte.
 *
 * Un fichier par chapitre (1 189 fichiers, ~3 Ko chacun) plutôt qu'un fichier
 * par livre : le lecteur affiche un chapitre à la fois, et le codex mobile ne
 * doit parser que ce qu'il montre. Le contenu est minifié par ligne (un
 * fichier = une ligne) pour rester compact en HTTP.
 *
 * `data/bible/lsg.json` reste la source de vérité (et le repli du lecteur) :
 * le script ne fait que le projeter. `--check` échoue si la projection dérive,
 * ce qui interdit de corriger le texte d'un côté sans l'autre.
 *
 * Le script ne se contente pas de recopier : il **vérifie le corpus** avant de
 * projeter. Un verset vide, un doublon de référence, un chapitre ou un verset
 * manquant, un caractère de contrôle, un `chapterCount` qui ment : chacun est
 * une erreur qui échoue avec le chemin exact (`joh/3:16`), dans les deux modes.
 * Le corpus actuel passe ces contrôles sans exception (66 livres, 1 189
 * chapitres, 31 170 versets).
 *
 * Usage :
 *   node scripts/bible/split-lsg.mjs            # vérifie puis (ré)écrit
 *   node scripts/bible/split-lsg.mjs --check    # vérifie corpus + fraîcheur
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE = resolve(root, 'data/bible/lsg.json');
const OUT_DIR = resolve(root, 'public/data/bible/lsg');
const CHECK = process.argv.includes('--check');

const json = (value) => `${JSON.stringify(value, null, 0)}\n`;

/** Caractères qu'un texte biblique ne peut pas contenir (contrôles, U+FFFD). */
const FORBIDDEN_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/;

/**
 * Contrôles d'intégrité du corpus source — `data/bible/lsg.json`.
 *
 * Retourne la liste des problèmes, vide si le corpus est sain. Chaque message
 * porte une référence lisible (`joh/3:16`, `psa/119`) pour qu'on sache quoi
 * corriger sans relire 6,9 Mo.
 *
 * Ce qui est refusé, et pourquoi :
 *  - livre ou chapitre en double : deux entrées de même identifiant rendraient
 *    la navigation ambiguë et la projection écraserait silencieusement l'une
 *    des deux ;
 *  - chapitres non contigus à partir de 1 : la grille de chapitres se construit
 *    sur `1..n`, un trou passerait pour un chapitre absent ;
 *  - versets vides ou blanchis : un verset sans texte s'affiche comme un bug
 *    de chargement, pas comme une donnée ;
 *  - caractères de contrôle / U+FFFD : traces d'un décodage raté, invisibles à
 *    la lecture et impossibles à corriger après coup ;
 *  - `chapterCount` différent de `chapters.length` : l'en-tête du livre
 *    mentirait sur ce que contient la projection.
 */
export function validateDataset(dataset) {
  const problems = [];
  const bookIds = new Set();
  for (const book of dataset.books ?? []) {
    if (bookIds.has(book.id)) problems.push(`livre en double : ${book.id}`);
    bookIds.add(book.id);
    const chapters = book.chapters ?? [];
    if (book.chapterCount !== chapters.length) {
      problems.push(
        `${book.id} : chapterCount ${book.chapterCount} ≠ ${chapters.length} chapitres`,
      );
    }
    const chapterNumbers = new Set();
    for (const chapter of chapters) {
      if (chapterNumbers.has(chapter.number)) {
        problems.push(`chapitre en double : ${book.id}/${chapter.number}`);
      }
      chapterNumbers.add(chapter.number);
      const ref = `${book.id}/${chapter.number}`;
      const verses = chapter.verses ?? [];
      if (verses.length === 0) problems.push(`${ref} : chapitre vide`);
      let previous = 0;
      for (const verse of verses) {
        if (verse.number !== previous + 1) {
          problems.push(`${ref}:${verse.number} : verset attendu ${previous + 1}`);
        }
        previous = verse.number;
        const text = typeof verse.text === 'string' ? verse.text : '';
        if (text.trim() === '') problems.push(`${ref}:${verse.number} : verset vide`);
        else if (FORBIDDEN_CHARS.test(text)) {
          problems.push(`${ref}:${verse.number} : caractère de contrôle`);
        }
      }
    }
    for (let expected = 1; expected <= chapters.length; expected += 1) {
      if (!chapterNumbers.has(expected)) problems.push(`${book.id}/${expected} : chapitre absent`);
    }
  }
  return problems;
}

/** Métadonnées d'un livre : structure seule, aucun verset. */
export function bookMeta(book) {
  return {
    id: book.id,
    name: book.name,
    testament: book.testament,
    chapterCount: book.chapterCount,
    chapterVerseCounts: book.chapters.map((c) => ({ number: c.number, verses: c.verses.length })),
  };
}

/** Tous les fichiers attendus, en mémoire, indexés par chemin relatif. */
export function buildProjection(dataset) {
  const files = new Map();
  files.set(
    'index.json',
    json({
      id: dataset.id,
      language: dataset.language,
      name: dataset.name,
      year: dataset.year,
      books: dataset.books.map(bookMeta),
    }),
  );
  for (const book of dataset.books) {
    for (const chapter of book.chapters) {
      files.set(`${book.id}/${chapter.number}.json`, json(chapter));
    }
  }
  return files;
}

function main() {
  const dataset = JSON.parse(readFileSync(SOURCE, 'utf8'));

  // Le corpus est vérifié avant la projection, dans les deux modes : `--check`
  // ne doit pas se contenter de dire « la copie est fraîche » alors que la
  // source contient un verset vide.
  const invalid = validateDataset(dataset);
  if (invalid.length > 0) {
    for (const problem of invalid.slice(0, 20)) console.error(`[split-lsg] ${problem}`);
    console.error(
      `[split-lsg] corpus invalide (${invalid.length} problème(s)) — corriger data/bible/lsg.json.`,
    );
    process.exit(1);
  }

  const expected = buildProjection(dataset);

  if (CHECK) {
    const problems = [];
    for (const [name, content] of expected) {
      const file = resolve(OUT_DIR, name);
      if (!existsSync(file)) problems.push(`${name} absent`);
      else if (readFileSync(file, 'utf8') !== content) problems.push(`${name} périmé`);
    }
    const walk = (dir, prefix = '') => {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) walk(resolve(dir, entry.name), rel);
        else if (!expected.has(rel)) problems.push(`${rel} inattendu`);
      }
    };
    walk(OUT_DIR);
    if (problems.length > 0) {
      for (const problem of problems.slice(0, 10)) console.error(`[split-lsg] ${problem}`);
      console.error(
        `[split-lsg] projection incomplète (${problems.length} écart(s)) — relancer sans --check.`,
      );
      process.exit(1);
    }
    console.log(`[split-lsg] projection conforme (${expected.size} fichiers).`);
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, content] of expected) {
    const file = resolve(OUT_DIR, name);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  // Le compte vient de la projection elle-même, pas d'une soustraction sur le
  // nombre de livres : un livre sans chapitre, ou un index, ferait mentir le
  // chiffre affiché (1190 fichiers ≠ 66 livres + 1 189 chapitres + 1 index).
  const chapters = [...expected.keys()].filter(
    (name) => name !== 'index.json' && name.endsWith('.json'),
  ).length;
  console.log(
    `[split-lsg] ${dataset.books.length} livres, ${chapters} chapitres, 1 index → ${expected.size} fichiers dans public/data/bible/lsg/`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
