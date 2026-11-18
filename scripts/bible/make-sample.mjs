#!/usr/bin/env node
/**
 * scripts/bible/make-sample.mjs — fabrique `data/bible/lsg.sample.json`.
 *
 * Pourquoi : `data/bible/lsg.json` pèse 6,9 Mo et 31 170 versets. C'est la
 * bonne source pour l'application, une mauvaise matière pour **fixer un bug** :
 * un test qui charge 7 Mo est lent, et un test qui dépend du fichier complet
 * casse dès qu'il est absent du poste (données non versionnées ailleurs).
 *
 * Le fichier produit garde **exactement le schéma** du vrai jeu de données
 * (`id`, `language`, `name`, `year`, `books[].chapters[].verses[]`) et le texte
 * réel de la LSG 1910 — pas de verset inventé, pas de « lorem ipsum ». Seule la
 * couverture change : les 66 livres sont présents (structure du canon), mais
 * seuls les passages utiles portent des chapitres.
 *
 * Usage :
 *   node scripts/bible/make-sample.mjs            # régénère le fichier
 *   node scripts/bible/make-sample.mjs --check    # échoue si le fichier a dérivé
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE = resolve(root, 'data/bible/lsg.json');
const TARGET = resolve(root, 'data/bible/lsg.sample.json');
const CHECK = process.argv.includes('--check');

/**
 * Passages gardés dans l'échantillon. Ils correspondent aux passages proposés
 * par l'écran « Mémoriser un verset » (`src/domains/bible/starter-passages.ts`)
 * et aux fixtures des tests de mémorisation.
 */
const KEEP = [
  ['gen', 1],
  ['psa', 23],
  ['psa', 91],
  ['prov', 3],
  ['isa', 41],
  ['mat', 11],
  ['joh', 3],
  ['rom', 8],
  ['gal', 5],
  ['phil', 4],
  ['jos', 1],
];

if (!existsSync(SOURCE)) {
  console.error(`[make-sample] source absente : ${SOURCE}`);
  console.error('  → restaurer `data/bible/lsg.json` (voir docs/bible/SOURCES-TRADUCTIONS.md).');
  process.exit(1);
}

const full = JSON.parse(readFileSync(SOURCE, 'utf8'));
const wanted = new Map();
for (const [bookId, chapter] of KEEP) {
  if (!wanted.has(bookId)) wanted.set(bookId, new Set());
  wanted.get(bookId).add(chapter);
}

const missing = [];
const books = full.books.map((book) => {
  const chapters = wanted.get(book.id);
  const kept = chapters
    ? book.chapters.filter((c) => chapters.has(c.number))
    : [];
  if (chapters) {
    for (const n of chapters) {
      if (!kept.some((c) => c.number === n)) missing.push(`${book.id} ${n}`);
    }
  }
  return { ...book, chapters: kept };
});

if (missing.length) {
  console.error(`[make-sample] chapitres introuvables : ${missing.join(', ')}`);
  process.exit(1);
}

const sample = {
  id: full.id,
  language: full.language,
  name: `${full.name} — échantillon de test`,
  year: full.year,
  sample: true,
  note: 'Passages réels de la LSG 1910, extraits par scripts/bible/make-sample.mjs. Destiné aux tests et au mode démo, pas à la lecture complète.',
  books,
};

const json = `${JSON.stringify(sample, null, 0)}\n`;

if (CHECK) {
  const current = existsSync(TARGET) ? readFileSync(TARGET, 'utf8') : '';
  if (current !== json) {
    console.error('[make-sample] lsg.sample.json a dérivé — relancer sans --check.');
    process.exit(1);
  }
  console.log('[make-sample] échantillon à jour.');
  process.exit(0);
}

writeFileSync(TARGET, json);
const verses = books.reduce(
  (sum, b) => sum + b.chapters.reduce((s, c) => s + c.verses.length, 0),
  0,
);
console.log(
  `[make-sample] ${TARGET} · ${books.length} livres · ${verses} versets · ${(json.length / 1024).toFixed(1)} Ko`,
);
