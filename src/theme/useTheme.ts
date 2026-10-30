/**
 * Unified Theme Hook — single source of truth for theme state.
 *
 * Merges the former `useAppTheme()` and context-based `useTheme()` into one
 * hook that:
 *  - Exposes `colors` (light/dark palette), `isDark`, `themeMode`
 *  - Syncs `data-theme` on <html> so CSS variables (globals.css) switch
 *  - Applies matching Ionic CSS variables
 *  - Supports manual override persisted in localStorage
 */

import { useEffect, useMemo, useState } from 'react';
import { useAppearanceStore } from '@/store/appearance-store';
import {
  ColorsDark,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Nav,
  getThemeColors,
} from './tokens';

export type ThemeMode = 'light' | 'dark';

function applyThemeAttributes(mode: ThemeMode) {
  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  const colors = getThemeColors(mode);
  root.style.setProperty('--ion-color-primary', colors.primary);
  root.style.setProperty('--ion-background-color', colors.background);
  root.style.setProperty('--ion-toolbar-background', colors.surface);
  root.style.setProperty('--ion-text-color', colors.textPrimary);
  root.style.setProperty('--ion-item-background', colors.surface);
  root.style.setProperty('--ion-card-background', colors.surface);
}

export function useTheme() {
  const choice = useAppearanceStore((s) => s.themeMode);
  const setChoice = useAppearanceStore((s) => s.setThemeMode);
  const [systemDark, setSystemDark] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const themeMode: ThemeMode = choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;
  useEffect(() => { applyThemeAttributes(themeMode); }, [themeMode]);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const setThemeMode = (mode: ThemeMode) => setChoice(mode);

  const isDark = themeMode === 'dark';
  const colors = useMemo(() => getThemeColors(themeMode), [themeMode]);

  return {
    colors,
    isDark,
    themeMode,
    setThemeMode,
    // Token scales (stable references)
    typ: Typography,
    sp: Spacing,
    rad: Radius,
    sh: Shadows,
    nav: Nav,
    // Legacy aliases for compatibility
    colorsDark: ColorsDark,
    Colors: colors,
    Typography,
    Spacing,
    Radius: Radius,
    Shadows: Shadows,
    Nav: Nav,
    dark: isDark,
  };
}

/**
 * @deprecated Backward-compatibility alias — use useTheme() directly.
 * Existing screens using useAppTheme keep working; migrate them over time.
 */
export const useAppTheme = useTheme;

export default useTheme;
