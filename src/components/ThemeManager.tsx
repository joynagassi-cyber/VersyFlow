/**
 * ThemeManager — applies the persisted theme mode on mount.
 *
 * Reads the theme mode from `useAppearanceStore` and pushes it into the
 * `useTheme` hook, which sets `data-theme` on <html> and applies the
 * matching Ionic CSS variables. This ensures the theme is applied as early
 * as possible (before any screen renders) so there is no flash of wrong
 * theme.
 */

import { useEffect } from 'react';
import { useAppearanceStore } from '@/store/appearance-store';
import { useTheme } from '@/theme/useTheme';

export function ThemeManager() {
  const themeMode = useAppearanceStore((s) => s.themeMode);
  const theme = useTheme();

  useEffect(() => {
    if (themeMode === 'system') {
      // follow system preference — the useTheme hook already does this,
      // just make sure there is no stale manual override
      return;
    }
    theme.setThemeMode(themeMode);
}, [themeMode]);

  return null;
}

export default ThemeManager;
