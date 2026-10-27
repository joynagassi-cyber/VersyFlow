// Trace the psa 3:3 verse through the cleaner, step by step
import { readFileSync } from 'node:fs';

const c = readFileSync('data/bible/raw/fra/fraLSG_usfm/20-PSAFraLSG.usfm', 'utf8');
const lines = c.split(/\r?\n/);
const idx = lines.findIndex((l) => l.startsWith('\\v 3 '));
let raw = lines[idx].replace(/^\\v 3\s*/, '');
for (let i = idx + 1; i < lines.length && !lines[i].startsWith('\\v '); i++) {
  if (lines[i].startsWith('\\q1')) raw += ' ' + lines[i];
}
console.log('RAW:', JSON.stringify(raw));

const BS = '\\\\';
function step(label, t, re, repl) {
  const out = t.replace(re, repl);
  console.log(label, JSON.stringify(out));
  return out;
}

let t = raw;
t = step('w-strong: ', t, new RegExp(BS + 'w ([^|\\n]*)\\|strong="[^"]*"\\w\\*', 'g'), '$1');
t = step('q-pair:   ', t, new RegExp(BS + 'q([^\\n]*)' + BS + 'q\\*', 'g'), '');
t = step('q-resid:  ', t, new RegExp(BS + 'q', 'g'), '');
t = t.replace(new RegExp(BS + 'q[0-9]?\\s?', 'g'), ' ');
t = t.replace(/[ \t]+/g, ' ').trim();
console.log('FINAL:  ', JSON.stringify(t));
