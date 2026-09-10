/**
 * Family Members Screen
 * Phase 10: Family UI
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from '@/components/ui/Primitives';
import { useRouter } from '@/hooks/useIonicNavigation';
import { IonIcon } from '@ionic/react'
import * as Ionicons from 'ionicons/icons';
import { useAppTheme } from '@/theme/useTheme';
import { useFamilyStore } from '@/store/family-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamilyService } from '@/hooks/useFamilyService';
import { useTranslation } from 'react-i18next';
import type { MemberWithProfile } from '@/services/family-service';

export default function FamilyMembersScreen() {
  const router = useRouter();
  const { colors, sp, sh, rad } = useAppTheme();
  const { t } = useTranslation();
  const { activeFamilyId, families } = useFamilyStore();
  const { activeProfile } = useActiveProfile();
  const { getMembersScoped } = useFamilyService();

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const family = families.find(f => f.id === activeFamilyId) || null;

  useEffect(() => {
    if (family) {
      loadMembers();
    }
  }, [family]);

  const loadMembers = async () => {
    if (!family) return;
    setIsLoading(true);
    try {
      const scopedMembers = await getMembersScoped(family.id);
      setMembers(scopedMembers);
    } catch (e) {
      // Handle error silently or show toast
    } finally {
      setIsLoading(false);
    }
  };

  if (!family) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('family.noFamily')}</Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonSmall}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{family.name}</Text>
        <TouchableOpacity onPress={() => router.push('/family/invite')} style={styles.inviteButton}>
          <Ionicons name="person-add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.membersSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('family.members')}</Text>

          {isLoading ? (
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t('common.loading')}</Text>
          ) : (
            members.map((member) => (
              <View key={member.id} style={[styles.memberCard, { backgroundColor: colors.surface, ...sh.sm }]}>
                <View style={[styles.memberAvatar, { backgroundColor: colors.iconBgRose }]}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                    {member.profile?.displayName || member.accountId}
                  </Text>
                  <Text style={[styles.memberRole, { color: colors.textMuted }]}>
                    {member.role === 'owner' ? t('family.roleOwner') :
                     member.role === 'admin' ? t('family.roleAdmin') :
                     t('family.roleMember')}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              </View>
            ))
          )}

          <View style={[styles.invitePrompt, { backgroundColor: colors.surfaceTint, borderRadius: rad.lg }]}>
            <Ionicons name="person-add" size={24} color={colors.primary} />
            <View style={styles.invitePromptText}>
              <Text style={[styles.invitePromptTitle, { color: colors.textPrimary }]}>{t('family.inviteMember')}</Text>
              <Text style={[styles.invitePromptDesc, { color: colors.textSecondary }]}>{t('family.inviteHint')}</Text>
            </View>
            <TouchableOpacity
              style={[styles.invitePromptButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/family/invite')}
            >
              <Text style={[styles.invitePromptButtonText, { color: '#fff' }]}>{t('family.invite')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  backButtonSmall: { padding: 8, marginLeft: -8 },
  title: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center', marginRight: 40 },
  inviteButton: { padding: 8, marginRight: -8 },
  scrollView: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 24 },
  backButton: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 26 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  membersSection: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  loadingText: { fontSize: 14, textAlign: 'center', padding: 20 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600' },
  memberRole: { fontSize: 13, marginTop: 2 },
  invitePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  invitePromptText: { flex: 1 },
  invitePromptTitle: { fontSize: 15, fontWeight: '600' },
  invitePromptDesc: { fontSize: 13, marginTop: 2 },
  invitePromptButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  invitePromptButtonText: { fontSize: 14, fontWeight: '600' },
});
