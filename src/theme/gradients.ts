import { GRADIENTS as LEGACY_GRADIENTS, type GradientMeta } from './tweakcn-presets';

/** Recettes ColorBase (angles et étapes relevés dans la bibliothèque publique).
 * Source : https://colorbase.in/gradient-library — anciens IDs conservés. */
export const COLORBASE_GRADIENTS: GradientMeta[] = [
  { id: 'colorbase-velvet-dawn', className: '', css: 'linear-gradient(135deg, #FF9A9E, #FECFEF, #F6D365)' },
  { id: 'colorbase-indigo-coast', className: '', css: 'linear-gradient(120deg, #0F2027, #203A43, #2C5364)' },
  { id: 'colorbase-moss-circuit', className: '', css: 'linear-gradient(160deg, #134E5E, #71B280)' },
  { id: 'colorbase-copper-dusk', className: '', css: 'linear-gradient(210deg, #B79891, #94716B)' },
  { id: 'colorbase-paper-zephyr', className: '', css: 'linear-gradient(180deg, #F5F7FA, #C3CFE2)' },
  { id: 'colorbase-midnight-reef', className: '', css: 'linear-gradient(150deg, #000000, #434343)' },
];
export const GRADIENTS = [...LEGACY_GRADIENTS, ...COLORBASE_GRADIENTS];

/** Find the least neutral veil that keeps both primary and secondary text
 * readable across the gradient's interpolated sRGB stops. */
export function gradientSurfaceWash(css: string, dark: boolean): number {
  const surface = dark ? [23, 23, 23] : [255, 255, 255];
  const ink = dark ? [195, 195, 195] : [91, 74, 87];
  const stops = (css.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((hex) =>
    [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)),
  );
  if (!stops.length) return 100;
  const samples: number[][] = [];
  for (let i = 0; i < stops.length - 1; i += 1) {
    for (let n = 0; n <= 10; n += 1) samples.push(stops[i].map((v, j) => v + (stops[i + 1][j] - v) * n / 10));
  }
  if (stops.length === 1) samples.push(stops[0]);
  const luminance = (rgb: number[]) => rgb.reduce((sum, channel, i) => {
    const c = channel / 255;
    return sum + (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
  }, 0);
  const textLuminance = luminance(ink);
  for (let wash = 20; wash <= 100; wash += 1) {
    const safe = samples.every((rgb) => {
      const bg = luminance(rgb.map((channel, i) => channel * (1 - wash / 100) + surface[i] * wash / 100));
      return (Math.max(textLuminance, bg) + 0.05) / (Math.min(textLuminance, bg) + 0.05) >= 5;
    });
    if (safe) return wash;
  }
  return 100;
}

/** Preserve each selected stop while allowing the blurred backdrop to show through. */
export function translucentGradient(css: string): string {
  return css.replace(/#[0-9a-fA-F]{6}\b/g, (color) =>
    `color-mix(in srgb, ${color} calc(var(--glass-alpha, .42) * 100%), transparent)`,
  );
}
