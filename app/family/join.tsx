/**
 * Family Join Screen
 * Phase 10: Family UI
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
} from '@/components/ui/Primitives';
import { useRouter } from '@/hooks/useIonicNavigation';
import { IonIcon } from '@/components/ui/Primitives'
import {chevronBack, qrCode} from 'ionicons/icons';
import { useAppTheme } from '@/theme/useTheme';
import { useFamilyService } from '@/hooks/useFamilyService';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from 'react-i18next';

export default function FamilyJoinScreen() {
  const router = useRouter();
  const { colors, sh } = useAppTheme();
  const { t } = useTranslation();
  const { acceptInvitation } = useFamilyService();
  const { addFamily, addMembership, setActiveFamily } = useFamilySyncStore();
  const signedIn = Boolean(useAuthStore((s) => s.user?.userId));
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!signedIn) {
      Alert.alert(t('common.error'), t('family.signedInRequired'));
      return;
    }
    if (!code.trim()) {
      Alert.alert(t('common.error'), t('family.enterCode'));
      return;
    }
    setIsLoading(true);
    try {
      const result = await acceptInvitation(code.trim().toUpperCase());
      // Push into the local store so the home / members screens reflect the
      // new family immediately — the PowerSync bridge re-syncs the same rows
      // later (idempotent addFamily / addMembership).
      addFamily(result.family);
      addMembership(result.membership);
      setActiveFamily(result.family.id);
      Alert.alert(t('family.joinedSuccess'), t('family.joinWelcome'));
      router.push('/family/home');
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('family.invalidCode');
      Alert.alert(t('common.error'), msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = () => {
    Alert.alert(t('family.scanner'), t('family.scannerDesc'));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IonIcon icon={chevronBack} size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('family.join')}</Text>
        <View style={styles.headerSpacing} />
      </View>

      <View style={styles.content}>
        {!signedIn && (
          <Text style={[styles.helpText, { color: colors.textMuted }]}>{t('family.signedInRequired')}</Text>
        )}
        <View style={styles.scannerSection}>
          <TouchableOpacity style={[styles.scannerButton, { borderColor: colors.border }]} onPress={handleScan}>
            <IonIcon icon={qrCode} size={48} color={colors.primary} />
            <Text style={[styles.scannerText, { color: colors.textSecondary }]}>{t('family.scanQR')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>{t('family.or')}</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('family.inviteCode')}</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            value={code}
            onChangeText={setCode}
            placeholder="FAM-XXXXXX"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            maxLength={8}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.joinButton,
            { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 },
            sh.lg,
          ]}
          onPress={handleJoin}
          disabled={isLoading}
        >
          <Text style={[styles.joinButtonText, { color: '#fff' }]}>
            {isLoading ? t('common.loading') : t('family.joinButton')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.helpText, { color: colors.textMuted }]}>
          {t('family.expiryHint')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: { padding: 8, marginLeft: -8 },
  title: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerSpacing: { width: 40 },
  content: { flex: 1, padding: 20, gap: 24 },
  scannerSection: { alignItems: 'center' },
  scannerButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  scannerText: { fontSize: 14, fontWeight: '600' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 14, fontWeight: '600' },
  inputSection: { gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600' },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    letterSpacing: 2,
    textAlign: 'center',
  },
  joinButton: {
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButtonText: { fontSize: 16, fontWeight: '700' },
  helpText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
