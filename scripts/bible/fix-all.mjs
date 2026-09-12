// DEFINITIVE FIX — regenerates the entire regex block of usfm2json.mjs
// using only charCode-based string building. Zero source backslashes.
//
// Design:
//   P   = 2-char string (\\)  → RegExp source that matches ONE literal backslash in data
//   STAR = *
//   D  = [0-9]  (plain chars, no escape needed)
//   W  = \\s source = P + 's'  (matches whitespace in data — but data has no newlines
//        because the parser splits lines first, so \\s = space/tab only here)
//
// All CLEANER patterns follow the rule:
//   pair closer = P + tag + P + STAR   (matches  \tag*  in data)
//   pair opener = P + tag + ' '       (matches  \tag  in data)
//   capture group = OPEN + CLS + CLOSE  where CLS = [^|]*  (stops at pipe)
//
// For patterns WITHOUT strongs, the content between opener and closer can be
// plain text (no pipe), so CLS works fine.
// For patterns WITH strongs: content = word|strong="H1234"
//   → use two-part match: OPEN + WORD + CLOSE + STRONGREF + P + STAR
//   where WORD = [^|]*  (greedy up to pipe) and STRONGREF = |strong="[^"]*"
//   The replacement keeps $1 (the word).
import { readFileSync, writeFileSync } from 'node:fs';

const p = 'scripts/bible/usfm2json.mjs';
let src = readFileSync(p, 'utf8');

// ---- Locate block boundaries ----
const startMarker = '// ---------------------------------------------------------------- constants';
const endMarker = '// ---------------------------------------------------------------- USFM parse';
const start = src.indexOf(startMarker);
const end = src.indexOf(endMarker);
if (start === -1 || end === -1) {
  console.error('boundary markers not found:', start, end);
  process.exit(1);
}

// ---- Build the replacement block as a plain string ----
// All backslashes in the OUTPUT file are produced by String.fromCharCode calls,
// never written as literal \ characters in this source.

const B = String.fromCharCode(92);   // used only in comments/strings below
const L = []; // lines of the output block

L.push(startMarker);
L.push('// P = 2-char string (\\) → RegExp source for ONE literal backslash in data.');
L.push('// B = 1-char string (\\) → used for String.startsWith() on data lines.');
L.push('// CLS = [^|]* — greedy match up to the next pipe (verse text has no newlines).');
L.push('// STRONGREF = |strong="[^"]*" — matches a Strong\'s reference payload.');
L.push('//');
L.push('// All regexes are built by concatenating P with plain-ASCII fragments.');
L.push('// No string literal in this file contains a backslash character.');
L.push('const B = String.fromCharCode(92);');
L.push('const P = String.fromCharCode(92, 92);');
L.push('');
L.push('// tag-introducing prefixes (String.startsWith on data lines)');
L.push("const P_ID  = B + 'id';");
L.push("const P_H   = B + 'h ';");
L.push("const P_TOC = B + 'toc';");
L.push("const P_MT  = B + 'mt';");
L.push("const P_C   = B + 'c ';");
L.push("const P_V   = B + 'v ';");
L.push("const P_Q   = B + 'q';");
L.push("const P_P   = B + 'p ';");
L.push('');
L.push('// pattern fragments');
L.push("const STAR      = String.fromCharCode(42);");
L.push("const CLS       = String.fromCharCode(91) + String.fromCharCode(94) + '|' + String.fromCharCode(93) + STAR;  // [^|]*");
L.push("const CLS_L     = CLS + String.fromCharCode(63);  // [^|]*? lazy");
L.push("const OPEN      = String.fromCharCode(40);  // (");
L.push("const CLOSE     = String.fromCharCode(41);  // )");
L.push("const LB        = String.fromCharCode(91);  // [");
L.push("const RB        = String.fromCharCode(93);  // ]");
L.push("// STRONGREF: literal text  |strong=\"H1234\"");
L.push("// The | (124) needs no escaping; the quotes are plain chars.");
L.push("const STRONGREF = String.fromCharCode(124) + 'strong=' + String.fromCharCode(34) + '[^' + String.fromCharCode(34) + ']*' + String.fromCharCode(34);");
L.push('');
L.push('// Inline verse-text cleaner. ORDER MATTERS: pair closers before residue strippers.');
L.push('const CLEANERS = [');

