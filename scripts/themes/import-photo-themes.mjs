#!/usr/bin/env node
/**
 * Importe les 20 scènes photo (40 visuels + 20 vignettes) dans le catalogue.
 *
 * Le dossier de dépôt (`--staging`, par défaut `artifacts/photos-src/`) doit
 * contenir, pour chaque scène de `photo-scenes.mjs` :
 *
 *   {id}-landscape.jpg   (ou .jpeg/.png/.webp) — cadrage 3:2
 *   {id}-portrait.jpg                          — cadrage 2:3
 *
 * Le script :
 *   1. refuse tout fichier source dont le grand côté est inférieur à la cible
 *      (pas d'image minuscule agrandie) ;
 *   2. recadre/redimensionne à l'identique des thèmes existants
 *      (1248 × 832 paysage, 832 × 1248 portrait) en WebP qualité 85 ;
 *   3. produit la vignette `{id}-thumb.webp` (320 px de large) ;
 *   4. réécrit `src/theme/photo-themes.generated.ts` avec **uniquement** les
 *      scènes réellement livrées, de sorte que le sélecteur de thèmes ne
 *      propose jamais un fond manquant.
 *
 * Modes :
 *   --check   ne rien écrire, sortir 1 si `photo-themes.generated.ts` diverge
 *             des fichiers présents sur disque (utilisé par les tests).
 *
 * Usage : node scripts/themes/import-photo-themes.mjs [--staging dir] [--check]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHOTO_SCENES, PHOTO_SIZES } from './photo-scenes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const staging = resolve(flag('staging', join(root, 'artifacts', 'photos-src')));
const publicDir = resolve(flag('public', join(root, 'public', 'themes')));
const generatedFile = resolve(
  flag('generated', join(root, 'src', 'theme', 'photo-themes.generated.ts')),
);
const checkOnly = has('check');
const SOURCE_EXT = ['jpg', 'jpeg', 'png', 'webp'];

function magickBin() {
  for (const bin of ['magick', 'convert']) {
    try {
      execFileSync(bin, ['-version'], { stdio: 'ignore' });
      return bin;
    } catch {
      /* binaire suivant */
    }
  }
  return null;
}

const bin = magickBin();

function identifyBinPath() {
  try {
    execFileSync('identify', ['-version'], { stdio: 'ignore' });
    return 'identify';
  } catch {
    return null;
  }
}

const identifyBin = bin ? identifyBinPath() : null;

function imageSize(file) {
  // ImageMagick 6 expose `identify` séparément ; ImageMagick 7 accepte
  // `magick identify`. On préfère le binaire autonome quand il existe.
  const cmd = identifyBin ? [identifyBin] : [bin, 'identify'];
  const out = execFileSync(cmd[0], [...cmd.slice(1), '-format', '%w %h', file], {
    encoding: 'utf8',
  });
  const [w, h] = out.trim().split(/\s+/).map(Number);
  return { w, h };
}

/** Cherche `{id}-{format}.{ext}` parmi les extensions acceptées. */
function findSource(id, format) {
  if (!existsSync(staging)) return null;
  for (const ext of SOURCE_EXT) {
    const candidate = join(staging, `${id}-${format}.${ext}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function convert(src, dest, { width, height }) {
  mkdirSync(dirname(dest), { recursive: true });
  const { w, h } = imageSize(src);
  if (Math.max(w, h) < Math.max(width, height)) {
    throw new Error(
      `${src} fait ${w}×${h} : trop petit pour ${width}×${height} (agrandissement refusé)`,
    );
  }
  const resize = height ? `${width}x${height}^` : `${width}x`;
  const geom = height ? ['-gravity', 'center', '-extent', `${width}x${height}`] : [];
  execFileSync(
    bin,
    [src, '-auto-orient', '-resize', resize, ...geom, '-strip', '-quality', '85', dest],
    { stdio: 'ignore' },
  );
}

function renderGenerated(entries) {
  const body = entries.length
    ? entries
        .map(
          (e) => `  {
    id: '${e.id}',
    name: ${JSON.stringify(e.name)},
    category: '${e.category}',
    color: '${e.color}',
    motif: ${JSON.stringify(e.motif)},
    ext: '${e.ext}',
    importedAt: '${e.importedAt}',
  },`,
        )
        .join('\n')
    : '';
  return `/**
 * GÉNÉRÉ — ne pas éditer à la main.
 *
 * Écrit par \`node scripts/themes/import-photo-themes.mjs\` à partir des
 * fichiers réellement présents dans \`public/themes/photos-*\`.
 *
 * Tant que le lot de 40 images n'est pas livré, cette liste est vide : le
 * sélecteur de thèmes n'affiche aucune catégorie photo et aucune vignette
 * cassée. Dès que les fichiers existent, relancer le script publie la
 * catégorie sans toucher au reste du catalogue.
 */

import type { PhotoThemeEntry } from './photo-themes-types';

export const PHOTO_THEMES: PhotoThemeEntry[] = [
${body}
];
`;
}

/* ---------------------------------- run ---------------------------------- */

if (!bin) {
  console.error('ImageMagick introuvable (ni `magick` ni `convert`). Aucune image produite.');
  process.exit(2);
}

const imported = [];
const skipped = [];
const now = new Date().toISOString();
const currentGenerated = existsSync(generatedFile) ? readFileSync(generatedFile, 'utf8') : '';

/** Date d'import déjà enregistrée pour une scène (évite un diff inutile). */
function existingImportDate(id) {
  const m = currentGenerated.match(
    new RegExp(`id: '${id}'[\\s\\S]{0,300}?importedAt: '([^']+)'`),
  );
  return m ? m[1] : now;
}

