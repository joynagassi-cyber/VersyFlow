/**
 * Theme Hook — Provides theme-aware tokens for all components
 * Usage: const { colors, typ, spacing, radius } = useAppTheme()
 */

import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  Colors,
  ColorsDark,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Nav,
  getThemeColors,
} from './tokens';

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = useMemo(() => getThemeColors(isDark ? 'dark' : 'light'), [isDark]);
  const typ = Typography;
  const sp = Spacing;
  const rad = Radius;
  const sh = Shadows;
  const nav = Nav;

  return {
    colors,
    typ,
    sp,
    rad,
    sh,
    nav,
    isDark,
    // Legacy access for compatibility
    Colors: isDark ? ColorsDark : Colors,
    Typography: typ,
    Spacing: sp,
    Radius: rad,
    Shadows: sh,
    Nav: nav,
    dark: isDark,
  };
}
