import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { GLASS_PRESETS, normalizeGlassSettings, useAppearanceStore } from '@/store/appearance-store';
import { resolveTheme } from '@/theme/resolve-theme';

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : []);
}

describe('fonds et icônes', () => {
  it('pose les réglages de verre via le plan de thème', () => {
    const plan = resolveTheme({ presetId: null, accent: '', backgroundType: 'image', colorThemeId: 'example', gradientId: null, isDark: false, reducedTransparency: false, highContrast: false, wide: false, glassSettings: GLASS_PRESETS.equilibre });
    expect(plan.attributes['data-bg']).toBe('image');
    expect(plan.vars['--glass-alpha']).toBe('0.42');
    // Le fond ne doit plus effacer l'image : 2 px de flou et un voile à 62 %,
    // là où le preset par défaut appliquait 10 px et un voile opaque.
    expect(plan.vars['--bg-blur']).toBe('2px');
    expect(plan.vars['--veil-alpha']).toBe('0.62');
    // À 2 px, le filtre de fond est composé ; à 0 px il serait `none`.
    expect(plan.vars['--bg-filter']).toContain('blur(2px)');
  });
  it('normalise les valeurs persistées et distingue les réglages personnalisés', () => {
    expect(normalizeGlassSettings({ bgBlur: 99, glassBlur: -1, glassAlpha: 10, veilAlpha: 500 })).toEqual({ bgBlur: 24, glassBlur: 0, glassAlpha: 20, veilAlpha: 100 });
    expect(normalizeGlassSettings(undefined)).toEqual(GLASS_PRESETS.equilibre);
    useAppearanceStore.getState().applyGlassPreset('net');
    expect(useAppearanceStore.getState().glassSettings).toEqual(GLASS_PRESETS.net);
    expect(useAppearanceStore.getState().glassPreset).toBe('net');
    useAppearanceStore.getState().setGlassSettings({ bgBlur: 1 });
    expect(useAppearanceStore.getState().glassPreset).toBe('custom');
  });
  it('ne dépend plus de l’ancienne bibliothèque dans le code de l’interface', () => {
    const forbidden = '@' + 'huge' + 'icons/';
    const hits = [...files('app'), ...files('src')].filter((p) => readFileSync(p, 'utf8').includes(forbidden));
    expect(hits).toEqual([]);
  });
  it('applique le verre aux cartes principales sans cibler les champs', () => {
    expect(readFileSync('app/(tabs)/index.tsx', 'utf8')).toMatch(/className="[^"]*g[123]/);
    expect(readFileSync('app/(tabs)/progress.tsx', 'utf8')).toMatch(/className="[^"]*g[123]/);
    expect(readFileSync('app/(tabs)/settings.tsx', 'utf8')).toMatch(/className="[^"]*g[123]/);
    expect(readFileSync('app/settings/appearance.tsx', 'utf8')).toMatch(/className="[^"]*g[123]/);
    for (const p of [ 'app/analytics/dashboard.tsx']) {
      expect(readFileSync(p, 'utf8')).toMatch(/className="[^"]*glass/);
    }
    const css = readFileSync('src/styles/globals.css', 'utf8');
    // Plancher mesuré (voir tests/design/contrast-surfaces.test.ts) : la
    // valeur vit dans un jeton, plus en dur dans la recette du verre.
    expect(css).toContain('max(var(--glass-alpha), var(--glass-alpha-min))');
    expect(css).toMatch(/--glass-alpha-min:\s*\.8;/);
    expect(css).toContain('prefers-reduced-transparency');
  });
});
