/**
 * Review History Screen — Timeline of review sessions for a verse
 * See docs/08-ui-screens.md
 */

import { useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRoute, useRouter } from '@/hooks/useIonicNavigation';
import { useTranslation } from 'react-i18next';
import { IonIcon } from '@/components/ui/Primitives'
import {arrowBack, arrowForward, book, checkmarkCircle, medal, refresh, trendingUp} from 'ionicons/icons';
import { Rating } from '@/domains/fsrs';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getReviewLogRepository } from '@/infrastructure/repository/powersync-repositories';
import type { ReviewLogEntry as DomainReviewLogEntry } from '@/domains/memorization/entities';

interface ReviewLogEntry {
  id: string;
  answeredAt: number;
  rating: Rating | string;
  stabilityBefore: number;
  stabilityAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
  elapsedDays: number;
  repetitions: number;
}

interface VerseRecord {
  id: string;
  reference: string;
  text: string;
  totalReviews: number;
  averageStability: number;
  masteryLevel: string;
}

const RATING_MAP: Record<DomainReviewLogEntry['rating'], Rating> = {
  again: Rating.AGAIN,
  hard: Rating.HARD,
  good: Rating.GOOD,
  easy: Rating.EASY,
};

const EMPTY_VERSE: VerseRecord = {
  id: '',
  reference: '',
  text: '',
  totalReviews: 0,
  averageStability: 0,
  masteryLevel: '—',
};

