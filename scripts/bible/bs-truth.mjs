import { readFileSync } from 'node:fs';
const modSrc = readFileSync('scripts/bible/usfm2json.mjs', 'utf8');
const bsLine = modSrc.split('\n').find(l => l.startsWith('const BS'));
// Show the EXACT source characters of the BS assignment
const m = bsLine.match(/const BS = '(.*)';/s);
console.log('BS source literal content (between quotes):', JSON.stringify(m[1]));
console.log('char codes:', [...m[1]].map(c => c.charCodeAt(0)).join(','));
// The literal string value that the JS parser assigns to BS:
// each pair of \ in the literal becomes one \ in the string
const bsString = m[1].replace(/\\\\/g, '\\');
console.log('evaluated BS string:', JSON.stringify(bsString), 'len:', bsString.length);
// A RegExp pattern fragment that matches ONE literal backslash in a REGEX must be:
// the two-character string "\\" (backslash backslash).
// Is BS equal to that?
console.log('BS === two backslashes?', bsString === '\\\\');
console.log('BS char codes:', [...bsString].map(c=>c.charCodeAt(0)).join(','));
