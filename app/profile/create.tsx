/**
 * Create Profile Screen
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
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/useTheme';
import { useActiveProfile } from '@/hooks/useActiveProfile';

const AVATARS = ['🦁', '🦊', '🐼', '🐨', '🦄', '🐯', '🐸', '🐙'];

export default function CreateProfileScreen() {
  const router = useRouter();
  const { colors, sp, sh, rad } = useAppTheme();
  const { createProfile } = useActiveProfile();

  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!displayName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom');
      return;
    }

    setIsSubmitting(true);
    try {
      await createProfile(displayName.trim(), selectedAvatar);
      router.replace('/(tabs)/index');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Nouveau profil</Text>
      </View>

      <View style={styles.content}>
        {/* Avatar Selection */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Choisissez un avatar</Text>
        <View style={styles.avatarGrid}>
          {AVATARS.map((avatar) => (
            <TouchableOpacity
              key={avatar}
              style={[
                styles.avatarOption,
                {
                  backgroundColor: selectedAvatar === avatar ? colors.primary + '20' : colors.surface,
                  borderWidth: selectedAvatar === avatar ? 2 : 1,
                  borderColor: selectedAvatar === avatar ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedAvatar(avatar)}
            >
              <Text style={styles.avatarText}>{avatar}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Display Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Nom d'affichage</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Entrez votre nom"
            placeholderTextColor={colors.textMuted}
            maxLength={30}
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
            sh.lg,
          ]}
          onPress={handleCreate}
          disabled={isSubmitting}
        >
          <Text style={styles.createButtonText}>
            {isSubmitting ? 'Création...' : 'Créer mon profil'}
          </Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
  },
  inputGroup: {
    marginBottom: 32,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  createButton: {
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
