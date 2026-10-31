#!/usr/bin/env node
/**
 * Mesures de tonalité — l'équivalent JavaScript de `theme-metrics.py`, sans
 * dépendance Python, pour que la chaîne de traitement tourne partout où
 * ImageMagick est présent (c'est déjà une dépendance de l'import des thèmes).
 *
 * Convention de mesure (identique au script Python, volontairement) :
 *   - analyse à **120 px de large** : c'est la taille d'une vignette de
 *     sélecteur, donc la taille à laquelle l'utilisateur juge réellement ;
 *   - netteté = variance du laplacien / variance de l'image (sans unité) ;
 *   - colorfulness = Hasler & Süsstrunk, sans unité lui aussi.
 *
 * Les valeurs de référence sont dans `docs/design/theme-tone-targets.json`,
 * extraites du sélecteur de thèmes de TickTick.
 */
import { execFileSync } from 'node:child_process';

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

export const MEASURE_WIDTH = 120;

/** Récupère les pixels RGB 8 bits de l'image, ramenée à MEASURE_WIDTH. */
function rawPixels(file, width = MEASURE_WIDTH) {
  const [w, h] = execFileSync(BIN, [file, '-format', '%w %h', 'info:'], { encoding: 'utf8' })
    .trim()
    .split(/\s+/)
    .map(Number);
  const outH = Math.max(1, Math.round((h * width) / w));
  const buf = execFileSync(
    BIN,
    [file, '-resize', `${width}x`, '-depth', '8', '-colorspace', 'sRGB', 'rgb:-'],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  return { w: width, h: outH, buf };
}

function percentile(sorted, q) {
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((q / 100) * (sorted.length - 1))));
  return sorted[i];
}

/** Mesures complètes d'une image. */
export function measure(file, width = MEASURE_WIDTH) {
  const { w, h, buf } = rawPixels(file, width);
  const n = w * h;
  const luma = new Float64Array(n);
  let satSum = 0;
  let rSum = 0;
  let bSum = 0;
  const rg = new Float64Array(n);
  const yb = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const r = buf[i * 3] / 255;
    const g = buf[i * 3 + 1] / 255;
    const b = buf[i * 3 + 2] / 255;
    luma[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    satSum += max > 1e-6 ? (max - min) / max : 0;
    rSum += r;
    bSum += b;
    rg[i] = r - g;
    yb[i] = 0.5 * (r + g) - b;
  }

  const sorted = Float64Array.from(luma).sort();
  const mean = luma.reduce((a, v) => a + v, 0) / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (luma[i] - mean) ** 2;
  const variance = varSum / n;

  // Laplacien 4-voisins.
  let lapSum = 0;
  let lapSq = 0;
  let lapN = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = 4 * luma[i] - luma[i - w] - luma[i + w] - luma[i - 1] - luma[i + 1];
      lapSum += lap;
      lapSq += lap * lap;
      lapN += 1;
    }
  }
  const lapVar = lapSq / lapN - (lapSum / lapN) ** 2;

  const stat = (arr) => {
    const m = arr.reduce((a, v) => a + v, 0) / arr.length;
    let s = 0;
    for (const v of arr) s += (v - m) ** 2;
    return { mean: m, std: Math.sqrt(s / arr.length) };
  };
  const sRg = stat(rg);
  const sYb = stat(yb);
  const colorfulness =
    Math.sqrt(sRg.std ** 2 + sYb.std ** 2) + 0.3 * Math.sqrt(sRg.mean ** 2 + sYb.mean ** 2);

  const p1 = percentile(sorted, 1);
  const p5 = percentile(sorted, 5);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  // Bandes SPATIALES (haut / bas de l'image), pas des tris de valeurs : on
  // mesure la zone où se poseront le titre et le texte d'interface.
  const third = Math.max(1, Math.floor(h / 3));
  let topSum = 0;
  let bottomSum = 0;
  for (let y = 0; y < third; y++) for (let x = 0; x < w; x++) topSum += luma[y * w + x];
  for (let y = h - third; y < h; y++) for (let x = 0; x < w; x++) bottomSum += luma[y * w + x];
  const topMean = topSum / (third * w);
  const bottomMean = bottomSum / (third * w);

  return {
    mean,
    std: Math.sqrt(variance),
    p1,
    p5,
    p50: percentile(sorted, 50),
    p95,
    p99,
    range: p99 - p1,
    contrast_mid: p95 - p5,
    sharpness: lapVar / (variance + 1e-6),
    colorfulness,
    saturation: satSum / n,
    warmth: rSum / n - bSum / n,
    deep_blacks: Array.prototype.reduce.call(sorted, (a, v) => a + (v < 0.06 ? 1 : 0), 0) / n,
    highlights: Array.prototype.reduce.call(sorted, (a, v) => a + (v > 0.94 ? 1 : 0), 0) / n,
    top_mean: topMean,
    bottom_mean: bottomMean,
    text_zone: topMean - bottomMean,
  };
}

