#!/usr/bin/env node
/**
 * import-vendored-themes.mjs — génère les thèmes tweakcn DEMANDÉS (contrat n°3)
 * à partir de `scripts/data/vendored-themes.json`.
 *
 * POURQUOI CE SCRIPT EXISTE
 * `scripts/import-official-themes.mjs` régénère les 25 presets historiques
 * depuis le dépôt GitHub de tweakcn (`utils/theme-presets.ts`). Les thèmes
 * ajoutés ici ne sont PAS dans ce fichier : ce sont des thèmes enregistrés par
 * des utilisateurs de tweakcn, servis par le registre officiel
 * `https://tweakcn.com/r/themes/<id>` au format `registry:style` de shadcn.
 * Ils ont donc été récupérés VERBATIM (payload JSON du registre) puis figés
 * dans `scripts/data/vendored-themes.json` : plus aucune requête réseau n'est
 * nécessaire pour régénérer les sorties, et la valeur servie est vérifiable
 * ligne à ligne contre la source (URL conservée par thème).
 *
 * DEUX TRANSFORMATIONS SEULEMENT, toutes deux documentées et déterministes :
 *  1. `oklch(L C H)` → hex sRGB. Les blocs historiques du projet sont en hex
 *     (`tests/design/theme-tokens.test.ts` l'impose) et les WebView mobiles
 *     anciennes ne comprennent pas `oklch()` : servir du hex évite un thème
 *     vide sur Android ancien. La conversion est la formule Oklab → LMS →
 *     linéaire sRGB → sRGB, sans arrondi intermédiaire, puis clamp [0,1].
 *  2. normalisation du contraste à 4,5:1 (même règle et même code que
 *     `scripts/apply-preset-contrast.mjs`, importé ici) : teinte et saturation
 *     des accents conservées, luminosité ajustée, texte noir/blanc en dernier
 *     recours. Chaque correction est écrite dans
 *     `docs/design/vendored-theme-contrast.md` — rien n'est corrigé en silence.
 *  3. `--radius` → `--radius-scale` (radius / 0.5rem). Le projet a un design
 *     system à rayons fixes (8/12/16/20/24 px). Pour qu'un thème à 1.875rem
 *     soit VRAIMENT plus rond sans casser les autres, `tailwind.config.js`
 *     multiplie ces rayons par `--radius-scale`. Le thème par défaut a
 *     exactement 0.5rem ⇒ scale = 1 ⇒ aucun pixel ne bouge par rapport à
 *     aujourd'hui.
 *
 * Usage :
 *   node scripts/import-vendored-themes.mjs           # écrit les sorties
 *   node scripts/import-vendored-themes.mjs --check    # n'écrit rien, code 1 si écart
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// Même règle d'accessibilité que les 25 presets historiques : un accent
// officiel illisible n'est pas une fidélité, c'est un défaut de livraison.
import { ensurePair, contrast, TARGET } from './apply-preset-contrast.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = resolve(root, 'scripts/data/vendored-themes.json');
const CSS_PATH = resolve(root, 'src/styles/vendored-themes.css');
const TS_PATH = resolve(root, 'src/theme/vendored-themes.ts');
const CHECK_ONLY = process.argv.includes('--check');

/* ------------------------------------------------------------- couleurs */

/** oklch(L C H) → [r, g, b] sRGB 0-255 (clamp gamut). */
export function oklchToRgb(input) {
  const m = input.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*\)$/i);
  if (!m) throw new Error(`couleur non oklch : ${input}`);
  const L = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const C = parseFloat(m[2]);
  const hDeg = parseFloat(m[3]);
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  const lin = [
    +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
  const gamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  return lin.map((v) => Math.max(0, Math.min(255, Math.round(gamma(v) * 255))));
}

