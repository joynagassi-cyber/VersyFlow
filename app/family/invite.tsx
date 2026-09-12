/**
 * Family Invite Screen
 * Phase 10: Family UI
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from '@/components/ui/Primitives';
import { useRouter } from '@/hooks/useIonicNavigation';
import { IonIcon } from '@/components/ui/Primitives'
import {chevronBack, copy, informationCircle, shareSocial} from 'ionicons/icons';
import { useAppTheme } from '@/theme/useTheme';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { useFamilyService } from '@/hooks/useFamilyService';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from 'react-i18next';

export default function FamilyInviteScreen() {
  const router = useRouter();
  const { colors, sh, rad } = useAppTheme();
  const { t } = useTranslation();
  const { activeFamilyId, families } = useFamilySyncStore();
  const { createInvitation } = useFamilyService();
  const signedIn = Boolean(useAuthStore((s) => s.user?.userId));

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const family = families.find(f => f.id === activeFamilyId) || null;

  useEffect(() => {
    if (family && !inviteCode) {
      void handleGenerateCode();
    }
  }, [family]);

  const handleGenerateCode = async () => {
    if (!family) return;
    setIsLoading(true);
    try {
      const invitation = await createInvitation(family.id);
      setInviteCode(invitation.token);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.error');
      Alert.alert(t('common.error'), msg);
    } finally {
      setIsLoading(false);
    }
  };

  const buildInviteText = () => {
    const base = t('family.shareDesc');
    return inviteCode ? `${base} ${inviteCode}` : base;
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      Alert.alert(t('family.inviteCodeCopied'));
    } catch {
      // Clipboard unavailable (e.g. insecure context) — show the code.
      Alert.alert(t('family.inviteCode'), inviteCode);
    }
  };

  const handleShare = async () => {
    const text = buildInviteText();
    const nav = navigator as Navigator & { share?: (data: { title?: string; text: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: t('family.shareTitle'), text });
      } catch {
        // User cancelled or share failed — no-op.
      }
    } else {
      Alert.alert(t('family.shareTitle'), text);
    }
  };

  if (!family || !signedIn) {
    router.back();
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IonIcon icon={chevronBack} size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('family.invite')}</Text>
        <View style={styles.headerSpacing} />
      </View>

      <View style={styles.content}>
        <View style={[styles.familyHeader, { backgroundColor: family.color + '15', borderRadius: rad['2xl'] }]}>
          <Text style={styles.familyEmoji}>{family.icon}</Text>
          <Text style={[styles.familyName, { color: colors.textPrimary }]}>{family.name}</Text>
        </View>

        <View style={[styles.codeCard, { backgroundColor: colors.surface, ...sh.md }]}>
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>{t('family.inviteCode')}</Text>
          <View style={styles.codeRow}>
            {inviteCode ? (
              <>
                <Text style={[styles.codeValue, { color: colors.primary }]}>{inviteCode}</Text>
                <TouchableOpacity style={styles.codeAction} onPress={handleCopy}>
                  <IonIcon icon={copy} size={20} color={colors.primary} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: colors.primary }]}
                onPress={handleGenerateCode}
                disabled={isLoading}
              >
                <Text style={styles.generateButtonText}>
                  {isLoading ? t('common.loading') : t('family.generateCode')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.codeExpiry, { color: colors.textMuted }]}>{t('family.expiryHint')}</Text>
        </View>

        <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary, ...sh.rose }]} onPress={handleShare}>
          <IonIcon icon={shareSocial} size={20} color="#fff" />
          <Text style={styles.shareButtonText}>{t('family.shareCode')}</Text>
        </TouchableOpacity>

        <View style={[styles.infoCard, { backgroundColor: colors.surfaceTint }]}>
          <IonIcon icon={informationCircle} size={20} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('family.inviteHint')}
          </Text>
        </View>
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
  content: { flex: 1, padding: 20, gap: 20 },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  familyEmoji: { fontSize: 32 },
  familyName: { fontSize: 20, fontWeight: '700' },
  codeCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  codeLabel: { fontSize: 14, fontWeight: '600' },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeValue: { fontSize: 32, fontWeight: '800', letterSpacing: 2 },
  codeAction: { padding: 8 },
  codeExpiry: { fontSize: 13 },
  generateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 26,
  },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 26,
  },
  shareButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
