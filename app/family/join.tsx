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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/useTheme';

export default function FamilyJoinScreen() {
  const router = useRouter();
  const { colors, sp, sh, rad } = useAppTheme();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code d\'invitation');
      return;
    }
    setIsLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    Alert.alert('Succès', 'Demande envoyée ! Attendez l\'approbation du propriétaire.');
    router.back();
  };

  const handleScan = () => {
    Alert.alert('Scanner', 'Fonctionnalité QR Code à implémenter avec expo-camera');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Rejoindre</Text>
        <View style={styles.headerSpacing} />
      </View>

      <View style={styles.content}>
        <View style={styles.scannerSection}>
          <TouchableOpacity style={[styles.scannerButton, { borderColor: colors.border }]} onPress={handleScan}>
            <Ionicons name="qr-code" size={48} color={colors.primary} />
            <Text style={[styles.scannerText, { color: colors.textSecondary }]}>Scanner un QR code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>ou</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Code d'invitation</Text>
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
          <Text style={styles.joinButtonText}>
            {isLoading ? 'Vérification...' : 'Rejoindre la famille'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.helpText, { color: colors.textMuted }]}>
          Le code expire après 7 jours. Contactez le propriétaire de la famille pour un nouveau code.
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
  joinButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  helpText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
