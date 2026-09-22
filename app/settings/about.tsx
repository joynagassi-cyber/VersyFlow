/**
 * About Screen — App information and version
 */

import { useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from '@/hooks/useIonicNavigation';
import { useTranslation } from 'react-i18next';

const VERSION = '0.1.0';

export default function AboutScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
  },
  header: {
    alignItems: 'center',
    padding: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
  },
  version: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
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
  description: {
    fontSize: 14,
    color: colors.textTertiary,
    lineHeight: 22,
  },
  link: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  linkLast: {
    borderBottomWidth: 0,
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
  },
  credit: {
    fontSize: 14,
    color: colors.textTertiary,
    paddingVertical: 6,
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
  const [buildNumber, setBuildNumber] = useState('1');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>VersyFlow</Text>
        <Text style={styles.version}>Version {VERSION} ({buildNumber})</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about', 'À propos')}</Text>
        <Text style={styles.description}>
          {t('settings.aboutDescription', 'VersyFlow vous aide à mémoriser les versets bibliques grâce à la science de la répétition espacée (FSRS).')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.links', 'Liens')}</Text>
        <TouchableOpacity style={styles.link} onPress={() => Linking.openURL('https://github.com/your-org/versyflow')}>
          <Text style={styles.linkText}>{t('settings.documentation', 'Documentation')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={() => Linking.openURL('mailto:support@versyflow.com')}>
          <Text style={styles.linkText}>{t('settings.supportLink', 'Support')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={() => Linking.openURL('https://versyflow.com/privacy')}>
          <Text style={styles.linkText}>{t('settings.privacyPolicy', 'Politique de confidentialité')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.credits', 'Crédits')}</Text>
        <Text style={styles.credit}>{t('settings.creditMission', 'Développé avec ❤️ pour la gloire de Dieu')}</Text>
        <Text style={styles.credit}>{t('settings.creditEngine', 'Moteur FSRS par Dmytro Gutman')}</Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>{t('common.back', 'Retour')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

