import { readFileSync } from 'node:fs';
const c = readFileSync('data/bible/raw/fra/fraLSG_usfm/20-PSAFraLSG.usfm', 'utf8');
const lines = c.split(/\r?\n/);
// Find verse 3 of chapter 3 with 'Combien'
const idx = lines.findIndex(l => l.includes('Combien'));
console.log('RAW:', JSON.stringify(lines[idx]));
console.log('CODES:', [...lines[idx]].map(ch => ch.charCodeAt(0)).join(','));
// Check for the \qs part specifically
const m = lines[idx].match(/\\qs.*\\qs\*/);
if (m) console.log('qs segment:', JSON.stringify(m[0]), 'codes:', [...m[0]].map(ch => ch.charCodeAt(0)).join(','));
