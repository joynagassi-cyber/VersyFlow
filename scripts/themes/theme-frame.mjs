#!/usr/bin/env node
/**
 * Passe de cadrage déterministe — la signature commune des thèmes illustrés.
 *
 * Pourquoi ce script existe
 * -------------------------
 * Une banque de thèmes devient « premium » non pas parce que chaque image est
 * jolie, mais parce que 100 images différentes se lisent comme **une seule
 * famille**. Un modèle d'image ne garantit jamais ça : il change de palette,
 * de point de fuite et de densité d'une génération à l'autre.
 *
 * Ce script applique donc, après la génération, les trois invariants que le
 * modèle ne tient pas :
 *
 *   1. **Voile bas** — dégradé transparent -> noir 34 % sur les 46 % du bas.
 *      C'est ce qui rend le texte lisible sans assombrir toute l'image.
 *   2. **Sceau d'angle** — pastille d'accent en haut à gauche, à position et
 *      diamètre fixes. C'est le repère de marque : présent sur les 200
 *      vignettes, il transforme une collection en catalogue.
 *   3. **Grain** — bruit monochrome fin (2,5 %), qui casse les dégradés
 *      vectoriels trop lisses et fait « imprimé » plutôt que « généré ».
 *
 * Usage
 * -----
 *   node scripts/themes/theme-frame.mjs <src> <dest> --format landscape [--accent '#1E8449']
 *   node scripts/themes/theme-frame.mjs --batch <dir> --accent-map map.json
 *
 * Le script est idempotent : repasser une image déjà cadrée double le voile.
 * Il consomme donc toujours une source brute, jamais une sortie.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** Géométrie des deux cadrages, alignée sur `photo-scenes.mjs`. */
export const FRAME_SIZES = {
  landscape: { width: 1248, height: 832 },
  portrait: { width: 832, height: 1248 },
};

/** Réglages de la signature — identiques pour les 200 visuels. */
export const FRAME_SIGNATURE = {
  /** Hauteur du voile bas, en fraction de la hauteur d'image. */
  veilHeight: 0.46,
  /** Opacité maximale du voile, en fraction. */
  veilOpacity: 0.34,
  /** Diamètre du sceau d'angle, en fraction de la largeur. */
  sealDiameter: 0.055,
  /** Marge du sceau, en fraction de la largeur. */
  sealMargin: 0.052,
  /** Intensité du grain, en pourcentage. */
  grain: 2.5,
};

function magickBin() {
  for (const bin of ['magick', 'convert']) {
    try {
      execFileSync(bin, ['-version'], { stdio: 'ignore' });
      return bin;
    } catch {
      /* binaire suivant */
    }
  }
  throw new Error('ImageMagick introuvable (ni `magick` ni `convert`).');
}

const BIN = magickBin();

/**
 * Fabrique le calque de signature (voile + sceau) avec les primitives
 * d'ImageMagick. Pas de SVG : le délégué `rsvg` n'est pas garanti présent.
 *
 * Le voile est un noir dont l'alpha monte linéairement de 0 à `veilOpacity`
 * du haut du calque vers le bas ; le sceau est empilé par-dessus.
 */
