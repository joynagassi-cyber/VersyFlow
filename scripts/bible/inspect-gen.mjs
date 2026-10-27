// Inspect raw GEN 27:28 in the USFM source
import { readFileSync } from 'node:fs';
const content = readFileSync('data/bible/raw/fra/fraLSG_usfm/02-GENfraLSG.usfm', 'utf8');
const lines = content.split(/\r?\n/);
let inC27 = false;
for (const l of lines) {
  if (l.startsWith('\\c 27')) inC27 = true;
  if (l.startsWith('\\c 28')) break;
  if (inC27 && l.startsWith('\\v 28')) {
    console.log('RAW:', JSON.stringify(l));
    break;
  }
}
// Also check what c27 looks like in total
let c27count = 0;
for (const l of lines) {
  if (l.startsWith('\\c 27')) c27count++;
}
console.log('c 27 line count:', c27count);
// Show first 5 lines starting with backslash c near line 400
lines.slice(390, 410).forEach((l, i) => console.log(390 + i, JSON.stringify(l).slice(0, 80)));
