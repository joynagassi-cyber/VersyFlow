#!/usr/bin/env node
/**
 * Normalisation du contraste des presets tweakcn.
 *
 * POURQUOI. `scripts/import-official-themes.mjs` recopie les palettes
 * officielles verbatim. Or 17 des 25 presets servis ont un texte posé sur
 * `--primary` sous le seuil WCAG AA de 4,5:1 (pire cas mesuré : 2,28:1 sur
 * ocean-breeze). Servir une teinte officielle illisible n'est pas du respect
 * de la source, c'est un défaut de livraison.
 *
 * CE QUE FAIT LE SCRIPT, dans cet ordre :
 *  1. garde le couple d'origine s'il passe déjà 4,5:1 (aucune réécriture) ;
 *  2. sinon, ajuste la LUMINOSITÉ de `--primary` par pas de 1 % (teinte et
 *     saturation préservées, 12 pas maximum) jusqu'à ce que le texte
 *     d'origine atteigne 4,5:1 ;
 *  3. si la borne est atteinte sans succès, prend le meilleur du noir et du
 *     blanc (c'est ce qui rend lisible un vert clair ou un corail) ;
 *  4. même traitement pour `--muted-foreground` contre le fond ET la carte.
 *
 * Les corrections sont déterministes et consignées dans
 * `docs/design/preset-contrast-report.md`. Relancer le script ne change rien
 * (idempotent) : une valeur déjà conforme n'est jamais retouchée.
 *
 * Usage : node scripts/apply-preset-contrast.mjs [--check]
 *   --check : n'écrit rien, sort en code 1 si une correction serait nécessaire.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CSS_PATH = resolve(root, 'src/styles/tweakcn-presets.css');
const TS_PATH = resolve(root, 'src/theme/tweakcn-presets.ts');
const REPORT_PATH = resolve(root, 'docs/design/preset-contrast-report.md');
const CHECK_ONLY = process.argv.includes('--check');

export const TARGET = 4.5;
const MAX_STEPS = 12;

/* ---------------------------------------------------------------- couleurs */

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex([r, g, b]) {
  const p = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${p(r)}${p(g)}${p(b)}`;
}

const channel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ------------------------------------------------------------------- HSL */

export function rgbToHsl([r, g, b]) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}

export function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
}

/** Déplace la luminosité d'une couleur en préservant teinte et saturation. */
function shiftLightness(hex, delta) {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb([h, s, Math.max(0, Math.min(1, l + delta))]));
}

/* ------------------------------------------------------- règle de décision */

/**
 * Rapproche `fg` (texte) de `bg` jusqu'à 4,5:1.
 * Renvoie { bg, fg, ratio, changed, reason }.
 */
export function ensurePair(bg, fg, label = '') {
  const initial = contrast(bg, fg);
  if (initial >= TARGET) {
    return { bg, fg, ratio: initial, changed: false, reason: 'conforme d’origine' };
  }

  // 1. garder la teinte, ajuster la luminosité du fond dans le sens utile :
  //    un texte CLAIR exige d'ASSOMBRIR le fond, et inversement.
  const fgIsLighter = luminance(fg) > luminance(bg);
  for (let step = 1; step <= MAX_STEPS; step++) {
    const candidate = shiftLightness(bg, (fgIsLighter ? -0.01 : 0.01) * step);
    if (contrast(candidate, fg) >= TARGET) {
      return {
        bg: candidate,
        fg,
        ratio: contrast(candidate, fg),
        changed: true,
        reason: `${label} : luminosité ajustée (${initial.toFixed(2)} → ${contrast(candidate, fg).toFixed(2)})`,
      };
    }
  }

  // 2. sinon, noir ou blanc, au meilleur ratio.
  const black = contrast(bg, '#000000');
  const white = contrast(bg, '#ffffff');
  const best = black >= white ? { fg: '#000000', r: black } : { fg: '#ffffff', r: white };
  if (best.r < TARGET) {
    // 3. dernier recours : éloigner encore le fond, en gardant la teinte.
    const black = best.fg === '#000000';
    for (let step = 1; step <= 40; step++) {
      const candidate = shiftLightness(bg, (black ? 0.01 : -0.01) * step);
      if (contrast(candidate, best.fg) >= TARGET) {
        return {
          bg: candidate,
          fg: best.fg,
          ratio: contrast(candidate, best.fg),
          changed: true,
          reason: `${label} : fond éclairci/assombri au-delà de la borne`,
        };
      }
    }
  }
  return {
    bg,
    fg: best.fg,
    ratio: best.r,
    changed: true,
    reason: `${label} : texte passé en ${best.fg === '#000000' ? 'noir' : 'blanc'} (${initial.toFixed(2)} → ${best.r.toFixed(2)})`,
  };
}

/* -------------------------------------------------------------- traitement */

const css = readFileSync(CSS_PATH, 'utf8');
// Deux blocs par preset : `:root[data-preset='x']` (clair) et
// `:root[data-theme='dark'][data-preset='x']` (sombre). Le sélecteur est lu
// en entier pour ne jamais laisser le mode sombre sous le seuil.
const blockRe = /(:root((?:\[[^\]]+\])+)\s*\{)([^}]*)(\})/g;
const presetBlocks = (source) =>
  [...source.matchAll(blockRe)]
    .filter((m) => /data-preset=/.test(m[2]))
    .map((m) => ({
      whole: m[0],
      open: m[1],
      body: m[3],
      close: m[4],
      name: (m[2].match(/data-preset=['"]([a-z0-9-]+)['"]/) || [])[1],
      dark: /data-theme=['"]dark['"]/.test(m[2]),
    }));
const adjustments = [];
let updatedCss = css;
let corrections = 0;

for (const block of presetBlocks(css)) {
  const { whole, open, name, body, close, dark } = block;
  const label = `${name}${dark ? ' (sombre)' : ''}`;
  const read = (token) => {
    const m = body.match(new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{6});`));
    return m ? m[1] : null;
  };

  const bg = read('background');
  const card = read('card');
  const primary = read('primary');
  const primaryFg = read('primary-foreground');
  const mutedFg = read('muted-foreground');
  if (!bg || !primary || !primaryFg) continue;

  let nextBody = body;

  // a. texte posé sur l'accent
  const onPrimary = ensurePair(primary, primaryFg, `${label} / --primary-foreground`);
  if (onPrimary.changed) {
    corrections++;
    adjustments.push({ preset: label, pair: 'primary-foreground sur primary', from: contrast(primary, primaryFg), to: onPrimary.ratio, note: onPrimary.reason });
    if (onPrimary.bg.toLowerCase() !== primary.toLowerCase()) {
      nextBody = nextBody.replace(/--primary:\s*#[0-9a-fA-F]{6};/, `--primary: ${onPrimary.bg};`);
      // --ring suit l'accent : un anneau de focus d'une autre couleur que l'action trompe.
      nextBody = nextBody.replace(/--ring:\s*#[0-9a-fA-F]{6};/, `--ring: ${onPrimary.bg};`);
    }
    if (onPrimary.fg !== primaryFg) {
      nextBody = nextBody.replace(/--primary-foreground:\s*#[0-9a-fA-F]{6};/, `--primary-foreground: ${onPrimary.fg};`);
    }
  }

  // b. texte secondaire : doit passer 4,5:1 sur le fond ET sur la carte.
  if (mutedFg) {
    const surfaces = [bg, card].filter(Boolean);
    const worstRatio = Math.min(...surfaces.map((surface) => contrast(surface, mutedFg)));
    if (worstRatio < TARGET) {
      const [h, sat, l] = rgbToHsl(hexToRgb(mutedFg));
      // On ne touche pas au fond (identité de la palette) : on éloigne le texte.
      // Les deux directions sont essayées, la plus petite qui satisfait gagne.
      let bestFix = null;
      for (const dir of [-1, 1]) {
        for (let step = 1; step <= 60; step++) {
          const candidate = rgbToHex(hslToRgb([h, sat, Math.max(0, Math.min(1, l + dir * 0.01 * step))]));
          const ratios = surfaces.map((surface) => contrast(surface, candidate));
          if (Math.min(...ratios) >= TARGET) {
            if (!bestFix || step < bestFix.step) {
              bestFix = { hex: candidate, step, ratio: Math.min(...ratios) };
            }
            break;
          }
        }
      }
      if (bestFix) {
        corrections++;
        adjustments.push({
          preset: label,
          pair: 'muted-foreground sur background/card',
          from: worstRatio,
          to: bestFix.ratio,
          note: `${label} / --muted-foreground : luminosité ajustée de ${bestFix.step} %`,
        });
        nextBody = nextBody.replace(/--muted-foreground:\s*#[0-9a-fA-F]{6};/, `--muted-foreground: ${bestFix.hex};`);
      }
    }
  }

  if (nextBody !== body) {
    updatedCss = updatedCss.replace(whole, `${open}${nextBody}${close}`);
  }
}

if (CHECK_ONLY) {
  if (updatedCss !== css) {
    console.error(`[preset-contrast] ${corrections} correction(s) de contraste resteraient à appliquer.`);
    process.exit(1);
  }
  console.log('[preset-contrast] tous les presets sont conformes (≥ 4,5:1).');
  process.exit(0);
}

if (updatedCss !== css) {
  writeFileSync(CSS_PATH, updatedCss);
  console.log(`[preset-contrast] ${corrections} correction(s) → ${CSS_PATH}`);
}

/* --------- synchronisation des métadonnées TS (aucune divergence possible) */

let ts = readFileSync(TS_PATH, 'utf8');
let tsChanged = 0;
for (const { name, body, dark } of presetBlocks(updatedCss)) {
  if (dark) continue;
  const read = (token) => {
    const m = body.match(new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{6});`));
    return m ? m[1] : null;
  };
  const primary = read('primary');
  const primaryFg = read('primary-foreground');
  if (!primary) continue;
  const lineRe = new RegExp(`(\\{ id: '${name}',[^\\n]*?primary: ')#[0-9a-fA-F]{6}('.*?primaryFg: ')#[0-9a-fA-F]{6}(')`);
  if (lineRe.test(ts)) {
    const next = ts.replace(lineRe, `$1${primary}$2${primaryFg}$3`);
    if (next !== ts) {
      ts = next;
      tsChanged++;
    }
  }
}
if (tsChanged) {
  writeFileSync(TS_PATH, ts);
  console.log(`[preset-contrast] ${tsChanged} entrée(s) de PRESETS resynchronisée(s)`);
}

/* ---------------------------------------------------------------- rapport */

const lines = [
  '# Rapport de contraste des presets',
  '',
  'Généré par `node scripts/apply-preset-contrast.mjs`. Ne pas éditer à la main.',
  '',
  `Seuil appliqué : **${TARGET}:1** (WCAG AA, texte courant).`,
  '',
  adjustments.length
    ? '| Preset | Couple | Avant | Après | Décision |'
    : 'Aucun ajustement nécessaire : toutes les paires passent déjà le seuil.',
  ...(adjustments.length ? ['| --- | --- | --- | --- | --- |'] : []),
  ...adjustments.map(
    (a) => `| ${a.preset} | ${a.pair} | ${a.from.toFixed(2)}:1 | ${a.to.toFixed(2)}:1 | ${a.note} |`,
  ),
  '',
];
writeFileSync(REPORT_PATH, lines.join('\n'));
console.log(`[preset-contrast] rapport → ${REPORT_PATH}`);
