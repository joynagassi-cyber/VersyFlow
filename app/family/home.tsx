/**
 * Family Home Screen
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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/useTheme';
import { useFamilyStore } from '@/store/family-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';

export default function FamilyHomeScreen() {
  const router = useRouter();
  const { colors, sp, sh, rad } = useAppTheme();
  const { families, activeFamilyId, setActiveFamily } = useFamilyStore();
  const { activeProfile } = useActiveProfile();

  const activeFamily = families.find(f => f.id === activeFamilyId) || null;

  const handleCreateFamily = () => {
    router.push('/family/create');
  };

  const handleJoinFamily = () => {
    router.push('/family/join');
  };

  const handleSelectFamily = (familyId: string) => {
    setActiveFamily(familyId);
    router.push('/family/members');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Ma Famille</Text>
        <TouchableOpacity onPress={handleCreateFamily} style={styles.createButton}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Active Family Card */}
        {activeFamily ? (
          <TouchableOpacity
            style={[
              styles.familyCard,
              { backgroundColor: colors.surface, borderColor: activeFamily.color + '40' },
              sh.md,
            ]}
            onPress={() => handleSelectFamily(activeFamily.id)}
          >
            <View style={[styles.familyIcon, { backgroundColor: activeFamily.color + '20' }]}>
              <Text style={styles.familyIconText}>{activeFamily.icon}</Text>
            </View>
            <View style={styles.familyInfo}>
              <Text style={[styles.familyName, { color: colors.textPrimary }]}>{activeFamily.name}</Text>
              <Text style={[styles.familyMeta, { color: colors.textMuted }]}>
                4 membres • Progression partagée
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderRadius: rad['2xl'] }]}>
            <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Aucune famille</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              Créez une famille pour partager votre progression
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary, ...sh.md }]}
            onPress={handleCreateFamily}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Créer une famille</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButtonGhost, { backgroundColor: colors.surface, ...sh.sm }]}
            onPress={handleJoinFamily}
          >
            <Ionicons name="log-in" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonGhostText, { color: colors.primary }]}>Rejoindre une famille</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Families */}
        {families.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Familles récentes</Text>
            {families.map((family) => (
              <TouchableOpacity
                key={family.id}
                style={[
                  styles.recentItem,
                  { backgroundColor: colors.surface, borderBottomColor: colors.border },
                ]}
                onPress={() => handleSelectFamily(family.id)}
              >
                <View style={[styles.recentIcon, { backgroundColor: family.color + '20' }]}>
                  <Text style={styles.recentIconText}>{family.icon}</Text>
                </View>
                <View style={styles.recentInfo}>
                  <Text style={[styles.recentName, { color: colors.textPrimary }]}>{family.name}</Text>
                  <Text style={[styles.recentDate, { color: colors.textMuted }]}>
                    Créée il y a {Math.floor((Date.now() - family.createdAt) / 86400000)} jours
                  </Text>
                </View>
                {activeFamilyId === family.id && (
                  <View style={[styles.activeBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.activeBadgeText, { color: colors.primary }]}>Actif</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  createButton: {
    padding: 8,
    marginRight: -8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  familyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyIconText: {
    fontSize: 28,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 18,
    fontWeight: '700',
  },
  familyMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 26,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 26,
  },
  actionButtonGhostText: {
    fontSize: 16,
    fontWeight: '600',
  },
  recentSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIconText: {
    fontSize: 22,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  recentDate: {
    fontSize: 12,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
