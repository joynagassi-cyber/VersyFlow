/**
 * Primitive Button — Primary Action
 * See docs/06-design-system.md (ButtonPrimary) + docs/07-design-tokens.md
 */

import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';

interface ButtonPrimaryProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ButtonPrimary({ title, onPress, disabled = false, loading = false }: ButtonPrimaryProps) {
  const { colors } = useAppTheme();
  const styles = StyleSheet.create({
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    disabled: {
      backgroundColor: colors.textMuted,
      opacity: 0.5,
    },
    loading: {
      opacity: 0.8,
    },
    text: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.disabled,
        loading && styles.loading,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} size="small" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
