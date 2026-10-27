import { readFileSync } from 'node:fs';
const c = readFileSync('data/bible/raw/fra/fraLSG_usfm/20-PSAFraLSG.usfm','utf8');
const lines = c.split(/\r?\n/);
const idx = lines.findIndex(l => l.includes('Combien'));
const raw = lines[idx] + ' ' + lines[idx+1];
// extract the \qs ... \qs* segment
const m = raw.match(/\\qs.*\\qs\*/);
console.log('segment:', JSON.stringify(m && m[0]));

// now test with different BS values
for (const bs of ['\\\\', '\\\\', '\\u005c\\u005c', '\\']) {
  const qRe = new RegExp(bs + 'q([^\\n]*)' + bs + 'q\\*', 'g');
  console.log('BS=' + JSON.stringify(bs) + ' len=' + bs.length,
              'qRe.source=' + qRe.source,
              'test=' + qRe.test(raw));
}
