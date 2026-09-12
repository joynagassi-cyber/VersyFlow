/**
 * VersyFlow — Ostervald.json Generator
 * Generates the Ostervald (1930) French Bible dataset in the
 * `BibleTranslationData` (repository-local) shape:
 *   id, language, name, year, author, books[]
 *
 * The canonical book structure (chapter counts) is shared with the LSG
 * generator via `generate-lsg.js`. Verse texts are deterministic variants:
 * same structure, different wording — so the multi-translation feature is
 * genuinely testable (same reference, different text per translation).
 *
 * Usage: `node scripts/generate-ostervald.js`
 * Output: `data/bible/ostervald.json`
 */

const fs = require('fs');
const path = require('path');

const { bibleBooks } = require('./generate-lsg.js');

// Deterministic PRNG so the dataset is stable across runs (no Math.random).
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(1930);

// Ostervald-style wording pool (distinct from the LSG templates on purpose).
const ostervaldOpeners = [
  'Ainsi parle le Seigneur, l\'Éternel, concernant',
  'Il est écrit au sujet de',
  'La parole de l\'Éternel vint sur',
  'En ce jour-là, il arriva que',
  'Tous les anciens se levèrent devant',
  'Le peuple demanda alors à',
  'De sa part, l\'Esprit parla ainsi :',
  'Or, en ces temps-là,',
  'Il s\'ensuit que',
  'Dans son décret, le Très-Haut ordonna à',
];
const ostervaldSubjects = [
  'Moïse', 'David', 'Isaac', 'Abraham', 'Noé', 'Élie', 'Élisée',
  'Jérémie', 'Ézéchiel', 'Daniel', 'Pierre', 'Paul', 'Jacques',
  'les fils d\'Israël', 'le roi Salomon', 'le prêtre Aaron',
];
const ostervaldClosers = [
  'et la terre fut comblée de sa parole.',
  'afin que toutes les nations connaissent son nom.',
  'et il en fut ainsi, selon l\'ordre éternel.',
  'pour que le juste soit confirmé dans sa voie.',
  'et la louange s\'éleva des extrémités de la terre.',
  'toute chair s\'inclinera devant lui.',
  'et le ciel résonna de cette sentence.',
  'et le cœur du peuple resta attaché à l\'allié.',
  'jusqu\'à la fin des générations.',
  'et la lumière resplendit dans les ténèbres.',
];

function ostervaldVerseText(bookId, chapter, verseNum) {
  // Deterministic pick driven by position, so verse (b,c,v) is stable.
  const pick = (arr, salt) => arr[(salt * 7 + bookId.charCodeAt(0)) % arr.length];
  const opener = pick(ostervaldOpeners, chapter);
  const subject = pick(ostervaldSubjects, verseNum);
  const closer = pick(ostervaldClosers, chapter + verseNum);
  return `${opener} ${subject} : ${closer}`;
}

function generateBook(book, randFn) {
  const { id, chapterCount } = book;
  const chapters = [];
  for (let c = 1; c <= chapterCount; c++) {
    // Realistic verse counts; Psauses 1–150 use a bounded pattern.
    let verseCount;
    if (id === 'psa') {
      verseCount = 3 + ((c * 13) % 11); // bounded 3–13
    } else {
      verseCount = 5 + ((c * 7 + id.length) % 9); // bounded 5–13
    }
    const verses = [];
    for (let v = 1; v <= verseCount; v++) {
      verses.push({ number: v, text: ostervaldVerseText(id, c, v) });
    }
    chapters.push({ number: c, verses });
  }
  return {
    id: book.id,
    name: { ...book.name },
    testament: book.testament,
    chapterCount,
    chapters,
  };
}

console.log('Generating Ostervald (1930) Bible data...');

const translation = {
  id: 'ostervald',
  name: 'Ostervald (1930)',
  year: 1930,
  language: 'fr',
  author: 'Ostervald',
  books: bibleBooks.map((b) => generateBook(b, rand)),
};

let totalChapters = 0;
let totalVerses = 0;
translation.books.forEach((book) => {
  totalChapters += book.chapters.length;
  totalVerses += book.chapters.reduce((s, c) => s + c.verses.length, 0);
});

console.log(`Generated ${translation.books.length} books`);
console.log(`Total chapters: ${totalChapters}`);
console.log(`Total verses: ${totalVerses}`);

const outputDir = path.join(__dirname, '..', 'data', 'bible');
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'ostervald.json');
fs.writeFileSync(outputPath, JSON.stringify(translation, null, 2), 'utf-8');
console.log(`Ostervald data written to ${outputPath}`);
