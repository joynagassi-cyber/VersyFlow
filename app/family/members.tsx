/**
 * Family Members Screen
 * Phase 10: Family UI
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/useTheme';
import { useFamilyStore } from '@/store/family-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';

export default function FamilyMembersScreen() {
  const router = useRouter();
  const { colors, sp, sh, rad } = useAppTheme();
  const { activeFamilyId, families, removeMember } = useFamilyStore();
  const { activeProfile } = useActiveProfile();

  const family = families.find(f => f.id === activeFamilyId) || null;

  if (!family) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>Aucune famille active</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{family.name}</Text>
        <TouchableOpacity onPress={() => router.push('/family/invite')} style={styles.inviteButton}>
          <Ionicons name="person-add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.membersSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Membres ({family.name})</Text>

          {/* Members list - simulated since we don't have real membership data */}
          <View style={[styles.memberCard, { backgroundColor: colors.surface, ...sh.sm }]}>
            <View style={[styles.memberAvatar, { backgroundColor: colors.iconBgRose }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={styles.memberInfo}>
              <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                {activeProfile?.displayName || 'Utilisateur'}
              </Text>
              <Text style={[styles.memberRole, { color: colors.textMuted }]}>Propriétaire</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>

          <View style={[styles.invitePrompt, { backgroundColor: colors.surfaceTint, borderRadius: rad.lg }]}>
            <Ionicons name="person-add" size={24} color={colors.primary} />
            <View style={styles.invitePromptText}>
              <Text style={[styles.invitePromptTitle, { color: colors.textPrimary }]}>Inviter un membre</Text>
              <Text style={[styles.invitePromptDesc, { color: colors.textSecondary }]}>
                Partagez votre progression avec votre famille
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.invitePromptButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/family/invite')}
            >
              <Text style={styles.invitePromptButtonText}>Inviter</Text>
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
  backButton: { padding: 8, marginLeft: -8 },
  title: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center', marginRight: 40 },
  inviteButton: { padding: 8, marginRight: -8 },
  scrollView: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#2D2D2D', marginBottom: 24 },
  backButton: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 26, backgroundColor: '#E91E8C' },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  membersSection: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
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
  invitePromptButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
