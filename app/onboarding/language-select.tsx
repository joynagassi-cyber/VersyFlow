/**
 * Language Picker Screen — Onboarding Step 1
 * Supports: French, English, Arabic (RTL), German, Chinese
 * See docs/08-ui-screens.md §2
 */

import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES } from '@/domains/i18n/config';

export default function LanguagePickerScreen() {
  const router = useRouter();
  // TODO: wire with Zustand store for selection persistence

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Langue de l'interface</Text>

      <ScrollView style={styles.scrollArea}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.card}
            onPress={() => {
              // Persist language → navigate to translation picker or home
            }}
          >
            <Text style={styles.nativeName}>{lang.name}</Text>
            <Text style={styles.displayName}>{lang.displayName}</Text>
            {lang.rtl && <Text style={styles.rtlBadge}>RTL</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => router.back()}
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
  scrollArea: {
    flex: 1,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...shadow.md,
  },
  nativeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  displayName: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 2,
  },
  rtlBadge: {
    fontSize: 11,
    color: '#E91E8C',
    marginTop: 4,
    backgroundColor: '#FFE4EE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  continueButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
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
