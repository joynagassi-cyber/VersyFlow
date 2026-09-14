/**
 * Available Translations Screen — download-on-demand remote Bible datasets.
 *
 * Lists every remote translation in the embedded dataset catalogue, with
 * download size and state (downloaded / in-progress / not downloaded).
 * Tapping "Télécharger" streams the dataset from the Supabase Storage public
 * bucket into the PowerSync-backed local cache (offline-first), then makes it
 * selectable in the translation picker.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { shadowCss } from '@/theme/tokens';
import { useRouter } from '@/hooks/useIonicNavigation';
import { Check, CloudDownload, BookText } from 'lucide-react';
import { useSettingsStore } from '@/store/settings-store';
import { useTranslationPreference } from '@/hooks/useTranslationPreference';
import {
  BIBLE_DATASET_CATALOG,
  findRemoteDatasetEntry,
  loadTranslationBooks,
  downloadAndLoadTranslationBooks,
} from '@/services/bible-text-service';
import {
  DEFAULT_BIBLE_TRANSLATIONS,
  type BibleTranslationManifest,
} from '@/domains/bible/registry';

type DownloadState = 'not-downloaded' | 'downloading' | 'downloaded' | 'error';

interface RowState {
  state: DownloadState;
  progress: number; // 0..1
  error?: string;
}

/** Human-readable size (B → Ko/Go). */
function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} Mo`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} Ko`;
  return `${bytes} o`;
}

const ON_PRIMARY = '#FFFFFF';
const registry = new Map<string, BibleTranslationManifest>(
  DEFAULT_BIBLE_TRANSLATIONS.map((t) => [t.id, t]),
);

