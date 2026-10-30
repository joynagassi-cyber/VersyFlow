import { describe, it, expect } from 'vitest';
import { GRADIENTS, COLORBASE_GRADIENTS } from '@/theme/gradients';
import { GRADIENTS as LEGACY } from '@/theme/tweakcn-presets';
import { resolveTheme } from '@/theme/resolve-theme';

describe('dégradés ColorBase', () => {
  it('préserve les anciens identifiants et applique les nouvelles recettes', () => {
    expect(COLORBASE_GRADIENTS).toHaveLength(6);
    expect(GRADIENTS.slice(0, LEGACY.length)).toEqual(LEGACY);
    for (const gradient of COLORBASE_GRADIENTS) {
      const plan = resolveTheme({ presetId: null, accent: '', backgroundType: 'gradient', gradientId: gradient.id, colorThemeId: null, isDark: false, reducedTransparency: false, highContrast: false, wide: false });
      expect(plan.vars['--app-bg-image']).toBe(gradient.css);
    }
  });
});

describe('voile des cartes dégradées', () => {
  it('calcule un voile lisible pour les textes secondaires sur les dégradés disponibles', async () => {
    const { gradientSurfaceWash } = await import('@/theme/gradients');
    const luminance = (rgb: number[]) => rgb.reduce((sum, v, i) => {
      const c = v / 255;
      return sum + (c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
    }, 0);
    for (const gradient of GRADIENTS) for (const dark of [false, true]) {
      const wash = gradientSurfaceWash(gradient.css, dark) / 100;
      expect(wash).toBeGreaterThanOrEqual(.2);
      expect(wash).toBeLessThanOrEqual(1);
      const ink = luminance(dark ? [195, 195, 195] : [91, 74, 87]);
      const base = dark ? 23 : 255;
      const stops = (gradient.css.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
      expect(stops.length).toBeGreaterThan(0);
      for (let i = 0; i < stops.length - 1; i++) for (let n = 0; n <= 10; n++) {
        const bg = luminance(stops[i].map((v, j) => (v + (stops[i + 1][j] - v) * n / 10) * (1 - wash) + base * wash));
        expect((Math.max(bg, ink) + .05) / (Math.min(bg, ink) + .05)).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(gradientSurfaceWash('none', false)).toBe(100);
  });
});

it('garde les arrêts du dégradé dans le verre et nettoie la variable hors dégradé', async () => {
  const { translucentGradient } = await import('@/theme/gradients');
  for (const gradient of GRADIENTS) {
    const glass = translucentGradient(gradient.css);
    expect(glass).toContain('var(--glass-alpha, .42)');
    expect(glass.match(/color-mix\(/g)).toHaveLength((gradient.css.match(/#[0-9a-fA-F]{6}\b/g) ?? []).length);
  }
  const plan = resolveTheme({ presetId: null, accent: '', backgroundType: 'none', gradientId: null, colorThemeId: null, isDark: false, reducedTransparency: false, highContrast: false, wide: false });
  expect(plan.removedVars).toContain('--glass-gradient');
});

it('utilise les couleurs du dégradé au lieu de l’accent enregistré sans modifier les préférences', () => {
  const plan = resolveTheme({ presetId: null, accent: '', fixedAccentId: 'rose', backgroundType: 'gradient', gradientId: 'colorbase-velvet-dawn', colorThemeId: null, isDark: false, reducedTransparency: false, highContrast: false, wide: false });
  expect(plan.vars['--color-primary']).toBe('#FF9A9E');
  expect(plan.vars['--color-accent']).toBe('#F6D365');
  expect(plan.attributes['data-fixed-accent']).toBeUndefined();
  expect(plan.vars['--fixed-accent']).toBeUndefined();
});
