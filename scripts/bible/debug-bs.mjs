// Debug: why do the new cleaner patterns not fire?
import { readFileSync } from 'node:fs';
const src = readFileSync('scripts/bible/usfm2json.mjs', 'utf8');
const lines = src.split('\n');
const bsLine = lines.find((l) => l.startsWith('const BS'));
console.log('BS source line:', JSON.stringify(bsLine));
console.log('BS source char codes:', [...bsLine].map((c) => c.charCodeAt(0)).join(','));

// The module compiles const BS = '...' where ... is the raw text between the quotes
const m = bsLine.match(/const BS = '(.*)'/);
const bsRuntime = m[1];
console.log('BS runtime value:', JSON.stringify(bsRuntime), 'length:', bsRuntime.length);
console.log('BS runtime char codes:', [...bsRuntime].map((c) => c.charCodeAt(0)).join(','));

// Now build the q-pair regex exactly as the module does and test it
const qPair = new RegExp(bsRuntime + 'q([^\\n]*)' + bsRuntime + 'q\\*', 'g');
console.log('q-pair source:', qPair.source);
console.log('test \\\\qs... :', qPair.test('\\qs — Pause\\qs*'));

// What does the module's actual runtime BS look like? Use a direct eval to get it
const bsDirect = eval(m[0].replace('const BS = ', '').trim());
console.log('BS direct eval:', JSON.stringify(bsDirect), 'length:', bsDirect.length);
const qPair2 = new RegExp(bsDirect + 'q([^\\n]*)' + bsDirect + 'q\\*', 'g');
console.log('q-pair2 source:', qPair2.source);
console.log('test:', qPair2.test('\\qs — Pause\\qs*'));
