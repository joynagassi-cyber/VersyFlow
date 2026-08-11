/**
 * Theme Provider — Wraps the app with theme context
 * Provides automatic light/dark mode switching
 */

import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ColorsDark, getThemeColors, type ThemeMode } from './tokens';

interface ThemeContextType {
  colors: typeof Colors;
  colorsDark: typeof ColorsDark;
  isDark: boolean;
  themeMode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: Colors,
  colorsDark: ColorsDark,
  isDark: false,
  themeMode: 'light',
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const value = React.useMemo<ThemeContextType>(() => ({
    colors: isDark ? ColorsDark : Colors,
    colorsDark: ColorsDark,
    isDark,
    themeMode: isDark ? 'dark' : 'light',
  }), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
