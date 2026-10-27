// Root cause: verify what BS value the MODULE actually uses at runtime
import { readFileSync } from 'node:fs';
const src = readFileSync('scripts/bible/usfm2json.mjs', 'utf8');
// exec the module's BS line in a sandbox where we can inspect it
const sandboxSrc = src.split('\n').find((l) => l.startsWith('const BS')) +
  '\nconsole.log("MODULE-BS:", JSON.stringify(BS), "len:", BS.length);';
execSync('node -e ' + JSON.stringify(sandboxSrc));
