#!/usr/bin/env node
/**
 * Calibrage automatique d'un visuel de thème sur le profil de référence.
 *
 * Principe
 * --------
 * On ne choisit plus des réglages « à l'œil » : on **vise des cibles
 * mesurées** (`docs/design/theme-tone-targets.json`, extraites du sélecteur
 * de thèmes de TickTick) et on corrige par boucle fermée. Chaque itération :
 *
 *   1. applique la recette courante **à la source d'origine** (jamais à la
 *      sortie précédente — sinon les artefacts s'empilent et les noirs
 *      finissent bouchés) ;
 *   2. mesure le résultat ;
 *   3. corrige chaque paramètre dans le sens de l'erreur, avec un amortissement
 *      pour éviter l'oscillation.
 *
 * Paramètres pilotés : point noir / point blanc (niveaux), force sigmoïde
 * (contraste), luminosité, saturation, netteté en deux rayons, chaleur.
 *
 * Pourquoi ça compte : quatre images traitées à la main donneront quatre
 * rendus. Une boucle qui vise la même cible donnera **cent visuels qui se
 * ressemblent**, ce qui est exactement ce qui manque aujourd'hui.
 *
 * Usage
 * -----
 *   node scripts/themes/theme-autotune.mjs <src> <dest> [--iter 6] [--target file.json]
 *   node scripts/themes/theme-autotune.mjs --batch <dir-in> <dir-out> [--limit 10]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { measure, hueShift } from './theme-metrics.mjs';

const BIN = (() => {
  for (const bin of ['magick', 'convert']) {
    try {
      execFileSync(bin, ['-version'], { stdio: 'ignore' });
      return bin;
    } catch {
      /* suivant */
    }
  }
  throw new Error('ImageMagick introuvable.');
})();

/** Axes que la boucle cherche à égaler, avec leur poids dans le score. */
export const TUNING_AXES = {
  mean: 1.6, // densité perçue : l'écart le plus visible
  range: 1.2, // étirement du contraste
  colorfulness: 1.6, // vivacité — le vrai manque actuel
  sharpness: 0.5, // mesuré sur une capture compressée : poids réduit
};

/**
 * Axes **volontairement exclus** du pilotage automatique.
 *
 * `saturation` et `warmth` décrivent l'identité de la scène, pas la qualité du
 * rendu : un coucher de soleil au Caire est chaud et saturé par nature. Les
 * forcer vers une cible globale rendrait toutes les catégories grises et
 * interchangeables — l'inverse du but. Ils restent mesurés, pour information.
 */
export const DIAGNOSTIC_ONLY = ['saturation', 'warmth'];

/**
 * Bornes de sûreté, non négociables.
 *
 * Un optimiseur qui ne vise que des moyennes finit par tricher : pousser la
 * saturation à 149 % et multiplier les canaux séparément a rendu un soleil
 * cyan tout en améliorant le score. Ces bornes interdisent les réglages qui
 * gagnent sur les chiffres en détruisant la couleur.
 */
export const SAFE_LIMITS = {
  maxSaturation: 128, // au-delà, les aplats saturent et les teintes dérivent
  maxHueShift: 10, // degrés de dérive moyenne tolérés
  maxSharpness: 2.4, // au-delà : halos visibles sur les aplats vectoriels
};

