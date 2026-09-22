/**
 * Privacy Settings Screen
 */

import { useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from '@/hooks/useIonicNavigation';
import { useTranslation } from 'react-i18next';

export default function PrivacyScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  dangerText: {
    color: colors.error,
  },
  arrow: {
    fontSize: 20,
    color: colors.textMuted,
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
  }), [colors]);
  const router = useRouter();
  const { t } = useTranslation();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [crashReporting, setCrashReporting] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.privacyTitle', 'Données & Confidentialité')}</Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('settings.anonymousAnalytics', "Partager l'analyse anonyme")}</Text>
          <Switch
            value={analyticsEnabled}
            onValueChange={setAnalyticsEnabled}
            trackColor={{ false: '#767570', true: colors.primary }}
            thumbColor={analyticsEnabled ? 'colors.primary' : '#f4f3f2'}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('settings.crashReports', 'Rapports de plantage')}</Text>
          <Switch
            value={crashReporting}
            onValueChange={setCrashReporting}
            trackColor={{ false: '#767570', true: colors.primary }}
            thumbColor={crashReporting ? 'colors.primary' : '#f4f3f2'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.dataManagement', 'Gestion des données')}</Text>

        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>{t('settings.downloadData', 'Télécharger mes données')}</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>{t('settings.deleteAccount', 'Supprimer mon compte')}</Text>
          <Text style={[styles.optionText, styles.dangerText]}>Supprimer</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>{t('common.back', 'Retour')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

