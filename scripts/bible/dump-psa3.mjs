import { readFileSync } from 'node:fs';
const c = readFileSync('data/bible/raw/fra/fraLSG_usfm/20-PSAFraLSG.usfm','utf8');
const lines = c.split(/\r?\n/);
const idx = lines.findIndex(l => l.startsWith('\\v 3 '));
let raw = lines[idx].replace(/^\\v 3\s*/, '');
for (let i = idx+1; i < lines.length && !lines[i].startsWith('\\v '); i++) {
  if (lines[i].startsWith('\\q1')) raw += ' ' + lines[i];
}
console.log('RAW:', JSON.stringify(raw));
// print char codes of last 30 chars
const tail = raw.slice(-60);
console.log('TAIL:', JSON.stringify(tail));
console.log('codes:', [...tail].map(ch => ch.charCodeAt(0)).join(','));