// Helper: build a cleaner entry line
// pairCloser = P + tag + P + STAR  (matches \tag* in data)
// pairOpener = P + tag + ' '      (matches \tag  in data)

// 1. footnotes \f L ... \f* → removed
L.push('  // 1. footnotes  (removed)');
L.push("  [new RegExp(P + 'f ' + CLS_L + P + 'f' + P + STAR, 'g'), ''],");
// 2. cross-refs \x L ... \x* → removed
L.push('  // 2. cross-refs  (removed)');
L.push("  [new RegExp(P + 'x ' + CLS_L + P + 'x' + P + STAR, 'g'), ''],");
// 3. Hebrew word marker with strongs \w word|strong="H1234" \w* → keep word
L.push('  // 3. Hebrew word marker with strongs  (keep word)');
L.push("  [new RegExp(P + 'w ' + OPEN + CLS + CLOSE + STRONGREF + P + 'w' + P + STAR, 'g'), '$1'],");
// 4. Greek word marker with strongs \+w word|strong="G1234" \+w* → keep word
L.push('  // 4. Greek word marker with strongs  (keep word)');
L.push("  [new RegExp(P + '+' + 'w ' + OPEN + CLS + CLOSE + STRONGREF + P + '+' + 'w' + P + STAR, 'g'), '$1'],");
// 5. word marker without strongs \w word \w* → keep word
L.push('  // 5. word marker without strongs  (keep word)');
L.push("  [new RegExp(P + 'w ' + OPEN + CLS + CLOSE + P + 'w' + P + STAR, 'g'), '$1'],");
// 6. +word marker without strongs \+w word \+w* → keep word
L.push('  // 6. +word marker without strongs  (keep word)');
L.push("  [new RegExp(P + '+' + 'w ' + OPEN + CLS + CLOSE + P + '+' + 'w' + P + STAR, 'g'), '$1'],");
// 7. name division \nd Name\nd* → keep the name
L.push('  // 7. name division  (keep the name)');
L.push("  [new RegExp(P + 'nd ' + OPEN + CLS + CLOSE + P + 'nd' + P + STAR, 'g'), '$1'],");
// 8. division marks \d L <text> \d* → space
L.push('  // 8. division marks  (replace with space)');
L.push("  [new RegExp(P + 'd ' + OPEN + CLS_L + CLOSE + P + 'd' + P + STAR, 'g'), ' '],");
// 9. Greek italics \+it <text> \+it* → keep text
L.push('  // 9. Greek italics  (keep text)');
L.push("  [new RegExp(P + '+' + 'it' + OPEN + CLS + CLOSE + P + '+' + 'it' + P + STAR, 'g'), '$1'],");
// 10. general italics \it <text> \it* → keep text
L.push('  // 10. general italics  (keep text)');
L.push("  [new RegExp(P + 'it' + OPEN + CLS + CLOSE + P + 'it' + P + STAR, 'g'), '$1'],");
// 11. pronunciation \j <text> \j* → keep inner text
L.push('  // 11. pronunciation  (keep inner text)');
L.push("  [new RegExp(P + 'j' + OPEN + CLS + CLOSE + P + 'j' + P + STAR, 'g'), '$1'],");
// 12. song title pair \qs <title> \qs* → removed
L.push('  // 12. song title pair  (removed)');
L.push("  [new RegExp(P + 'q' + OPEN + CLS + CLOSE + P + 'q' + P + STAR, 'g'), ''],");
// 13. title pair \s <title> \s* → removed
L.push('  // 13. title pair  (removed)');
L.push("  [new RegExp(P + 's' + OPEN + CLS + CLOSE + P + 's' + P + STAR, 'g'), ''],");
// 14. residual strong refs
L.push('  // 14. residual strong refs');
L.push("  [new RegExp(STRONGREF, 'g'), ''],");
// 15. residual closing stars: any backslash-letter-star
L.push('  // 15. residual closing stars');
L.push("  [new RegExp(P + LB + 'a-z' + RB + P + STAR, 'g'), ''],");
// 16. residual opening markers: any backslash-letter
L.push('  // 16. residual opening markers');
L.push("  [new RegExp(P + LB + 'a-z+' + RB, 'g'), ''],");
// 17. control chars
L.push('  // 17. control chars');
L.push("  [new RegExp(LB + P + 'u0000-' + P + 'u001f' + P + 'u007f' + RB, 'g'), ''],");
L.push('];');
L.push('');
L.push('/** Strip USFM presentation markers from verse text, keeping only scripture. */');
L.push('function cleanVerseText(raw) {');
L.push('  let t = raw;');
L.push('  for (const [re, repl] of CLEANERS) t = t.replace(re, repl);');
L.push("  // poetry markers (\\q / \\q1 / \\q2) → space");
L.push("  t = t.replace(new RegExp(P + 'q[0-9]?' + P + 's?', 'g'), ' ');");
L.push("  return t.replace(/[ \\t]+/g, ' ').trim();");
L.push('}');
L.push('');
L.push('/** Returns true when the line starts a new structural element (end of verse). */');
L.push('function isStructuralLine(line) {');
L.push('  return line.startsWith(B) &&');
L.push('    /^[a-z+]/.test(line.slice(1)) &&');
L.push('    !line.startsWith(P_V) &&');
L.push('    !line.startsWith(P_Q);');
L.push('}');
L.push('');

