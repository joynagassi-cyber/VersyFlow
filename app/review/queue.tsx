/**
 * Review Queue Screen — List of verses due for review
 * See docs/08-ui-screens.md §8
 * Figma: https://www.figma.com/design/BL5Cbn6s2aMXAtNDmAVJ8F/VersyFlow
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/hooks/useI18n';
import { MemorizationService } from '@/domains/memorization/service';
import { IFsrsEngine, Sm2FallbackEngine } from '@/domains/fsrs';
import { MmkvStorage } from '@/infrastructure/storage';
import { getFsrsEngine } from '@/services/fsrs-factory';

// Types
interface ReviewItem {
  id: string;
  bookId: string;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
  nextReviewAt: number;
  isOverdue: boolean;
  stability?: number;
}

// Singleton
let memorizationService: MemorizationService | null = null;
let fsrsEngine: IFsrsEngine | null = null;

const getMemorizationService = () => {
  if (!memorizationService) {
    if (!fsrsEngine) {
      fsrsEngine = getFsrsEngine();
    }
    memorizationService = new MemorizationService(new MmkvStorage(), fsrsEngine);
  }
  return memorizationService;
};

// Sample data for demo
const SAMPLE_REVIEWS: ReviewItem[] = [
  {
    id: '1',
    bookId: 'Jean',
    chapter: 3,
    verse: 16,
    reference: 'Jean 3:16',
    text: 'Car Dieu a tellement aimé le monde...',
    nextReviewAt: Date.now() - 86400000 * 2,
    isOverdue: true,
    stability: 1.2,
  },
  {
    id: '2',
    bookId: 'Psaumes',
    chapter: 23,
    verse: 1,
    reference: 'Psaume 23:1',
    text: 'L\'Éternel est mon berger...',
    nextReviewAt: Date.now(),
    isOverdue: false,
    stability: 3.5,
  },
  {
    id: '3',
    bookId: 'Romains',
    chapter: 8,
    verse: 28,
    reference: 'Romains 8:28',
    text: 'Nous savons d\'ailleurs que...',
    nextReviewAt: Date.now() + 86400000,
    isOverdue: false,
    stability: 5.2,
  },
  {
    id: '4',
    bookId: 'Philippiens',
    chapter: 4,
    verse: 13,
    reference: 'Philippiens 4:13',
    text: 'Je puis tout par celui...',
    nextReviewAt: Date.now() - 86400000 * 5,
    isOverdue: true,
    stability: 0.8,
  },
  {
    id: '5',
    bookId: 'Matthieu',
    chapter: 6,
    verse: 33,
    reference: 'Matthieu 6:33',
    text: 'Cherchez premièrement le royaume...',
    nextReviewAt: Date.now() + 86400000 * 2,
    isOverdue: false,
    stability: 7.1,
  },
];

export default function ReviewQueueScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const { t } = useI18n();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      // Try to load from service
      const service = getMemorizationService();
      const dueRecords = await service.getDueRecords();
      if (dueRecords && dueRecords.length > 0) {
        setReviews(dueRecords.map((r: any) => ({
          id: r.id,
          bookId: r.bookId,
          chapter: r.chapterNumber,
          verse: r.verseNumber,
          reference: r.reference,
          text: r.text,
          nextReviewAt: r.nextReviewAt,
          isOverdue: r.isOverdue,
          stability: r.stability,
        })));
      } else {
        // Fallback to sample data
        setReviews(SAMPLE_REVIEWS);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews(SAMPLE_REVIEWS);
    } finally {
      setLoading(false);
    }
  };

  const overdueReviews = reviews.filter(r => r.isOverdue);
  const dueReviews = reviews.filter(r => !r.isOverdue);
  const totalDue = reviews.length;
  const totalOverdue = overdueReviews.length;
  const estimatedTime = Math.ceil(totalDue * 2.5);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = timestamp - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `En retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Demain';
    } else {
      return `Dans ${diffDays} jours`;
    }
  };

  const renderReviewItem = ({ item }: { item: ReviewItem }) => (
    <TouchableOpacity
      style={[styles.reviewCard, item.isOverdue && styles.overdueCard]}
      onPress={() => router.push(`/review/session?recordId=${item.id}`)}
      activeOpacity={0.85}
    >
      <View style={[styles.borderAccent, item.isOverdue ? styles.borderOverdue : styles.borderDue]} />
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewReference}>{item.reference}</Text>
          <View style={[styles.statusBadge, item.isOverdue ? styles.overdueBadge : styles.dueBadge]}>
            <Ionicons
              name={item.isOverdue ? 'alert-circle' : 'checkmark-circle'}
              size={14}
              color={item.isOverdue ? 'colors.surface' : colors.surface}
            />
            <Text style={styles.statusBadgeText}>
              {item.isOverdue ? 'En retard' : 'À l\'heure'}
            </Text>
          </View>
        </View>
        <Text style={styles.reviewText} numberOfLines={2}>{item.text}</Text>
        <View style={styles.reviewFooter}>
          <Text style={styles.reviewDate}>{formatDate(item.nextReviewAt)}</Text>
          {item.stability && (
            <View style={styles.stabilityIndicator}>
              <View style={[styles.stabilityBar, { width: `${Math.min(100, item.stability * 10)}%` }]} />
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const renderCategorySection = (title: string, items: ReviewItem[], icon: string) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Ionicons name={icon as any} size={18} color={title === 'En retard' ? 'colors.error' : colors.primary} />
          <Text style={styles.categoryTitle}>{title}</Text>
          <Text style={styles.categoryCount}>{items.length}</Text>
        </View>
        {items.map((item) => renderReviewItem({ item }))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Chargement des révisions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (reviews.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.emptyTitle}>Tout est à jour !</Text>
          <Text style={styles.emptySubtitle}>
            Vous n'avez aucune révision à faire pour le moment.
          </Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/(tabs)/index')}
          >
            <Ionicons name="home" size={20} color={colors.surface} />
            <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Révisions du jour</Text>
        <TouchableOpacity onPress={loadReviews}>
          <Ionicons name="refresh" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Strip */}
      <View style={styles.summaryStrip}>
        <View style={[styles.summaryPill, { backgroundColor: colors.primary }]}>
          <Ionicons name="list" size={16} color={colors.surface} />
          <Text style={styles.summaryPillText}>{totalDue} à réviser</Text>
        </View>
        {totalOverdue > 0 && (
          <View style={[styles.summaryPill, { backgroundColor: colors.error }]}>
            <Ionicons name="alert-circle" size={16} color={colors.surface} />
            <Text style={styles.summaryPillText}>{totalOverdue} en retard</Text>
          </View>
        )}
        <View style={[styles.summaryPill, { backgroundColor: colors.surfaceTint }]}>
          <Ionicons name="time" size={16} color={colors.textSecondary} />
          <Text style={[styles.summaryPillText, { color: colors.textSecondary }]}>~{estimatedTime} min</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overdue Section */}
        {renderCategorySection('En retard', overdueReviews, 'alert-circle')}

        {/* Due Today Section */}
        {renderCategorySection('À l\'heure', dueReviews, 'checkmark-circle')}

        {/* Start Review Button - Fixed Bottom */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push(`/review/session?recordId=${reviews[0]?.id}`)}
            activeOpacity={0.9}
          >
            <Ionicons name="play" size={20} color={colors.surface} />
            <Text style={styles.startButtonText}>Commencer la révision</Text>
            <Text style={styles.startButtonCount}>({totalDue})</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Summary Strip
  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  summaryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.surface,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Category Section
  categorySection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  // Review Card
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  overdueCard: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  borderAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  borderOverdue: {
    backgroundColor: colors.error,
  },
  borderDue: {
    backgroundColor: colors.primary,
  },
  reviewContent: {
    flex: 1,
    marginLeft: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewReference: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueBadge: {
    backgroundColor: colors.error,
  },
  dueBadge: {
    backgroundColor: colors.primary,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.surface,
  },
  reviewText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  stabilityIndicator: {
    width: 60,
    height: 4,
    backgroundColor: colors.surfaceTint,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stabilityBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.iconBgGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 26,
  },
  homeButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  startButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  startButtonCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
});
