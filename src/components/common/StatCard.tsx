/**
 * Stat Card — Display a single statistic
 */

import { StyleSheet, View, Text } from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
}

export function StatCard({ value, label, icon }: StatCardProps) {
  const { colors } = useAppTheme();
  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      ...shadow,
    },
    value: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    label: {
      fontSize: 13,
      color: colors.textTertiary,
    },
  });

  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
};