function buildOverlay(format, accent) {
  const { width: w, height: h } = FRAME_SIZES[format];
  const { veilHeight, veilOpacity, sealDiameter, sealMargin } = FRAME_SIGNATURE;
  const veilH = Math.round(h * veilHeight);
  const veilTop = h - veilH;
  const seal = Math.round(w * sealDiameter);
  const margin = Math.round(w * sealMargin);
  const cx = margin + seal / 2;
  const cy = margin + veilH - veilH + seal / 2; // marge depuis le haut de l'image

  const overlay = `${process.pid}-overlay.png`;
  const veil = `${process.pid}-veil.png`;

  // Voile : aplats noir + rampe d'alpha, puis opacité maximale.
  execFileSync(
    BIN,
    ['-size', `${w}x${veilH}`, 'xc:black', '(', '-size', `${w}x${veilH}`, 'gradient:black-white', ')',
      '-alpha', 'off', '-compose', 'CopyOpacity', '-composite',
      '-channel', 'A', '-evaluate', 'multiply', String(veilOpacity), '+channel', veil],
    { stdio: 'ignore' },
  );

  // Calque complet, transparent, avec le voile posé en bas.
  execFileSync(
    BIN,
    ['-size', `${w}x${h}`, 'xc:none', veil, '-geometry', `+0+${veilTop}`, '-composite', overlay],
    { stdio: 'ignore' },
  );

  // Ruban de coin : une bande verticale à la couleur du thème, suspendue au
  // bord haut. Plus discret qu'une pastille, et lisible à 200 px de large.
  const ribbonW = Math.round(w * 0.026);
  const ribbonH = Math.round(h * 0.085);
  const ribbonX = Math.round(w * 0.048);

  // Filet intérieur : 1 px ivoire à 10 %, le cadre des livres de photo.
  const inset = Math.round(w * 0.016);
  execFileSync(
    BIN,
    [overlay, '-fill', 'none', '-stroke', 'rgba(253,251,247,0.10)', '-strokewidth', '1',
      '-draw', `rectangle ${inset},${inset} ${w - inset},${h - inset}`,
      '-stroke', 'none', '-fill', accent,
      '-draw', `roundrectangle ${ribbonX},0 ${ribbonX + ribbonW},${ribbonH} ${ribbonW / 2},${ribbonW / 2}`,
      overlay],
    { stdio: 'ignore' },
  );

  return { overlay, veil };
}

/**
 * Applique la signature. `src` doit être une source brute (non cadrée) ;
 * `dest` peut être identique à `src` (écriture en deux temps).
 */
export function applyFrame(src, dest, { format, accent = '#1E8449' } = {}) {
  if (!FRAME_SIZES[format]) {
    throw new Error(`format inconnu : ${format} (attendu landscape|portrait)`);
  }
  if (!existsSync(src)) throw new Error(`source absente : ${src}`);
  mkdirSync(dirname(dest), { recursive: true });

  const { width: w, height: h } = FRAME_SIZES[format];
  const tmp = `${dest}.frame-${process.pid}.png`;

  // 1. normalisation : recadrage au centre sur la cible, puis mise à l'échelle.
  execFileSync(
    BIN,
    [src, '-auto-orient', '-resize', `${w}x${h}^`, '-gravity', 'center',
      '-extent', `${w}x${h}`, '-strip', tmp],
    { stdio: 'ignore' },
  );

  // 2. voile + sceau.
  const { overlay: layer, veil } = buildOverlay(format, accent);
  execFileSync(BIN, [tmp, layer, '-composite', tmp], { stdio: 'ignore' });

  // 3. grain + écriture finale.
  execFileSync(
    BIN,
    [tmp, '-attenuate', String(FRAME_SIGNATURE.grain / 10), '+noise', 'Gaussian',
      '-quality', '88', dest],
    { stdio: 'ignore' },
  );

  for (const f of [tmp, layer, veil]) {
    try {
      execFileSync('rm', ['-f', f]);
    } catch {
      /* nettoyage best-effort */
    }
  }
  return { width: w, height: h, bytes: statSync(dest).size };
}

/* ------------------------------ CLI ------------------------------ */
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const argv = process.argv.slice(2);
  const arg = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? fallback : argv[i + 1];
  };
  const [src, dest] = argv.filter((a) => !a.startsWith('--') && !a.startsWith('#'));
  if (!src || !dest) {
    console.error(
      'usage: node scripts/themes/theme-frame.mjs <src> <dest> --format landscape|portrait [--accent #RRGGBB]',
    );
    process.exit(2);
  }
  const out = applyFrame(src, dest, { format: arg('format', 'landscape'), accent: arg('accent', '#1E8449') });
  console.log(`${dest} — ${out.width}×${out.height}, ${Math.round(out.bytes / 1024)} Ko`);
}
