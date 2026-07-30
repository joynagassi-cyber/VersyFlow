/**
 * Review History Screen — Displays historical review log for a memorized verse
 * See docs/08-ui-screens.md §14
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
} from 'react-native';
import { useRoute, useRouter } from 'expo-router';
import { useI18n } from '@/hooks/useI18n';
import { MemorizationService } from '@/domains/memorization/service';
import { IFsrsEngine, Sm2FallbackEngine } from '@/domains/fsrs';
import { MmkvStorage } from '@/infrastructure/storage';
import { ReviewLogEntry } from '@/domains/memorization/entities';
import { FsrsRating } from '@/domains/fsrs';

// Singleton pour le service
let memorizationService: MemorizationService | null = null;

const getMemorizationService = () => {
  if (!memorizationService) {
    const storage = new MmkvStorage();
    const fsrs = new Sm2FallbackEngine();
    memorizationService = new MemorizationService(storage, fsrs);
  }
  return memorizationService;
};

export default function ReviewHistoryScreen() {
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();

  // Record ID passed from query params (like /review/history?recordId=...)
  const recordId = (route.params as any)?.recordId;

  // Get service instance
  const service = getMemorizationService();

  // State
  const [history, setHistory] = useState<ReviewLogEntry[]>();
  const [loading, setLoading] = useState(true);
  const [verseText, setVerseText] = useState('');

  // Load history on mount
  useEffect(() => {
    if (!recordId) {
      router.replace('/review/queue');
      return;
    }

    loadHistory();
  }, [recordId, router, service]);

  const loadHistory = async () => {
    try {
      // Get the record to get the verse text
      const record = await service.getMemorizedRecord(
        recordId.split(':')[0],
        parseInt(recordId.split(':')[1], 10),
        parseInt(recordId.split(':')[2], 10),
        recordId.split(':')[3]
      );

      if (!record) {
        throw new Error('Record not found');
      }

      setVerseText(record.bibleVerseText);

      // Get all review logs for this record
      const logs = await service.getReviewLogsForRecord(recordId);
      setHistory(logs);
    } catch (error) {
      console.error('Error loading review history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to readable string
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR');
  };

  // Rating label
  const getRatingLabel = (rating: string | FsrsRating): string => {
    // Convert string to FsrsRating enum if needed
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
      case FsrsRating.AGAIN: return t('rating.again');
      case FsrsRating.HARD: return t('rating.hard');
      case FsrsRating.GOOD: return t('rating.good');
      case FsrsRating.EASY: return t('rating.easy');
      default: return rating;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E91E8C" />
          <Text style={styles.loadingText}>Chargement de l'historique...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!history || history.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>Aucune révision pour ce verset</Text>
          <Text style={styles.emptySubtitle}>
            {verseText ? `Ceci est le premier rappel pour : "${verseText.substring(0, 50)}..."` : 'Ce verset n\'a pas encore été révisé'}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Retour à la file</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historique des révisions</Text>
          {verseText && (
            <Text style={styles.verseReference}>
              {verseText.substring(0, 60)}{verseText.length > 60 ? '...' : ''}
            </Text>
          )}
        </View>

        {/* History items */}
        {history.map((log, index) => (
          <View key={log.id} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>{formatTimestamp(log.answeredAt)}</Text>
              <View style={[styles.ratingBadge, getRatingStyle(log.rating)]}>
                <Text style={styles.ratingText}>{getRatingLabel(log.rating)}</Text>
              </View>
            </View>

            <View style={styles.historyDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Avant</Text>
                <Text style={styles.detailValue}>Stabilité: {log.stabilityBefore.toFixed(1)}</Text>
                <Text style={styles.detailValue}>Difficulté: {log.difficultyBefore.toFixed(1)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Après</Text>
                <Text style={styles.detailValue}>Stabilité: {log.stabilityAfter.toFixed(1)}</Text>
                <Text style={styles.detailValue}>Difficulté: {log.difficultyAfter.toFixed(1)}</Text>
              </View>
            </View>

            {index < history.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Résumé</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total des révisions</Text>
            <Text style={styles.summaryValue}>{history.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Meilleure stabilité</Text>
            <Text style={styles.summaryValue}>
              {Math.max(...history.map(h => Math.max(h.stabilityBefore, h.stabilityAfter))).toFixed(1)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dernier rappel</Text>
            <Text style={styles.summaryValue}>{formatTimestamp(history[history.length - 1].answeredAt)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getRatingStyle(rating: FsrsRating) {
  switch (rating) {
    case FsrsRating.AGAIN: return styles.ratingAgain;
    case FsrsRating.HARD: return styles.ratingHard;
    case FsrsRating.GOOD: return styles.ratingGood;
    case FsrsRating.EASY: return styles.ratingEasy;
    default: return {};
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  verseReference: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadow: {
      color: '#000',
      offsetX: 0,
      offsetY: 1,
      opacity: 0.1,
      radius: 4,
    },
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingAgain: {
    backgroundColor: '#FF6B6B',
  },
  ratingHard: {
    backgroundColor: '#FF9500',
  },
  ratingGood: {
    backgroundColor: '#4CD964',
  },
  ratingEasy: {
    backgroundColor: '#007AFF',
  },
  ratingText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    color: '#2D2D2D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadow: {
      color: '#000',
      offsetX: 0,
      offsetY: 1,
      opacity: 0.1,
      radius: 4,
    },
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
});