export default function AvailableTranslationsScreen() {
  const { colors, sp, rad } = useAppTheme();
  const router = useRouter();
  const setBibleTranslation = useSettingsStore((s) => s.setBibleTranslation);
  const bibleTranslation = useSettingsStore((s) => s.bibleTranslation);
  const { setPreference } = useTranslationPreference();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.surfaceTint },
        header: { padding: 20, backgroundColor: colors.surface, ...shadowCss('sm') },
        title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
        subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
        list: { paddingHorizontal: 12, paddingBottom: 24 },
        card: {
          backgroundColor: colors.surface,
          borderRadius: rad.md,
          padding: sp.md,
          marginBottom: sp.md,
          ...shadowCss('sm'),
        },
        rowTop: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
        iconCircle: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        name: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flex: 1 },
        size: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
        badge: {
          padding: sp.xs,
          borderRadius: rad.sm,
          backgroundColor: colors.successLight,
        },
        progressBar: {
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.surfaceElevated,
          marginTop: sp.md,
          overflow: 'hidden',
        },
        progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
        errorText: { fontSize: 12, color: colors.error, marginTop: sp.sm },
        downloadBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: sp.xs,
          marginTop: sp.md,
          paddingVertical: sp.sm,
          borderRadius: rad.sm,
          backgroundColor: colors.primary,
        },
        downloadBtnText: { color: ON_PRIMARY, fontSize: 14, fontWeight: '600' },
        selectBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: sp.xs,
          marginTop: sp.md,
          paddingVertical: sp.sm,
          borderRadius: rad.sm,
          backgroundColor: colors.success,
        },
        selectBtnText: { color: ON_PRIMARY, fontSize: 14, fontWeight: '600' },
        back: {
          padding: sp.md,
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        },
        backText: { fontSize: 14, color: colors.primary, textDecorationLine: 'underline' },
      }),
    [colors, sp, rad],
  );

  // One entry per catalogue id, seeded from current local availability.
  const [states, setStates] = useState<Record<string, RowState>>(() => {
    const initial: Record<string, RowState> = {};
    for (const entry of BIBLE_DATASET_CATALOG) {
      initial[entry.id] = { state: 'not-downloaded', progress: 0 };
    }
    return initial;
  });

  // On mount, probe which datasets are already in the local cache.
  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      for (const entry of BIBLE_DATASET_CATALOG) {
        try {
          const books = await loadTranslationBooks(entry.id);
          if (!cancelled) {
            setStates((prev) => ({
              ...prev,
              [entry.id]: books
                ? { state: 'downloaded', progress: 1 }
                : { state: 'not-downloaded', progress: 0 },
            }));
          }
        } catch {
          // Unavailable — keep the default state.
        }
      }
    };
    void probe();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownload = useCallback(
    async (entryId: string) => {
      const entry = findRemoteDatasetEntry(entryId);
      if (!entry) return;
      setStates((prev) => ({
        ...prev,
        [entryId]: { state: 'downloading', progress: 0 },
      }));
      try {
        await downloadAndLoadTranslationBooks(entry, (received, total) => {
          const p = total > 0 ? received / total : 1;
          setStates((prev) => ({
            ...prev,
            [entryId]: { state: 'downloading', progress: p },
          }));
        });
        setStates((prev) => ({
          ...prev,
          [entryId]: { state: 'downloaded', progress: 1 },
        }));
      } catch (err) {
        setStates((prev) => ({
          ...prev,
          [entryId]: {
            state: 'error',
            progress: 0,
            error: err instanceof Error ? err.message : String(err),
          },
        }));
      }
    },
    [],
  );

  const handleSelect = (entryId: string) => {
    setBibleTranslation(entryId);
    setPreference(entryId);
  };

  const totalRemote = BIBLE_DATASET_CATALOG.length;
  const downloadedCount = Object.values(states).filter(
    (s) => s.state === 'downloaded',
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Traductions disponibles
        </Text>
        <Text style={styles.subtitle}>
          {downloadedCount}/{totalRemote} téléchargées ·{' '}
          {BIBLE_DATASET_CATALOG.reduce((acc, e) => acc + e.sizeBytes, 0)
            ? formatBytes(
                BIBLE_DATASET_CATALOG.reduce((acc, e) => acc + e.sizeBytes, 0),
              )
            : '—'}
          {' '}au total
        </Text>
      </View>

      <ScrollView>
        <View style={styles.list}>
          {BIBLE_DATASET_CATALOG.map((entry) => {
            const manifest = registry.get(entry.id);
            const st = states[entry.id];
            const isSelected = bibleTranslation === entry.id;
            return (
              <View key={entry.id} style={styles.card}>
                <View style={styles.rowTop}>
                  <View style={styles.iconCircle}>
                    <BookText size={20} color={ON_PRIMARY} />
                  </View>
                  <Text style={styles.name}>
                    {manifest?.name ?? entry.id}
                    {manifest?.year ? ` (${manifest.year})` : ''}
                  </Text>
                  {st?.state === 'downloaded' && !isSelected && (
                    <View style={styles.badge}>
                      <Text style={{ color: colors.success, fontSize: 11, fontWeight: '600' }}>
                        OK
                      </Text>
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.badge}>
                      <Text style={{ color: colors.success, fontSize: 11, fontWeight: '600' }}>
                        Active
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.size}>
                  {manifest?.language.toUpperCase()} · {formatBytes(entry.sizeBytes)}
                </Text>

                {st?.state === 'downloading' && (
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.round((st.progress ?? 0) * 100)}%` },
                      ]}
                    />
                  </View>
                )}
                {st?.state === 'error' && st.error && (
                  <Text style={styles.errorText}>{st.error}</Text>
                )}

                {st?.state === 'not-downloaded' && (
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownload(entry.id)}
                  >
                    <CloudDownload size={16} color={ON_PRIMARY} />
                    <Text style={styles.downloadBtnText}>Télécharger</Text>
                  </TouchableOpacity>
                )}

                {st?.state === 'downloaded' && !isSelected && (
                  <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => handleSelect(entry.id)}
                  >
                    <Check size={16} color={ON_PRIMARY} />
                    <Text style={styles.selectBtnText}>Sélectionner</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
