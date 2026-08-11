/**
 * Family Invite Screen
 * Phase 10: Family UI
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/useTheme';
import { useFamilyStore } from '@/store/family-store';

export default function FamilyInviteScreen() {
  const router = useRouter();
  const { colors, sp, sh, rad } = useAppTheme();
  const { activeFamilyId, families } = useFamilyStore();

  const family = families.find(f => f.id === activeFamilyId) || null;
  const [inviteCode] = useState(() => 'FAM-' + Math.random().toString(36).substring(2, 8).toUpperCase());

  const handleCopy = () => {
    // In real app, use Clipboard API
    Alert.alert('Code copié!', inviteCode);
  };

  const handleShare = () => {
    Alert.alert('Partager', 'Fonctionnalité à implémenter avec expo-sharing');
  };

  if (!family) {
    router.back();
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Inviter</Text>
        <View style={styles.headerSpacing} />
      </View>

      <View style={styles.content}>
        <View style={[styles.familyHeader, { backgroundColor: family.color + '15', borderRadius: rad['2xl'] }]}>
          <Text style={styles.familyEmoji}>{family.icon}</Text>
          <Text style={[styles.familyName, { color: colors.textPrimary }]}>{family.name}</Text>
        </View>

        <View style={[styles.codeCard, { backgroundColor: colors.surface, ...sh.md }]}>
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Code d'invitation</Text>
          <View style={styles.codeRow}>
            <Text style={[styles.codeValue, { color: colors.primary }]}>{inviteCode}</Text>
            <TouchableOpacity style={styles.codeAction} onPress={handleCopy}>
              <Ionicons name="copy" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.codeExpiry, { color: colors.textMuted }]}>Expira dans 7 jours</Text>
        </View>

        <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary, ...sh.rose }]} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color="#fff" />
          <Text style={styles.shareButtonText}>Partager le code</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Partagez ce code avec les membres de votre famille pour qu'ils puissent rejoindre.
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
    backgroundColor: '#E3F2FD',
  },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
