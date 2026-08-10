/**
 * VersyFlow Design Tokens — Sacred Modern Design System
 * Light & Dark mode support with automatic theme switching
 * Do NOT hardcode colors in components — always use these tokens
 */

import { Platform } from 'react-native';

// ─── Color Palette ───────────────────────────────────────────────────────────

export const Colors = {
  // Primary — Sacred Rose
  primary: '#E91E8C',
  primaryLight: '#FFB6CC',
  primaryDark: '#B30069',

  // Backgrounds
  background: '#fcf9f8',
  backgroundDark: '#121212',
  surface: '#FFFFFF',
  surfaceDark: '#1E1E1E',
  surfaceElevated: '#FFFFFF',
  surfaceElevatedDark: '#2A2A2A',
  surfaceTint: '#FFF0F6',
  surfaceTintDark: '#2A1A24',

  // Borders & Dividers
  border: '#FFE4EE',
  borderDark: 'rgba(255, 255, 255, 0.08)',
  divider: '#FFF0F6',
  dividerDark: 'rgba(255, 255, 255, 0.06)',

  // Text — Light mode
  textPrimary: '#2D2D2D',
  textSecondary: '#594048',
  textTertiary: '#6E6E6E',
  textMuted: '#A0A0A0',
  textPlaceholder: '#C0C0C0',

  // Text — Dark mode
  textPrimaryDark: '#FFFFFF',
  textSecondaryDark: '#B3B3B3',
  textTertiaryDark: '#6E6E6E',
  textMutedDark: '#535353',

  // Semantic — Success
  success: '#008733',
  successLight: '#E8F5E9',
  successDark: '#1DB954',

  // Semantic — Error
  error: '#FF6B6B',
  errorLight: '#FFEBEE',
  errorDark: '#E51332',

  // Semantic — Warning
  warning: '#FF9500',
  warningLight: '#FFF3E0',
  warningDark: '#FFB800',

  // Semantic — Info
  info: '#007AFF',
  infoLight: '#E3F2FD',
  infoDark: '#2196F3',

  // Status indicators
  statusNew: '#A0A0A0',
  statusReview: '#E91E8C',
  statusLearned: '#008733',

  // Icon backgrounds
  iconBgRose: '#FFE4EE',
  iconBgPink: '#FFF0F6',
  iconBgPurple: '#EADCE2',
  iconBgBlue: '#E3F2FD',
  iconBgGreen: '#E8F5E9',
  iconBgOrange: '#FFF3E0',
  iconBgTeal: '#E0F2F1',
  iconBgIndigo: '#E8EAF6',
} as const;

// ─── Dark Mode Token Map ────────────────────────────────────────────────────

export const ColorsDark = {
  // Primary — Sacred Rose (same, works on dark)
  primary: '#E91E8C',
  primaryLight: '#FFB6CC',
  primaryDark: '#FF6BAC',

  // Backgrounds
  background: '#121212',
  backgroundDark: '#0A0A0A',
  surface: '#1E1E1E',
  surfaceDark: '#151515',
  surfaceElevated: '#2A2A2A',
  surfaceElevatedDark: '#333333',
  surfaceTint: '#2A1A24',
  surfaceTintDark: '#1F151D',

  // Borders & Dividers
  border: 'rgba(255, 255, 255, 0.08)',
  borderDark: 'rgba(255, 255, 255, 0.05)',
  divider: 'rgba(255, 255, 255, 0.06)',
  dividerDark: 'rgba(255, 255, 255, 0.04)',

  // Text — Dark mode
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textTertiary: '#6E6E6E',
  textMuted: '#535353',
  textPlaceholder: '#404040',

  // Text — Light mode (fallback)
  textPrimaryDark: '#2D2D2D',
  textSecondaryDark: '#594048',
  textTertiaryDark: '#6E6E6E',
  textMutedDark: '#A0A0A0',

  // Semantic — Success
  success: '#00C853',
  successLight: '#1A2E1A',
  successDark: '#1DB954',

  // Semantic — Error
  error: '#FF5252',
  errorLight: '#2E1A1A',
  errorDark: '#E51332',

  // Semantic — Warning
  warning: '#FFB300',
  warningLight: '#2E2010',
  warningDark: '#FFB800',

  // Semantic — Info
  info: '#448AFF',
  infoLight: '#1A2030',
  infoDark: '#2196F3',

  // Status indicators
  statusNew: '#6E6E6E',
  statusReview: '#E91E8C',
  statusLearned: '#00C853',

  // Icon backgrounds
  iconBgRose: '#2A1A24',
  iconBgPink: '#2A1A24',
  iconBgPurple: '#1F1520',
  iconBgBlue: '#1A2030',
  iconBgGreen: '#1A2E1A',
  iconBgOrange: '#2E2010',
  iconBgTeal: '#1A2E2E',
  iconBgIndigo: '#1A1A2E',
} as const;

// ─── Typography Scale ────────────────────────────────────────────────────────

export const Typography = {
  // Display
  displayLarge: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  displayLargeMobile: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },

  // Headlines
  headlineMedium: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  headlineSmall: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },

  // Titles
  titleLarge: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  titleMedium: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  titleSmall: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },

  // Body
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },

  // Labels & Captions
  labelLarge: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 },
  labelMedium: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
  labelSmall: { fontSize: 11, fontWeight: '500' as const, lineHeight: 15, letterSpacing: 0.05 },

  // Button text
  buttonText: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },

  // Bible text (Source Serif 4 equivalent)
  bibleText: { fontSize: 20, fontWeight: '400' as const, lineHeight: 34, letterSpacing: 0.01 },
} as const;

// ─── Spacing Scale (8px base grid) ───────────────────────────────────────────

export const Spacing = {
  unit: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  containerMargin: 24,
  gutter: 16,
  stackSm: 8,
  stackMd: 16,
  stackLg: 32,
  sectionGap: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
  pill: 26, // For 52px height buttons
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2 },
    android: { elevation: 1 },
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
    android: { elevation: 2 },
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
    android: { elevation: 4 },
  }),
  xl: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16 },
    android: { elevation: 8 },
  }),
  // Rose tinted shadows for CTAs
  rose: Platform.select({
    ios: { shadowColor: '#E91E8C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
    android: { elevation: 6 },
  }),
  // Modal shadows
  modal: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    android: { elevation: 8 },
  }),
} as const;

// ─── Navigation Dimensions ───────────────────────────────────────────────────

export const Nav = {
  tabBarHeight: 64,
  tabBarActiveHeight: 64,
  headerHeight: 56,
  safeAreaBottom: Platform.OS === 'ios' ? 34 : 16,
} as const;

// ─── Elevation Levels ────────────────────────────────────────────────────────

export const Elevation = {
  level0: 0,
  level1: 2,
  level2: 4,
  level3: 6,
  level4: 8,
} as const;

// ─── Helper: Get theme-aware colors ──────────────────────────────────────────

type ThemeMode = 'light' | 'dark';

export function getThemeColors(mode: ThemeMode) {
  return mode === 'dark' ? ColorsDark : Colors;
}

export function getThemeShadow(size: keyof typeof Shadows, mode: ThemeMode) {
  return Shadows[size];
}

// ─── Export all for easy access ──────────────────────────────────────────────

export default {
  Colors,
  ColorsDark,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Nav,
  Elevation,
  getThemeColors,
  getThemeShadow,
};
