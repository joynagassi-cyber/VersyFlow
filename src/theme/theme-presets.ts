/** Identifiant d'accent libre (preset tweakcn ou thème image). */
export type AccentKey = string & {};

import { findThemeById as catalogFindThemeById, themePortraitUrl, themeLandscapeUrl, type ThemeCatalogEntry } from './theme-catalog';
import { extractImageAccent } from './image-accent';
import { useAppearanceStore } from '@/store/appearance-store';

export function findThemeById(id: string | null | undefined): ThemeCatalogEntry | null {
  return catalogFindThemeById(id);
}

export interface AccentValues {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  /** 2e couleur extraite de l'image de fond (thèmes image uniquement). */
  accentSecondary?: string;
  /** Teinte moyenne sombre extraite de l'image — voile des cartes. */
  tint?: string;
  /** Texte (noir/blanc) choisi par contraste WCAG sur `primary`. */
  primaryForeground?: string;
}

/**
 * L'ancien catalogue d'accents maison (ACCENT_PRESETS) a été SUPPRIMÉ :
 * les couleurs de l'app viennent des presets officiels tweakcn
 * (data-preset) ou de l'accent extrait de l'image de fond. Il ne reste
 * ici que l'application de l'accent dynamique d'image.
 */
export const DEFAULT_ACCENT: AccentKey = 'quantum-rose';

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

export function applyAccentPreset(key: string | null | undefined, isDark: boolean, colorThemeId?: string | null): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // An image/color theme overrides all preset accent variables. Its accent
  // color is extracted live from the illustration's own palette (not the
  // static catalog hex), and its background is the applied portrait.
  if (colorThemeId) {
    const theme = findThemeById(colorThemeId);
    const fallback = theme ? colorThemeValues(theme.color) : colorThemeValues('#e6067a');
    const src = themeImagePath(colorThemeId);
    // Apply the fallback immediately (synchronous, zero-flash), then
    // refine with the real extracted palette once the image is sampled.
    setAccentVars(root, fallback, src, colorThemeId, isDark);
    void extractImageAccent(colorThemeId, src, fallback).then((values) => {
      // Guard: the theme may have changed while the sample was in flight.
      if (useAppearanceStore.getState().colorThemeId !== colorThemeId) return;
      setAccentVars(root, values, src, colorThemeId, isDark);
    });
    return;
  }
  // Sans image de fond, les variables viennent du preset tweakcn actif
  // (feuille générée) : aucun override maison ici.
  void key; void isDark;
  root.style.removeProperty('--theme-image');
  root.removeAttribute('data-theme-image');
}

/** Variables shadcn standard alimentées par l'accent dynamique (image). */
function setShadcnAccentVars(root: HTMLElement, v: AccentValues): void {
  root.style.setProperty('--primary', v.primary);
  root.style.setProperty('--ring', v.primary);
  root.style.setProperty('--accent', v.accentSecondary ?? v.accent);
  if (v.tint) root.style.setProperty('--tint', v.tint);
  if (v.primaryForeground) {
    root.style.setProperty('--primary-foreground', v.primaryForeground);
    root.style.setProperty('--color-primary-foreground', v.primaryForeground);
  }
}

function setAccentVars(
  root: HTMLElement,
  v: AccentValues,
  src: string,
  id: string,
  isDark: boolean,
): void {
  root.style.setProperty('--color-primary', v.primary);
  root.style.setProperty('--color-primary-light', v.primaryLight);
  root.style.setProperty('--color-primary-dark', v.primaryDark);
  root.style.setProperty('--color-accent', v.accent);
  root.style.setProperty('--color-accent-light', v.accentLight);
  root.style.setProperty('--ion-color-primary', v.primary);
  root.style.setProperty('--ion-color-secondary', v.accent);
  setShadcnAccentVars(root, v);
  // The applied portrait gets a soft depth-of-field treatment: a large
  // blur + slight scale so it reads as an ambient wash (creativity,
  // not a raw photo), and the UI surface stays readable on top of it.
  root.style.setProperty('--theme-image', `url(${src})`);
  root.setAttribute('data-theme-image', 'on');
  root.setAttribute('data-theme-image-mode', isDark ? 'dark' : 'light');
  void id;
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
  return wide ? themeLandscapeUrl(id) : themePortraitUrl(id);
}

export function clearAccentPreset(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  [
    '--color-primary',
    '--color-primary-light',
    '--color-primary-dark',
    '--color-accent',
    '--color-accent-light',
    '--ion-color-primary',
    '--ion-color-secondary',
    '--primary',
    '--ring',
    '--accent',
    '--tint',
    '--primary-foreground',
    '--color-primary-foreground',
  ].forEach((k) => root.style.removeProperty(k));
}
