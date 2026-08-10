/**
 * Appearance Settings Screen — Theme and display preferences
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';

type Theme = 'light' | 'dark' | 'system';

export default function AppearanceScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>('light');
  const [fontSize, setFontSize] = useState<number>(16);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);

  const themes: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
    { value: 'system', label: 'Système' },
  ];

  const fontSizes = [14, 16, 18, 20, 22];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thème</Text>
        {themes.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.option, theme === t.value && styles.optionSelected]}
            onPress={() => setTheme(t.value)}
          >
            <Text style={[styles.optionText, theme === t.value && styles.optionTextSelected]}>
              {t.label}
            </Text>
            {theme === t.value && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Taille du texte</Text>
        <View style={styles.fontSizeRow}>
          {fontSizes.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.fontSizeButton, fontSize === size && styles.fontSizeButtonSelected]}
              onPress={() => setFontSize(size)}
            >
              <Text style={[styles.fontSizeText, fontSize === size && styles.fontSizeTextSelected]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Affichage</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Numéros de versets</Text>
          <Switch
            value={showVerseNumbers}
            onValueChange={setShowVerseNumbers}
            trackColor={{ false: '#767570', true: colors.primary }}
            thumbColor={showVerseNumbers ? 'colors.primary' : '#f4f3f2'}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionSelected: {
    backgroundColor: colors.surfaceTint,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
  },
  fontSizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fontSizeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  fontSizeButtonSelected: {
    backgroundColor: colors.primary,
  },
  fontSizeText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  fontSizeTextSelected: {
    color: colors.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.textPrimary,
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
