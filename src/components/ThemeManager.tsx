import { useEffect } from 'react';
import { useAppearanceStore } from '@/store/appearance-store';
import { useTheme } from '@/theme/useTheme';
import { applyAccentPreset } from '@/theme/theme-presets';

/**
 * ThemeManager - applies the persisted theme mode + accent color on mount and
 * on change. Mounted once in main.tsx so the correct theme & accent are in
 * place before any screen paints.
 *
 *  - Syncs `appearance-store.themeMode` into `useTheme` (drives `data-theme`).
 *  - Applies the accent preset (`--color-primary*` / `--color-accent` / Ionic)
 *    based on the chosen accent + the effective dark state.
 */
export function ThemeManager() {
  const themeMode = useAppearanceStore((s) => s.themeMode);
  const accent = useAppearanceStore((s) => s.accent);
  const theme = useTheme();

  // Follow a manual override; for 'system' the useTheme hook tracks the OS.
  useEffect(() => {
    if (themeMode === 'system') return;
    theme.setThemeMode(themeMode);
  }, [themeMode, theme]);

  // Apply the accent color for the current effective dark state.
  useEffect(() => {
    applyAccentPreset(accent, theme.isDark);
  }, [accent, theme.isDark, theme]);

  return null;
}

export default ThemeManager;
