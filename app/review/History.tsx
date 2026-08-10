/**
 * Review History Screen — Timeline of review sessions for a verse
 * See docs/08-ui-screens.md
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRoute, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FsrsRating } from '@/domains/fsrs';

interface ReviewLogEntry {
  id: string;
  answeredAt: number;
  rating: FsrsRating | string;
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

// Sample data for demo
const SAMPLE_HISTORY: ReviewLogEntry[] = [
  {
    id: '1',
    answeredAt: Date.now() - 86400000 * 2,
    rating: FsrsRating.GOOD,
    stabilityBefore: 2.1,
    stabilityAfter: 3.5,
    difficultyBefore: 5.0,
    difficultyAfter: 4.8,
    elapsedDays: 2,
    repetitions: 3,
  },
  {
    id: '2',
    answeredAt: Date.now() - 86400000 * 5,
    rating: FsrsRating.HARD,
    stabilityBefore: 1.5,
    stabilityAfter: 2.1,
    difficultyBefore: 5.5,
    difficultyAfter: 5.0,
    elapsedDays: 5,
    repetitions: 2,
  },
  {
    id: '3',
    answeredAt: Date.now() - 86400000 * 10,
    rating: FsrsRating.AGAIN,
    stabilityBefore: 0.8,
    stabilityAfter: 1.5,
    difficultyBefore: 6.0,
    difficultyAfter: 5.5,
    elapsedDays: 10,
    repetitions: 1,
  },
];

const SAMPLE_VERSE: VerseRecord = {
  id: '1',
  reference: 'Jean 3:16',
  text: 'Car Dieu a tellement aimé le monde qu\'il a donné son Fils unique...',
  totalReviews: 3,
  averageStability: 2.4,
  masteryLevel: 'En cours',
};

export default function ReviewHistoryScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const route = useRoute();
  const router = useRouter();
  const [history, setHistory] = useState<ReviewLogEntry[]>(SAMPLE_HISTORY);
  const [verse, setVerse] = useState<VerseRecord>(SAMPLE_VERSE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

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

  const getRatingConfig = (rating: FsrsRating | string) => {
    let actualRating: FsrsRating;
    if (typeof rating === 'string') {
      switch (rating) {
        case 'again': actualRating = FsrsRating.AGAIN; break;
        case 'hard': actualRating = FsrsRating.HARD; break;
        case 'good': actualRating = FsrsRating.GOOD; break;
        case 'easy': actualRating = FsrsRating.EASY; break;
        default: actualRating = FsrsRating.AGAIN;
      }
    } else {
      actualRating = rating;
    }

    switch (actualRating) {
      case FsrsRating.AGAIN:
        return { color: colors.error, label: 'À revoir', icon: 'refresh' };
      case FsrsRating.HARD:
        return { color: colors.warning, label: 'Difficile', icon: 'remove' };
      case FsrsRating.GOOD:
        return { color: '#4CD964', label: 'Bon', icon: 'checkmark' };
      case FsrsRating.EASY:
        return { color: colors.info, label: 'Facile', icon: 'star' };
      default:
        return { color: colors.primary, label: 'Bon', icon: 'checkmark' };
    }
  };

  const calculateProgress = () => {
    if (history.length === 0) return 0;
    const goodOrBetter = history.filter(h =>
      h.rating === FsrsRating.GOOD || h.rating === FsrsRating.EASY
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
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Verse Info Card */}
        <View style={styles.verseCard}>
          <View style={styles.verseHeader}>
            <View style={styles.verseIconContainer}>
              <Ionicons name="book" size={24} color={colors.primary} />
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
                      <Ionicons name={config.icon as any} size={12} color={colors.surface} />
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
                          <Ionicons name="arrow-forward" size={12} color={colors.textMuted} />
                          <Text style={styles.detailAfter}>{log.stabilityAfter.toFixed(1)}j</Text>
                        </View>
                      </View>
                      <View style={styles.detailGroup}>
                        <Text style={styles.detailLabel}>Difficulté</Text>
                        <View style={styles.detailValues}>
                          <Text style={styles.detailBefore}>{log.difficultyBefore.toFixed(1)}</Text>
                          <Ionicons name="arrow-forward" size={12} color={colors.textMuted} />
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
                <Ionicons name="trending-up" size={24} color={colors.surface} />
              </View>
              <Text style={styles.statValue}>
                {(verse.averageStability * 10).toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Rétention estimée</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMedium]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.surface} />
              </View>
              <Text style={styles.statValue}>
                {history.filter(h => h.rating === FsrsRating.GOOD || h.rating === FsrsRating.EASY).length}
              </Text>
              <Text style={styles.statLabel}>Bon/Facile</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMedium]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.error }]}>
                <Ionicons name="refresh" size={24} color={colors.surface} />
              </View>
              <Text style={styles.statValue}>
                {history.filter(h => h.rating === FsrsRating.AGAIN).length}
              </Text>
              <Text style={styles.statLabel}>À revoir</Text>
            </View>
          </View>
        </View>

        {/* Mastery Level */}
        <View style={styles.masteryCard}>
          <View style={styles.masteryHeader}>
            <Ionicons name="medal" size={24} color={colors.warning} />
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
            <Ionicons name="arrow-back" size={20} color={colors.surface} />
            <Text style={styles.primaryButtonText}>Retour à la file</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
