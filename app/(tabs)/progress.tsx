/**
 * Progress Tab — Dashboard with real progress statistics
 * Connects to ProgressService for live data
 * See docs/08-ui-screens.md §10
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useI18n } from '@/hooks/useI18n';
import { MemorizationService } from '@/domains/memorization/service';
import { IFsrsEngine, Sm2FallbackEngine } from '@/domains/fsrs';
import { MmkvStorage } from '@/infrastructure/storage';
import { ProgressService, ProgressStats } from '@/services/progress-service';

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

export default function ProgressScreen() {
  const { t } = useI18n();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger les stats au montage
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const service = getMemorizationService();
      const progressService = new ProgressService(service, new Sm2FallbackEngine());
      const statsData = await progressService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading progress stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E91E8C" />
          <Text style={styles.loadingText}>Chargement des statistiques...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Aucune progression enregistrée</Text>
          <Text style={styles.emptySubtitle}>
            Commencez à mémoriser des versets pour voir vos statistiques ici
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Grid 2x2 */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('progress.totalVerses')}</Text>
            <Text style={styles.statValue}>{stats.totalVerses}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('progress.mastered')}</Text>
            <Text style={styles.statValue}>{stats.masteredVerses}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('progress.streak')}</Text>
            <Text style={styles.statValue}>{stats.streakCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('progress.due')}</Text>
            <Text style={styles.statValue}>{stats.dueForReview}</Text>
          </View>
        </View>

        {/* Weekly Trend */}
        <View style={styles.trendCard}>
          <Text style={styles.trendTitle}>Tendance hebdomadaire</Text>
          <View style={styles.trendRow}>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Cette semaine</Text>
              <Text style={styles.trendValue}>{stats.weeklyTrend.thisWeek}</Text>
            </View>
            <View style={styles.trendSeparator}></View>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Semaine dernière</Text>
              <Text style={styles.trendValue}>{stats.weeklyTrend.lastWeek}</Text>
            </View>
          </View>
          <View style={styles.changeIndicator}>
            <Text
              style={[
                styles.changeText,
                stats.weeklyTrend.changePercentage >= 0 ? styles.changePositive : styles.changeNegative,
              ]}
            >
              {stats.weeklyTrend.changePercentage >= 0 ? '↑' : '↓'}
              {Math.abs(stats.weeklyTrend.changePercentage)}%
            </Text>
            <Text style={styles.changeLabel}>
              vs semaine précédente
            </Text>
          </View>
        </View>

        {/* Streak Info */}
        {stats.streakCount > 0 && (
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <Text style={styles.streakTitle}>Série consecutive</Text>
              <TouchableOpacity>
                <Text style={styles.streakEmoji}>🔥</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.streakText}>
              Serie de {stats.streakCount} jour(s)
            </Text>
          </View>
        )}

        {/* Session Metrics */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Métriques de session</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Temps moyen par session</Text>
            <Text style={styles.metricValue}>{stats.avgSessionDurationMin.toFixed(1)} min</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E91E8C',
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 16,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
  },
  trendSeparator: {
    width: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 8,
  },
  trendLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  changeText: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 4,
  },
  changePositive: {
    color: '#4CD964',
  },
  changeNegative: {
    color: '#FF6B6B',
  },
  changeLabel: {
    fontSize: 12,
    color: '#888',
  },
  streakCard: {
    backgroundColor: '#FFE4EE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  streakEmoji: {
    fontSize: 24,
  },
  streakText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E91E8C',
    textAlign: 'center',
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
});
