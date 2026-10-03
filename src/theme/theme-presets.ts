export type AccentKey =
  | 'magenta'
  | 'rose'
  | 'red'
  | 'violet'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'ink'
  | (string & {});

import { findThemeById as catalogFindThemeById, type ThemeCatalogEntry } from './theme-catalog';

export function findThemeById(id: string | null | undefined): ThemeCatalogEntry | null {
  return catalogFindThemeById(id);
}

export interface AccentValues {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
}

export interface AccentPreset {
  key: AccentKey;
  label: string;
  swatch: string;
  light: AccentValues;
  dark: AccentValues;
}

type V = AccentValues;
const P = (
  key: AccentKey,
  label: string,
  swatch: string,
  light: V,
  dark: V,
): AccentPreset => ({ key, label, swatch, light, dark });

export const ACCENT_PRESETS: AccentPreset[] = [
  P('magenta', 'Magenta', '#d81b97',
    { primary: '#d81b97', primaryLight: '#ff9ee0', primaryDark: '#a60d6e', accent: '#ff2d55', accentLight: '#ff7a93' },
    { primary: '#f472d6', primaryLight: '#ff9ee0', primaryDark: '#c21585', accent: '#ff5a7a', accentLight: '#ff8fa5' }),
  P('rose', 'Rose', '#e91e8c',
    { primary: '#e91e8c', primaryLight: '#ffb6cc', primaryDark: '#b30069', accent: '#ff5a7a', accentLight: '#ff8fa5' },
    { primary: '#f472d6', primaryLight: '#ff9ee0', primaryDark: '#c21585', accent: '#ff5a7a', accentLight: '#ff8fa5' }),
  P('red', 'Rubis', '#e11d48',
    { primary: '#e11d48', primaryLight: '#ffb3c4', primaryDark: '#9f1239', accent: '#ff2d55', accentLight: '#ff7a93' },
    { primary: '#fb7185', primaryLight: '#ffb3c4', primaryDark: '#be123c', accent: '#ff5a7a', accentLight: '#ff8fa5' }),
  P('violet', 'Violet', '#8a2be2',
    { primary: '#8a2be2', primaryLight: '#d7b8f7', primaryDark: '#6b21a8', accent: '#c026d3', accentLight: '#e879f9' },
    { primary: '#c084fc', primaryLight: '#e9d5ff', primaryDark: '#9333ea', accent: '#e879f9', accentLight: '#f5b8fc' }),
  P('blue', 'Ocean', '#0ea5e9',
    { primary: '#0284c7', primaryLight: '#a5dcf5', primaryDark: '#075985', accent: '#6366f1', accentLight: '#a5b4fc' },
    { primary: '#38bdf8', primaryLight: '#bae6fd', primaryDark: '#0ea5e9', accent: '#818cf8', accentLight: '#c7d2fe' }),
  P('emerald', 'Emeraude', '#059669',
    { primary: '#059669', primaryLight: '#a7f3d0', primaryDark: '#065f46', accent: '#d97706', accentLight: '#fcd34d' },
    { primary: '#34d399', primaryLight: '#a7f3d0', primaryDark: '#059669', accent: '#fbbf24', accentLight: '#fde68a' }),
  P('amber', 'Ambre', '#f59e0b',
    { primary: '#d97706', primaryLight: '#fde68a', primaryDark: '#92400e', accent: '#ea580c', accentLight: '#fdba74' },
    { primary: '#fbbf24', primaryLight: '#fde68a', primaryDark: '#d97706', accent: '#fb923c', accentLight: '#fdba74' }),
  P('ink', 'Encre', '#334155',
    { primary: '#334155', primaryLight: '#cbd5e1', primaryDark: '#0f172a', accent: '#e11d48', accentLight: '#fda4af' },
    { primary: '#94a3b8', primaryLight: '#cbd5e1', primaryDark: '#475569', accent: '#fb7185', accentLight: '#fda4af' }),
];

export const DEFAULT_ACCENT: AccentKey = 'magenta';

export function getAccentPreset(key?: string | null): AccentPreset {
  return ACCENT_PRESETS.find((p) => p.key === key) ?? ACCENT_PRESETS[0];
}

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
  // color is the theme's core hex (from the catalog), and its background is
  // the applied portrait illustration.
  if (colorThemeId) {
    const hex = findThemeById(colorThemeId)?.color ?? '#d81b97';
    const v = colorThemeValues(hex);
    root.style.setProperty('--color-primary', v.primary);
    root.style.setProperty('--color-primary-light', v.primaryLight);
    root.style.setProperty('--color-primary-dark', v.primaryDark);
    root.style.setProperty('--color-accent', v.accent);
    root.style.setProperty('--color-accent-light', v.accentLight);
    root.style.setProperty('--ion-color-primary', v.primary);
    root.style.setProperty('--ion-color-secondary', v.accent);
    root.style.setProperty('--theme-image', `url(${themeImagePath(colorThemeId)})`);
    root.setAttribute('data-theme-image', 'on');
    return;
  }
  const v = isDark ? getAccentPreset(key).dark : getAccentPreset(key).light;
  root.style.setProperty('--color-primary', v.primary);
  root.style.setProperty('--color-primary-light', v.primaryLight);
  root.style.setProperty('--color-primary-dark', v.primaryDark);
  root.style.setProperty('--color-accent', v.accent);
  root.style.setProperty('--color-accent-light', v.accentLight);
  root.style.setProperty('--ion-color-primary', v.primary);
  root.style.setProperty('--ion-color-secondary', v.accent);
  root.style.removeProperty('--theme-image');
  root.removeAttribute('data-theme-image');
}

/**
 * Resolve the portrait image path for an image-based color theme.
 * `id` = theme id from the catalog, e.g. "esprit-pentecote".
 * The category is the first two id segments; the file lives at
 * public/themes/{category}/{id}-portrait.png.
 */
export function themeImagePath(id: string): string {
  const category = id.split('-').slice(0, 2).join('-');
  return `/themes/${category}/${id}-portrait.png`;
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
  ].forEach((k) => root.style.removeProperty(k));
}
