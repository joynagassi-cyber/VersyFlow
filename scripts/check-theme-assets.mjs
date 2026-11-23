#!/usr/bin/env node
/**
 * Vérifie l'intégrité des visuels de thèmes (public/themes/**).
 *
 * Pour chaque thème du catalogue (src/theme/theme-catalog.ts) on attend :
 *   - un portrait MOBILE  : {category}/{id}-portrait.<ext>  (ratio < 1)
 *   - une composition BUREAU 16:9 : {category}/{id}-landscape.<ext> (ratio > 1.5)
 *
 * Le format se lit dans le **fichier**, pas dans une constante : la chaîne de
 * génération a livré du PNG puis du WebP, et un script qui exige `.png` déclare
 * 200 fichiers manquants sur un dossier complet. Largeurs réellement livrées :
 * 832×1248 et 1248×832 (et non 1024×1536), ce qui est le ratio attendu.
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

/** Signature PNG (8 octets) et WebP (`RIFF`…`WEBP`). */
function imageFormat(file) {
  const d = readFileSync(file).subarray(0, 12);
  if (d.length < 12) return null;
  if (d.readUInt32BE(0) === 0x89504e47) return 'png';
  if (d.toString('ascii', 0, 4) === 'RIFF' && d.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/** Dimensions : en-tête PNG, ou `VP8`/`VP8L`/`VP8X` de la première image WebP. */
function imageSize(file) {
  const buffer = readFileSync(file);
  const format = imageFormat(file);
  if (format === 'png') {
    return { w: buffer.readUInt32BE(16), h: buffer.readUInt32BE(20) };
  }
  if (format !== 'webp') return null;
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    return { w: buffer.readUInt16LE(26) & 0x3fff, h: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') {
    return { w: buffer.readUIntLE(24, 3) + 1, h: buffer.readUIntLE(27, 3) + 1 };
  }
  return null;
}

function sha(file) {
  return createHash('sha1').update(readFileSync(file)).digest('hex');
}

const themes = readCatalog();
if (themes.length === 0) {
  console.error('Catalogue illisible : aucun thème trouvé dans theme-catalog.ts');
  process.exit(1);
}

/**
 * Le seul thème sans visuel, et il est assumé : « Miroir » (objets) n'a jamais
 * été généré, et plusieurs écrans l'écartent explicitement (avatar, couverture,
 * carte du jour, sélecteur de fond). `theme-provenance` le déclare déjà dans
 * `manifest.missingThemes` ; l'exiger ici donnerait un échec permanent qu'on
 * finirait par ignorer. Il est compté à part, jamais silencieusement ignoré.
 */
const KNOWN_MISSING = new Set(['objets/obj-miroir']);

const problems = [];
let okPortrait = 0;
let okLandscape = 0;
const knownMissing = [];

for (const { category, id } of themes) {
  for (const kind of ['portrait', 'landscape']) {
    const label = `${category}/${id}-${kind}`;
    const stem = join(themesDir, category, `${id}-${kind}`);
    // L'extension vient du disque : `themeLandscapeUrl` en choisit une en aval.
    const file = ['webp', 'png'].map((ext) => `${stem}.${ext}`).find((path) => existsSync(path));
    if (!file) {
      if (KNOWN_MISSING.has(`${category}/${id}`)) knownMissing.push(label);
      else problems.push(`${label}: fichier manquant (ni .webp ni .png)`);
      continue;
    }
    const size = imageSize(file);
    if (!size) {
      problems.push(`${label}: image illisible (${file.split('.').pop()})`);
      continue;
    }
    const ratio = size.w / size.h;
    if (kind === 'portrait') {
      if (ratio >= 1) problems.push(`${label}: ratio ${ratio.toFixed(2)} (portrait attendu < 1)`);
      else okPortrait++;
    } else {
      if (ratio < 1.5) problems.push(`${label}: ratio ${ratio.toFixed(2)} (paysage 16:9 attendu > 1.5)`);
      else {
        const portraitFile = ['webp', 'png']
          .map((ext) => join(themesDir, category, `${id}-portrait.${ext}`))
          .find((path) => existsSync(path));
        if (portraitFile && sha(file) === sha(portraitFile)) {
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
console.log('Dossier : public/themes (versionné depuis le 29/10 : les visuels font partie de la livraison)');
if (knownMissing.length > 0) {
  console.log(
    `Sans visuel, assumé : ${knownMissing.join(', ')} (voir docs/IMAGES_QA.md)`,
  );
}

if (problems.length) {
  console.error(`\n${problems.length} problème(s) :`);
  for (const p of problems) console.error(` - ${p}`);
  process.exit(1);
}
console.log('\nTous les visuels de thèmes sont complets et conformes.');
