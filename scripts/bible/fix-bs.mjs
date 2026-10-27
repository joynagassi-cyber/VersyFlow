import { readFileSync, writeFileSync } from 'node:fs';
let s = readFileSync('scripts/bible/usfm2json.mjs', 'utf8');
// Replace all 6 RE_ lines from ' + BS + to ' + SP +
s = s.replace(/' \+ BS \+ /g, "' + SP + ");
writeFileSync('scripts/bible/usfm2json.mjs', s);
console.log('BS occurrences left:', (s.match(/\bBS\b/g)||[]).length);
console.log('SP occurrences:', (s.match(/\bSP\b/g)||[]).length);
