/**
 * Language Settings Screen — UI language preferences
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES } from '@/domains/i18n/config';
import { useSettingsStore } from '@/store/settings-store';

export default function LanguageSettingsScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const { uiLanguage, setUiLanguage } = useSettingsStore();
  const selectedLanguage = uiLanguage || 'fr';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Langue de l'interface</Text>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCard,
                selectedLanguage === lang.code && styles.languageCardSelected,
              ]}
              onPress={() => setUiLanguage(lang.code)}
            >
              <View style={styles.langInfo}>
                <Text style={styles.nativeName}>{lang.name}</Text>
                <Text style={styles.displayName}>{lang.displayName}</Text>
                {lang.rtl && <Text style={styles.rtlBadge}>RTL</Text>}
              </View>
              {selectedLanguage === lang.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  languageCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageCardSelected: {
    backgroundColor: colors.surfaceTint,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  langInfo: {
    flex: 1,
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
    alignSelf: 'flex-start',
  },
  checkmark: {
    fontSize: 24,
    color: colors.primary,
    marginLeft: 16,
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
