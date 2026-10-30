/** Identifiant d'accent libre (preset tweakcn ou thème image). */
export type AccentKey = string;

import { findThemeById as catalogFindThemeById, type ThemeCatalogEntry } from './theme-catalog';
import { extractImageAccent } from './image-accent';
import { useAppearanceStore } from '@/store/appearance-store';
import {
  ACCENT_VARS,
  accentVars,
  applyThemeToDocument,
  imagePath,
  type ResolvedAccent,
  type ThemePlan,
} from './resolve-theme';

export function findThemeById(id: string | null | undefined): ThemeCatalogEntry | null {
  return catalogFindThemeById(id);
}

/** Couleurs d'accent : définies une seule fois, dans `resolve-theme.ts`. */
export type AccentValues = ResolvedAccent;

/**
 * L'ancien catalogue d'accents maison (ACCENT_PRESETS) a été SUPPRIMÉ :
 * les couleurs de l'app viennent des presets officiels tweakcn
 * (data-preset) ou de l'accent extrait de l'image de fond. Il ne reste
 * ici que l'application de l'accent dynamique d'image.
 */
export const DEFAULT_ACCENT: AccentKey = 'lara-red';

/**
 * Build an AccentValues set for a color-based image theme (public/themes/…).
 * The light variant uses the raw hex; the dark variant uses a lightened
 * variant for contrast on #121212.
 */
export function colorThemeValues(hex: string): AccentValues {
  return {
    primary: hex,
    primaryLight: hex,
    primaryDark: hex,
    accent: hex,
    accentLight: hex,
  };
}

export function applyAccentPreset(
  key: string | null | undefined,
  isDark: boolean,
  colorThemeId?: string | null,
): void {
  // Sans image de fond, les variables viennent du preset tweakcn actif
  // (feuille générée) : aucun override maison, donc aucune écriture ici.
  void key;
  if (!colorThemeId) return;
  const theme = findThemeById(colorThemeId);
  const fallback = theme ? colorThemeValues(theme.color) : colorThemeValues('#e6067a');
  const src = themeImagePath(colorThemeId);
  // On pose tout de suite les couleurs du catalogue (aucun flash), puis on
  // affine avec la palette réellement extraite de l'illustration.
  const applyImageAccent = (values: AccentValues) => {
    // Check at write time: an extraction may finish after the user chose a fixed accent.
    const plan = accentPlan(values, src, isDark, !!useAppearanceStore.getState().fixedAccentId);
    applyThemeToDocument(plan);
  };
  applyImageAccent(fallback);
  void extractImageAccent(colorThemeId, src, fallback).then((values) => {
    // Garde : le thème a pu changer pendant l'échantillonnage.
    if (useAppearanceStore.getState().colorThemeId !== colorThemeId) return;
    applyImageAccent(values);
  });
}

/** Plan partiel : accent + illustration (appliqué par l'unique écrivain). */
export function accentPlan(values: AccentValues, src: string, isDark: boolean, preserveFixedTint = false): ThemePlan {
  const vars: Record<string, string> = { ...accentVars(values), '--theme-image': `url(${src})` };
  if (preserveFixedTint) delete vars['--tint'];
  return {
    attributes: {
      'data-theme-image': 'on',
      'data-theme-image-mode': isDark ? 'dark' : 'light',
    },
    removedAttributes: [],
    vars,
    removedVars: [],
  };
}

/**
 * Resolve the portrait image path for an image-based color theme.
 * `id` = theme id from the catalog, e.g. "esprit-pentecote".
 * The category is the first two id segments; the file lives at
 * public/themes/{category}/{id}-portrait.png.
 */
export function themeImagePath(id: string): string {
  // Mobile (< 1024 px) : artwork portrait. Desktop/web : artwork paysage large.
  const wide = typeof window !== 'undefined' && window.innerWidth >= 1024;
  return imagePath(id, wide);
}

export function clearAccentPreset(): void {
  applyThemeToDocument({
    attributes: {},
    removedAttributes: ['data-theme-image', 'data-theme-image-mode'],
    vars: {},
    removedVars: [...ACCENT_VARS, '--theme-image'],
  });
}
