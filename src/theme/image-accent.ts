/**
 * Image accent extraction — reads the dominant colors of a theme image at
 * runtime and converts them to the app's CSS accent variables.
 *
 * Used by `applyAccentPreset` when a color-based image theme is active:
 * instead of using a static hex from the catalog, we sample the actual
 * pixels of the portrait PNG, cluster the most saturated hue, and
 * derive the light/dark/light/dark variants of the accent so that the
 * app's buttons, icons and text tint to match the illustration's own
 * palette. This makes each image theme feel unique rather than a generic
 * color swatch.
 *
 * The extraction is cached in memory (one sample per image, not
 * recomputed on every apply) and is a no-op on SSR or when the image
 * is not yet loaded.
 */

// Module-level cache: theme id → extracted accent values.
const accentCache = new Map<string, import('./theme-presets').AccentValues>();

/**
 * Load a theme image and extract its dominant accent palette.
 * Falls back to the catalog hex (via the `fallback` argument) when the
 * image cannot be read (CORS, missing file, SSR).
 */
export async function extractImageAccent(
  id: string,
  src: string,
  fallback: import('./theme-presets').AccentValues,
): Promise<import('./theme-presets').AccentValues> {
  const cached = accentCache.get(id);
  if (cached) return cached;

  try {
    const img = await loadImage(src);
    const pixels = readCenterCrop(img);
    const palette = clusterPalette(pixels, 6);
    const values = paletteToAccent(palette);
    accentCache.set(id, values);
    return values;
  } catch {
    return fallback;
  }
}

/** Load an <img> element with a decode (waits until pixels are usable). */
/** Au-delà de ce délai, on considère l'image indisponible et on garde le thème. */
const IMAGE_TIMEOUT_MS = 4000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // Une image qui ne déclenche ni `load` ni `error` (réseau suspendu, data
    // URI tronquée, onglet en veille) ne doit pas bloquer le thème pour
    // toujours : sans ce garde-fou, l'accent resterait figé et la promesse
    // pendante à chaque rendu.
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('image-accent: délai dépassé'));
    }, IMAGE_TIMEOUT_MS);

    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => img.decode().then(() => done(() => resolve(img))).catch((error) => done(() => reject(error)));
    img.onerror = () => done(() => reject(new Error('image-accent: chargement impossible')));
    img.src = src;
  });
}

/**
 * Read a small center crop (the motif region of the portrait) as RGBA.
 * The crop is 256×256 centered on the image — that's where the
 * illustration sits, and we want its colors, not the border gradient.
 */
function readCenterCrop(img: HTMLImageElement): Uint8ClampedArray {
  const size = 256;
  const scale = Math.max(size / img.width, size / img.height);
  const w = Math.round(size * (img.width / Math.max(img.width, img.height)));
  const h = Math.round(size * (img.height / Math.max(img.width, img.height)));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no 2d context');
  // Draw the image centered and scaled to fill the crop box.
  const drawW = w * scale;
  const drawH = h * scale;
  const dx = (w - drawW) / 2;
  const dy = (h - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);
  const data = ctx.getImageData(0, 0, w, h).data;
  return data;
}

/**
 * Quantize pixels into 4 equal-size HSL buckets by hue, keep the
 * bucket with the most saturated samples, and return its average.
 * This is a small, fast heuristic (no dependencies) that is good
 * enough for picking "the color of the illustration".
 */
function clusterPalette(
  pixels: Uint8ClampedArray,
  buckets: number,
): Array<{ h: number; s: number; l: number }> {
  const hueBuckets: Array<Array<{ h: number; s: number; l: number }>> =
    Array.from({ length: buckets }, () => []);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] / 255;
    const g = pixels[i + 1] / 255;
    const b = pixels[i + 2] / 255;
    const { h, s, l } = rgbToHsl(r, g, b);
    // Skip near-white / near-black / desaturated pixels (they are the
    // background or shadows, not the motif).
    if (s < 0.15 || l < 0.08 || l > 0.92) continue;
    const bucket = Math.min(buckets - 1, Math.floor((h / 360) * buckets));
    hueBuckets[bucket].push({ h, s, l });
  }
  const averaged = hueBuckets
    .filter((b) => b.length > 0)
    .map((b) => {
      const sum = b.reduce(
        (acc, p) => ({ h: acc.h + p.h, s: acc.s + p.s, l: acc.l + p.l }),
        { h: 0, s: 0, l: 0 },
      );
      return {
        avg: { h: sum.h / b.length, s: sum.s / b.length, l: sum.l / b.length },
        count: b.length,
      };
    })
    .sort((a, b) => b.count - a.count)
    .map((x) => x.avg);
  return averaged.length > 0 ? averaged : [{ h: 350, s: 0.6, l: 0.5 }];
}

/** Luminance relative WCAG 2.x d'une couleur hex #rrggbb. */
function relativeLuminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/**
 * Choisit noir ou blanc comme texte sur `bgHex` : on garde le candidat au
 * meilleur ratio de contraste WCAG (cible ≥ 4.5:1 quand c'est atteignable).
 */
export function bestTextOn(bgHex: string): '#000000' | '#ffffff' {
  const l = relativeLuminance(bgHex);
  const withBlack = (l + 0.05) / 0.05;
  const withWhite = 1.05 / (l + 0.05);
  return withBlack >= withWhite ? '#000000' : '#ffffff';
}

function rgbToHsl(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [r + m, g + m, b + m];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const to = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Convert a dominant HSL color to a full accent value set (light + dark
 * variants), matching the shape of `colorThemeValues` in theme-presets.ts.
 * Light: the motif color itself (slightly brighter).
 * Dark: a lightened variant that stays readable on #121212.
 */
function paletteToAccent(
  palette: Array<{ h: number; s: number; l: number }>,
): import('./theme-presets').AccentValues {
  const d = palette[0];
  const primary = rgbToHex(hslToRgb(d.h, Math.min(d.s, 0.85), Math.min(d.l, 0.55)));
  const light = rgbToHex(hslToRgb(d.h, Math.min(d.s, 0.7), 0.75));
  const dark = rgbToHex(hslToRgb(d.h, Math.min(d.s, 0.85), Math.max(d.l - 0.15, 0.25)));
  // Dark-mode accent: lightened version so it shows on #121212.
  const darkAccent = rgbToHex(hslToRgb(d.h, Math.min(d.s, 0.7), 0.7));
  // 2e couleur de l'image (bucket suivant, teinte distincte) — sinon primaire.
  const second = palette[1];
  const accentSecondary = second
    ? rgbToHex(hslToRgb(second.h, Math.min(second.s, 0.85), Math.min(second.l, 0.55)))
    : primary;
  // Teinte moyenne sombre : même famille que l'accent, assombrie — sert de
  // voile (--tint) derrière les cartes en verre dépoli.
  const tint = rgbToHex(hslToRgb(d.h, Math.min(d.s * 0.7, 0.6), 0.3));
  return {
    primary,
    primaryLight: light,
    primaryDark: dark,
    accent: primary,
    accentLight: darkAccent,
    accentSecondary,
    tint,
    primaryForeground: bestTextOn(primary),
  };
}
