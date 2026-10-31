#!/usr/bin/env node
/**
 * Traitement d'image « tirage premium » — la passe qui enlève le rendu brut.
 *
 * Pourquoi ce script existe
 * -------------------------
 * Une image sortie d'un modèle est **plate** : noirs laiteux, micro-contraste
 * absent, netteté diffuse, balance des blancs quelconque. Mise telle quelle
 * dans un thème plein écran, elle respire le fichier non retouché. Les
 * sélecteurs de thèmes soignés (TickTick, entre autres) ne montrent jamais
 * l'image brute : ils montrent un **tirage**, c'est-à-dire une image dont on a
 * verrouillé le point noir, la courbe, la chaleur, la netteté et les bords.
 *
 * La chaîne ci-dessous est volontairement courte, ordonnée et mesurable :
 *
 *   1. **Densité**   — point noir/point blanc resserrés, puis courbe en S
 *                      (`-level` puis `-sigmoidal-contrast`). C'est ce qui
 *                      supprime le voile laiteux sans brûler les hautes
 *                      lumières. La densité vient de là, pas d'un `-brightness`.
 *   2. **Chaleur**   — le rouge monte, le bleu descend d'autant que le vert
 *                      reste : décalage chaud neutre, sans virer à l'orange.
 *   3. **Saturation**— +8 %, pour compenser la perte de couleur du resserrage.
 *   4. **Netteté**   — deux rayons : `0x1.0` pour le micro-contraste qui fait
 *                      « net », `0x0.5` pour le piqué des bords fins. Un seul
 *                      rayon donne soit du flou granuleux, soit des halos.
 *   5. **Bords**     — vignettage léger (−8 %) qui recentre le regard et
 *                      empêche le fond de « flotter » au bord de l'écran.
 *
 * Ordre imposé : la netteté passe **après** le redimensionnement. Netteté
 * avant, puis réduction = netteté perdue ; c'est l'erreur classique.
 *
 * Usage
 * -----
 *   node scripts/themes/theme-treat.mjs <src> <dest> [--strength light|standard|strong]
 *                                              [--format landscape|portrait]
 *   node scripts/themes/theme-treat.mjs --batch <dir-in> <dir-out> --format landscape
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const BIN = (() => {
  for (const bin of ['magick', 'convert']) {
    try {
      execFileSync(bin, ['-version'], { stdio: 'ignore' });
      return bin;
    } catch {
      /* suivant */
    }
  }
  throw new Error('ImageMagick introuvable (ni `magick` ni `convert`).');
})();

/**
 * Trois dosages. `standard` est le réglage par défaut ; `strong` s'adresse aux
 * sources visiblement laiteuses ou désaturées ; `light` aux images déjà
 * travaillées qu'il ne faut pas écraser.
 */
export const TREAT_PRESETS = {
  light: {
    blackPoint: 0.8,
    whitePoint: 99.2,
    sigmoid: 2.2,
    warmR: 1.02,
    warmB: 0.985,
    saturation: 104,
    brightness: 101,
    microAmount: 0.55,
    edgeAmount: 0.3,
    vignette: 5,
  },
  standard: {
    blackPoint: 1.6,
    whitePoint: 99.0,
    sigmoid: 3.2,
    warmR: 1.035,
    warmB: 0.972,
    saturation: 108,
    brightness: 102,
    microAmount: 0.85,
    edgeAmount: 0.45,
    vignette: 8,
  },
  strong: {
    blackPoint: 2.6,
    whitePoint: 98.4,
    sigmoid: 4.2,
    warmR: 1.05,
    warmB: 0.958,
    saturation: 113,
    brightness: 103,
    microAmount: 1.15,
    edgeAmount: 0.6,
    vignette: 11,
  },
};


/**
 * Vignettage par **multiplication**, et non par `-vignette` d'ImageMagick 6 :
 * cette dernière compose un halo *blanc* autour de l'image et éclaircit tout
 * (mesuré : 0,239 -> 0,620 sur une photo sombre). On fabrique donc un dégradé
 * radial blanc -> gris et on multiplie : le centre reste intact, les bords
 * s'assombrissent de `strength` pour cent.
 */
function buildVignette(src, strength) {
  const [w, h] = execFileSync(BIN, [src, '-format', '%w %h', 'info:'], { encoding: 'utf8' })
    .trim()
    .split(/\s+/)
    .map(Number);
  const edge = Math.round(255 * (1 - strength / 100));
  const hex = `#${edge.toString(16).padStart(2, '0').repeat(3)}`;
  const out = join(tmpdir(), `theme-vig-${process.pid}-${Math.random().toString(36).slice(2)}.png`);
  execFileSync(BIN, ['-size', `${w}x${h}`, `radial-gradient:white-${hex}`, out], { stdio: 'ignore' });
  return out;
}

