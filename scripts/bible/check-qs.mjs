import { readFileSync } from 'node:fs';
const c = readFileSync('data/bible/raw/fra/fraLSG_usfm/20-PSAFraLSG.usfm','utf8');
const lines = c.split(/\r?\n/);
const idx = lines.findIndex(l => l.includes('Combien'));
const raw = lines[idx] + ' ' + lines[idx+1];
console.log('RAW:', JSON.stringify(raw));
// Find the \qs part
const qIdx = raw.indexOf('\\qs');
console.log('\\qs at index:', qIdx);
if (qIdx !== -1) {
  console.log('substring codes:', [...raw.slice(qIdx, qIdx+40)].map(c => c.charCodeAt(0)).join(','));
}
