/**
 * Passage Memorization Session Screen
 * Reads URL params, loads verses from the Bible repository,
 * and drives a MemorizationSessionEngine.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter, useLocalSearchParams } from '@/hooks/useIonicNavigation';
import { useTranslation } from 'react-i18next';
import { LocalBibleRepository, InMemoryBibleTextSource } from '@/domains/bible/repository-local';
import { BibleJsonFileSource } from '@/infrastructure/bible/bible-json-source';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { MemorizationSessionEngine } from '@/domains/memorization/session-engine';
import type { VerseData } from '@/domains/memorization/session-engine';
import { Rating } from '@/domains/fsrs';

/**
 * Determines whether to use the JSON-file source (web) or in-memory seed (tests/dev).
 * On React Native / Expo web, fetch is available; in node-based vitest it is not.
 */
function createBibleSource() {
  if (typeof fetch === 'function') {
    return new BibleJsonFileSource({ dataDir: 'data/bible' });
  }
  // Node / test environment — minimal seed
  return new InMemoryBibleTextSource({});
}

export default function MemorizationSession() {
  const { t } = useTranslation();
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [engine, setEngine] = useState<MemorizationSessionEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verseData, setVerseData] = useState<VerseData | null>(null);
  const [totalVerses, setTotalVerses] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);

  const bookId = params.bookId ?? '';
  const chapter = parseInt(params.chapter ?? '0', 10);
  const verseStart = parseInt(params.verseStart ?? params.verse ?? '0', 10);
  const verseEnd = parseInt(params.verseEnd ?? verseStart.toString(), 10);
  const translationId = params.translationId ?? 'lsg';
  const learnerProfileId = params.learnerProfileId ?? 'default';

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (!engine) return;
    const ok = engine.prevVerse();
    if (ok) {
      const data = engine.getCurrentVerseData();
      setVerseData(data);
      setCurrentIndex(engine.getCurrentVerseIndex());
      setProgress(engine.getProgress());
      setComplete(engine.isComplete());
    }
  }, [engine]);

  const handleNext = useCallback(() => {
    if (!engine) return;
    const ok = engine.nextVerse();
    if (ok) {
      const data = engine.getCurrentVerseData();
      setVerseData(data);
      setCurrentIndex(engine.getCurrentVerseIndex());
      setProgress(engine.getProgress());
      setComplete(engine.isComplete());
    } else if (engine.isComplete()) {
      // Last verse already complete
    }
  }, [engine]);

  const handleRate = useCallback((rating: Rating) => {
    if (!engine) return;
    engine.rateCurrentVerse(rating);
    const data = engine.getCurrentVerseData();
    setVerseData(data);
    setCurrentIndex(engine.getCurrentVerseIndex());
    setProgress(engine.getProgress());
    setComplete(engine.isComplete());
  }, [engine]);

  const handleAbandon = useCallback(() => {
    engine?.abandon();
    router.back();
  }, [engine, router]);

  useEffect(() => {
    if (!bookId || !chapter || !verseStart) {
      setError(t('errors.verseNotFound'));
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const source = createBibleSource();
        const bibleRepo = new LocalBibleRepository(source);
        const fsrsEngine = getFsrsEngine();
        const memorizationEngine = new MemorizationSessionEngine(bibleRepo, fsrsEngine);

        await memorizationEngine.startPassage({
          bookId,
          chapter,
          verseStart,
          verseEnd: verseEnd || verseStart,
          translationId,
          learnerProfileId,
        });

        if (cancelled) return;

        const firstVerse = memorizationEngine.getCurrentVerseData();
        setEngine(memorizationEngine);
        setVerseData(firstVerse);
        setTotalVerses(memorizationEngine.getTotalVerses());
        setCurrentIndex(memorizationEngine.getCurrentVerseIndex());
        setProgress(memorizationEngine.getProgress());
        setComplete(memorizationEngine.isComplete());
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
            {t('session.startingPassage')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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

  if (!engine || !verseData) return null;

  const wordCount = verseData.text.split(/\s+/).filter(w => w.length > 0).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAbandon} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>
              {t('common.close')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.reference, { color: colors.textPrimary }]}>
            {t('session.verseReference')}
          </Text>
          <Text style={[styles.referenceValue, { color: colors.textPrimary }]}>
            {`${verseData.bookId}:${verseData.chapter}:${verseData.verse}`}
          </Text>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            {t('session.verseOf', { current: currentIndex + 1, total: totalVerses })}
          </Text>
        </View>

        {/* Dots indicator */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalVerses }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex
                    ? colors.primary
                    : i < currentIndex
                      ? colors.success
                      : colors.border,
                },
                i === currentIndex ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>

        {/* Verse text */}
        <View style={[styles.verseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.verseText, { color: colors.textPrimary, fontSize: sp.lg }]}>
            {verseData.text}
          </Text>
          <Text style={[styles.wordCount, { color: colors.textTertiary }]}>
            {wordCount} {t('bible.verse')}
          </Text>
        </View>

        {/* Rating buttons */}
        <View style={styles.ratingRow}>
          <TouchableOpacity
            style={[styles.ratingBtn, { backgroundColor: colors.errorBackground }]}
            onPress={() => handleRate(Rating.AGAIN)}
          >
            <Text style={[styles.ratingText, { color: colors.error }]}>{t('session.ratingAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ratingBtn, { backgroundColor: colors.warningBackground }]}
            onPress={() => handleRate(Rating.HARD)}
          >
            <Text style={[styles.ratingText, { color: colors.warning }]}>{t('session.ratingHard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ratingBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleRate(Rating.GOOD)}
          >
            <Text style={[styles.ratingText, { color: colors.onPrimary }]}>{t('session.ratingGood')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ratingBtn, { backgroundColor: colors.successBackground }]}
            onPress={() => handleRate(Rating.EASY)}
          >
            <Text style={[styles.ratingText, { color: colors.success }]}>{t('session.ratingEasy')}</Text>
          </TouchableOpacity>
        </View>

        {/* Nav buttons */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Text style={[styles.navText, { color: currentIndex === 0 ? colors.textTertiary : colors.textPrimary }]}>
              {t('session.goBack')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleNext}
            disabled={currentIndex >= totalVerses - 1 && engine.isComplete()}
          >
            <Text style={[styles.navText, { color: currentIndex >= totalVerses - 1 && engine.isComplete() ? colors.textMuted : colors.textPrimary }]}>
              {t('session.proceed')}
            </Text>
          </TouchableOpacity>
        </View>

        {complete && (
          <View style={[styles.completeCard, { backgroundColor: colors.successBackground }]}>
            <Text style={[styles.completeText, { color: colors.success }]}>
              {t('session.passageComplete')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { fontSize: 16, marginBottom: 16, textAlign: 'center', paddingHorizontal: 24 },
  backButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  closeButton: { alignSelf: 'flex-end', paddingVertical: 4 },
  closeText: { fontSize: 14 },
  reference: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  referenceValue: { fontSize: 18, fontWeight: '600' },
  progressLabel: { fontSize: 13, marginTop: 2 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  verseCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  verseText: { lineHeight: 26 },
  wordCount: { fontSize: 12, marginTop: 8 },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  ratingBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 72,
    alignItems: 'center',
  },
  ratingText: { fontSize: 13, fontWeight: '600' },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  navBtn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  navText: { fontSize: 15, fontWeight: '500' },
  completeCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  completeText: { fontSize: 16, fontWeight: '600' },
});
