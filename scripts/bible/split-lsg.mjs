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
 * Usage :
 *   node scripts/bible/split-lsg.mjs            # (ré)écrit la projection
 *   node scripts/bible/split-lsg.mjs --check    # vérifie la fraîcheur
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE = resolve(root, 'data/bible/lsg.json');
const OUT_DIR = resolve(root, 'public/data/bible/lsg');
const CHECK = process.argv.includes('--check');

const json = (value) => `${JSON.stringify(value, null, 0)}\n`;

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
