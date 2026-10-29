#!/usr/bin/env node
/**
 * Vérifie l'intégrité des visuels de thèmes (public/themes/**).
 *
 * Pour chaque thème du catalogue (src/theme/theme-catalog.ts) on attend :
 *   - un portrait MOBILE  : {category}/{id}-portrait.png  (ratio < 1)
 *   - une composition BUREAU 16:9 : {category}/{id}-landscape.png (ratio > 1.5)
 *
 * Le script détecte aussi les « fausses » versions bureau : une copie
 * octet-pour-octet du portrait (les copies provisoires `cp` d'avant
 * génération). Il sort en code 1 s'il manque quoi que ce soit.
 *
 * Usage : node scripts/check-theme-assets.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesDir = join(root, 'public', 'themes');

function readCatalog() {
  const src = readFileSync(join(root, 'src', 'theme', 'theme-catalog.ts'), 'utf8');
  const out = [];
  const categoryRe = /id:\s*'([a-z]+)',\s*\n\s*name:\s*'[^']*',\s*\n\s*themes:\s*\[([\s\S]*?)\n\s{4}\],/g;
  for (const cat of src.matchAll(categoryRe)) {
    const category = cat[1];
    for (const t of cat[2].matchAll(/id:\s*'([a-z0-9-]+)'/g)) out.push({ category, id: t[1] });
  }
  return out;
}

function pngSize(file) {
  const d = readFileSync(file).subarray(0, 33);
  if (d.length < 24) return null;
  return { w: d.readUInt32BE(16), h: d.readUInt32BE(20) };
}

function sha(file) {
  return createHash('sha1').update(readFileSync(file)).digest('hex');
}

const themes = readCatalog();
if (themes.length === 0) {
  console.error('Catalogue illisible : aucun thème trouvé dans theme-catalog.ts');
  process.exit(1);
}

const problems = [];
let okPortrait = 0;
let okLandscape = 0;

for (const { category, id } of themes) {
  for (const kind of ['portrait', 'landscape']) {
    const file = join(themesDir, category, `${id}-${kind}.png`);
    const label = `${category}/${id}-${kind}`;
    if (!existsSync(file)) {
      problems.push(`${label}: fichier manquant`);
      continue;
    }
    const size = pngSize(file);
    if (!size) {
      problems.push(`${label}: PNG illisible`);
      continue;
    }
    const ratio = size.w / size.h;
    if (kind === 'portrait') {
      if (ratio >= 1) problems.push(`${label}: ratio ${ratio.toFixed(2)} (portrait attendu < 1)`);
      else okPortrait++;
    } else {
      if (ratio < 1.5) problems.push(`${label}: ratio ${ratio.toFixed(2)} (paysage 16:9 attendu > 1.5)`);
      else {
        const portraitFile = join(themesDir, category, `${id}-portrait.png`);
        if (existsSync(portraitFile) && sha(file) === sha(portraitFile)) {
          problems.push(`${label}: copie provisoire du portrait (pas une vraie composition bureau)`);
        } else okLandscape++;
      }
    }
  }
}

const total = themes.length;
console.log(`Thèmes au catalogue : ${total}`);
console.log(`Portraits mobiles OK : ${okPortrait}/${total}`);
console.log(`Compositions bureau OK : ${okLandscape}/${total}`);
console.log('Dossier : public/themes (gitignored, local uniquement)');

if (problems.length) {
  console.error(`\n${problems.length} problème(s) :`);
  for (const p of problems) console.error(` - ${p}`);
  process.exit(1);
}
console.log('\nTous les visuels de thèmes sont complets et conformes.');
