/**
 * Primitive Button — Secondary Action
 */

import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '@/tokens';

interface ButtonSecondaryProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export function ButtonSecondary({ title, onPress, disabled = false }: ButtonSecondaryProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary[400],
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
    borderColor: colors.neutral[300],
  },
  text: {
    color: colors.primary[400],
    fontSize: 16,
    fontWeight: '600',
  },
});
