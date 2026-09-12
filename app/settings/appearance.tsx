/**
 * Appearance Settings Screen — Theme and display preferences
 *
 * Wired to the real theme system (`useTheme().setThemeMode`) and persisted via
 * the `useAppearanceStore`, so a theme choice actually applies (CSS variables
 * on <html> + Ionic tokens) and survives restarts.
 */

import { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
} from '@/components/ui/Primitives';
import { useTheme } from '@/theme/useTheme';
import { useRouter } from '@/hooks/useIonicNavigation';
import { useAppearanceStore } from '@/store/appearance-store';

type Theme = 'light' | 'dark' | 'system';

export default function AppearanceScreen() {
  const theme = useTheme();
  const router = useRouter();

  const {
    themeMode,
    fontSize,
    showVerseNumbers,
    setThemeMode,
    setFontSize,
    toggleVerseNumbers,
  } = useAppearanceStore();

  const { colors, sp, sh, rad } = theme;
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: rad.md,
      padding: sp.md,
      marginHorizontal: sp.md,
      marginBottom: sp.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: sp.sm,
    },
    option: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: sp.sm * 1.5,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      borderRadius: rad.sm,
    },
    optionLast: {
      borderBottomWidth: 0,
    },
    optionSelected: {
      backgroundColor: colors.surfaceTint,
      borderRadius: rad.sm,
      paddingHorizontal: sp.md,
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
      paddingVertical: sp.sm * 1.5,
      paddingHorizontal: sp.md * 1.25,
      borderRadius: rad.sm,
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
      color: colors.onSurface,
      fontWeight: '600',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: sp.sm * 1.5,
    },
    toggleLabel: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    backButton: {
      padding: sp.md,
      alignItems: 'center',
    },
    backText: {
      fontSize: 14,
      color: colors.textMuted,
      textDecorationLine: 'underline',
    },
  }), [colors, sp, rad, sh]);

  const handleSelectTheme = (value: Theme) => {
    setThemeMode(value);
    if (value === 'system') {
      // Reset to system preference
      theme.setThemeMode(theme.isDark ? 'dark' : 'light');
    } else {
      theme.setThemeMode(value);
    }
  };

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
        {themes.map((t, i) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.option, i === themes.length - 1 ? styles.optionLast : null, themeMode === t.value ? styles.optionSelected : null]}
            onPress={() => handleSelectTheme(t.value)}
          >
            <Text style={[styles.optionText, themeMode === t.value ? styles.optionTextSelected : null]}>
              {t.label}
            </Text>
            {themeMode === t.value && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Taille du texte</Text>
        <View style={styles.fontSizeRow}>
          {fontSizes.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.fontSizeButton, fontSize === size ? styles.fontSizeButtonSelected : null]}
              onPress={() => setFontSize(size)}
            >
              <Text style={[styles.fontSizeText, fontSize === size ? styles.fontSizeTextSelected : null]}>
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
            onValueChange={() => toggleVerseNumbers()}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
