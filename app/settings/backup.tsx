/**
 * Backup & Sync Settings Screen
 */

import { useState, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from '@/hooks/useIonicNavigation';
import { useAuthStore } from '@/store/auth-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import type { MemorizationRecord } from '@/domains/memorization/entities';

export default function BackupScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
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
  }), [colors]);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [autoBackup, setAutoBackup] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(isAuthenticated);
  const { activeProfile } = useActiveProfile();
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const service = getMemorizationService(activeProfile?.id ?? 'default');
      const records = await service.getAllMemorized();
      const payload = {
        app: 'versyflow',
        version: 1,
        exportedAt: new Date().toISOString(),
        records,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.href = url;
      a.download = `versyflow-backup-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ kind: 'ok', message: `${records.length} verset(s) exporté(s)` });
    } catch (e) {
      console.error('[Backup] export failed', e);
      setStatus({ kind: 'error', message: 'Export impossible pour le moment' });
    }
  };

  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const raw: unknown = JSON.parse(await file.text());
      const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as { records?: unknown[] }).records)
          ? (raw as { records: unknown[] }).records
          : [];
      const service = getMemorizationService(activeProfile?.id ?? 'default');
      let count = 0;
      for (const item of list) {
        const rec = item as MemorizationRecord;
        if (!rec || typeof rec !== 'object' || !rec.bookId || !rec.translationId) continue;
        const { id, learnerProfileId, ...rest } = rec;
        await service.saveMemorizedRecord(rest, activeProfile?.id ?? 'default');
        count += 1;
      }
      setStatus({ kind: 'ok', message: `${count} verset(s) importé(s)` });
    } catch {
      setStatus({ kind: 'error', message: 'Fichier illisible (JSON attendu)' });
    }
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

      <TouchableOpacity style={styles.buttonGhost} onPress={handleImportClick}>
        <Text style={styles.buttonGhostText}>Importer des données</Text>
      </TouchableOpacity>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={(e) => void handleImportFile(e)}
      />
      {status && (
        <Text style={[styles.note, { color: status.kind === 'ok' ? colors.success : colors.error }]}>
          {status.message}
        </Text>
      )}
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

