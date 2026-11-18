#!/usr/bin/env node
/**
 * Importe les scènes chrétiennes et d'architecture sacrée dans le catalogue.
 *
 * Le dossier de dépôt (`--staging`, par défaut `artifacts/sacred-src/`) doit
 * contenir, pour chaque scène de `sacred-scenes.mjs` :
 *
 *   {id}-landscape.{jpg|jpeg|png|webp} — cadrage 3:2
 *   {id}-portrait.{jpg|jpeg|png|webp}  — cadrage 2:3
 *
 * Modes :
 *   --check   ne rien écrire, sortir 1 si `sacred-themes.generated.ts` diverge
 *             des fichiers présents sur disque.
 *   --force   reconvertir même si les WebP existent déjà sur disque.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SACRED_SCENES, SACRED_SIZES } from './sacred-scenes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const staging = resolve(flag('staging', join(root, 'artifacts', 'sacred-src')));
const publicDir = resolve(flag('public', join(root, 'public', 'themes')));
const generatedFile = resolve(
  flag('generated', join(root, 'src', 'theme', 'sacred-themes.generated.ts')),
);
const checkOnly = has('check');
const force = has('force');
const SOURCE_EXT = ['jpg', 'jpeg', 'png', 'webp'];

function magickBin() {
  for (const b of ['magick', 'convert']) {
    try {
      execFileSync(b, ['-version'], { stdio: 'ignore' });
      return b;
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
  const cmd = identifyBin ? [identifyBin] : [bin, 'identify'];
  const out = execFileSync(cmd[0], [...cmd.slice(1), '-format', '%w %h', file], {
    encoding: 'utf8',
  });
  const [w, h] = out.trim().split(/\s+/).map(Number);
  return { w, h };
}

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
 * Écrit par \`node scripts/themes/import-sacred-themes.mjs\` à partir des
 * fichiers réellement présents dans \`public/themes/{foi-victoire,architecture-sacree}\`.
 */

import type { PhotoThemeEntry } from './photo-themes-types';

export const SACRED_THEMES: PhotoThemeEntry[] = [
${body}
];
`;
}

if (!bin) {
  console.error('ImageMagick introuvable (ni `magick` ni `convert`). Aucune image produite.');
  process.exit(2);
}

const imported = [];
const skipped = [];
const now = new Date().toISOString();
const currentGenerated = existsSync(generatedFile) ? readFileSync(generatedFile, 'utf8') : '';

function existingImportDate(id) {
  const m = currentGenerated.match(
    new RegExp(`id: '${id}'[\\s\\S]{0,300}?importedAt: '([^']+)'`),
  );
  return m ? m[1] : now;
}

if (checkOnly) {
  const onDisk = SACRED_SCENES.filter((scene) =>
    ['landscape', 'portrait'].every((f) =>
      existsSync(join(publicDir, scene.category, `${scene.id}-${f}.webp`)),
    ),
  ).map((scene) => scene.id);
  const listed = [...currentGenerated.matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
  if (onDisk.join() !== listed.join()) {
    console.error(
      `sacred-themes.generated.ts diverge de public/themes : ${listed.length} scène(s) listée(s), ${onDisk.length} sur disque.\n` +
        'Relancer `node scripts/themes/import-sacred-themes.mjs` (sans --check).',
    );
    process.exit(1);
  }
  console.log(`OK — ${onDisk.length} scène(s) sacrée(s) alignée(s) sur les fichiers.`);
  process.exit(0);
}

for (const scene of SACRED_SCENES) {
  const dir = join(publicDir, scene.category);
  const ext = 'webp';
  const outLandscape = join(dir, `${scene.id}-landscape.${ext}`);
  const outPortrait = join(dir, `${scene.id}-portrait.${ext}`);
  const outThumb = join(dir, `${scene.id}-thumb.webp`);
  const outputs = [outLandscape, outPortrait, outThumb];

  if (!force && outputs.every((f) => existsSync(f))) {
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
    convert(landscape, outLandscape, SACRED_SIZES.landscape);
    convert(portrait, outPortrait, SACRED_SIZES.portrait);
    convert(outLandscape, outThumb, SACRED_SIZES.thumb);
  } catch (err) {
    console.error(`× ${scene.id} : ${err.message}`);
    skipped.push(`${scene.id} (conversion échouée)`);
    for (const f of outputs) if (existsSync(f)) rmSync(f, { force: true });
    continue;
  }

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

const missing = SACRED_SCENES.length - imported.length;
console.log(
  `Scènes sacrées importées : ${imported.length}/${SACRED_SCENES.length} — visuels générés : ${imported.length * 2}, vignettes : ${imported.length}.`,
);
if (missing) {
  console.log(`En attente (${missing}) :`);
  for (const s of skipped) console.log(`  · ${s}`);
}
