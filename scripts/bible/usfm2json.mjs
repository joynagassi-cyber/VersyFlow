#!/usr/bin/env node
/**
 * VersyFlow Bible Corpus — USFM → JSON normalizer
 *
 * Converts an eBible.org USFM per-book directory into the VersyFlow
 * local-dataset JSON shape consumed by `LocalBibleRepository`.
 *
 * Normalization rules (spec §36 — no presentation artefacts may reach the
 * memorization engine):
 *   - word markers   \w word|strong="H1234" \w*   → keep `word`
 *   - Greek variant  \+w word|strong="G1234" \+w*  → keep `word`
 *   - cross-refs     \x L ... \x*                  → removed
 *   - footnotes      \f L ... \f*                  → removed
 *   - song titles    \qs ... \qs* / \s ... \s*     → removed
 *   - name division  \nd Name\nd* / \d X\nd*       → keep the word
 *   - italics        \+it ... \+it* / \it ... \it* → keep the text
 *   - pronunciation  \j ... \j*                   → keep inner text
 *   - section tags   \ms1 Title / \s1 Sub / \r / \ip / \ie      → removed
 *   - poetry lines   \q / \q1 / \q2                 → " "
 *   - \p / \c N / \v N                              → coordinates
 *   - \h book display name (French header)
 *
 * Multi-line verses: a \v line continues on following lines (poetry,
 * wrapped long verses) until the next structural tag.
 *
 * Usage:
 *   node scripts/bible/usfm2json.mjs --translation lsg \
 *        --source data/bible/raw/fra/fraLSG_usfm \
 *        --out data/bible/normalized/lsg.json \
 *        --fr-name "Louis Segond (1910)" --year 1910 --author "Louis Segond" \
 *        [--public-domain]
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2);
function opt(name, fallback = undefined) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
}
const hasFlag = (name) => argv.includes(`--${name}`);

const translationId = opt('translation');
const sourceDir = opt('source');
const outPath = opt('out');
const frName = opt('fr-name', translationId);
const year = opt('year') ? parseInt(opt('year'), 10) : undefined;
const author = opt('author');
const language = opt('language', 'fr');
const publicDomain = hasFlag('public-domain');
if (!translationId || !sourceDir || !outPath) {
  console.error('usage: usfm2json.mjs --translation <id> --source <dir> --out <file>');
  process.exit(1);
}

// ---------------------------------------------------------------- constants
// P = 2-char string (\) → RegExp source for ONE literal backslash in data.
// B = 1-char string (\) → used for String.startsWith() on data lines.
// CLS = [^|]* — greedy match up to the next pipe (verse text has no newlines).
// STRONGREF = |strong="[^"]*" — matches a Strong's reference payload.
//
// All regexes are built by concatenating P with plain-ASCII fragments.
// No string literal in this file contains a backslash character.
const B = String.fromCharCode(92);
const P = String.fromCharCode(92, 92);

// tag-introducing prefixes (String.startsWith on data lines)
const P_ID  = B + 'id';
const P_H   = B + 'h ';
const P_TOC = B + 'toc';
const P_MT  = B + 'mt';
const P_C   = B + 'c ';
const P_V   = B + 'v ';
const P_Q   = B + 'q';
const P_P   = B + 'p ';

// pattern fragments
const STAR      = String.fromCharCode(42);
const CLS       = String.fromCharCode(91) + String.fromCharCode(94) + '|' + String.fromCharCode(93) + STAR;  // [^|]*
const CLS_L     = CLS + String.fromCharCode(63);  // [^|]*? lazy
const OPEN      = String.fromCharCode(40);  // (
const CLOSE     = String.fromCharCode(41);  // )
const LB        = String.fromCharCode(91);  // [
const RB        = String.fromCharCode(93);  // ]
// STRONGREF: literal text  |strong="H1234"
// The | (124) needs no escaping; the quotes are plain chars.
const STRONGREF = String.fromCharCode(124) + 'strong=' + String.fromCharCode(34) + '[^' + String.fromCharCode(34) + ']*' + String.fromCharCode(34);

// Inline verse-text cleaner. ORDER MATTERS: pair closers before residue strippers.
const CLEANERS = [
  // 1. footnotes  (removed)
  [new RegExp(P + 'f ' + CLS_L + P + 'f' + P + STAR, 'g'), ''],
  // 2. cross-refs  (removed)
  [new RegExp(P + 'x ' + CLS_L + P + 'x' + P + STAR, 'g'), ''],
  // 3. Hebrew word marker with strongs  (keep word)
  [new RegExp(P + 'w ' + OPEN + CLS + CLOSE + STRONGREF + P + 'w' + P + STAR, 'g'), '$1'],
  // 4. Greek word marker with strongs  (keep word)
  [new RegExp(P + '+' + 'w ' + OPEN + CLS + CLOSE + STRONGREF + P + '+' + 'w' + P + STAR, 'g'), '$1'],
  // 5. word marker without strongs  (keep word)
  [new RegExp(P + 'w ' + OPEN + CLS + CLOSE + P + 'w' + P + STAR, 'g'), '$1'],
  // 6. +word marker without strongs  (keep word)
  [new RegExp(P + '+' + 'w ' + OPEN + CLS + CLOSE + P + '+' + 'w' + P + STAR, 'g'), '$1'],
  // 7. name division  (keep the name)
  [new RegExp(P + 'nd ' + OPEN + CLS + CLOSE + P + 'nd' + P + STAR, 'g'), '$1'],
  // 8. division marks  (replace with space)
  [new RegExp(P + 'd ' + OPEN + CLS_L + CLOSE + P + 'd' + P + STAR, 'g'), ' '],
  // 9. Greek italics  (keep text)
  [new RegExp(P + '+' + 'it' + OPEN + CLS + CLOSE + P + '+' + 'it' + P + STAR, 'g'), '$1'],
  // 10. general italics  (keep text)
  [new RegExp(P + 'it' + OPEN + CLS + CLOSE + P + 'it' + P + STAR, 'g'), '$1'],
  // 11. pronunciation  (keep inner text)
  [new RegExp(P + 'j' + OPEN + CLS + CLOSE + P + 'j' + P + STAR, 'g'), '$1'],
  // 12. song title pair  (removed)
  [new RegExp(P + 'q' + OPEN + CLS + CLOSE + P + 'q' + P + STAR, 'g'), ''],
  // 13. title pair  (removed)
  [new RegExp(P + 's' + OPEN + CLS + CLOSE + P + 's' + P + STAR, 'g'), ''],
  // 14. residual strong refs
  [new RegExp(STRONGREF, 'g'), ''],
  // 15. residual closing stars
  [new RegExp(P + LB + 'a-z' + RB + P + STAR, 'g'), ''],
  // 16. residual opening markers
  [new RegExp(P + LB + 'a-z+' + RB, 'g'), ''],
  // 17. control chars
  [new RegExp(LB + P + 'u0000-' + P + 'u001f' + P + 'u007f' + RB, 'g'), ''],
];

/** Strip USFM presentation markers from verse text, keeping only scripture. */
function cleanVerseText(raw) {
  let t = raw;
  for (const [re, repl] of CLEANERS) t = t.replace(re, repl);
  // poetry markers (\q / \q1 / \q2) → space
  t = t.replace(new RegExp(P + 'q[0-9]?' + P + 's?', 'g'), ' ');
  return t.replace(/[ \t]+/g, ' ').trim();
}

