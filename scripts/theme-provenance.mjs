#!/usr/bin/env node
/**
 * Provenance et tonalité des visuels de thèmes — L6.
 *
 * Deux questions auxquelles ce script répond, pour les 100 thèmes du catalogue :
 *
 *  1. D'OÙ VIENT l'image ? (provenance) — modèle, script générateur, licence,
 *     empreinte SHA-256, dimensions. Aucune image tierce n'est utilisée : les
 *     visuels sont produits pour ce projet, ce qui doit être écrit noir sur
 *     blanc, pas supposé.
 *  2. QUELLE EST SA TONALITÉ ? (tones) — la couleur moyenne du portrait, qui
 *     sert de teinte de repli quand l'extraction à l'exécution n'a pas encore
 *     eu lieu. Mesurée sur les pixels, pas déclarée.
 *
 * Le script n'invente rien : si un fichier est absent du poste (les visuels
 * sont des données lourdes, non versionnées), il est marqué `absent` et la
 * tonalité n'est pas calculée. `--strict` transforme une absence en échec,
 * pour une machine où les images sont présentes.
 *
 * Usage : node scripts/theme-provenance.mjs [--strict]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const THEMES_DIR = join(root, 'public', 'themes');
const OUT_PATH = join(root, 'docs/design/theme-provenance.json');
const STRICT = process.argv.includes('--strict');

/* ------------------------------------------------------------------ catalogue */

function readCatalog() {
  const src = readFileSync(join(root, 'src', 'theme', 'theme-catalog.ts'), 'utf8');
  const out = [];
  const categoryRe = /id:\s*'([a-z]+)',\s*\n\s*name:\s*'([^']*)',\s*\n\s*themes:\s*\[([\s\S]*?)\n\s{4}\],/g;
  for (const cat of src.matchAll(categoryRe)) {
    for (const t of cat[3].matchAll(
      /\{ id: '([a-z0-9-]+)', name: '([^']*)', color: '(#[0-9a-fA-F]{6})'/g,
    )) {
      out.push({ category: cat[1], categoryLabel: cat[2], id: t[1], label: t[2], color: t[3] });
    }
  }
  return out;
}

/* ---------------------------------------------------------------------- PNG */

/**
 * Moyenne des pixels d'un PNG 8 bits RVB/RVBA non entrelacé.
 * Décode les IDAT, applique les filtres par ligne, échantillonne une bande
 * centrale (un quart de la hauteur) : c'est la zone que l'interface affiche,
 * et cela évite de moyenner un ciel uni avec un sol saturé.
 */
export function pngMeanColor(buffer) {
  if (buffer.length < 33 || buffer.readUInt32BE(0) !== 0x89504e47) return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer[24];
  const colorType = buffer[25];
  const interlace = buffer[28];
  if (bitDepth !== 8 || ![2, 6].includes(colorType) || interlace !== 0) return null;
  const channels = colorType === 6 ? 4 : 3;

  const idat = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') idat.push(buffer.subarray(offset + 8, offset + 8 + length));
    if (type === 'IEND') break;
    offset += 12 + length;
  }
  if (!idat.length) return null;

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const prev = Buffer.alloc(stride);
  const line = Buffer.alloc(stride);
  let pos = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  const from = Math.floor(height / 4);
  const to = Math.floor((height * 3) / 4);

  for (let y = 0; y < height && pos < raw.length; y += 1) {
    const filter = raw[pos];
    pos += 1;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[pos + x];
      const left = x >= channels ? line[x - channels] : 0;
      const up = prev[x];
      const upLeft = x >= channels ? prev[x - channels] : 0;
      let out;
      switch (filter) {
        case 0: out = value; break;
        case 1: out = value + left; break;
        case 2: out = value + up; break;
        case 3: out = value + ((left + up) >> 1); break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          out = value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
          break;
        }
        default: return null;
      }
      line[x] = out & 0xff;
    }
    pos += stride;
    if (y >= from && y < to) {
      for (let x = 0; x < width; x += 4) {
        r += line[x * channels];
        g += line[x * channels + 1];
        b += line[x * channels + 2];
        count += 1;
      }
    }
    line.copy(prev);
  }

  if (!count) return null;
  const hex = (v) => Math.round(v / count).toString(16).padStart(2, '0');
  return { color: `#${hex(r)}${hex(g)}${hex(b)}`, width, height };
}

