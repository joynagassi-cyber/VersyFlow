/**
 * Stat Card — Display a single statistic
 */

import { StyleSheet, View, Text } from 'react-native';
import { colors, spacing, typography } from '@/tokens';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
}

export function StatCard({ value, label, icon }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary[400],
    fontFamily: typography.families.heading,
  },
  label: {
    fontSize: 14,
    color: '#6E6E6E',
    marginTop: 4,
  },
});

const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
};
