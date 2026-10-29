#!/usr/bin/env node
/**
 * import-official-themes.mjs — régénère les thèmes tweakcn + gradients
 * webgradients DEPUIS LEURS SOURCES OFFICIELLES. Aucune couleur n'est
 * inventée ni modifiée ici : on ne fait qu'extraire et reformater.
 *
 * Sources (dépôts GitHub officiels des projets) :
 *  - tweakcn : https://github.com/jnsahaj/tweakcn (utils/theme-presets.ts)
 *    (tweakcn.com et le registre shadcn sont injoignables depuis certains
 *    environnements ; le dépôt GitHub contient les mêmes presets officiels.)
 *  - webgradients : https://github.com/itmeo/webgradients (webgradients.css,
 *    licence MIT incluse dans le dépôt)
 *
 * Sorties :
 *  - src/styles/tweakcn-presets.css  (variables shadcn sous [data-preset])
 *  - src/styles/gradients.css        (classes .grad-* copiées telles quelles)
 *  - src/theme/tweakcn-presets.ts    (métadonnées : id, label, swatch)
 *
 * Usage : node scripts/import-official-themes.mjs
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** 10 presets officiels tweakcn : neutre, sombres, colorés, éditoriaux. */
const PRESET_IDS = [
  'modern-minimal', // neutre
  'cosmic-night', // sombre
  'doom-64', // sombre coloré
  'violet-bloom', // coloré
  'quantum-rose', // coloré (proche de l'identité VersyFlow)
  'ocean-breeze', // coloré frais
  'amber-minimal', // chaud minimal
  'vintage-paper', // éditorial papier
  'sage-garden', // vert doux
  'neo-brutalism', // contrasté
];

/** 10 gradients officiels webgradients (CSS copié tel quel). */
const GRADIENT_CLASSES = [
  'warm_flame',
  'juicy_peach',
  'sunny_morning',
  'malibu_beach',
  'true_sunset',
  'morpheus_den',
  'plum_plate',
  'happy_fisher',
  'saint_petersburg',
  'everlasting_sky',
];

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Télécharge via curl (le fetch Node est bloqué par certains proxys). */
async function fetchRaw(url) {
  const { stdout } = await execFileAsync(
    'curl',
    ['-sfL', '-H', 'Accept: application/vnd.github.raw', '-H', 'User-Agent: versyflow-theme-import', url],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  if (!stdout) throw new Error(`${url} → réponse vide`);
  return stdout;
}

/** Extrait l'objet `{ ... }` équilibré qui suit `marker` dans `src`. */
function extractObjectAfter(src, marker, fromIndex = 0) {
  const start = src.indexOf(marker, fromIndex);
  if (start < 0) throw new Error(`marker introuvable : ${marker}`);
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return { text: src.slice(open, i + 1), end: i + 1 };
  }
  throw new Error(`objet non équilibré après : ${marker}`);
}