/** Returns true when the line starts a new structural element (end of verse). */
function isStructuralLine(line) {
  return line.startsWith(B) &&
    /^[a-z+]/.test(line.slice(1)) &&
    !line.startsWith(P_V) &&
    !line.startsWith(P_Q);
}

// ---------------------------------------------------------------- USFM parse
function parseUsfmDir(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.usfm')).sort();
  const books = [];
  const warnings = [];

  const OLD = new Set([
    'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA',
    '1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO',
    'ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO',
    'OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',
  ]);

  const RE_ID  = new RegExp('^' + P + 'id' + P + 's+' + OPEN + '(' + '[^' + ' \/]+' + CLOSE);
  const RE_H   = new RegExp('^' + P + 'h '  + P + 's*' + '(.*' + B + 'S)');
  const RE_TOC = new RegExp('^' + P + 'toc[123]?' + P + 's*' + '(.*' + B + 'S)');
  const RE_MT  = new RegExp('^' + P + 'mt1?' + P + 's*' + '(.*' + B + 'S)');
  const RE_C   = new RegExp('^' + P + 'c ' + '[0-9]+' + P + 's*');
  const RE_V   = new RegExp('^' + P + 'v ' + '[0-9]+' + P + 's*');
// ---------------------------------------------------------------- USFM parse
function parseUsfmDir(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.usfm')).sort();
  const books = [];
  const warnings = [];

  const OLD = new Set([
    'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA',
    '1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO',
    'ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO',
    'OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',
  ]);

  const OPEN  = String.fromCharCode(40);
  const CLOSE = String.fromCharCode(41);
  const RE_ID  = new RegExp('^' + P + 'id'  + B + 's+' + OPEN + '(' + B + 'S+)' + CLOSE);
  const RE_H   = new RegExp('^' + P + 'h '  + B + 's+' + '(.*' + B + 'S)');
  const RE_TOC = new RegExp('^' + P + 'toc[123]?' + B + 's+' + '(.*' + B + 'S)');
  const RE_MT  = new RegExp('^' + P + 'mt1?' + B + 's+' + '(.*' + B + 'S)');
  const RE_C   = new RegExp('^' + P + 'c ' + B + 's+' + OPEN + '(' + B + 'd+)' + CLOSE);
  const RE_V   = new RegExp('^' + P + 'v ' + B + 's+' + String.fromCharCode(40) + B + 'd+' + String.fromCharCode(41) + B + 's*' + String.fromCharCode(40) + B + '[' + B + 's' + B + 'S]*' + String.fromCharCode(41) + '$');

  for (const file of files) {
    const content = readFileSync(join(dir, file), 'utf8').replace(/^﻿/, '');
    const lines = content.split(/\r?\n/);

    let code = '';
    let frNameBook = '';
    let testament = 'old';
    let chapter = null;
    let verses = [];
    let currentBook = null;
    let verseBuf = null;

    function flushVerse() {
      if (verseBuf !== null) {
        const text = cleanVerseText(verseBuf.text);
        if (text.length === 0) {
          warnings.push(`${file} ${code} ${chapter}:${verseBuf.num} — EMPTY after cleaning`);
        }
        verses.push({ number: verseBuf.num, text });
        verseBuf = null;
      }
    }
    function flushChapter() {
      flushVerse();
      if (chapter !== null && currentBook) {
        currentBook.chapters.push({ number: chapter, verses });
      }
      verses = [];
    }
    function flushBook() {
      flushChapter();
      if (currentBook) books.push(currentBook);
      currentBook = null;
      chapter = null;
    }

    for (const line of lines) {
      let m;
      if ((m = line.match(RE_ID))) {
        flushBook();
        code = m[1].toUpperCase();
        testament = OLD.has(code) ? 'old' : 'new';
        currentBook = { code, testament, nameFr: '', chapters: [] };
        continue;
      }
      if ((m = line.match(RE_H))) {
        frNameBook = m[1].trim();
        if (currentBook && !currentBook.nameFr) currentBook.nameFr = frNameBook;
        continue;
      }
      if ((m = line.match(RE_TOC)) && !frNameBook) {
        frNameBook = m[1].trim();
        if (currentBook && !currentBook.nameFr) currentBook.nameFr = frNameBook;
        continue;
      }
      if ((m = line.match(RE_MT)) && !frNameBook) {
        frNameBook = m[1].trim();
        if (currentBook && !currentBook.nameFr) currentBook.nameFr = frNameBook;
        continue;
      }
      if ((m = line.match(RE_C))) {
        flushChapter();
        chapter = parseInt(m[1], 10);
        continue;
      }
      if ((m = line.match(RE_V))) {
        flushVerse();
        verseBuf = { num: parseInt(m[1], 10), text: m[2] };
        continue;
      }
      if (verseBuf !== null && !isStructuralLine(line)) {
        verseBuf.text += ' ' + line;
        continue;
      }
      flushVerse();
    }
    flushBook();
  }
  return { files, books, warnings };
}

// ---------------------------------------------------------------- build
const { files, books, warnings } = parseUsfmDir(sourceDir);
if (books.length !== 66) {
  console.error(`FATAL: expected 66 books, parsed ${books.length}`);
  process.exit(1);
}

// Canonical chapter-count cross-check
const canonChapters = {
  GEN: 50, EXO: 40, LEV: 27, NUM: 36, DEU: 34, JOS: 24, JDG: 21, RUT: 4,
  '1SA': 31, '2SA': 24, '1KI': 22, '2KI': 25, '1CH': 29, '2CH': 36,
  EZR: 10, NEH: 13, EST: 10, JOB: 42, PSA: 150, PRO: 31, ECC: 12, SNG: 8,
  ISA: 66, JER: 52, LAM: 5, EZK: 48, DAN: 12, HOS: 14, JOL: 3, AMO: 9,
  OBA: 1, JON: 4, MIC: 7, NAM: 3, HAB: 3, ZEP: 3, HAG: 2, ZEC: 14, MAL: 4,
  MAT: 28, MRK: 16, LUK: 24, JHN: 21, ACT: 28, ROM: 16, '1CO': 16,
  '2CO': 13, GAL: 6, EPH: 6, PHP: 4, COL: 4, '1TH': 5, '2TH': 3,
  '1TI': 6, '2TI': 4, TIT: 3, PHM: 1, HEB: 13, JAS: 5, '1PE': 5, '2PE': 3,
  '1JN': 5, '2JN': 1, '3JN': 1, JUD: 1, REV: 22,
};
let chapterIssues = 0;
for (const b of books) {
  const expected = canonChapters[b.code];
  if (expected === undefined) {
    console.warn(`warn: book code ${b.code} not in canonical map`);
    continue;
  }
  if (b.chapters.length !== expected) {
    chapterIssues++;
    console.warn(`warn: ${b.code} parsed ${b.chapters.length} chapters (expected ${expected})`);
  }
}

const verseCount = books.reduce(
  (s, b) => s + b.chapters.reduce((c, ch) => c + ch.verses.length, 0),
  0,
);

const FR_NAMES = {
  gen: 'Genèse', exo: 'Exode', lev: 'Lévitique', num: 'Nombres', deb: 'Deutéronome',
  jos: 'Josué', jug: 'Juges', rut: 'Ruth', '1sam': '1 Samuel', '2sam': '2 Samuel',
  '1roi': '1 Rois', '2roi': '2 Rois', '1chron': '1 Chroniques', '2chron': '2 Chroniques',
  esai: 'Esdras', neh: 'Néhémie', est: 'Esther', job: 'Job', psa: 'Psaumes',
  prov: 'Proverbes', eccl: 'Ecclésiaste', cant: 'Cantique des Cantiques',
  isa: 'Ésaïe', jer: 'Jérémie', lament: 'Lamentations', ezek: 'Ézéchiel',
  dan: 'Daniel', os: 'Osée', joel: 'Joël', amos: 'Amos', abdj: 'Abdias',
  jon: 'Jonas', mich: 'Michée', nah: 'Nahum', hab: 'Habacuc', sep: 'Sophonie',
  ag: 'Aggée', zach: 'Zacharie', mal: 'Malachie',
  mat: 'Matthieu', mar: 'Marc', luk: 'Luc', joh: 'Jean', act: 'Actes',
  rom: 'Romains', '1cor': '1 Corinthiens', '2cor': '2 Corinthiens',
  gal: 'Galates', eph: 'Éphésiens', phil: 'Philippiens', col: 'Colossiens',
  '1thes': '1 Thessaloniciens', '2thes': '2 Thessaloniciens',
  '1tim': '1 Timothée', '2tim': '2 Timothée', tit: 'Tite', philem: 'Philémon',
  heb: 'Hébreux', jac: 'Jacques', '1pet': '1 Pierre', '2pet': '2 Pierre',
  '1joh': '1 Jean', '2joh': '2 Jean', '3joh': '3 Jean', jud: 'Jude',
  rev: 'Apocalypse',
};

const CODE_TO_VFLOW = {
  GEN: 'gen', EXO: 'exo', LEV: 'lev', NUM: 'num', DEU: 'deb',
  JOS: 'jos', JDG: 'jug', RUT: 'rut', '1SA': '1sam', '2SA': '2sam',
  '1KI': '1roi', '2KI': '2roi', '1CH': '1chron', '2CH': '2chron',
  EZR: 'esai', NEH: 'neh', EST: 'est', JOB: 'job', PSA: 'psa',
  PRO: 'prov', ECC: 'eccl', SNG: 'cant', ISA: 'isa', JER: 'jer',
  LAM: 'lament', EZK: 'ezek', DAN: 'dan', HOS: 'os', JOL: 'joel',
  AMO: 'amos', OBA: 'abdj', JON: 'jon', MIC: 'mich', NAM: 'nah',
  HAB: 'hab', ZEP: 'sep', HAG: 'ag', ZEC: 'zach', MAL: 'mal',
  MAT: 'mat', MRK: 'mar', LUK: 'luk', JHN: 'joh', ACT: 'act',
  ROM: 'rom', '1CO': '1cor', '2CO': '2cor', GAL: 'gal',
  EPH: 'eph', PHP: 'phil', COL: 'col', '1TH': '1thes', '2TH': '2thes',
  '1TI': '1tim', '2TI': '2tim', TIT: 'tit', PHM: 'philem', HEB: 'heb',
  JAS: 'jac', '1PE': '1pet', '2PE': '2pet', '1JN': '1joh', '2JN': '2joh',
  '3JN': '3joh', JUD: 'jud', REV: 'rev',
};

const output = {
  id: translationId,
  name: frName,
  year,
  language,
  style: 'classique',
  publicDomain,
  author,
  books: books.map((b) => {
    const vflowId = CODE_TO_VFLOW[b.code] || b.code.toLowerCase();
    const frLabel = FR_NAMES[vflowId] || b.nameFr || b.code;
    return {
      id: vflowId,
      name: { fr: frLabel, en: b.nameFr || b.code },
      testament: b.testament,
      chapterCount: b.chapters.length,
      chapters: b.chapters.map((ch) => ({
        number: ch.number,
        verses: ch.verses,
      })),
    };
  }),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(output, null, 1), 'utf8');

console.log(`OK ${translationId}: ${books.length} books, ${verseCount} verses → ${outPath}`);
if (warnings.length) {
  console.log(`WARN ${warnings.length} verse(s) had empty text after cleaning:`);
  for (const w of warnings.slice(0, 25)) console.log('  ' + w);
}
if (chapterIssues) console.log(`WARN ${chapterIssues} book(s) with chapter count ≠ canonical map`);
console.log(`SOURCE ${sourceDir} (${files.length} usfm files)`);
