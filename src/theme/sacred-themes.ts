/**
 * Catégories chrétiennes & d'architecture sacrée injectées en tête du
 * catalogue de thèmes.
 *
 * Dérivées des fichiers réellement importés dans
 * `public/themes/{foi-victoire,architecture-sacree}` via
 * `scripts/themes/import-sacred-themes.mjs`.
 */
import { SACRED_THEMES } from './sacred-themes.generated';
import type { PhotoThemeFormat } from './photo-themes-types';
import type { ThemeCategory } from './theme-catalog';

const SACRED_CATEGORY_NAMES: Record<string, string> = {
  'foi-victoire': 'Foi & Victoire',
  'architecture-sacree': 'Architecture & Sanctuaires',
};

const SACRED_CATEGORY_ORDER = ['foi-victoire', 'architecture-sacree'];

export function buildSacredCategories(): ThemeCategory[] {
  return SACRED_CATEGORY_ORDER.map((category) => {
    const files = SACRED_THEMES.filter((t) => t.category === category);
    return {
      id: category,
      name: SACRED_CATEGORY_NAMES[category] ?? category,
      themes: files.map(({ id, name, color, motif }) => ({ id, name, color, motif })),
    };
  }).filter((c) => c.themes.length > 0);
}

export function sacredThemeExt(id: string | null | undefined): PhotoThemeFormat | null {
  if (!id) return null;
  return SACRED_THEMES.find((t) => t.id === id)?.ext ?? null;
}

export const SACRED_THEME_COUNT = SACRED_THEMES.length;
