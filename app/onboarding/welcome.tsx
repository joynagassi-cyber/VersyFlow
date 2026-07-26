/**
 * Welcome Screen — Onboarding entry point
 * See docs/08-ui-screens.md §1
 */

import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
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
          onPress={() => router.replace('/(tabs)/index')}
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
    backgroundColor: '#FFF0F6',
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
    color: '#E91E8C',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6E6E6E',
    marginBottom: 48,
  },
  carousel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 64,
    ...shadow.md,
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  slideDesc: {
    fontSize: 14,
    color: '#A0A0A0',
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
    color: '#A0A0A0',
  },
  startButton: {
    flex: 2,
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
