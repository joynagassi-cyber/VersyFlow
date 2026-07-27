/**
 * Language Picker Screen — Onboarding Step 1
 * Supports: French, English, Arabic (RTL), German, Chinese
 * See docs/08-ui-screens.md §2
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES } from '@/domains/i18n/config';
import { useSettingsStore } from '@/store/settings-store';

export default function LanguagePickerScreen() {
  const router = useRouter();
  const { setUiLanguage, uiLanguage } = useSettingsStore();

  // Sélectionne la langue actuellement sauvegardée (ou la par défaut)
  const selectedLanguage = uiLanguage || 'fr';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Langue de l'interface</Text>

      <ScrollView style={styles.scrollArea}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.card,
              selectedLanguage === lang.code && styles.cardSelected,
            ]}
            onPress={() => {
              setUiLanguage(lang.code);
              // Naviguer vers l'étape suivante de l'onboarding
              router.push('/onboarding/translation-select');
            }}
          >
            <View style={styles.langInfo}>
              <Text style={styles.nativeName}>{lang.name}</Text>
              <Text style={styles.displayName}>{lang.displayName}</Text>
              {lang.rtl && <Text style={styles.rtlBadge}>RTL</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => router.back()}
      >
        <Text style={styles.continueText}>Retour</Text>
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
    marginBottom: 8,
    ...shadow.md,
  },
  cardSelected: {
    backgroundColor: '#FFF0F6',
    borderColor: '#E91E8C',
    borderWidth: 2,
  },
  langInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nativeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  displayName: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 4,
  },
  rtlBadge: {
    fontSize: 11,
    color: '#E91E8C',
    marginTop: 4,
    backgroundColor: '#FFE4EE',
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

