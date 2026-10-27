// Diagnostic: verify each CLEANER fires and RE_* patterns match real USFM data
import { readFileSync } from 'node:fs';

const src = readFileSync('scripts/bible/usfm2json.mjs', 'utf8');

// Evaluate just the constants block to get CLEANERS
const bStart = src.indexOf('const B = String');
const cStart = src.indexOf('const CLEANERS = [');
const cEnd = src.indexOf('];', cStart);
const block = src.slice(bStart, cEnd + 2);
const { CLEANERS } = new Function(block + '\nreturn { CLEANERS };')();
console.log('CLEANERS count:', CLEANERS.length);

// --- Test 1: Hebrew word marker with strongs ---
const hebrew = String.fromCharCode(92) + 'w word|strong="H1234" ' + String.fromCharCode(92) + 'w*';
console.log('Hebrew raw:', JSON.stringify(hebrew));
let t = hebrew;
for (const [re, repl] of CLEANERS) t = t.replace(re, repl);
console.log('Hebrew final:', JSON.stringify(t));
if (t.trim() !== 'word') console.log('  ⚠ expected "word"');

// --- Test 2: Greek word marker with strongs ---
const greek = String.fromCharCode(92) + '+w word|strong="G1234" ' + String.fromCharCode(92) + '+w*';
console.log('Greek raw:', JSON.stringify(greek));
t = greek;
for (const [re, repl] of CLEANERS) t = t.replace(re, repl);
console.log('Greek final:', JSON.stringify(t));
if (t.trim() !== 'word') console.log('  ⚠ expected "word"');

// --- Test 3: real MAT 5:3 line ---
const matSrc = readFileSync('data/bible/raw/fra/fraLSG_usfm/70-MATfraLSG.usfm', 'utf8');
const matLines = matSrc.split(/\r?\n/);
const heureuxLine = matLines.find(l => l.includes('Heureux'));
if (heureuxLine) {
  const raw = heureuxLine.replace(/^\\v 3\s*/, '');
  console.log('MAT 5:3 raw:', JSON.stringify(raw.slice(0, 120)));
  t = raw;
  for (const [re, repl] of CLEANERS) t = t.replace(re, repl);
  t = t.replace(new RegExp(String.fromCharCode(92, 92) + 'q[0-9]?' + String.fromCharCode(92) + 's?', 'g'), ' ');
  t = t.replace(/[ \t]+/g, ' ').trim();
  console.log('MAT 5:3 final:', JSON.stringify(t.slice(0, 80)));
  if (t.includes('*')) console.log('  ⚠ still has * !');
}

// --- Test 4: RE_* patterns against real data ---
// Check that RE_ID matches \id lines
const C = String.fromCharCode(92);  // one backslash char (B in the file)
const P = String.fromCharCode(92, 92);
const OPEN = String.fromCharCode(40);
const CLOSE = String.fromCharCode(41);

const RE_ID = new RegExp('^' + P + 'id' + C + 's+' + OPEN + '(' + C + 'S+)' + CLOSE);
const testId = C + 'id 70-MATfraLSG';
console.log('RE_ID test:', JSON.stringify(testId));
const m = testId.match(RE_ID);
console.log('  match:', m ? m[1] : 'NULL');

// --- Test 5: RE_V against real verse line ---
const RE_V = new RegExp('^' + P + 'v ' + C + 's+' + OPEN + '(' + C + 'd+)' + CLOSE + C + 's*' + OPEN + '(' + C + '[' + C + 's' + C + 'S]*' + C + ']*)$');
const testV = C + 'v 3  Heureux ' + String.fromCharCode(92) + 'w les* ';
console.log('RE_V test:', JSON.stringify(testV));
const mv = testV.match(RE_V);
console.log('  match:', mv ? { verse: mv[1], rest: mv[2].slice(0, 30) } : 'NULL');
