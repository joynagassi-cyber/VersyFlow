/**
 * Translation Comparison Screen
 *
 * Side-by-side column view of one Bible verse across multiple translations.
 * Reads params from route, resolves translations from registry, calls the
 * pure engine, and renders one card per translation using design tokens only.
 */

import { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter, useLocalSearchParams } from '@/hooks/useIonicNavigation';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { BibleTranslationRegistry, DEFAULT_BIBLE_TRANSLATIONS } from '@/domains/bible/registry';
import { LocalBibleRepository, InMemoryBibleTextSource } from '@/domains/bible/repository-local';
import { createTranslationComparisonService } from '@/services/translation-comparison-service';
import type { TranslationComparisonResult } from '@/capabilities/comparison/translation-comparison';
import { useSettingsStore } from '@/store/settings-store';

/**
 * Seed used when no dataset file is reachable (tests / dev bootstrap).
 * Both bundled translations are represented so the comparison engine has
 * data for every `available` manifest entry.
 */
const SEED_SOURCE: Record<string, unknown> = {
  lsg: {
    id: 'lsg',
    language: 'fr',
    name: 'Louis Segond (1910)',
    books: [
      {
        id: 'joh',
        name: { fr: 'Jean', en: 'John' },
        testament: 'new' as const,
        chapterCount: 21,
        chapters: [
          {
            number: 3,
            verses: [{ number: 16, text: 'Car Dieu a tant aime le monde qu\'il a donne son Fils unique...' }],
          },
        ],
      },
    ],
  },
  ostervald: {
    id: 'ostervald',
    language: 'fr',
    name: 'Ostervald (1930)',
    year: 1930,
    author: 'Ostervald',
    books: [
      {
        id: 'joh',
        name: { fr: 'Jean', en: 'John' },
        testament: 'new' as const,
        chapterCount: 21,
        chapters: [
          {
            number: 3,
            verses: [
              { number: 16, text: 'Ainsi parla l\'Éternel au sujet de Jésus : toute chair s\'inclinera devant lui.' },
            ],
          },
        ],
      },
    ],
  },
};