/** Parse les paires "clé": "valeur" d'un bloc de styles tweakcn. */
function parseStyleBlock(block) {
  const out = {};
  for (const m of block.matchAll(/"?([a-z0-9-]+)"?:\s*"([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

function parsePreset(tsSource, id) {
  const marker = `"${id}": {`;
  const start = tsSource.indexOf(marker);
  if (start < 0) throw new Error(`preset introuvable : ${id}`);
  const labelMatch = tsSource.slice(start, start + 200).match(/label:\s*"([^"]*)"/);
  const light = extractObjectAfter(tsSource, 'light: {', start);
  const dark = extractObjectAfter(tsSource, 'dark: {', light.end);
  return {
    id,
    label: labelMatch ? labelMatch[1] : id,
    light: parseStyleBlock(light.text),
    dark: parseStyleBlock(dark.text),
  };
}

function styleVars(styles, indent = '  ') {
  return Object.entries(styles)
    .map(([k, v]) => `${indent}--${k}: ${v};`)
    .join('\n');
}

/**
 * Pont (glue) vers les variables historiques du projet (--color-*), par
 * RÉFÉRENCE de variables uniquement : aucune valeur de couleur ajoutée.
 * Les composants existants (bg-primary, bg-surface…) suivent ainsi le preset.
 */
const BRIDGE = `  --color-background: var(--background);
  --color-surface: var(--card);
  --color-surface-elevated: var(--popover);
  --color-surface-tint: var(--muted);
  --color-primary: var(--primary);
  --color-primary-dark: var(--primary);
  --color-accent: var(--accent);
  --color-border: var(--border);
  --color-text-primary: var(--foreground);
  --color-text-secondary: var(--muted-foreground);
  --ion-color-primary: var(--primary);`;

async function main() {
  console.log('[themes] source tweakcn (GitHub officiel)…');
  const tsSource = await fetchRaw(
    'https://api.github.com/repos/jnsahaj/tweakcn/contents/utils/theme-presets.ts',
  );
  const presets = PRESET_IDS.map((id) => parsePreset(tsSource, id));

  const css = [
    '/*',
    ' * tweakcn-presets.css — GÉNÉRÉ par scripts/import-official-themes.mjs',
    ' * Thèmes officiels tweakcn (https://github.com/jnsahaj/tweakcn), valeurs',
    ' * copiées SANS modification. Ne pas éditer à la main : relancer le script.',
    ' * Activation : <html data-preset="<id>"> (+ data-theme="dark" pour le sombre).',
    ' */',
    '',
  ];
  for (const p of presets) {
    css.push(`/* ${p.label} — tweakcn/${p.id} (clair) */`);
    css.push(`:root[data-preset='${p.id}'] {`);
    css.push(styleVars(p.light));
    css.push(BRIDGE);
    css.push('}', '');
    css.push(`/* ${p.label} — tweakcn/${p.id} (sombre) */`);
    css.push(`:root[data-theme='dark'][data-preset='${p.id}'] {`);
    css.push(styleVars(p.dark));
    css.push(BRIDGE);
    css.push('}', '');
  }
  writeFileSync(resolve(root, 'src/styles/tweakcn-presets.css'), css.join('\n'));
  console.log(`[themes] ${presets.length} presets → src/styles/tweakcn-presets.css`);

  const meta = [
    '/**',
    ' * GÉNÉRÉ par scripts/import-official-themes.mjs — métadonnées des presets',
    ' * officiels tweakcn (label + couleur primaire d\u2019origine, pour l\u2019aperçu).',
    ' */',
    'export interface TweakcnPresetMeta { id: string; label: string; swatch: string }',
    'export const TWEAKCN_PRESETS: TweakcnPresetMeta[] = [',
    ...presets.map(
      (p) =>
        `  { id: '${p.id}', label: ${JSON.stringify(p.label)}, swatch: '${p.light.primary}' },`,
    ),
    '];',
    '',
  ];
  writeFileSync(resolve(root, 'src/theme/tweakcn-presets.ts'), meta.join('\n'));
  console.log('[themes] métadonnées → src/theme/tweakcn-presets.ts');

  console.log('[gradients] source webgradients (GitHub officiel, MIT)…');
  const gradCss = await fetchRaw(
    'https://api.github.com/repos/itmeo/webgradients/contents/webgradients.css',
  );
  const out = [
    '/*',
    ' * gradients.css — GÉNÉRÉ par scripts/import-official-themes.mjs',
    ' * Source : webgradients.com / https://github.com/itmeo/webgradients',
    ' * (licence MIT, voir le dépôt source). Règles copiées TELLES QUELLES,',
    ' * simplement renommées avec le préfixe .grad- pour éviter les collisions.',
    ' */',
    '',
  ];
  for (const cls of GRADIENT_CLASSES) {
    const re = new RegExp(`\\.${cls}\\s*\\{[^}]*\\}`, 'm');
    const m = gradCss.match(re);
    if (!m) throw new Error(`gradient introuvable : ${cls}`);
    out.push(m[0].replace(`.${cls}`, `.grad-${cls.replace(/_/g, '-')}`), '');
  }
  writeFileSync(resolve(root, 'src/styles/gradients.css'), out.join('\n'));
  console.log(`[gradients] ${GRADIENT_CLASSES.length} gradients → src/styles/gradients.css`);
}

main().catch((e) => {
  console.error('[import-official-themes] ÉCHEC :', e.message);
  process.exit(1);
});
