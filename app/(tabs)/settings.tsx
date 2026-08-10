/**
 * Settings Screen — Complete application settings
 * See docs/08-ui-screens.md §11
 * Figma: https://www.figma.com/design/BL5Cbn6s2aMXAtNDmAVJ8F/VersyFlow
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { I18nService } from '@/domains/i18n/i18n-service';
import { SUPPORTED_LANGUAGES } from '@/domains/i18n/config';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';

export default function SettingsScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { bibleTranslation, setBibleTranslation, completeOnboarding } = useSettingsStore();
  const [language, setLanguage] = useState<string>('fr');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    const i18n = I18nService.getInstance();
    setLanguage(i18n.getLanguage());
  }, []);

  const handleLanguageChange = (lng: string) => {
    const i18n = I18nService.getInstance();
    i18n.setLanguage(lng);
    setLanguage(lng);
    setShowLanguageModal(false);
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Réinitialiser la progression',
      'Êtes-vous sûr de vouloir supprimer toutes vos données ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            // Clear all data
            useSettingsStore.getState().resetToDefaults();
            setShowResetModal(false);
            router.replace('/(tabs)/index');
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    signOut();
    router.replace('/(tabs)/auth/login');
  };

  const getLanguageName = (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.surface} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.display_name || 'Utilisateur'}</Text>
            <Text style={styles.profileStatus}>
              {isAuthenticated ? 'Compte connecté' : 'Mode local'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Preferences Group */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Préférences</Text>
          <View style={styles.card}>
            {/* Language */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => setShowLanguageModal(true)}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.border }]}>
                  <Ionicons name="language" size={20} color={colors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Langue de l'interface</Text>
                  <Text style={styles.rowSubtitle}>{getLanguageName(language)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Bible Translation */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/onboarding/translation-select')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.iconBgPurple }]}>
                  <Ionicons name="book" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Traduction biblique</Text>
                  <Text style={styles.rowSubtitle}>
                    {bibleTranslation === 'lsg' ? 'Louis Segond (1910)' : bibleTranslation || 'Défaut'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Appearance Group */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Apparence</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/settings/appearance')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.iconBgBlue }]}>
                  <Ionicons name="moon" size={20} color={colors.info} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Thème</Text>
                  <Text style={styles.rowSubtitle}>Clair</Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <View style={styles.themePreview}>
                  <View style={[styles.themeDot, { backgroundColor: colors.surface, borderWidth: 1, borderColor: '#E0E0E0' }]} />
                  <View style={[styles.themeDot, { backgroundColor: '#1a1a1a' }]} />
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Group */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Données</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/settings/backup')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.iconBgGreen }]}>
                  <Ionicons name="cloud-upload" size={20} color={colors.success} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Sauvegarde & Sync</Text>
                  <Text style={styles.rowSubtitle}>Synchroniser vos données</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/settings/backup')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.iconBgOrange }]}>
                  <Ionicons name="download" size={20} color={colors.warning} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Exporter mes données</Text>
                  <Text style={styles.rowSubtitle}>Télécharger vos données</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Group */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Confidentialité</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/settings/privacy')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#7B1FA2" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Politique de confidentialité</Text>
                  <Text style={styles.rowSubtitle}>Voir nos conditions</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Group */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>À propos</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/settings/about')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: '#ECEFF1' }]}>
                  <Ionicons name="information-circle" size={20} color="#455A64" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Version</Text>
                  <Text style={styles.rowSubtitle}>VersyFlow v0.1.0</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/settings/about')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.iconBgIndigo }]}>
                  <Ionicons name="document-text" size={20} color="#3F51B5" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Documentation</Text>
                  <Text style={styles.rowSubtitle}>Guides et tutoriels</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/settings/about')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.iconBgTeal }]}>
                  <Ionicons name="help-circle" size={20} color="#00695C" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Aide & Support</Text>
                  <Text style={styles.rowSubtitle}>FAQ et contact</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Destructive Actions */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Danger</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.row, styles.dangerRow]}
              onPress={() => setShowResetModal(true)}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.errorLight }]}>
                  <Ionicons name="trash" size={20} color={colors.error} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, styles.dangerText]}>Réinitialiser la progression</Text>
                  <Text style={styles.rowSubtitle}>Supprimer toutes les données</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out" size={20} color={colors.surface} />
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </TouchableOpacity>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>VersyFlow</Text>
          <Text style={styles.footerSubtext}>Mémorisation biblique intuitive</Text>
          <Text style={styles.footerVersion}>v0.1.0 • © 2024</Text>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir la langue</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    language === lang.code && styles.languageOptionSelected,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={[
                    styles.languageName,
                    language === lang.code && styles.languageNameSelected,
                  ]}>
                    {lang.name}
                  </Text>
                  <Text style={styles.languageDisplayName}>{lang.displayName}</Text>
                  {language === lang.code && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resetModal}>
            <View style={styles.resetIconContainer}>
              <Ionicons name="warning" size={48} color={colors.error} />
            </View>
            <Text style={styles.resetTitle}>Réinitialiser tout ?</Text>
            <Text style={styles.resetMessage}>
              Cette action supprimera toutes vos données de mémorisation. Cette action est irréversible.
            </Text>
            <View style={styles.resetButtons}>
              <TouchableOpacity
                style={styles.resetCancelButton}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.resetCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetConfirmButton}
                onPress={handleResetProgress}
              >
                <Text style={styles.resetConfirmText}>Réinitialiser</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileStatus: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },

  // Groups
  group: {
    marginTop: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
    paddingHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceTint,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themePreview: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 8,
  },
  themeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  // Danger Row
  dangerRow: {
    backgroundColor: '#FFF5F5',
  },
  dangerText: {
    color: colors.error,
  },

  // Sign Out Button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 26,
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginTop: 24,
  },
  footerText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  footerSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#C0C0C0',
    marginTop: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalScroll: {
    padding: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  languageOptionSelected: {
    backgroundColor: colors.surfaceTint,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  languageNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  languageDisplayName: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Reset Modal
  resetModal: {
    backgroundColor: colors.surface,
    margin: 40,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  resetIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  resetMessage: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  resetButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  resetCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 26,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
  resetCancelText: {
    fontSize: 16,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  resetConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 26,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  resetConfirmText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: '600',
  },
});