export default function TranslationComparisonScreen() {
  const { t } = useTranslation();
  const { colors, sp, rad } = useAppTheme();
  const { bibleTranslation } = useSettingsStore();
  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: sp.md,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    marginBottom: sp.md,
    paddingHorizontal: sp.lg,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp.md,
    paddingVertical: sp.sm,
    borderBottomWidth: 1,
  },
  backButtonSmall: {
    padding: sp.xs,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: sp.sm,
  },
  refBadge: {
    marginHorizontal: sp.md,
    marginTop: sp.sm,
    marginBottom: sp.md,
    paddingHorizontal: sp.sm,
    paddingVertical: sp.sm,
    borderRadius: rad.md,
    borderWidth: 1,
    alignSelf: 'center',
  },
  refText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  columnsScroll: {
    flex: 1,
  },
  columnsContent: {
    paddingHorizontal: sp.md,
    paddingBottom: sp.lg,
    alignItems: 'flex-start',
  },
  column: {
    width: 260,
    flexShrink: 0,
    borderWidth: 1,
    borderRadius: rad.lg,
    marginBottom: 0,
  },
  columnHeader: {
    paddingHorizontal: sp.sm,
    paddingVertical: sp.sm,
    borderBottomWidth: 1,
    gap: sp.xs,
  },
  columnName: {
    fontSize: 13,
    fontWeight: '700',
  },
  licenseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: sp.sm,
    paddingVertical: sp.xs,
    borderRadius: rad.pill,
    borderWidth: 1,
  },
  licenseText: {
    fontSize: 10,
    fontWeight: '600',
  },
  columnBody: {
    gap: sp.sm,
  },
  verseText: {
    textAlign: 'left',
  },
  unavailableText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  backButton: {
    paddingHorizontal: sp.lg,
    paddingVertical: sp.sm,
    borderRadius: rad.xl,
    marginTop: sp.sm,
  },
  backButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  }), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{ bookId: string; chapter: string; verse: string }>();

  const { bookId, chapter, verse } = params;
  const [results, setResults] = useState<TranslationComparisonResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookName, setBookName] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const registry = new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS);

        // Use the real bundled dataset when reachable; fall back to the seed
        // (dev/test bootstrap). `bibleTranslation` is the user's persisted
        // preference and drives which translation column is highlighted.
        let source: import('@/domains/bible/repository-local').IBibleTextSource;
        if (typeof fetch === 'function') {
          const { BibleJsonFileSource } = await import('@/infrastructure/bible/bible-json-source');
          source = new BibleJsonFileSource({ dataDir: 'data/bible' });
        } else {
          source = new InMemoryBibleTextSource(SEED_SOURCE);
        }
        const engine = createTranslationComparisonService(source, registry);

        const translationIds = registry
          .getByLanguage('fr')
          .filter((r) => r.available)
          .map((r) => r.id);

        // Order the columns so the user's active translation comes first.
        const ordered = [...translationIds].sort(
          (a, b) =>
            Number(b === bibleTranslation) - Number(a === bibleTranslation),
        );

        if (ordered.length === 0) {
          setError(t('comparison.noTranslations'));
          setLoading(false);
          return;
        }

        const bookNameValue =
          (await import('@/domains/bible/entities')).BIBLE_BOOKS.find(
            (b) => b.id === bookId,
          )?.name?.[i18next.language ?? 'fr'] ?? bookId;
        setBookName(bookNameValue);

        const data = await engine.compare(
          { bookId, chapter: parseInt(chapter), verse: parseInt(verse) },
          ordered,
        );

        if (!cancelled) {
          setResults(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [bookId, chapter, verse, bibleTranslation, t]);

  const referenceDisplay = bookId
    ? `${bookName ?? bookId} ${chapter}:${verse}`
    : `${chapter}:${verse}`;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceTint }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>{t('comparison.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceTint }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceTint }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonSmall}>
          <Text style={[styles.backText, { color: colors.primary }]}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {t('comparison.title')}
        </Text>
      </View>

      {/* Reference badge */}
      <View style={[styles.refBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.refText, { color: colors.textSecondary }]}>
          {referenceDisplay}
        </Text>
      </View>

      {/* Columns */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.columnsScroll}
        contentContainerStyle={styles.columnsContent}
      >
        {results.map((item) => (
          <TranslationColumn key={item.translationId} item={item} colors={colors} sp={sp} rad={rad} t={t} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Column component ───────────────────────────────────────────────────────

interface ColumnProps {
  item: TranslationComparisonResult;
  colors: Record<string, string>;
  sp: Record<string, number>;
  rad: Record<string, number>;
  t: (key: string, params?: Record<string, unknown>) => string;
}

function TranslationColumn({ item, colors, sp, rad, t }: ColumnProps) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        column: {
          width: 260,
          flexShrink: 0,
          borderWidth: 1,
          borderRadius: rad.lg,
        },
        columnHeader: {
          paddingHorizontal: sp.sm,
          paddingVertical: sp.sm,
          borderBottomWidth: 1,
          gap: sp.xs,
        },
        columnName: {
          fontSize: 13,
          fontWeight: '700',
        },
        licenseBadge: {
          alignSelf: 'flex-start',
          paddingHorizontal: sp.sm,
          paddingVertical: sp.xs,
          borderRadius: rad.pill,
          borderWidth: 1,
        },
        licenseText: {
          fontSize: 10,
          fontWeight: '600',
        },
        columnBody: {
          gap: sp.sm,
        },
        verseText: {
          textAlign: 'left',
        },
        unavailableText: {
          fontSize: 13,
          fontStyle: 'italic',
        },
      }),
    [colors, sp, rad],
  );

  const licenseLabel =
    item.available
      ? t('comparison.licenseAvailable')
      : t('comparison.licenseUnavailable');

  return (
    <View style={[styles.column, { marginInlineEnd: sp.md, backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Column header */}
      <View style={[styles.columnHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.columnName, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View
          style={[
            styles.licenseBadge,
            {
              backgroundColor: item.available ? colors.successLight : colors.warningLight,
              borderColor: item.available ? colors.success : colors.warning,
            },
          ]}
        >
          <Text style={[styles.licenseText, { color: item.available ? colors.success : colors.warning }]}>
            {item.available ? t('comparison.available') : licenseLabel}
          </Text>
        </View>
      </View>

      {/* Verse text */}
      <View style={[styles.columnBody, { padding: sp.md }]}>
        {item.text ? (
          <Text style={[styles.verseText, { color: colors.textPrimary, fontSize: 15, lineHeight: 24 }]}>
            {item.text}
          </Text>
        ) : (
          <Text style={[styles.unavailableText, { color: colors.textMuted }]}>
            {t('comparison.unavailable')}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