/* ------------------------------- mode --check ------------------------------ */

if (checkOnly) {
  // On ne regarde pas le dossier de dépôt : la référence est le disque, qui
  // doit lister exactement les scènes présentes dans le fichier généré.
  const onDisk = PHOTO_SCENES.filter((scene) =>
    ['landscape', 'portrait'].every((f) =>
      existsSync(join(publicDir, scene.category, `${scene.id}-${f}.webp`)),
    ),
  ).map((scene) => scene.id);
  const listed = [...currentGenerated.matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
  if (onDisk.join() !== listed.join()) {
    console.error(
      `photo-themes.generated.ts diverge de public/themes : ${listed.length} scène(s) listée(s), ${onDisk.length} sur disque.\n` +
        'Relancer `node scripts/themes/import-photo-themes.mjs` (sans --check).',
    );
    process.exit(1);
  }
  console.log(`OK — ${onDisk.length} scène(s) photo alignée(s) sur les fichiers.`);
  process.exit(0);
}

for (const scene of PHOTO_SCENES) {
  const dir = join(publicDir, scene.category);
  const ext = 'webp';
  const outLandscape = join(dir, `${scene.id}-landscape.${ext}`);
  const outPortrait = join(dir, `${scene.id}-portrait.${ext}`);
  const outThumb = join(dir, `${scene.id}-thumb.webp`);
  const outputs = [outLandscape, outPortrait, outThumb];

  // Déjà importé : on conserve l'entrée même si les sources ont été
  // supprimées (relancer le script ne doit jamais « dé-publier » un fond).
  if (outputs.every((f) => existsSync(f))) {
    imported.push({ ...scene, ext, importedAt: existingImportDate(scene.id) });
    continue;
  }

  const landscape = findSource(scene.id, 'landscape');
  const portrait = findSource(scene.id, 'portrait');
  if (!landscape || !portrait) {
    skipped.push(`${scene.id} (${!landscape ? 'paysage' : 'portrait'} manquant)`);
    continue;
  }

  try {
    convert(landscape, outLandscape, PHOTO_SIZES.landscape);
    convert(portrait, outPortrait, PHOTO_SIZES.portrait);
    convert(outLandscape, outThumb, PHOTO_SIZES.thumb);
  } catch (err) {
    console.error(`× ${scene.id} : ${err.message}`);
    skipped.push(`${scene.id} (conversion échouée)`);
    for (const f of outputs) if (existsSync(f)) rmSync(f, { force: true });
    continue;
  }

  // Un paysage copié à l'identique depuis le portrait est un faux : on refuse.
  if (statSync(outLandscape).size === statSync(outPortrait).size) {
    console.error(`× ${scene.id} : paysage et portrait identiques en taille, import refusé`);
    skipped.push(`${scene.id} (formats identiques)`);
    for (const f of outputs) if (existsSync(f)) rmSync(f, { force: true });
    continue;
  }
  imported.push({ ...scene, ext, importedAt: now });
}

const expected = renderGenerated(imported);
if (currentGenerated !== expected) writeFileSync(generatedFile, expected);

/* -------------------------------- rapport -------------------------------- */

const missing = PHOTO_SCENES.length - imported.length;
console.log(
  `Scènes importées : ${imported.length}/${PHOTO_SCENES.length} — visuels générés : ${imported.length * 2}, vignettes : ${imported.length}.`,
);
if (missing) {
  console.log(`En attente (${missing}) :`);
  for (const s of skipped) console.log(`  · ${s}`);
  console.log(`Déposer les sources dans ${staging} puis relancer ce script.`);
}
if (!imported.length) {
  console.log('Aucun fichier livré : le catalogue reste sans catégorie photo (aucune image cassée).');
}