// Test all cleaner patterns against the real MAT 5:3 raw line
import { readFileSync } from 'node:fs';
const src = readFileSync('scripts/bible/usfm2json.mjs', 'utf8');

// Pull the constants block (B, P, p()) + CLEANERS declaration and evaluate together
const bStart = src.indexOf('const B = String');
const cStart = src.indexOf('const CLEANERS = [');
const cEnd = src.indexOf('];', cStart);
const block = src.slice(bStart, cEnd + 2);
const factory = new Function(block + '\nreturn { CLEANERS };');
const { CLEANERS } = factory();

const s = readFileSync('data/bible/raw/fra/fraLSG_usfm/70-MATfraLSG.usfm', 'utf8');
const lines = s.split(/\r?\n/);
const idx = lines.findIndex(l => l.includes('Heureux'));
const raw = lines[idx].replace(/^\\v 3\s*/, '');
console.log('RAW:', JSON.stringify(raw.slice(0, 100)));

for (let i = 0; i < CLEANERS.length; i++) {
  const [re, repl] = CLEANERS[i];
  const out = raw.replace(re, repl);
  if (out !== raw) {
    console.log(`CLEANER[${i}] FIRED src=${JSON.stringify(re.source)}`);
  }
}
let t = raw;
for (const [re, repl] of CLEANERS) t = t.replace(re, repl);
console.log('FINAL:', JSON.stringify(t));
