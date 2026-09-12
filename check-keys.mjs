import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
const ROOT = 'C:/Users/joyda/dyad-apps/versy-flow-3';
const langs = ['ar','de','en','fr','zh'];
const files = langs.map(l => `${ROOT}/src/i18n/locales/${l}.ts`);
const sources = {};
for (const f of files) sources[f] = fs.readFileSync(f,'utf8');
const allUsed = new Set();
function* walk(dir){
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist') continue;
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) yield p;
  }
}
for (const dir of ['src','app']) {
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const content = fs.readFileSync(file, 'utf8');
    // dotted key candidates: letters/digits/underscore segments joined by dots,
    // inside single or double quotes
    const re = /['"]([a-z][a-zA-Z0-9_-]*(?:\.[a-zA-Z0-9_-]+)+)['"]/g;
    let m;
    while ((m = re.exec(content))) allUsed.add(m[1]);
  }
}
function getKeysV2(src){
  // Locale files: plain (unquoted) object keys, e.g. `appName:` or `idle:`
  const keys = new Set();
  const re = /(^|\s)([a-zA-Z][a-zA-Z0-9_-]*)\s*:/gm;
  let m;
  while ((m = re.exec(src))) keys.add(m[2]);
  // Also capture quoted keys in case some locales quote them
  const re2 = /['"]([a-zA-Z][a-zA-Z0-9_-]*)['"]\s*:/g;
  while ((m = re2.exec(src))) keys.add(m[1]);
  return keys;
}
const localeKeys = {};
for (const f of files) localeKeys[f] = getKeysV2(sources[f]);
const missing = {};
for (const f of files) missing[f] = new Set();
for (const key of allUsed){
  for (const f of files){
    if (!localeKeys[f].has(key)) missing[f].add(key);
  }
}
// Strategy: collect all quoted dotted keys used in src/app (t('section.key') calls).
// Since i18next flattens nested objects, compare SECTION-level presence per locale,
// then for each used dotted key, verify its section object exists in the locale.
console.log('total dotted key candidates used in code:', allUsed.size);

// Collect the set of section names (first segment) present in each locale
function getSections(src){
  const secs = new Set();
  const re = /(^|\s|\{)([a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*\{/gm;
  let m;
  while ((m = re.exec(src))) secs.add(m[2]);
  return secs;
}
const sections = {};
for (const f of files) sections[f] = getSections(sources[f]);

// For each locale, list used dotted keys whose top section is MISSING
for (const f of files){
  const missing = [...allUsed].filter(k=> !sections[f].has(k.split('.')[0]));
  console.log('==', f.split('/').pop(), '| sections:', [...sections[f]].join(', '));
  console.log('   used keys with missing top section:', missing.length);
  if (missing.length) console.log(missing.slice(0,40).join('\n').split('\n').map(x=>'   '+x).join('\n'));
}
