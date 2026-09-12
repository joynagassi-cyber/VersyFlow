import { readFileSync, writeFileSync } from 'node:fs';
let s = readFileSync('scripts/bible/usfm2json.mjs', 'utf8');
// Fix the 3 broken patterns: "+w\*" / "+it\*" → "\+w\*" / "\+it\*"
s = s.split('+w\\*').join('\\+w\\*');
s = s.split('+it\\*').join('\\+it\\*');
writeFileSync('scripts/bible/usfm2json.mjs', s);
console.log('fixed');
