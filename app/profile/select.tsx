/**
 * ProfileSelectionScreen
 * Allows user to select or create a learner profile
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useAppTheme } from '@/theme/useTheme';

export default function ProfileSelectionScreen() {
  const router = useRouter();
  const { colors, sp, rad } = useAppTheme();
  const { profiles, activeProfile, selectProfile, createProfile, shouldShowSelector } = useActiveProfile();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSelect = (id: string) => {
    selectProfile(id);
    router.replace('/(tabs)');
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createProfile(newName.trim());
    setShowCreate(false);
    setNewName('');
    // Auto-navigation handled by profile store
    router.replace('/(tabs)');
  };

  if (profiles.length === 1 && !activeProfile) {
    // Auto-select single profile
    selectProfile(profiles[0].id);
    router.replace('/(tabs)');
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Qui apprend aujourd'hui ?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Sélectionne ton profil pour continuer
          </Text>
        </View>

        <View style={styles.profilesList}>
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.profileCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: activeProfile?.id === profile.id ? colors.primary : colors.border,
                  borderWidth: activeProfile?.id === profile.id ? 2 : 1,
                },
              ]}
              onPress={() => handleSelect(profile.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {profile.displayName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                  {profile.displayName}
                </Text>
                {activeProfile?.id === profile.id && (
                  <Text style={[styles.activeLabel, { color: colors.primary }]}>
                    Actif
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.surfaceTint }]}
          onPress={() => setShowCreate(!showCreate)}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={[styles.createButtonText, { color: colors.primary }]}>
            Ajouter un profil
          </Text>
        </TouchableOpacity>

        {showCreate && (
          <View style={[styles.createForm, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formLabel, { color: colors.textPrimary }]}>
              Nom du profil
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Ex: Sarah, David..."
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.surfaceTint }]}
                onPress={() => { setShowCreate(false); setNewName(''); }}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={handleCreate}
                disabled={!newName.trim()}
              >
                <Text style={styles.confirmText}>Créer</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  profilesList: {
    gap: 12,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createForm: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