export function toHex(value) {
  const [r, g, b] = oklchToRgb(value);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Toute couleur du fichier source doit être convertible (aucun hex en dur). */
function colorOrThrow(token, value) {
  if (/^oklch\(/i.test(value)) return toHex(value);
  throw new Error(`--${token} : "${value}" n'est pas en oklch ; source inattendue`);
}

/* ----------------------------------------------------- clés → jetons CSS */

/** Clés courtes du JSON figé → noms de variables réellement consommés. */
export const TOKENS = {
  bg: 'background',
  fg: 'foreground',
  card: 'card',
  'card-fg': 'card-foreground',
  pop: 'popover',
  'pop-fg': 'popover-foreground',
  pri: 'primary',
  'pri-fg': 'primary-foreground',
  sec: 'secondary',
  'sec-fg': 'secondary-foreground',
  mut: 'muted',
  'mut-fg': 'muted-foreground',
  acc: 'accent',
  'acc-fg': 'accent-foreground',
  des: 'destructive',
  'des-fg': 'destructive-foreground',
  bd: 'border',
  in: 'input',
  ring: 'ring',
  c1: 'chart-1',
  c2: 'chart-2',
  c3: 'chart-3',
  c4: 'chart-4',
  c5: 'chart-5',
  sb: 'sidebar',
  'sb-fg': 'sidebar-foreground',
  'sb-pri': 'sidebar-primary',
  'sb-pri-fg': 'sidebar-primary-foreground',
  'sb-acc': 'sidebar-accent',
  'sb-acc-fg': 'sidebar-accent-foreground',
  'sb-bd': 'sidebar-border',
  'sb-ring': 'sidebar-ring',
};

/** Pont vers les variables historiques du projet (par référence, zéro valeur). */
const BRIDGE = [
  '--color-background: var(--background);',
  '--color-surface: var(--card);',
  '--color-surface-elevated: var(--popover);',
  '--color-surface-tint: var(--muted);',
  '--color-primary: var(--primary);',
  '--color-primary-dark: var(--primary);',
  '--color-accent: var(--accent);',
  '--color-border: var(--border);',
  '--color-text-primary: var(--foreground);',
  '--color-text-secondary: var(--muted-foreground);',
  '--color-on-primary: var(--primary-foreground);',
  '--color-ring: var(--ring);',
  '--ion-color-primary: var(--primary);',
];

function radiusScale(radius) {
  const rem = radius.match(/^([\d.]+)rem$/);
  if (!rem) throw new Error(`radius non géré : ${radius}`);
  return Number((parseFloat(rem[1]) / 0.5).toFixed(4));
}

function blockVars(colors, theme) {
  const out = [];
  for (const [short, cssName] of Object.entries(TOKENS)) {
    const raw = colors[short];
    if (!raw) throw new Error(`jeton manquant : ${short}`);
    if (!/^#[0-9a-f]{6}$/.test(raw)) throw new Error(`--${cssName} non normalisé : ${raw}`);
    out.push(`  --${cssName}: ${raw};`);
  }
  out.push(`  --radius: ${theme.radius};`);
  out.push(`  --radius-scale: ${radiusScale(theme.radius)};`);
  out.push(`  --tracking-normal: ${theme.tracking};`);
  out.push(`  --spacing-preset: ${theme.spacing};`);
  out.push(`  --font-sans: ${theme.fontSans};`);
  out.push(`  --font-serif: ${theme.fontSerif};`);
  out.push(`  --font-mono: ${theme.fontMono};`);
  // Ombres officielles du preset : consommées via --shadow-preset-* (voir
  // globals.css, utilité .vf-elevated). Valeurs copiées telles quelles.
  if (theme.shadowSm) out.push(`  --shadow-preset-sm: ${theme.shadowSm};`);
  if (theme.shadowLg) out.push(`  --shadow-preset-lg: ${theme.shadowLg};`);
  out.push(...BRIDGE.map((l) => `  ${l}`));
  return out.join('\n');
}

/* -------------------------------------------------- accessibilité (AA 4,5:1) */

const REPORT_PATH = resolve(root, 'docs/design/vendored-theme-contrast.md');

/**
 * Applique la recette de `apply-preset-contrast.mjs` au bloc : teinte
 * conservée, luminosité déplacée, ou texte noir/blanc en dernier recours.
 * Renvoie les couleurs corrigées + la trace de chaque correction.
 */
function normalizeBlock(hexColors, label) {
  const out = { ...hexColors };
  const adjustments = [];

  /**
   * Couples « texte sur accent ». Priorité à la FIDÉLITÉ de l'accent : la
   * teinte officielle n'est jamais déplacée pour faire passer un texte. Si le
   * couple officiel est sous le seuil, on bascule d'abord le TEXTE en noir ou
   * blanc (au meilleur ratio) — deux valeurs neutres, aucune invention de
   * couleur — et only en dernier recours on déplace la surface.
   */
  const apply = (surfaceKey, fgKey, tokenLabel) => {
    const surface = out[surfaceKey];
    const officialFg = out[fgKey];
    const official = contrast(surface, officialFg);
    if (official >= TARGET) return;

    const black = contrast(surface, '#000000');
    const white = contrast(surface, '#ffffff');
    const best = black >= white ? { fg: '#000000', r: black } : { fg: '#ffffff', r: white };
    if (best.r >= TARGET) {
      out[fgKey] = best.fg;
      adjustments.push({
        block: label,
        pair: tokenLabel,
        from: Number(official.toFixed(2)),
        to: Number(best.r.toFixed(2)),
        reason: `${label} / ${tokenLabel.split(' ')[0]} : texte passé en ${best.fg === '#000000' ? 'noir' : 'blanc'}, accent officiel conservé`,
      });
      return;
    }

    const fixed = ensurePair(surface, officialFg, `${label} / ${tokenLabel}`);
    if (!fixed.changed) return;
    if (fixed.bg.toLowerCase() !== out[surfaceKey].toLowerCase()) out[surfaceKey] = fixed.bg;
    if (fixed.fg.toLowerCase() !== out[fgKey].toLowerCase()) out[fgKey] = fixed.fg;
    adjustments.push({
      block: label,
      pair: tokenLabel,
      from: Number(official.toFixed(2)),
      to: Number(fixed.ratio.toFixed(2)),
      reason: fixed.reason,
    });
  };

  // a. texte posé sur l'accent. L'accent n'est pas déplacé : l'anneau de
  //    focus reste donc, lui aussi, exactement la couleur demandée.
  apply('pri', 'pri-fg', 'primary-foreground sur primary');
  out.ring = out.pri;

  // b. texte secondaire : doit passer sur le fond ET sur la carte.
  const onBg = ensurePair(out.bg, out['mut-fg'], `${label} / muted-foreground`);
  let mutedFg = onBg.fg;
  if (contrast(out.card, mutedFg) < TARGET) {
    mutedFg = ensurePair(out.card, mutedFg, `${label} / muted-foreground (carte)`).fg;
  }
  if (mutedFg.toLowerCase() !== out['mut-fg'].toLowerCase()) {
    adjustments.push({
      block: label,
      pair: 'muted-foreground sur background/card',
      from: Number(contrast(hexColors.bg, hexColors['mut-fg']).toFixed(2)),
      to: Number(Math.min(contrast(out.bg, mutedFg), contrast(out.card, mutedFg)).toFixed(2)),
      reason: `${label} / --muted-foreground : luminosité ajustée`,
    });
    out['mut-fg'] = mutedFg;
  }

  // c. autres couples texte/surface.
  apply('sec', 'sec-fg', 'secondary-foreground sur secondary');
  apply('acc', 'acc-fg', 'accent-foreground sur accent');
  apply('des', 'des-fg', 'destructive-foreground sur destructive');

  return { colors: out, adjustments };
}

/* ------------------------------------------------------------- génération */

const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
const themes = data.themes;
if (!Array.isArray(themes) || themes.length === 0) throw new Error('aucun thème dans la source');
const defaults = themes.filter((t) => t.default);
if (defaults.length !== 1) throw new Error(`exactement un thème par défaut attendu, trouvé ${defaults.length}`);

const css = [
  '/*',
  ' * vendored-themes.css — GÉNÉRÉ par scripts/import-vendored-themes.mjs',
  ' * NE PAS ÉDITER À LA MAIN. Source : scripts/data/vendored-themes.json',
  ' * (payloads `registry:style` récupérés VERBATIM sur tweakcn.com/r/themes/<id>).',
  ' * Seule transformation : oklch → hex sRGB (voir l’en-tête du script).',
  ' * Activation : <html data-preset="<id>"> (+ data-theme="dark" pour le sombre).',
  ' */',
  '',
];

const allAdjustments = [];
const hexFor = (theme, mode) => {
  const raw = theme[mode];
  const hex = {};
  for (const short of Object.keys(TOKENS)) {
    if (!raw[short]) throw new Error(`jeton manquant : ${theme.id}/${mode}/${short}`);
    hex[short] = colorOrThrow(TOKENS[short], raw[short]);
  }
  return hex;
};

for (const t of themes) {
  const lightNorm = normalizeBlock(hexFor(t, 'light'), `${t.id} (clair)`);
  const darkNorm = normalizeBlock(hexFor(t, 'dark'), `${t.id} (sombre)`);
  t._light = lightNorm.colors;
  t._dark = darkNorm.colors;
  allAdjustments.push(...lightNorm.adjustments, ...darkNorm.adjustments);

  const light = blockVars(t._light, t);
  const dark = blockVars(t._dark, t);
  const tag = t.darkOnly ? ' — thème sombre : clair ≡ sombre' : '';
  css.push(`/* ${t.label} — ${t.source}${tag} */`);
  css.push(`:root[data-preset='${t.id}'] {`);
  css.push(light);
  css.push('}', '');
  css.push(`/* ${t.label} — sombre */`);
  css.push(`:root[data-theme='dark'][data-preset='${t.id}'] {`);
  css.push(dark);
  css.push('}', '');
}

const ts = [
  '/**',
  ' * GÉNÉRÉ par scripts/import-vendored-themes.mjs — NE PAS ÉDITER À LA MAIN.',
  ' * Thèmes tweakcn demandés au contrat n°3, servis par le registre officiel.',
  ' * `swatch` = couleur primaire du mode clair (pastille de l’écran Apparence).',
  ' */',
  'export interface VendoredPresetMeta {',
  '  id: string;',
  '  label: string;',
  '  swatch: string;',
  '  bg: string;',
  '  card: string;',
  '  fg: string;',
  '  primary: string;',
  '  accent: string;',
  '  muted: string;',
  '  primaryFg: string;',
  '  /** URL du registre officiel d’où viennent les valeurs (traçabilité). */',
  '  source: string;',
  '  /** Thème conçu pour le sombre : `:root` ≡ `.dark` chez tweakcn. */',
  '  darkOnly: boolean;',
  '  /** Thème appliqué au premier lancement. */',
  '  isDefault: boolean;',
  '}',
  '',
  'export const VENDORED_PRESETS: VendoredPresetMeta[] = [',
];

for (const t of themes) {
  const hex = (mode, key) => (mode === 'light' ? t._light : t._dark)[key];
  const row = {
    id: t.id,
    label: t.label,
    swatch: hex('light', 'pri'),
    bg: hex('light', 'bg'),
    card: hex('light', 'card'),
    fg: hex('light', 'fg'),
    primary: hex('light', 'pri'),
    accent: hex('light', 'acc'),
    muted: hex('light', 'mut'),
    primaryFg: hex('light', 'pri-fg'),
    source: t.source,
    darkOnly: Boolean(t.darkOnly),
    isDefault: Boolean(t.default),
  };
  ts.push(
    '  { ' +
      Object.entries(row)
        .map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`)
        .join(', ') +
      ' },',
  );
}
ts.push('];', '');
ts.push('export const DEFAULT_VENDORED_PRESET_ID =');
ts.push(`  '${defaults[0].id}';`);
ts.push('');

const report = [
  '# Contraste des thèmes ajoutés (contrat n°3)',
  '',
  'Généré par `node scripts/import-vendored-themes.mjs`. Ne pas éditer à la main.',
  '',
  `Seuil appliqué : **AA ${TARGET}:1**. Règle : teinte et saturation de l’accent`,
  'conservées, luminosité déplacée ; à défaut, texte noir ou blanc au meilleur',
  'ratio. Les blocs non listés sont conformes **d’origine** (valeur officielle).',
  '',
  allAdjustments.length === 0
    ? 'Aucune correction : tous les thèmes sont conformes d’origine.'
    : `| Bloc | Paire | Avant | Après | Motif |\n| --- | --- | --- | --- | --- |\n${allAdjustments
        .map(
          (a) =>
            `| ${a.block} | ${a.pair} | ${a.from.toFixed(2)}:1 | ${a.to.toFixed(2)}:1 | ${a.reason.replace(/\|/g, '\\|')} |`,
        )
        .join('\n')}`,
  '',
];

const outputs = [
  [CSS_PATH, css.join('\n')],
  [TS_PATH, ts.join('\n')],
  [REPORT_PATH, report.join('\n')],
];

let drift = 0;
for (const [path, content] of outputs) {
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (current === content) {
    console.log(`[ok] ${path.replace(root + '/', '')} à jour`);
    continue;
  }
  drift++;
  if (CHECK_ONLY) {
    console.error(`[drift] ${path.replace(root + '/', '')} diffère de la source`);
  } else {
    writeFileSync(path, content);
    console.log(`[écrit] ${path.replace(root + '/', '')}`);
  }
}

// Rapport lisible : ce qui a servi à décider, et de quoi le vérifier.
console.log(`[thèmes] ${themes.length} presets, défaut = ${defaults[0].id}`);
console.log(`[contraste] ${allAdjustments.length} correction(s) AA documentée(s)`);
for (const t of themes) {
  console.log(
    `  - ${t.id.padEnd(18)} ${t.label.padEnd(18)} radius=${t.radius.padEnd(8)} ` +
      `scale=${radiusScale(t.radius).toString().padEnd(6)} ${t.darkOnly ? 'sombre only' : 'clair+sombre'}`,
  );
}

if (CHECK_ONLY && drift > 0) process.exit(1);
