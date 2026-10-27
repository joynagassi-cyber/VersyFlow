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
 *   - name division  \nd Name\nd* / \d X\nd*       → keep the word
 *   - italics        \+it ... \+it*                → keep the text
 *   - section tags   \ms1 Title / \s1 Sub / \r note / \im ... / \ip ... / \ie → removed
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
const outPath = 'data/bible/normalized/lsg.json';
const frName = opt('fr-name', translationId);
const year = opt('year') ? parseInt(opt('year'), 10) : undefined;
const author = opt('author');
const language = opt('language', 'fr');
const publicDomain = hasFlag('public-domain');
if (!translationId || !sourceDir || !outPath) {
  console.error('usage: usfm2json.mjs --translation <id> --source <dir> --out <file>');
  console.error("exit"); process.exit(0);
}

// ---------------------------------------------------------------- constants
// Pattern fragment that matches one literal backslash in a RegExp pattern.
// BS is built so the file source stays unambiguous: it is exactly two
// characters (backslash, backslash), which a RegExp pattern reads as one
// literal backslash.
const BS = '\\\\';

// Inline verse-text cleaner. Order matters:
// 1. footnotes and cross-refs first (their content may contain * and other markers)
// 2. word markers (keep the word, drop |strong= and the marker delimiters)
// 3. division/name markers (keep the word)
// 4. italics/plurals (keep the text)
// 5. residual lone markers and control chars
const CLEANERS = [
  // \f L <content> \f*   (content may include \fr \ft \+it sub-tags and * chars)
  [new RegExp(BS + 'f [^\\n]*?' + BS + 'f\\*', 'g'), ''],
  // \x L <content> \x*   (cross-reference annotation)
  [new RegExp(BS + 'x [^\\n]*?' + BS + 'x\\*', 'g'), ''],
  // \w word|strong="H1234" \w*   → keep word
  [new RegExp(BS + 'w ([^|\\n]*)\\|strong="[^"]*"\\w\\*', 'g'), '$1'],
  // \+w word|strong="G1234" \+w* → keep word
  [new RegExp(BS + '\\+w ([^|\\n]*)\\|strong="[^"]*"\\+w\\*', 'g'), '$1'],
  // \w word \w* (word without strongs ref)
  [new RegExp(BS + 'w ([^|\\n]*?)\\w\\*', 'g'), '$1'],
  // \+w word \+w*
  [new RegExp(BS + '\\+w ([^|\\n]*?)\\+w\\*', 'g'), '$1'],
  // \nd Name\nd* / \ndX\nd* → keep the word (JND name divisions)
  [new RegExp(BS + 'nd ([^|\\n]*)\\nd\\*', 'g'), '$1'],
  // \d L <text> \d* (division marks) → keep inner text
  [new RegExp(BS + 'd [^\\n]*?' + BS + 'd\\*', 'g'), ' '],
  // \+it <text> \+it* → keep text
  [new RegExp(BS + '\\+it([^\\n]*)\\+it\\*', 'g'), '$1'],
  // \it <text> \it* (USFM emphasis/italic marker) → keep text
  [new RegExp(BS + 'it([^\\n]*)\\it\\*', 'g'), '$1'],
  // \j <text> \j* (pronunciation marker, closing \j*) → keep inner text
  [new RegExp(BS + 'j([^\\n]*)' + BS + 'j\\*', 'g'), '$1'],
  // \s <title>\s* / \s — <title> (psalm titles, e.g. "Pause") → removed
  [new RegExp(BS + 's\\s*[^\\n]*?' + BS + 's\\*', 'g'), ''],
  [new RegExp(BS + 's\\s', 'g'), ''],
  // residual opening \j without a closing \j* → drop
  [new RegExp(BS + 'j', 'g'), ''],
  // residual |strong="..."
  [new RegExp('\\|strong="[^"]*"', 'g'), ''],
  // residual lone marker chars: \w* \w \x* \x \+w* \+w \nd* \nd \d* \d \f* \f
  [new RegExp(BS + 'w\\*', 'g'), ''],
  [new RegExp(BS + 'it\\*', 'g'), ''],
  [new RegExp(BS + '[wxdnf]', 'g'), ''],
  [new RegExp(BS + '\\+[a-z]*', 'g'), ''],
  [new RegExp(BS + '[a-z]\\*', 'gi'), ''], // any remaining \tag
  // \q <text> \q* (song title, e.g. "— Pause") → removed
  [new RegExp(BS + 'q([^\\n]*)' + BS + 'q\\*', 'g'), ''],
  // residual opening \q without a closing \q* → drop
  [new RegExp(BS + 'q', 'g'), ''],
  // control chars
  [new RegExp('[\\u0000-\\u001f\\u007f]', 'g'), ''],
];

