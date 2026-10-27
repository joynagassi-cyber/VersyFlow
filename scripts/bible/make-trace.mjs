// Trace which CLEANERS fire on a "Pause" verse in the REAL module
import { readFileSync } from 'node:fs';
let src = readFileSync('C:/Users/joyda/dyad-apps/versy-flow-3/scripts/bible/usfm2json.mjs', 'utf8');

// Inject a trace into cleanVerseText
src = src.replace(
  'function cleanVerseText(raw) {\n  let t = raw;',
  `function cleanVerseText(raw) {
  let t = raw;
  if (typeof raw === 'string' && raw.includes('Pause')) {
    let _probe = raw;
    for (let i = 0; i < CLEANERS.length; i++) {
      const [re, repl] = CLEANERS[i];
      const before = _probe;
      const after = before.replace(re, repl);
      if (after !== before) {
        console.error('CLEANER[' + i + '] FIRED src=' + re.source + ' repl=' + JSON.stringify(repl));
        console.error('  before: ' + JSON.stringify(before.slice(0,80)));
        console.error('  after:  ' + JSON.stringify(after.slice(0,80)));
      }
      _probe = after;
    }
    console.error('CLEANED:', JSON.stringify(_probe));
  }`
);

src = src.replace('process.exit(1)', 'console.error("exit"); process.exit(0)');
// prevent writing output
src = src.replace(
  'writeFileSync(outPath, JSON.stringify(output, null, 1), \'utf8\');',
  '/* skip write */'
);
src = src.replace(
  "if (!translationId || !sourceDir || !outPath) {\n  console.error('usage: usfm2json.mjs --translation <id> --source <dir> --out <file>');\n  process.exit(0)\n}",
  ''
);
src = src.replace(
  'const outPath = opt(\'out\');',
  "const outPath = 'data/bible/normalized/lsg.json';"
);

const { writeFileSync } = await import('node:fs');
writeFileSync('C:/Users/joyda/dyad-apps/versy-flow-3/scripts/bible/trace-live.mjs', src);
