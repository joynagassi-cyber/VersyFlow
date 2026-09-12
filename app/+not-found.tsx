import { useMemo } from 'react';
/**
 * Not Found — 404 Fallback Screen
 */

import { Link } from 'react-router-dom';
import { StyleSheet, View, Text } from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';

export default function NotFoundScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.surfaceTint,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.textPrimary,
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 26,
  },
  linkText: {
    fontSize: 14,
    color: colors.surface,
    fontWeight: '600',
  },
  }), [colors]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cette page n'existe pas</Text>
      <Link to="/" style={styles.link as any}>
        <Text style={styles.linkText}>Retour à l'accueil</Text>
      </Link>
    </View>
  );
}