function hueAt(buf, i) {
  const r = buf[i * 3] / 255;
  const g = buf[i * 3 + 1] / 255;
  const bl = buf[i * 3 + 2] / 255;
  const max = Math.max(r, g, bl);
  const min = Math.min(r, g, bl);
  const c = max - min;
  if (c < 0.08) return null; // trop désaturé : teinte non significative
  let h;
  if (max === r) h = ((g - bl) / c) % 6;
  else if (max === g) h = (bl - r) / c + 2;
  else h = (r - g) / c + 4;
  return { h: (((h * 60) % 360) + 360) % 360, c };
}

/**
 * Dérive de teinte entre deux images, en degrés (0 = aucune dérive).
 *
 * On ne compare que les pixels suffisamment colorés des deux côtés : sur les
 * gris, un angle de teinte n'a pas de sens. C'est la mesure qui attrape le
 * défaut que les moyennes globales laissent passer — un soleil devenu cyan
 * garde la même luminosité, le même contraste et la même vivacité.
 */
export function hueShiftByZone(srcFile, destFile, width = MEASURE_WIDTH, zones = 4) {
  const a = rawPixels(srcFile, width);
  const b = rawPixels(destFile, width);
  const out = [];
  for (let z = 0; z < zones; z++) {
    const x0 = Math.floor((a.w / zones) * z);
    const x1 = Math.floor((a.w / zones) * (z + 1));
    let sum = 0;
    let weight = 0;
    for (let y = 0; y < a.h; y++) {
      for (let x = x0; x < x1; x++) {
        const i = y * a.w + x;
        const ha = hueAt(a.buf, i);
        const hb = hueAt(b.buf, i);
        if (!ha || !hb) continue;
        let d = Math.abs(ha.h - hb.h);
        if (d > 180) d = 360 - d;
        const w = Math.min(ha.c, hb.c);
        sum += d * w;
        weight += w;
      }
    }
    out.push(weight > 0 ? sum / weight : 0);
  }
  return Math.max(...out);
}

export function hueShift(srcFile, destFile, width = MEASURE_WIDTH) {
  const a = rawPixels(srcFile, width);
  const b = rawPixels(destFile, width);
  const n = Math.min(a.w * a.h, b.w * b.h);
  let sum = 0;
  let weight = 0;

  for (let i = 0; i < n; i++) {
    const ha = hueAt(a.buf, i);
    const hb = hueAt(b.buf, i);
    if (!ha || !hb) continue;
    let d = Math.abs(ha.h - hb.h);
    if (d > 180) d = 360 - d;
    sum += d * Math.min(ha.c, hb.c);
    weight += Math.min(ha.c, hb.c);
  }
  return weight > 0 ? sum / weight : 0;
}

/** Profil médian d'un ensemble d'images (robuste aux scènes atypiques). */
export function profile(files) {
  const rows = files.map((f) => measure(f));
  const keys = Object.keys(rows[0]);
  const out = {};
  for (const k of keys) {
    const vals = rows.map((r) => r[k]).sort((a, b) => a - b);
    out[k] = vals[Math.floor(vals.length / 2)];
  }
  return out;
}

/** Écart relatif signé, utilisable comme consigne de correction. */
export function gaps(actual, target, keys) {
  const out = {};
  for (const k of keys) {
    const t = target[k];
    out[k] = t === 0 ? actual[k] - t : (actual[k] - t) / Math.abs(t);
  }
  return out;
}

/* ------------------------------ CLI ------------------------------ */
const isMain = process.argv[1] && process.argv[1].endsWith('theme-metrics.mjs');
if (isMain) {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('usage: theme-metrics.mjs <image>... | --profile <image>...');
    process.exit(2);
  }
  if (args[0] === '--profile') {
    console.log(JSON.stringify(profile(args.slice(1)), null, 2));
    process.exit(0);
  }
  for (const f of args) {
    const m = measure(f);
    console.log(`\n${f}`);
    for (const [k, v] of Object.entries(m)) console.log(`  ${k.padEnd(14)} ${v.toFixed(4)}`);
  }
}
