/**
 * ThemeManager - applies the persisted theme mode + accent color on mount and
 * on change. Mounted once in main.tsx so the correct theme & accent are in
 * place before any screen paints.
 *
 *  - Syncs `appearance-store.themeMode` into `useTheme` (drives `data-theme`).
 *  - Applies the accent preset (`--color-primary*` / `--color-accent` / Ionic)
 *    based on the chosen accent + the effective dark state.
 *  - When the accent is an image-based color theme (theme-catalog), also sets
 *    `--theme-image` so the full-screen portrait illustration is applied.
 *  - Applies the Bible reading typography (`--reading-*` vars) from the
 *    appearance store's bibleFont* fields, and lazy-loads the chosen
 *    @fontsource family so the webfont is only fetched when selected.
 */
import { useEffect } from 'react';
import { useAppearanceStore } from '@/store/appearance-store';
import { useTheme } from '@/theme/useTheme';
import { applyAccentPreset } from '@/theme/theme-presets';
import { applyReadingVars, findBibleFont, loadBibleFont } from '@/theme/theme-fonts';

export function ThemeManager() {
  const themeMode = useAppearanceStore((s) => s.themeMode);
  const accent = useAppearanceStore((s) => s.accent);
  const colorThemeId = useAppearanceStore((s) => s.colorThemeId);
  const bibleFontFamily = useAppearanceStore((s) => s.bibleFontFamily);
  const bibleFontSize = useAppearanceStore((s) => s.bibleFontSize);
  const bibleLineHeight = useAppearanceStore((s) => s.bibleLineHeight);
  const bibleLetterSpacing = useAppearanceStore((s) => s.bibleLetterSpacing);
  const bibleLineLength = useAppearanceStore((s) => s.bibleLineLength);
  const theme = useTheme();

  // Follow a manual override; for 'system' the useTheme hook tracks the OS.
  useEffect(() => {
    if (themeMode === 'system') return;
    theme.setThemeMode(themeMode);
  }, [themeMode, theme]);

  // Apply the accent color for the current effective dark state, and the
  // image-based theme background (when an image theme is active).
  useEffect(() => {
    applyAccentPreset(accent, theme.isDark, colorThemeId);
  }, [accent, colorThemeId, theme.isDark, theme]);

  // Bible reading typography: lazy-load the chosen webfont (offline-first,
  // only on selection change) and write the live --reading-* vars so the
  // manuscript styles in globals.css follow the user's settings.
  useEffect(() => {
    void loadBibleFont(bibleFontFamily);
  }, [bibleFontFamily]);

  useEffect(() => {
    applyReadingVars({
      family: findBibleFont(bibleFontFamily).family,
      size: bibleFontSize,
      lineHeight: bibleLineHeight,
      letterSpacing: bibleLetterSpacing,
      lineLength: bibleLineLength,
    });
  }, [bibleFontFamily, bibleFontSize, bibleLineHeight, bibleLetterSpacing, bibleLineLength]);

  return null;
}

export default ThemeManager;
