/**
 * Primitive Button — Secondary Action
 */

import { StyleSheet, Text, TouchableOpacity } from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';

interface ButtonSecondaryProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export function ButtonSecondary({ title, onPress, disabled = false }: ButtonSecondaryProps) {
  const { colors } = useAppTheme();
  const styles = StyleSheet.create({
    button: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    disabled: {
      opacity: 0.5,
    },
    text: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '500',
    },
  });

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
