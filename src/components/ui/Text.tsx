/**
 * Primitive Text — Reusable text component with token-based styles
 */

import { Text as RNText, StyleSheet } from 'react-native';
import { typography } from '@/tokens';

type TextSize = keyof typeof typography.sizes;
type TextWeight = keyof typeof typography.weights;

interface TextProps {
  size?: TextSize;
  weight?: TextWeight;
  style?: any;
  children: React.ReactNode;
}

export function Text({ size = 'base', weight = 'regular', style, children }: TextProps) {
  return (
    <RNText
      style={[
        styles.base,
        {
          fontSize: typography.sizes[size],
          fontWeight: typography.weights[weight],
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.families.primary,
    color: '#2D2D2D',
  },
});
