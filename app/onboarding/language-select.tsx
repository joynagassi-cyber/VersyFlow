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
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES } from '@/domains/i18n/config';
import { useSettingsStore } from '@/store/settings-store';

export default function LanguagePickerScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
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
    backgroundColor: colors.surfaceTint,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  scrollArea: {
    flex: 1,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...shadow.md,
  },
  cardSelected: {
    backgroundColor: colors.surfaceTint,
    borderColor: colors.primary,
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
    color: colors.textPrimary,
  },
  displayName: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  rtlBadge: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.surface,
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

