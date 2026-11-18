import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolveTheme } from '@/theme/resolve-theme';
import { GRADIENTS } from '@/theme/tweakcn-presets';

describe('correctifs Apparence', () => {
  const screen = readFileSync('app/settings/appearance.tsx', 'utf8');
  const css = readFileSync('src/styles/globals.css', 'utf8');
  it('apparie surface et texte, sans sous-cartes en verre', () => {
    // Les jetons de surface sont déclarés pour les DEUX modes : un bloc commun
    // (identité et densités) puis un bloc par mode pour ce qui diffère
    // réellement. Un test qui ne vérifierait qu'un des deux modes laisserait
    // passer un sombre incomplet — c'est ce qui était arrivé.
    expect(css).toContain(":root,\n:root[data-theme='light'],\n:root[data-theme='dark'],");
    expect(css).toContain(":root, :root[data-theme='light'], .appearance-preview[data-theme='light']");
    expect(css).toContain(":root[data-theme='dark'], .appearance-preview[data-theme='dark']");
    expect(screen).toContain('g2 appearance-section');
    expect(screen).not.toMatch(/className="glass/);
    expect(screen).not.toMatch(/text-white|text-gray-|preset\.(?:bg|fg|card|primaryFg)/);
    expect(css).toContain('color-mix(in srgb,var(--tx) 6%,transparent)');
  });
  it('choisit un dégradé existant et le transmet au pseudo-élément', () => {
    expect(screen).toContain('GRADIENTS[0].id');
    expect(css).toContain("@property --app-bg-image { syntax: '*'; inherits: true;");
    const plan = resolveTheme({ presetId: null, accent: '', backgroundType: 'gradient', gradientId: GRADIENTS[0].id, colorThemeId: null, isDark: false, reducedTransparency: false, highContrast: false, wide: false });
    expect(plan.vars['--app-bg-image']).toBe(GRADIENTS[0].css);
  });
  it('conserve des interrupteurs nommés et les valeurs des curseurs', () => {
    expect(screen).toContain('aria-label={label}');
    expect(screen).toContain('--range-progress');
    expect(screen).toContain('setReducedTransparency(!reducedTransparency)');
  });
});
