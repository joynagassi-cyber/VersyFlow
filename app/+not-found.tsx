/**
 * Not Found — 404 Fallback Screen
 */

import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useAppTheme } from '@/theme/useTheme';

export default function NotFoundScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Cette page n'existe pas</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Retour à l'accueil</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
});
