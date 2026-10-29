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
// 20 presets officiels tweakcn (exclus par consigne : cyberpunk, néon,
// glow, brutaliste — 'neo-brutalism' et 'doom-64' sont donc écartés).
const PRESET_IDS = [
  'modern-minimal', 'clean-slate', 'violet-bloom', 't3-chat', 'mocha-mousse',
  'amethyst-haze', 'kodama-grove', 'cosmic-night', 'quantum-rose',
  'elegant-luxury', 'amber-minimal', 'solar-dusk', 'pastel-dreams',
  'ocean-breeze', 'midnight-bloom', 'northern-lights', 'vintage-paper',
  'sunset-horizon', 'starry-night', 'soft-pop', 'sage-garden',
].slice(0, 20);

/** 10 gradients officiels webgradients (CSS copié tel quel). */
const GRADIENT_CLASSES = [
  'warm_flame', 'juicy_peach', 'sunny_morning', 'malibu_beach', 'true_sunset',
  'morpheus_den', 'plum_plate', 'happy_fisher', 'saint_petersburg',
  'everlasting_sky', 'night_fade', 'spring_warmth', 'young_passion',
  'lady_lips', 'rainy_ashville',
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

/**
 * 5 thèmes hybrides haut de gamme, créés par fusion de tokens OFFICIELS
 * tweakcn (catégories croisées, hors cyberpunk/néon/glow/brutaliste).
 * `base` fournit la structure ; `take` copie des tokens précis d'autres
 * presets sources. Noms évocateurs (nature, matière, architecture).
 */
const HYBRIDS = [
  {
    id: 'alabaster-zen', label: 'Alabaster Zen',
    philosophy: 'Minimal + Monochrome + Flat + Zen — blanc albâtre, neutres doux, surfaces plates.',
    base: 'clean-slate',
    take: { primary: 'modern-minimal', ring: 'modern-minimal', accent: 'sage-garden', muted: 'modern-minimal' },
  },
  {
    id: 'obsidian-meridian', label: 'Obsidian Meridian',
    philosophy: 'Professional + Corporate + Midnight + Glassmorphism — nuit obsidienne, cartes verre, accents océan.',
    base: 'cosmic-night',
    take: { card: 'midnight-bloom', popover: 'midnight-bloom', accent: 'northern-lights', secondary: 'midnight-bloom' },
  },
  {
    id: 'velvet-terracotta', label: 'Velvet Terracotta',
    philosophy: 'Warm + Earthy + Retro + Sunset + Autumn + Elegant — crème vintage, terre cuite, laiton chaud.',
    base: 'vintage-paper',
    take: { primary: 'sunset-horizon', ring: 'sunset-horizon', accent: 'mocha-mousse', secondary: 'amber-minimal' },
  },
  {
    id: 'pastel-reverie', label: 'Pastel Reverie',
    philosophy: 'Playful + Soft + Candy + Pastel + Spring — pastels doux, géométrie ronde, accents bonbon AA.',
    base: 'pastel-dreams',
    take: { primary: 'soft-pop', ring: 'soft-pop', accent: 'soft-pop' },
  },
  {
    id: 'quartz-deco', label: 'Quartz Deco',
    philosophy: 'Geometric + Art-Deco + Bold + High-Contrast — lignes franches, contraste net, rythme typographique.',
    base: 'elegant-luxury',
    take: { background: 'modern-minimal', foreground: 'modern-minimal', accent: 'amber-minimal', ring: 'elegant-luxury' },
  },
];

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
  /* Texte posé sur l'accent : DOIT suivre --primary-foreground, sinon un
     preset à texte noir sur accent clair rend du blanc illisible. */
  --color-on-primary: var(--primary-foreground);
  --color-ring: var(--ring);
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
  // Hybrides : base + copies de tokens sources (clair ET sombre).
  const byId = Object.fromEntries(presets.map((p) => [p.id, p]));
  const hybridMetas = [];
  for (const h of HYBRIDS) {
    const base = byId[h.base];
    if (!base) throw new Error(`hybride ${h.id} : base introuvable ${h.base}`);
    const merged = { light: { ...base.light }, dark: { ...base.dark } };
    for (const mode of ['light', 'dark']) {
      for (const [token, srcId] of Object.entries(h.take)) {
        const src = byId[srcId];
        if (src && src[mode][token] !== undefined) merged[mode][token] = src[mode][token];
      }
    }
    css.push(`/* HYBRIDE — ${h.label} : ${h.philosophy} */`);
    css.push(`:root[data-preset='${h.id}'] {`);
    css.push(styleVars(merged.light));
    css.push(BRIDGE);
    css.push('}', '');
    css.push(`:root[data-theme='dark'][data-preset='${h.id}'] {`);
    css.push(styleVars(merged.dark));
    css.push(BRIDGE);
    css.push('}', '');
    byId[h.id] = { id: h.id, label: h.label, light: merged.light, dark: merged.dark };
    hybridMetas.push(
      `  { id: '${h.id}', label: ${JSON.stringify(h.label)}, swatch: '${merged.light.primary}', hybrid: true },`,
    );
  }

  writeFileSync(resolve(root, 'src/styles/tweakcn-presets.css'), css.join('\n'));
  console.log(`[themes] ${presets.length} presets + ${HYBRIDS.length} hybrides → src/styles/tweakcn-presets.css`);
  presets.push(...hybridMetas.map((line, i) => ({
    id: HYBRIDS[i].id, label: HYBRIDS[i].label,
    light: { primary: line.match(/swatch: '(#[0-9a-fA-F]+)'/)[1] }, dark: {},
  })));

  const hybridIds = new Set(HYBRIDS.map((h) => h.id));
  const meta = [
    '/**',
    ' * GÉNÉRÉ par scripts/import-official-themes.mjs — métadonnées des presets',
    ' * officiels tweakcn + des 5 hybrides fusionnés depuis leurs tokens.',
    ' */',
    'export interface TweakcnPresetMeta { id: string; label: string; swatch: string; hybrid?: boolean; bg: string; card: string; fg: string; primary: string; accent: string; muted: string; primaryFg: string }',
    'export const TWEAKCN_PRESETS: TweakcnPresetMeta[] = [',
    ...presets.map((p) => {
      const L = byId[p.id] ? byId[p.id].light : p.light;
      const tok = (k) => `'${(L[k] ?? '#000000').replace(/'/g, '')}'`;
      return `  { id: '${p.id}', label: ${JSON.stringify(p.label)}, swatch: ${tok('primary')}, bg: ${tok('background')}, card: ${tok('card')}, fg: ${tok('foreground')}, primary: ${tok('primary')}, accent: ${tok('accent')}, muted: ${tok('muted')}, primaryFg: ${tok('primary-foreground')}${hybridIds.has(p.id) ? ', hybrid: true' : ''} },`;
    }),
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

  // Métadonnées gradients (valeur background-image d'origine, verbatim) pour
  // appliquer un dégradé en fond d'app via --app-bg-image.
  const gradMeta = [
    'export interface GradientMeta { id: string; className: string; css: string }',
    'export const GRADIENTS: GradientMeta[] = [',
  ];
  for (const cls of GRADIENT_CLASSES) {
    const re = new RegExp(`\\.${cls}\\s*\\{[^}]*\\}`, 'm');
    const m = gradCss.match(re);
    const cssValue = m[0].match(/background-image:\s*([^;]+);/)[1].trim();
    const id = cls.replace(/_/g, '-');
    gradMeta.push(`  { id: '${id}', className: 'grad-${id}', css: ${JSON.stringify(cssValue)} },`);
  }
  gradMeta.push('];', '');
  const metaPath = resolve(root, 'src/theme/tweakcn-presets.ts');
  const { readFileSync } = await import('node:fs');
  writeFileSync(metaPath, readFileSync(metaPath, 'utf8') + '\n' + gradMeta.join('\n'));
  console.log('[gradients] métadonnées → src/theme/tweakcn-presets.ts');
}

// IMPORTANT : après régénération, lancer `node scripts/apply-preset-contrast.mjs`.
// Les palettes officielles verbatim échouent AA sur le texte posé sur --primary
// pour 17 des 25 presets ; la normalisation est déterministe et idempotente.
main().catch((e) => {
  console.error('[import-official-themes] ÉCHEC :', e.message);
  process.exit(1);
});
