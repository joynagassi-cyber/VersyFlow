import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { ALL_THEMES, themeLandscapeUrl, themeThumbUrl } from '@/theme/theme-catalog';
import { PHOTO_THEME_COUNT } from '@/theme/photo-themes';
import { GRADIENTS } from '@/theme/tweakcn-presets';

describe('onglet Fond', () => {
  const screen = readFileSync('app/settings/appearance.tsx', 'utf8');
  it('utilise les composants réels de l’accueil pour un aperçu non interactif', () => {
    expect(screen).toContain('<HomeScreen />');
    expect(screen).toContain("setAttribute('inert', '')");
    expect(screen).toContain('onClick={() => setThemeMode(previewMode)}');
  });
  it('sélectionne douze dégradés déjà existants et conserve les autres choix', () => {
    expect(GRADIENTS.filter((g) => !['sunny-morning', 'malibu-beach', 'true-sunset'].includes(g.id))).toHaveLength(12);
    expect(screen).toContain('!BACKGROUND_GRADIENTS.some');
    expect(screen).toContain("setBackgroundType('none')");
  });
  it('propose des miniatures WebP des images présentes avec repli PNG', () => {
    expect(ALL_THEMES).toHaveLength(100 + PHOTO_THEME_COUNT);
    for (const theme of ALL_THEMES.filter((item) => item.id !== 'obj-miroir')) {
      const webp = `public${themeThumbUrl(theme.id)}`;
      expect(existsSync(webp), webp).toBe(true);
    }
    expect(screen).toContain("entry.id !== 'obj-miroir'");
    expect(screen).toContain('disabled={!available}');
    expect(screen).toContain('loading="lazy"');
    expect(screen).toContain('<picture>');
  });
});