/* -------------------------------------------------------------------- sortie */

const PROVENANCE = {
  generator: 'scripts/generate-themes.mjs',
  model: 'agnes-image-2.5-flash',
  endpoint: 'https://apihub.agnes-ai.com/v1/images/generations',
  promptStyle: 'nature photoréaliste, scène complète, lavis teinté dans la famille du thème',
  licence: 'contenu généré pour VersyFlow — aucune image tierce, aucun visuel sous licence externe',
  formats: {
    portrait: '1024×1536 (mobile, appliqué comme fond)',
    landscape: '1536×1024 (bureau, sélection et bandeau)',
  },
};

function main() {
const themes = readCatalog();
const entries = themes.map((theme) => {
  const portrait = join(THEMES_DIR, theme.category, `${theme.id}-portrait.png`);
  const landscape = join(THEMES_DIR, theme.category, `${theme.id}-landscape.png`);
  const entry = {
    id: theme.id,
    category: theme.category,
    label: theme.label,
    declaredColor: theme.color,
    portrait: { path: `/themes/${theme.category}/${theme.id}-portrait.png`, present: false },
    landscape: { path: `/themes/${theme.category}/${theme.id}-landscape.png`, present: false },
    measured: null,
  };
  if (existsSync(portrait)) {
    const buffer = readFileSync(portrait);
    const mean = pngMeanColor(buffer);
    entry.portrait = {
      ...entry.portrait,
      present: true,
      bytes: buffer.length,
      sha256: createHash('sha256').update(buffer).digest('hex').slice(0, 16),
      width: mean?.width ?? null,
      height: mean?.height ?? null,
    };
    entry.measured = mean?.color ?? null;
  }
  if (existsSync(landscape)) {
    const buffer = readFileSync(landscape);
    entry.landscape = {
      ...entry.landscape,
      present: true,
      bytes: buffer.length,
      sha256: createHash('sha256').update(buffer).digest('hex').slice(0, 16),
      width: pngMeanColor(buffer)?.width ?? null,
    };
  }
  return entry;
});

const present = entries.filter((e) => e.portrait.present);

// Fichiers présents mais qu'aucun thème du catalogue ne réclame : un visuel
// orphelin est un fait à déclarer, pas à supprimer en silence.
const expected = new Set(
  entries.flatMap((e) => [e.portrait.path.split('/').pop(), e.landscape.path.split('/').pop()]),
);
const strays = [];
for (const category of readdirSync(THEMES_DIR)) {
  const dir = join(THEMES_DIR, category);
  try {
    for (const file of readdirSync(dir)) {
      if (file.endsWith('.png') && !expected.has(file)) strays.push(`${category}/${file}`);
    }
  } catch {
    /* pas un dossier */
  }
}

const missingThemes = entries
  .filter((e) => !e.portrait.present)
  .map((e) => `${e.category}/${e.id}`);
const manifest = {
  note: 'Généré par scripts/theme-provenance.mjs — ne pas éditer à la main.',
  ...PROVENANCE,
  themes: entries.length,
  portraitsPresent: present.length,
  landscapesPresent: entries.filter((e) => e.landscape.present).length,
  measuredTones: entries.filter((e) => e.measured).length,
  missingThemes,
  strays,
  entries,
};

writeFileSync(OUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `[theme-provenance] ${entries.length} thèmes · portfolios présents ${manifest.portraitsPresent}` +
    ` · paysages ${manifest.landscapesPresent} · tonalités mesurées ${manifest.measuredTones}`,
);
if (missingThemes.length) {
  console.log(`[theme-provenance] sans visuel : ${missingThemes.join(', ')}`);
}
if (strays.length) {
  console.log(`[theme-provenance] visuels orphelins (non réclamés par le catalogue) : ${strays.join(', ')}`);
}
console.log(`[theme-provenance] manifeste → ${OUT_PATH}`);

if (STRICT && present.length !== entries.length) {
  console.error(
    `[theme-provenance] --strict : ${entries.length - present.length} portrait(s) manquant(s).`,
  );
  process.exit(1);
}
}

// Importé par un test : on n'écrit rien, on n'imprime rien.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) main();
