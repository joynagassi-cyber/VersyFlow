/**
 * Translation Picker Screen — Onboarding Step 2
 * Default: LSG (Louis Segond 1910)
 * See docs/08-ui-screens.md §3
 */

import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const TRANSLATIONS = [
  { id: 'lsg', name: 'Louis Segond (1910)', year: '1910', style: 'Classique', default: true },
  // Future translations added here: KJV, NIV, NASB, ESV...
];

export default function TranslationPickerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Traduction biblique</Text>

      <TouchableOpacity style={styles.card} onPress={() => router.replace('/(tabs)/index')}>
        <Text style={styles.transName}>{TRANSLATIONS[0].name}</Text>
        <Text style={styles.transMeta}>
          {TRANSLATIONS[0].year} • {TRANSLATIONS[0].style}
        </Text>
        {TRANSLATIONS[0].default && (
          <Text style={styles.defaultBadge}>Traduction par défaut</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => router.replace('/(tabs)/index')}
      >
        <Text style={styles.continueText}>Continuer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    ...shadow.md,
  },
  transName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  transMeta: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 4,
  },
  defaultBadge: {
    fontSize: 12,
    color: '#E91E8C',
    marginTop: 8,
    backgroundColor: '#FFE4EE',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  continueButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

const shadow = {
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
};
