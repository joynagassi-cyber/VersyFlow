/**
 * Profile Screen — User Profile Management
 * Displays user info and allows basic profile updates
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';

export default function ProfileScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { bibleTranslation, setBibleTranslation } = useSettingsStore();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    // TODO: Update profile via authService
    setIsEditing(false);
    Alert.alert('Succès', 'Profil mis à jour');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.display_name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.email}>
            {user?.userId || 'Mode hors ligne'}
          </Text>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>

          {user ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Nom d'affichage</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                  />
                ) : (
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Text style={styles.value}>{displayName || 'Définir un nom'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Traduction Bible par défaut</Text>
                <TouchableOpacity
                  style={styles.translationButton}
                  onPress={() => {
                    const next = bibleTranslation === 'lsg' ? 'kjv' : 'lsg';
                    setBibleTranslation(next);
                  }}
                >
                  <Text style={styles.value}>{bibleTranslation === 'lsg' ? 'Louis Segond (1910)' : 'King James Version'}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.offlineNotice}>
              <Text style={styles.offlineText}>
                Vous utilisez VersyFlow en mode local. Connectez-vous pour synchroniser vos données.
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {user && (
          <View style={styles.section}>
            {isEditing && (
              <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
                <Text style={styles.buttonText}>Sauvegarder</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.buttonGhost} onPress={handleSignOut}>
              <Text style={styles.buttonGhostText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.surface,
  },
  email: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldLast: {
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  value: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  translationButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: 12,
  },
  offlineNotice: {
    backgroundColor: colors.surfaceTint,
    borderRadius: 8,
    padding: 12,
  },
  offlineText: {
    fontSize: 14,
    color: colors.textTertiary,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonGhostText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