/**
 * Traite une image. `dest` peut être identique à `src` (écriture en deux
 * temps) et l'extension décide du format de sortie (`img.format`).
 */
export function treat(src, dest, { strength = 'standard', format } = {}) {
  if (!TREAT_PRESETS[strength]) {
    throw new Error(`force inconnue : ${strength} (light|standard|strong)`);
  }
  if (!existsSync(src)) throw new Error(`source absente : ${src}`);
  const p = TREAT_PRESETS[strength];
  mkdirSync(dirname(dest), { recursive: true });
  const ext = extname(dest).slice(1) || 'webp';

  const tmp = `${dest}.treat-${process.pid}.png`;
  const vig = buildVignette(src, p.vignette);
  // Chaîne dans l'ordre : densité -> chaleur -> saturation -> netteté -> bords.
  execFileSync(
    BIN,
    [
      src, '-auto-orient',
      // 1. densité
      '-level', `${p.blackPoint}%,${p.whitePoint}%`,
      '-sigmoidal-contrast', `${p.sigmoid},50%`,
      // 2. chaleur
      '-channel', 'R', '-evaluate', 'multiply', String(p.warmR), '+channel',
      '-channel', 'B', '-evaluate', 'multiply', String(p.warmB), '+channel',
      // 3. saturation / luminosité
      '-modulate', `${p.brightness},${p.saturation},100`,
      // 4. netteté en deux rayons
      '-unsharp', `0x1.0+${p.microAmount}+0.015`,
      '-unsharp', `0x0.5+${p.edgeAmount}+0`,
      // 5. bords : vignettage multiplicatif (voir buildVignette)
      vig, '-compose', 'multiply', '-composite',
      ...(ext === 'webp' ? ['-quality', '86', '-define', 'webp:method=6'] : []),
      ...(ext === 'jpg' || ext === 'jpeg' ? ['-quality', '88', '-sampling-factor', '4:2:0'] : []),
      `${ext === 'webp' ? 'webp:' : ext === 'jpg' || ext === 'jpeg' ? 'jpeg:' : ''}${tmp}`,
    ],
    { stdio: 'ignore' },
  );

  // Le format final est choisi par le préfixe ; on renomme vers `dest`.
  execFileSync('mv', ['-f', tmp, dest]);
  execFileSync('rm', ['-f', vig]);
  return { dest, bytes: statSync(dest).size };
}

/** Mesures objectives — servent à prouver le traitement, pas à le décorer. */
export function measure(file) {
  const read = (args) => execFileSync(BIN, [file, ...args], { encoding: 'utf8' }).trim();
  const mean = Number(read(['-format', '%[fx:mean]', 'info:']));
  const std = Number(read(['-format', '%[fx:standard_deviation]', 'info:']));
  const edge = Number(
    execFileSync(BIN, [file, '-colorspace', 'Gray', '-edge', '1', '-format', '%[fx:mean]', 'info:'], {
      encoding: 'utf8',
    }).trim(),
  );
  return { mean, std, edge };
}

/* ------------------------------ CLI ------------------------------ */
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const argv = process.argv.slice(2);
  const arg = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? fallback : argv[i + 1];
  };
  const has = (name) => argv.includes(`--${name}`);
  const strength = arg('strength', 'standard');

  if (has('batch')) {
    const i = argv.indexOf('--batch');
    const [srcDir, outDir] = [argv[i + 1], argv[i + 2]];
    if (!srcDir || !outDir) {
      console.error('usage: --batch <dir-in> <dir-out> [--format landscape|portrait] [--strength ...]');
      process.exit(2);
    }
    const files = readdirSync(srcDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    let total = 0;
    for (const f of files) {
      const dest = join(outDir, `${basename(f, extname(f))}.webp`);
      treat(join(srcDir, f), dest, { strength, format: arg('format') });
      total += 1;
    }
    console.log(`${total} image(s) traitée(s) -> ${outDir}`);
    process.exit(0);
  }

  const [src, dest] = argv.filter((a) => !a.startsWith('--') && !a.startsWith('='));
  if (!src || !dest) {
    console.error('usage: node scripts/themes/theme-treat.mjs <src> <dest> [--strength light|standard|strong]');
    process.exit(2);
  }
  const before = measure(src);
  treat(src, dest, { strength, format: arg('format') });
  const after = measure(dest);
  const pct = (a, b) => `${(((b - a) / a) * 100).toFixed(0)}%`;
  console.log(`${dest}`);
  console.log(`  contraste (écart-type) : ${before.std.toFixed(3)} -> ${after.std.toFixed(3)}  (${pct(before.std, after.std)})`);
  console.log(`  netteté   (énergie bords) : ${before.edge.toFixed(4)} -> ${after.edge.toFixed(4)}  (${pct(before.edge, after.edge)})`);
  console.log(`  luminosité moyenne : ${before.mean.toFixed(3)} -> ${after.mean.toFixed(3)}`);
}
