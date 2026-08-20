/**
 * Tokens barrel export
 * Re-exports design tokens from theme/tokens.ts
 */
import {
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
} from '@/theme/tokens';

// Re-export named
export {
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

// Backward-compatible named exports for components
export const colors = Colors;
export const typography = Typography;
export const spacing = Spacing;
export const radius = Radius;
export const shadows = Shadows;
