/**
 * Enhanced Settings Screen — Navigation hub for all settings
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';
import { useAppTheme } from '@/theme/useTheme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, sh, sp, rad } = useAppTheme();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = () => {
    signOut();
    router.replace('/(tabs)/auth/login');
  };

  const settingsGroups = [
    {
      title: 'Compte',
      items: [
        { label: 'Profil', icon: 'person', action: () => router.push('/profile') },
        isAuthenticated && { label: 'Synchronisation', icon: 'cloud', action: () => router.push('/settings/backup') },
      ].filter(Boolean),
    },
    {
      title: 'Apparence',
      items: [
        { label: 'Thème', icon: 'moon', action: () => router.push('/settings/appearance') },
        { label: 'Langue', icon: 'language', action: () => router.push('/settings/languages') },
      ],
    },
    {
      title: 'Confidentialité',
      items: [
        { label: 'Données', icon: 'shield-checkmark', action: () => router.push('/settings/privacy') },
        { label: 'Sauvegarde', icon: 'download', action: () => router.push('/settings/backup') },
      ],
    },
    {
      title: 'Aide',
      items: [
        { label: 'À propos', icon: 'information-circle', action: () => router.push('/settings/about') },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.surface,
              marginHorizontal: sp.lg,
              marginTop: sp.md,
              borderRadius: rad.xl,
              padding: sp.lg,
              ...sh.md,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(user?.display_name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {user?.display_name || 'Utilisateur'}
            </Text>
            <Text style={[styles.profileStatus, { color: colors.textTertiary }]}>
              {isAuthenticated ? 'Connecté' : 'Mode local'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileArrow}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={{ marginTop: sp.xl }}>
            <Text style={[styles.groupTitle, { color: colors.textTertiary, paddingHorizontal: sp.xl, marginBottom: sp.sm }]}>
              {group.title}
            </Text>
            <View
              style={[
                styles.groupContent,
                {
                  backgroundColor: colors.surface,
                  marginHorizontal: sp.md,
                  borderRadius: rad.lg,
                  ...sh.sm,
                },
              ]}
            >
              {group.items.map((item: any, itemIndex: number) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.item,
                    itemIndex === group.items.length - 1 && styles.itemLast,
                    { borderBottomColor: colors.divider },
                  ]}
                  onPress={item.action}
                >
                  <View style={styles.itemLeft}>
                    <Ionicons name={item.icon as any} size={20} color={colors.textMuted} />
                    <Text style={[styles.itemText, { color: colors.textPrimary }]}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        {isAuthenticated && (
          <TouchableOpacity
            style={[
              styles.signOutButton,
              {
                marginHorizontal: sp.lg,
                marginTop: sp.xl,
                backgroundColor: colors.surface,
                borderRadius: rad.lg,
                ...sh.sm,
              },
            ]}
            onPress={() => setShowConfirm(true)}
          >
            <Ionicons name="log-out" size={20} color={colors.error} />
            <Text style={[styles.signOutText, { color: colors.error }]}>Se déconnecter</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      {showConfirm && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modal,
              { backgroundColor: colors.surface, borderRadius: rad.xl },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Déconnexion</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { backgroundColor: colors.surfaceTint, borderRadius: rad.pill },
                ]}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={[styles.modalButtonTextCancel, { color: colors.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  { backgroundColor: colors.error, borderRadius: rad.pill },
                ]}
                onPress={handleSignOut}
              >
                <Text style={styles.modalButtonTextConfirm}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: sp.md,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  profileArrow: {
    padding: sp.sm,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupContent: {
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sp.md,
    paddingHorizontal: sp.lg,
    borderBottomWidth: 1,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.md,
  },
  itemText: {
    fontSize: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.sm,
    paddingVertical: sp.md,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp.xl,
  },
  modal: {
    padding: sp.xl,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: sp.md,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: sp.xl,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: sp.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: sp.md,
    alignItems: 'center',
  },
  modalButtonCancel: {},
  modalButtonConfirm: {},
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
