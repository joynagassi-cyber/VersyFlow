/**
 * Backup & Sync Settings Screen
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';

export default function BackupScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [autoBackup, setAutoBackup] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(isAuthenticated);

  const handleExport = () => {
    // TODO: Implement data export
    router.push('/settings/export');
  };

  const handleImport = () => {
    // TODO: Implement data import
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sauvegarde</Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Sauvegarde automatique</Text>
          <Switch
            value={autoBackup}
            onValueChange={setAutoBackup}
            trackColor={{ false: '#767570', true: colors.primary }}
            thumbColor={autoBackup ? 'colors.primary' : '#f4f3f2'}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleExport}>
          <Text style={styles.buttonText}>Exporter mes données</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonGhost} onPress={handleImport}>
          <Text style={styles.buttonGhostText}>Importer des données</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synchronisation Cloud</Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Sync automatique</Text>
          <Switch
            value={syncEnabled}
            onValueChange={setSyncEnabled}
            disabled={!isAuthenticated}
            trackColor={{ false: '#767570', true: colors.primary }}
            thumbColor={syncEnabled ? 'colors.primary' : '#f4f3f2'}
          />
        </View>

        {!isAuthenticated && (
          <Text style={styles.note}>
            Connectez-vous pour activer la synchronisation cloud
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  buttonGhost: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonGhostText: {
    fontSize: 16,
    color: colors.primary,
  },
  note: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
