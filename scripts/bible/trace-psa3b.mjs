// Trace psa 3:3 step by step using the ACTUAL module's BS value (eval'd from source)
import { readFileSync } from 'node:fs';

// 1. Get the real module BS value
const src = readFileSync('scripts/bible/usfm2json.mjs', 'utf8');
const bsLine = src.split('\n').find((l) => l.startsWith('const BS'));
let BS;
eval(bsLine.replace('const BS = ', 'BS = '));
console.log('BS from module:', JSON.stringify(BS), 'len:', BS.length);

// 2. Read raw psa 3:3
const c = readFileSync('data/bible/raw/fra/fraLSG_usfm/20-PSAFraLSG.usfm', 'utf8');
const lines = c.split(/\r?\n/);
const idx = lines.findIndex((l) => l.startsWith('\\v 3 '));
let raw = lines[idx].replace(/^\\v 3\s*/, '');
for (let i = idx + 1; i < lines.length && !lines[i].startsWith('\\v '); i++) {
  if (lines[i].startsWith('\\q1')) raw += ' ' + lines[i];
}
console.log('RAW:', JSON.stringify(raw));

// 3. Apply w-strong with the module's BS
const wStrong = new RegExp(BS + 'w ([^|\\n]*)\\|strong="[^"]*"\\w\\*', 'g');
console.log('wStrong.source:', wStrong.source);
let t1 = raw.replace(wStrong, '$1');
console.log('after w-strong:', JSON.stringify(t1));

// 4. Apply q-pair with the module's BS
const qPair = new RegExp(BS + 'q([^\\n]*)' + BS + 'q\\*', 'g');
console.log('qPair.source:', qPair.source);
let t2 = t1.replace(qPair, '');
console.log('after q-pair:', JSON.stringify(t2));

// 5. Apply residual q with the module's BS
const qResid = new RegExp(BS + 'q', 'g');
console.log('qResid.source:', qResid.source);
let t3 = t2.replace(qResid, '');
console.log('after q-resid:', JSON.stringify(t3));

// 6. Final poetry strip
let t4 = t3.replace(new RegExp(BS + 'q[0-9]?\\s?', 'g'), ' ');
console.log('FINAL:', JSON.stringify(t4.replace(/[ \t]+/g, ' ').trim()));
