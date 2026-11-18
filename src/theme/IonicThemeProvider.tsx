/**
 * Ionic Theme Provider
 *
 * Provides theme context for Ionic React in a web/Capacitor environment.
 * Maps VersyFlow design tokens to Ionic CSS variables.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Colors, ColorsDark, getThemeColors, Typography, Spacing, Radius, Shadows, Nav } from './tokens';
import { useAppearanceStore } from '@/store/appearance-store';

export type ThemeMode = 'light' | 'dark';

/** Common color palette satisfied by both `Colors` (light) and `ColorsDark`. */
type ColorPalette = typeof Colors | typeof ColorsDark;

interface ThemeContextType {
  colors: ColorPalette;
  colorsDark: typeof ColorsDark;
  isDark: boolean;
  themeMode: ThemeMode;
  typ: typeof Typography;
  sp: typeof Spacing;
  rad: typeof Radius;
  sh: typeof Shadows;
  nav: typeof Nav;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: Colors,
  colorsDark: ColorsDark,
  isDark: false,
  themeMode: 'light',
  typ: Typography,
  sp: Spacing,
  rad: Radius,
  sh: Shadows,
  nav: Nav,
});

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Le mode ne se décide PLUS ici à partir de `prefers-color-scheme` : c'était un
 * second écrivain de `data-theme`, qui écrasait le choix de l'utilisateur
 * (`appearance-store.themeMode`) et faisait qu'un thème sombre choisi restait
 * invisible quand l'OS était en clair. Source unique : `useTheme` (./useTheme),
 * qui lit le store ; ce fournisseur ne fait que relayer.
 */
function getDarkMode(): ThemeMode {
  const stored = useAppearanceStore.getState().themeMode;
  if (stored === 'dark' || stored === 'light') return stored;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function IonicThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(getDarkMode() === 'dark');
  const themeMode: ThemeMode = isDark ? 'dark' : 'light';

  useEffect(() => {
    applyThemeVariables(isDark);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      applyThemeVariables(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  function applyThemeVariables(dark: boolean) {
    const root = document.documentElement;
    const colors = dark ? ColorsDark : Colors;

    // `data-theme` est posé par `useTheme` (store → attribut). On ne le
    // réécrit que s'il manque, pour ne pas contredire le choix utilisateur.
    if (!root.getAttribute('data-theme')) {
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
    }

    root.style.setProperty('--ion-color-primary', colors.primary);
    root.style.setProperty('--ion-background-color', colors.background);
    root.style.setProperty('--ion-toolbar-background', colors.surface);
    root.style.setProperty('--ion-text-color', colors.textPrimary);
    root.style.setProperty('--ion-item-background', colors.surface);
    root.style.setProperty('--ion-card-background', colors.surface);
  }

  const colors = useMemo(() => getThemeColors(themeMode), [themeMode]);
  const value = useMemo<ThemeContextType>(() => ({
    colors,
    colorsDark: ColorsDark,
    isDark,
    themeMode,
    typ: Typography,
    sp: Spacing,
    rad: Radius,
    sh: Shadows,
    nav: Nav,
  }), [colors, isDark, themeMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export default IonicThemeProvider;