const DEFAULT_RECIPE = {
  gamma: 1.0, // relève les tons moyens sans brûler les hautes lumières
  bp: 0.6, // point noir, en %
  wp: 99.4, // point blanc, en %
  sigmoid: 1.0, // force de la courbe en S
  brightness: 100, // -modulate b (finitions seulement)
  saturation: 100, // -modulate s
  micro: 0.3, // unsharp 0x1.0+
  edge: 0.15, // unsharp 0x0.5+
  warmR: 1.0,
  warmB: 1.0,
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Mode borné — la recette retenue après l'échec du pilotage « cible absolue ».
 *
 * Ce qui a été appris en le construisant : viser la moyenne de luminosité de
 * la référence pousse un coucher de soleil doré vers le gris, et pousser la
 * saturation pour rattraper la vivacité rend les aplats vectoriels criards
 * (Le Caire au soleil cyan, Berlin passé à l'or). La référence décrit un
 * **niveau de finition**, pas une teinte à atteindre : on densifie donc par le
 * contraste local et on ne touche à la couleur que dans une marge étroite.
 */
export const BOUNDED = {
  bp: 1.0,
  wp: 99.2,
  sigmoid: 3.4,
  gamma: 1.0,
  // ±0,04 de gamma : au-delà, on change l'heure de la journée de la scène.
  gammaMin: 0.96,
  gammaMax: 1.04,
  // 112 % : au-delà, les aplats saturés virent au néon.
  saturation: 112,
  micro: 0.8,
  edge: 0.4,
};

/** Applique une recette à une source et écrit le résultat. */
export function render(src, dest, r) {
  mkdirSync(dirname(dest), { recursive: true });
  const ext = extname(dest).slice(1) || 'webp';
  const args = [
    src,
    '-auto-orient',
    '-level',
    `${r.bp.toFixed(2)}%,${r.wp.toFixed(2)}%`,
    '-sigmoidal-contrast',
    `${r.sigmoid.toFixed(2)},50%`,
    '-gamma',
    r.gamma.toFixed(3),
    '-modulate',
    `${r.brightness.toFixed(2)},${r.saturation.toFixed(2)},100`,
    '-unsharp',
    `0x1.0+${r.micro.toFixed(2)}+0.015`,
    '-unsharp',
    `0x0.5+${r.edge.toFixed(2)}+0`,
  ];
  if (ext === 'webp') args.push('-quality', '86', '-define', 'webp:method=6');
  if (ext === 'jpg' || ext === 'jpeg') args.push('-quality', '88', '-sampling-factor', '4:2:0');
  args.push(dest);
  execFileSync(BIN, args, { stdio: 'ignore' });
  return dest;
}

/** Score d'écart global : 0 = cible atteinte, 1 = un axe doublé ou annulé. */
export function score(actual, target) {
  let sum = 0;
  let weight = 0;
  for (const [axis, w] of Object.entries(TUNING_AXES)) {
    const t = target[axis];
    if (!t) continue;
    const rel = Math.abs(actual[axis] - t) / Math.abs(t);
    sum += w * Math.min(rel, 1.5);
    weight += w;
  }
  return sum / weight;
}

/**
 * Boucle fermée. Renvoie la meilleure recette trouvée, sa mesure et l'historique
 * des scores — l'historique sert à prouver la convergence, pas à décorer.
 */
export function autotune(src, dest, { target, iterations = 6 } = {}) {
  const work = join(dirname(dest), `.autotune-${process.pid}-${basename(dest, extname(dest))}.webp`);
  const recipe = { ...DEFAULT_RECIPE };
  const history = [];
  let best = null;

  for (let i = 0; i < iterations; i++) {
    render(src, work, recipe);
    const m = measure(work);
    const s = score(m, target);
    history.push({ iteration: i, score: s, recipe: { ...recipe }, metrics: m });
    if (!best || s < best.score) best = { score: s, recipe: { ...recipe }, metrics: m };

    // Correction amortie : un pas complet oscillerait entre deux réglages.
    const ratio = (a, t, lo, hi) => clamp((t / Math.max(a, 1e-4)) ** 0.6, lo, hi);

    // Luminosité par gamma : monotone croissant et sans écrasement des
    // hautes lumières, contrairement à `-modulate brightness`.
    const bStep = ratio(m.mean, target.mean, 0.8, 1.25);
    recipe.gamma = clamp(recipe.gamma * bStep, 0.35, 3.2);

    const cStep = ratio(m.colorfulness, target.colorfulness, 0.85, 1.2);
    recipe.saturation = clamp(recipe.saturation * cStep, 70, 200);

    // Contraste : on resserre les niveaux tant que la plage est trop courte.
    const rangeRatio = target.range / Math.max(m.range, 1e-4);
    if (m.range < target.range) {
      recipe.bp = clamp(recipe.bp + 0.35 * (rangeRatio - 1) * 2.2, 0, 6);
      recipe.wp = clamp(recipe.wp - 0.35 * (rangeRatio - 1) * 2.2, 93, 100);
      recipe.sigmoid = clamp(recipe.sigmoid * clamp(rangeRatio ** 0.5, 0.9, 1.35), 0.3, 7);
    } else {
      recipe.sigmoid = clamp(recipe.sigmoid * 0.9, 0.3, 7);
    }

    const sStep = ratio(m.sharpness, target.sharpness, 0.85, 1.15);
    recipe.micro = clamp(recipe.micro * sStep, 0.05, SAFE_LIMITS.maxSharpness);
    recipe.edge = clamp(recipe.edge * sStep, 0.02, 1.2);

    // Saturation bornée : c'est cette borne qui empêche le « score parfait,
    // image détruite » observé sur Le Caire (soleil devenu cyan).
    recipe.saturation = clamp(recipe.saturation, 80, SAFE_LIMITS.maxSaturation);

    // Contrainte dure : si la teinte dérive, on rend la saturation.
    const drift = hueShift(src, work);
    history[history.length - 1].hueShift = drift;
    if (drift > SAFE_LIMITS.maxHueShift) {
      recipe.saturation = clamp(recipe.saturation * 0.85, 80, SAFE_LIMITS.maxSaturation);
      recipe.sigmoid = clamp(recipe.sigmoid * 0.92, 0.3, 7);
    }
  }

  execFileSync(BIN, [work, dest], { stdio: 'ignore' });
  try {
    execFileSync('rm', ['-f', work]);
  } catch {
    /* best-effort */
  }
  return { dest, score: best.score, recipe: best.recipe, metrics: best.metrics, history };
}

/**
 * Traitement borné en une passe : les cinq gestes d'un tirage, sans recherche
 * de cible. Sert de recette par défaut parce qu'il ne peut pas dériver.
 */
export function bounded(src, dest) {
  render(src, dest, { ...BOUNDED, brightness: 100 });
  const m = measure(dest);
  return { dest, score: null, recipe: { ...BOUNDED }, metrics: m };
}

/* ------------------------------ CLI ------------------------------ */
const isMain = process.argv[1] && process.argv[1].endsWith('theme-autotune.mjs');
if (isMain) {
  const argv = process.argv.slice(2);
  const mode = argv.includes('--bounded') ? 'bounded' : 'target';
  const arg = (n, d) => {
    const i = argv.indexOf(`--${n}`);
    return i === -1 ? d : argv[i + 1];
  };
  const targetPath = resolve(arg('target', 'docs/design/theme-tone-targets.json'));
  if (!existsSync(targetPath)) {
    console.error(`cibles introuvables : ${targetPath}`);
    process.exit(2);
  }
  const target = JSON.parse(execFileSync('cat', [targetPath], { encoding: 'utf8' }));
  const iterations = Number(arg('iter', 6));

  if (argv.includes('--batch')) {
    const i = argv.indexOf('--batch');
    const [srcDir, outDir] = [argv[i + 1], argv[i + 2]];
    const limit = Number(arg('limit', 0));
    let files = readdirSync(srcDir)
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
      .sort();
    if (limit > 0) files = files.slice(0, limit);
    const report = [];
    for (const f of files) {
      const dest = join(outDir, `${basename(f, extname(f))}.webp`);
      const r =
        mode === 'bounded'
          ? bounded(join(srcDir, f), dest)
          : autotune(join(srcDir, f), dest, { target, iterations });
      report.push({ src: f, score: r.score, metrics: r.metrics });
      console.log(`${f}  ${r.score === null ? 'borné' : `score=${r.score.toFixed(3)}`}`);
    }
    writeFileSync(join(outDir, 'autotune-report.json'), JSON.stringify({ target, report }, null, 2));
    const scored = report.filter((r) => typeof r.score === 'number');
    const summary = scored.length
      ? `score moyen ${(scored.reduce((a, r) => a + r.score, 0) / scored.length).toFixed(3)}`
      : 'mode borné, sans score de cible';
    console.log(`\n${files.length} image(s) -> ${outDir} (${summary})`);
    process.exit(0);
  }

  const [src, dest] = argv.filter((a) => !a.startsWith('--') && !argv[argv.indexOf(a) - 1]?.startsWith('--'));
  if (!src || !dest) {
    console.error('usage: theme-autotune.mjs <src> <dest> [--iter 6] [--target file.json]');
    process.exit(2);
  }
  const r = autotune(src, dest, { target, iterations });
  console.log(`${dest}\n  score final : ${r.score.toFixed(3)}`);
  console.log('  recette :', JSON.stringify(r.recipe, (k, v) => (typeof v === 'number' ? Number(v.toFixed(3)) : v)));
  for (const [k, w] of Object.entries(TUNING_AXES)) {
    const a = r.metrics[k];
    console.log(`  ${k.padEnd(13)} ${a.toFixed(4)}   cible ${target[k].toFixed(4)}   ${((a - target[k]) / Math.abs(target[k]) * 100).toFixed(1)}%`);
  }
}
