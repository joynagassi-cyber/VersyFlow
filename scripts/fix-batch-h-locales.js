/**
 * Fix unescaped single quotes in Batch H locale files (ha, ig, tw, so, dz, st)
 * The apostrophe characters in African languages break TypeScript string literals.
 */
const fs = require('fs');
const path = require('path');

const LOCALE_DIR = 'C:/Users/joyda/dyad-apps/versy-flow-3/src/i18n/locales';
const FILES = ['ha', 'ig', 'tw', 'so', 'dz', 'st'];

for (const lang of FILES) {
  const filePath = path.join(LOCALE_DIR, `${lang}.ts`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Strategy: find lines with value patterns like: key: 'text with apostrophe',
  // and escape the apostrophes by replacing them with \\'
  const lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match lines like:    someKey: 'value with apostrophe',
    // Pattern: word followed by ': ' then content then ' or ,
    const match = line.match(/^( *\w+:\s*')(.+?)('(?:,\s*)?)$/);
    if (match) {
      const prefix = match[1]; // e.g. '    appName: \''
      const value = match[2];  // e.g. Gaa n'ihu
      const suffix = match[3]; // e.g. '\,' or '\n'

      // If value contains unescaped apostrophes, escape them
      if (value.includes("'") && !value.includes("\\'")) {
        const fixedValue = value.replace(/'/g, "\\'");
        lines[i] = prefix + fixedValue + suffix;
        console.log(`${lang}.ts:${i + 1} Fixed: "${value}" -> "${fixedValue}"`);
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`${lang}.ts: saved`);
  } else {
    console.log(`${lang}.ts: no changes needed`);
  }
}

console.log('\nDone fixing Batch H locale files.');
