// Confirm: is BS really 2 backslashes at module runtime?
import { readFileSync } from 'node:fs';
// Import a minimal probe: re-run the module with a console.log of BS inserted
const src = readFileSync('scripts/bible/usfm2json.mjs', 'utf8');
// Find where CLEANERS is built and print the w-strong regex source
const probe = src.replace(
  "const translationId = opt('translation');",
  "console.error('PROBE-BS:', JSON.stringify(BS), 'len:', BS.length);\nconsole.error('PROBE-wStrong:', new RegExp(BS + 'w ([^|\\\\n]*)\\\\|strong=\"[^\"]*\"\\\\w\\\\*', 'g').source);\nconst translationId = opt('translation');"
);
const { writeFileSync, unlinkSync } = await import('node:fs');
writeFileSync('/tmp/probe-usfm.mjs', probe);
await import('file:///tmp/probe-usfm.mjs').catch(() => {});
unlinkSync('/tmp/probe-usfm.mjs');
