/**
 * Catégories « photo » injectées dans le catalogue de thèmes.
 *
 * Le catalogue de base (dix catégories d'illustrations) reste déclaré à la
 * main dans `theme-catalog.ts`. Les fonds photoréalistes, eux, sont **dérivés
 * des fichiers réellement importés** : `photo-themes.generated.ts` n'est
 * rempli que par `scripts/themes/import-photo-themes.mjs` quand les visuels
 * existent. Conséquence volontaire : sans images, aucune entrée n'apparaît
 * (pas de vignette cassée) ; avec images, les vingt scènes apparaissent dans
 * le sélecteur existant, sans autre modification.
 */
import { PHOTO_THEMES } from './photo-themes.generated';
import type { PhotoThemeFormat } from './photo-themes-types';
import type { ThemeCategory } from './theme-catalog';

const PHOTO_CATEGORY_NAMES: Record<string, string> = {
  'photos-nature': 'Photos · Nature',
  'photos-vie': 'Photos · Vie & loisirs',
};

const PHOTO_CATEGORY_ORDER = ['photos-nature', 'photos-vie'];

/**
 * Construit les catégories photo dans un ordre stable (nature puis vie), en
 * ignorant une catégorie vide. Renvoie `[]` tant que rien n'est importé.
 */
export function buildPhotoCategories(): ThemeCategory[] {
  return PHOTO_CATEGORY_ORDER.map((category) => {
    const files = PHOTO_THEMES.filter((t) => t.category === category);
    return {
      id: category,
      name: PHOTO_CATEGORY_NAMES[category] ?? category,
      themes: files.map(({ id, name, color, motif }) => ({ id, name, color, motif })),
    };
  }).filter((c) => c.themes.length > 0);
}

/** Extension des visuels d'un thème photo (`null` pour les thèmes illustrés). */
export function photoThemeExt(id: string | null | undefined): PhotoThemeFormat | null {
  if (!id) return null;
  return PHOTO_THEMES.find((t) => t.id === id)?.ext ?? null;
}

/** Nombre de scènes photo réellement disponibles (0 tant que rien n'est livré). */
export const PHOTO_THEME_COUNT = PHOTO_THEMES.length;
