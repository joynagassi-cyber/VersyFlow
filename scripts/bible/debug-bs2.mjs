// Simpler test: just check what BS is at runtime in the actual module
import { readFileSync } from 'node:fs';

// Read the source and extract just the BS assignment line
const src = readFileSync('scripts/bible/usfm2json.mjs', 'utf8');
const bsLine = src.split('\n').find((l) => l.startsWith('const BS'));
console.log('BS line:', JSON.stringify(bsLine));

// eval just that line
let bsVal;
eval(bsLine.replace('const BS', 'bsVal').replace(/;\s*$/, ''));
console.log('bsVal:', JSON.stringify(bsVal), 'length:', bsVal.length);

// Now test with a known raw input
const raw = '\\qs — Pause\\qs*';
console.log('raw:', JSON.stringify(raw));

const qPair = new RegExp(bsVal + 'q([^\\n]*)' + bsVal + 'q\\*', 'g');
console.log('qPair.source:', qPair.source);
console.log('qPair.test:', qPair.test(raw));

// What we need for \qs... to match: pattern must have exactly ONE backslash before q
// bsVal should be 1 backslash char
// If bsVal is 2 backslash chars, the pattern matches \\q not \q
console.log('need bsVal length:', 1, 'got:', bsVal.length);
