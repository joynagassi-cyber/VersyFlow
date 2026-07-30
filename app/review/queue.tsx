/**
 * Review Queue Screen — List of verses due for review
 * See docs/08-ui-screens.md §12
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/hooks/useI18n';
import { MemorizationService } from '@/domains/memorization/service';
import { IFsrsEngine, Sm2FallbackEngine } from '@/domains/fsrs';
import { MmkvStorage } from '@/infrastructure/storage';
import { getFsrsEngine } from '@/services/fsrs-factory';

// Singleton pour le service (à initialize au niveau de l'application)
let memorizationService: MemorizationService | null = null;
let fsrsEngine: IFsrsEngine | null = null;

const getMemorizationService = () => {
  if (!memorizationService) {
    if (!fsrsEngine) {
      fsrsEngine = getFsrsEngine(); // Use factory to get WASM or fallback
    }
    memorizationService = new MemorizationService(new MmkvStorage(), fsrsEngine);
  }
  return memorizationService;
};

export default function ReviewQueueScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les reviews dues au montage
  useEffect(() => {
    const loadDueReviews = async () => {
      try {
        const service = getMemorizationService();
        const dueRecords = await service.getDueRecords();
        setReviews(dueRecords);
      } catch (error) {
        console.error('Erreur lors du chargement des reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDueReviews();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E91E8C" />
          <Text style={styles.loadingText}>Chargement des reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (reviews.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyTitle}>Tout est à jour !</Text>
          <Text style={styles.emptySubtitle}>
            Pas de verse à réviser pour le moment
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(tabs)/index')}
          >
            <Text style={styles.buttonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Révisions du jour</Text>
        <Text style={styles.count}>{reviews.length} verset(s) à réviser</Text>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.reviewItem}
            onPress={() => router.push(`/review/session?recordId=${item.id}`)}
          >
            <View style={styles.reviewInfo}>
              <Text style={styles.bookName}>{item.bookId}</Text>
              <Text style={styles.chapterVerse}>
                Chapitre {item.chapterNumber}, Verset {item.verseNumber}
              </Text>
            </View>
            <View style={styles.reviewMeta}>
              <Text style={styles.dueText}>
                {t('review.dueSoon', { days: Math.ceil((item.nextReviewAt - Date.now()) / 86400000) })}
              </Text>
              {/* Button to view revision history */}
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => router.push({ pathname: '/review/history', params: { recordId: item.id } })}
              >
                <Text style={styles.historyButtonText}>Historique</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Aucune révision</Text>
            <Text style={styles.emptySubtitle}>
              Votre file de révision est vide
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
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
  emptyState: {
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
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4EE',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  count: {
    fontSize: 16,
    color: '#E91E8C',
    fontWeight: '600',
  },
  reviewItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.md,
  },
  reviewInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  chapterVerse: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 4,
  },
  reviewMeta: {
    alignItems: 'flex-end',
  },
  dueText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

const shadow = {
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
};