export default function ReviewHistoryScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textMuted,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },

  // Verse Card
  verseCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    margin: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  verseHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  verseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseInfo: {
    flex: 1,
  },
  verseReference: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  verseText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  verseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceTint,
  },
  verseStat: {
    alignItems: 'center',
    flex: 1,
  },
  verseStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  verseStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  verseStatDivider: {
    width: 1,
    backgroundColor: colors.border,
  },

  // Timeline Section
  timelineSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineDotContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.surface,
  },
  timelineDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailGroup: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailBefore: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '500',
  },
  detailAfter: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '500',
  },
  timelineMeta: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceTint,
  },
  timelineMetaText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statCardLarge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statCardMedium: {
    width: '48%',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Mastery Card
  masteryCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  masteryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  masteryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  masteryLevel: {
    backgroundColor: colors.surfaceTint,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  masteryLevelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  masteryProgress: {
    marginTop: 8,
  },
  masteryProgressBar: {
    height: 8,
    backgroundColor: colors.surfaceTint,
    borderRadius: 4,
    overflow: 'hidden',
  },
  masteryProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  masteryProgressText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },

  // Actions
  actions: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 26,
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },

  // Bottom spacer
  bottomSpacer: {
    height: 24,
  },
  }), [colors]);
  const route = useRoute();
  const router = useRouter();
  const [history, setHistory] = useState<ReviewLogEntry[]>([]);
  const [verse, setVerse] = useState<VerseRecord>(EMPTY_VERSE);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const records = await service.getAllMemorized();
        const withReviews = records
          .filter((r) => r.reviewCount > 0)
          .sort((a, b) => (b.lastReviewedAt ?? 0) - (a.lastReviewedAt ?? 0));
        const record = withReviews[0];
        if (!record) {
          if (!cancelled) {
            setNoData(true);
            setLoading(false);
          }
          return;
        }
        const domainLogs = await getReviewLogRepository().listByRecord(record.id);
        const mapped: ReviewLogEntry[] = domainLogs.map((log) => ({
          id: log.id,
          answeredAt: log.answeredAt,
          rating: RATING_MAP[log.rating] ?? Rating.AGAIN,
          stabilityBefore: log.stabilityBefore,
          stabilityAfter: log.stabilityAfter,
          difficultyBefore: log.difficultyBefore,
          difficultyAfter: log.difficultyAfter,
          elapsedDays: Math.max(0, Math.round((log.answeredAt - (record.createdAt || log.answeredAt)) / 86400000)),
          repetitions: record.reviewCount,
        }));
        if (cancelled) return;
        setHistory(mapped);
        setVerse({
          id: record.id,
          reference: record.bibleVerseReference || `${record.bookId} ${record.chapterNumber}:${record.verseNumber}`,
          text: record.bibleVerseText,
          totalReviews: record.reviewCount,
          averageStability: record.fsrsState?.stability ?? 0,
          masteryLevel: record.status === 'mastered' ? 'Maîtrisé' : 'En cours',
        });
        setNoData(false);
        setLoading(false);
      } catch (e) {
        console.error('[ReviewHistory] data load failed:', e);
        if (!cancelled) {
          setNoData(true);
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const getRatingConfig = (rating: Rating | string) => {
    let actualRating: Rating;
    if (typeof rating === 'string') {
      switch (rating) {
        case 'again': actualRating = Rating.AGAIN; break;
        case 'hard': actualRating = Rating.HARD; break;
        case 'good': actualRating = Rating.GOOD; break;
        case 'easy': actualRating = Rating.EASY; break;
        default: actualRating = Rating.AGAIN;
      }
    } else {
      actualRating = rating;
    }

    switch (actualRating) {
      case Rating.AGAIN:
        return { color: colors.error, label: 'À revoir', icon: 'refresh' };
      case Rating.HARD:
        return { color: colors.warning, label: 'Difficile', icon: 'remove' };
      case Rating.GOOD:
        return { color: '#4CD964', label: 'Bon', icon: 'checkmark' };
      case Rating.EASY:
        return { color: colors.info, label: 'Facile', icon: 'star' };
      default:
        return { color: colors.primary, label: 'Bon', icon: 'checkmark' };
    }
  };

  const calculateProgress = () => {
    if (history.length === 0) return 0;
    const goodOrBetter = history.filter(h =>
      h.rating === Rating.GOOD || h.rating === Rating.EASY
    ).length;
    return Math.round((goodOrBetter / history.length) * 100);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Chargement de l'historique...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IonIcon icon={arrowBack} size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique</Text>
          <View style={styles.headerRight} />
        </View>

        {noData ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
              {t('review.historyEmpty', 'Aucune révision enregistrée')}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
              {t('review.historyEmptyHint', 'Revisez des versets pour construire votre historique.')}
            </Text>
          </View>
        ) : (
          <>
        {/* Verse Info Card */}
        <View style={styles.verseCard}>
          <View style={styles.verseHeader}>
            <View style={styles.verseIconContainer}>
              <IonIcon icon={book} size={24} color={colors.primary} />
            </View>
            <View style={styles.verseInfo}>
              <Text style={styles.verseReference}>{verse.reference}</Text>
              <Text style={styles.verseText} numberOfLines={2}>{verse.text}</Text>
            </View>
          </View>
          <View style={styles.verseStats}>
            <View style={styles.verseStat}>
              <Text style={styles.verseStatValue}>{verse.totalReviews}</Text>
              <Text style={styles.verseStatLabel}>Révisions</Text>
            </View>
            <View style={styles.verseStatDivider} />
            <View style={styles.verseStat}>
              <Text style={styles.verseStatValue}>{verse.averageStability.toFixed(1)}j</Text>
              <Text style={styles.verseStatLabel}>Stabilité</Text>
            </View>
            <View style={styles.verseStatDivider} />
            <View style={styles.verseStat}>
              <Text style={styles.verseStatValue}>{calculateProgress()}%</Text>
              <Text style={styles.verseStatLabel}>Réussite</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Chronologie des révisions</Text>
          <View style={styles.timeline}>
            {history.map((log, index) => {
              const config = getRatingConfig(log.rating);
              const isLast = index === history.length - 1;

              return (
                <View key={log.id} style={styles.timelineItem}>
                  {/* Timeline dot */}
                  <View style={styles.timelineDotContainer}>
                    <View style={[styles.timelineDot, { backgroundColor: config.color }]}>
                      <IonIcon icon={config.icon as any} size={12} color={colors.surface} />
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>

                  {/* Timeline content */}
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineDate}>{formatTimestamp(log.answeredAt)}</Text>
                      <View style={[styles.ratingBadge, { backgroundColor: config.color }]}>
                        <Text style={styles.ratingBadgeText}>{config.label}</Text>
                      </View>
                    </View>

                    <View style={styles.timelineDetails}>
                      <View style={styles.detailGroup}>
                        <Text style={styles.detailLabel}>Stabilité</Text>
                        <View style={styles.detailValues}>
                          <Text style={styles.detailBefore}>{log.stabilityBefore.toFixed(1)}j</Text>
                          <IonIcon icon={arrowForward} size={12} color={colors.textMuted} />
                          <Text style={styles.detailAfter}>{log.stabilityAfter.toFixed(1)}j</Text>
                        </View>
                      </View>
                      <View style={styles.detailGroup}>
                        <Text style={styles.detailLabel}>Difficulté</Text>
                        <View style={styles.detailValues}>
                          <Text style={styles.detailBefore}>{log.difficultyBefore.toFixed(1)}</Text>
                          <IonIcon icon={arrowForward} size={12} color={colors.textMuted} />
                          <Text style={styles.detailAfter}>{log.difficultyAfter.toFixed(1)}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.timelineMeta}>
                      <Text style={styles.timelineMetaText}>
                        {log.elapsedDays}j écoulés • {log.repetitions} répétition{log.repetitions > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardLarge]}>
              <View style={styles.statIconContainer}>
                <IonIcon icon={trendingUp} size={24} color={colors.surface} />
              </View>
              <Text style={styles.statValue}>
                {(verse.averageStability * 10).toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Rétention estimée</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMedium]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.success }]}>
                <IonIcon icon={checkmarkCircle} size={24} color={colors.surface} />
              </View>
              <Text style={styles.statValue}>
                {history.filter(h => h.rating === Rating.GOOD || h.rating === Rating.EASY).length}
              </Text>
              <Text style={styles.statLabel}>Bon/Facile</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMedium]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.error }]}>
                <IonIcon icon={refresh} size={24} color={colors.surface} />
              </View>
              <Text style={styles.statValue}>
                {history.filter(h => h.rating === Rating.AGAIN).length}
              </Text>
              <Text style={styles.statLabel}>À revoir</Text>
            </View>
          </View>
        </View>

        {/* Mastery Level */}
        <View style={styles.masteryCard}>
          <View style={styles.masteryHeader}>
            <IonIcon icon={medal} size={24} color={colors.warning} />
            <Text style={styles.masteryTitle}>Niveau de maîtrise</Text>
          </View>
          <View style={styles.masteryLevel}>
            <Text style={styles.masteryLevelText}>{verse.masteryLevel}</Text>
          </View>
          <View style={styles.masteryProgress}>
            <View style={styles.masteryProgressBar}>
              <View
                style={[
                  styles.masteryProgressFill,
                  { width: `${Math.min(100, verse.averageStability * 10)}%` },
                ]}
              />
            </View>
            <Text style={styles.masteryProgressText}>
              {verse.averageStability.toFixed(1)}j de stabilité
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.back()}
          >
            <IonIcon icon={arrowBack} size={20} color={colors.surface} />
            <Text style={styles.primaryButtonText}>Retour à la file</Text>
          </TouchableOpacity>
        </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}
