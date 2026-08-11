/**
 * Welcome Screen — Onboarding entry point
 * See docs/08-ui-screens.md §1
 */

import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.logo}>VersyFlow</Text>
      <Text style={styles.tagline}>Mémorisation biblique intuitive</Text>

      <View style={styles.carousel}>
        <Text style={styles.slideTitle}>Choisissez votre traduction</Text>
        <Text style={styles.slideDesc}>Parmi les traductions bibliques disponibles</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/onboarding/language-select')}
        >
          <Text style={styles.startButtonText}>Commencer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: colors.textTertiary,
    marginBottom: 48,
  },
  carousel: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
    marginBottom: 64,
    ...shadow.md,
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  slideDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 16,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  startButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.surface,
  },
});

// Shadow utility matching tokens
const shadow = {
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
};