// ---- Now build the RE_* block using the same P-based approach ----
L.push('// ---------------------------------------------------------------- USFM parse');
L.push('function parseUsfmDir(dir) {');
L.push("  const files = readdirSync(dir).filter((f) => f.endsWith('.usfm')).sort();");
L.push('  const books = [];');
L.push('  const warnings = [];');
L.push('');
L.push('  const OLD = new Set([');
L.push("    'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA',");
L.push("    '1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO',");
L.push("    'ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO',");
L.push("    'OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',");
L.push('  ]);');
L.push('');
// RE_* patterns: use P for backslash-matching, [0-9] for digits, ( ) for groups
L.push("  const RE_ID  = new RegExp('^' + P + 'id' + P + 's+' + OPEN + '(' + '[^' + ' \\/]+' + CLOSE);");
L.push("  const RE_H   = new RegExp('^' + P + 'h '  + P + 's*' + '(.*' + B + 'S)');");
L.push("  const RE_TOC = new RegExp('^' + P + 'toc[123]?' + P + 's*' + '(.*' + B + 'S)');");
L.push("  const RE_MT  = new RegExp('^' + P + 'mt1?' + P + 's*' + '(.*' + B + 'S)');");
L.push("  const RE_C   = new RegExp('^' + P + 'c ' + '[0-9]+' + P + 's*');");
L.push("  const RE_V   = new RegExp('^' + P + 'v ' + '[0-9]+' + P + 's*');");

writeFileSync(p, src.slice(0, start) + L.join('\n') + '\n' + src.slice(end), 'utf8');
console.log('OK — replaced block. New size:', src.length);

// --- Verify: compile all CLEANER regexes ---
const block = L.join('\n');
const CLEANERS_TEST = new Function(
  block + '\nreturn CLEANERS;'
)();
console.log('CLEANERS count:', CLEANERS_TEST.length);
for (let i = 0; i < CLEANERS_TEST.length; i++) {
  const [re] = CLEANERS_TEST[i];
  if (!re) { console.error('CLEANER[' + i + '] is null'); process.exit(1); }
}
console.log('All CLEANER regexes compiled OK.');