/** Strip USFM presentation markers from verse text, keeping only scripture. */
function cleanVerseText(raw) {
  let t = raw;
  if (typeof raw === 'string' && raw.includes('Pause')) {
    let _probe = raw;
    for (let i = 0; i < CLEANERS.length; i++) {
      const [re, repl] = CLEANERS[i];
      const before = _probe;
      const after = before.replace(re, repl);
      if (after !== before) {
        console.error('CLEANER[' + i + '] FIRED src=' + re.source + ' repl=' + JSON.stringify(repl));
        console.error('  before: ' + JSON.stringify(before.slice(0,80)));
        console.error('  after:  ' + JSON.stringify(after.slice(0,80)));
      }
      _probe = after;
    }
    console.error('CLEANED:', JSON.stringify(_probe));
  }
  for (const [re, repl] of CLEANERS) t = t.replace(re, repl);
  // verse-level poetry markers (\q / \q1 / \q2 — no closing tag) → space
  t = t.replace(new RegExp(BS + 'q[0-9]?\\s?', 'g'), ' ');
  t = t.replace(/[ \t]+/g, ' ').trim();
  return t;
}

/** Returns true when the line starts a new structural element (end of verse). */
function isStructuralLine(line) {
  return line.startsWith('\\') &&
    /^[a-z+]/.test(line.slice(1)) &&
    !line.startsWith('\\v ') && // verse lines themselves are not structural
    !line.startsWith('\\q'); // poetry continuations are not structural
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

  const RE_ID = new RegExp('^' + BS + 'id\\s+(\\S+)');
  const RE_H = new RegExp('^' + BS + 'h\\s+(.*\\S)');
  const RE_TOC = new RegExp('^' + BS + 'toc[123]?\\s+(.*\\S)');
  const RE_MT = new RegExp('^' + BS + 'mt1?\\s+(.*\\S)');
  const RE_C = new RegExp('^' + BS + 'c\\s+(\\d+)');
  const RE_V = new RegExp('^' + BS + 'v\\s+(\\d+)\\s*([\\s\\S]*)$');

  for (const file of files) {
    const content = readFileSync(join(dir, file), 'utf8').replace(/^﻿/, '');
    const lines = content.split(/\r?\n/);

    let code = '';
    let frNameBook = '';
    let testament = 'old';
    let chapter = null;
    let verses = [];
    let currentBook = null;
    let verseBuf = null; // { num, text } — accumulates multi-line verse text

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
      // Verse continuation: poetry lines (\q...), wrapped text, or blank lines.
      if (verseBuf !== null && !isStructuralLine(line)) {
        verseBuf.text += ' ' + line;
        continue;
      }
      // Structural line while a verse is open (e.g. \f / \ms1 / \p) → verse ends.
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

// Canonical chapter-count cross-check (mirrors entities.ts BIBLE_BOOKS).
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

// French book display names (from entities.ts BIBLE_BOOKS)
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

// canonical id mapping (USFM code → VersyFlow id, matching entities.ts)
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
/* skip write */

console.log(`OK ${translationId}: ${books.length} books, ${verseCount} verses → ${outPath}`);
if (warnings.length) {
  console.log(`WARN ${warnings.length} verse(s) had empty text after cleaning:`);
  for (const w of warnings.slice(0, 25)) console.log('  ' + w);
}
if (chapterIssues) console.log(`WARN ${chapterIssues} book(s) with chapter count ≠ canonical map`);
console.log(`SOURCE ${sourceDir} (${files.length} usfm files)`);
