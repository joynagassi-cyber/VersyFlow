/**
 * Analytics Dashboard Screen
 * Visualizes memorization progress, retention curves, and learning patterns
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
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnalyticsCapability } from '@/capabilities/analytics/store';
import { useI18n } from '@/hooks/useI18n';

interface DataPoint {
  date: string;
  retention: number;
  sessions: number;
}

export default function AnalyticsDashboardScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const { t } = useI18n();
  const { stats, calculateStats, getRetentionCurve, getLearningTime } =
    useAnalyticsCapability();
  const [loading, setLoading] = useState(true);
  const [retentionCurve, setRetentionCurve] = useState<DataPoint[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await calculateStats();
      const curve = getRetentionCurve();
      setRetentionCurve(curve.slice(-30));
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Chargement des statistiques...</Text>
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
          <Text style={styles.headerTitle}>Votre Progression</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadData}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Overview Cards */}
        <View style={styles.statsOverview}>
          <View style={[styles.statCard, styles.statCardLarge]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="book" size={24} color={colors.surface} />
            </View>
            <Text style={styles.statValue}>{stats?.totalVerses || 0}</Text>
            <Text style={styles.statLabel}>Versets mémorisés</Text>
          </View>

          <View style={[styles.statCard, styles.statCardMedium]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.surface} />
            </View>
            <Text style={styles.statValue}>{stats?.masteredVerses || 0}</Text>
            <Text style={styles.statLabel}>Maîtrisés</Text>
          </View>

          <View style={[styles.statCard, styles.statCardMedium]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.error }]}>
              <Ionicons name="flame" size={24} color={colors.surface} />
            </View>
            <Text style={styles.statValue}>{stats?.streakCount || 0}</Text>
            <Text style={styles.statLabel}>Streak (jours)</Text>
          </View>
        </View>

        {/* Retention Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Rétention sur 30 jours</Text>
            <TouchableOpacity style={styles.chartAction}>
              <Text style={styles.chartActionText}>Détails</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartCard}>
            {retentionCurve.length > 0 ? (
              <View style={styles.chartContainer}>
                {/* Y-axis labels */}
                <View style={styles.yAxisContainer}>
                  <Text style={styles.yAxisLabel}>100%</Text>
                  <Text style={styles.yAxisLabel}>50%</Text>
                  <Text style={styles.yAxisLabel}>0%</Text>
                </View>

                {/* Chart bars */}
                <View style={styles.chartBars}>
                  {retentionCurve.slice(-14).map((point, idx) => (
                    <View key={idx} style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(4, point.retention * 100),
                            backgroundColor:
                              point.retention > 0.8
                                ? 'colors.success'
                                : point.retention > 0.5
                                ? 'colors.primary'
                                : colors.error,
                          },
                        ]}
                      />
                      <Text style={styles.barLabel}>
                        {new Date(point.date).getDate()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="analytics" size={48} color={colors.outline} />
                <Text style={styles.emptyChartText}>
                  Aucune donnée de rétention
                </Text>
                <Text style={styles.emptyChartSubtext}>
                  Commencez à mémoriser pour voir vos courbes
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Weekly Trend */}
        {stats?.weeklyTrend && (
          <View style={styles.trendSection}>
            <Text style={styles.sectionTitle}>Tendance hebdomadaire</Text>
            <View style={styles.trendCard}>
              <View style={styles.trendGrid}>
                <View style={styles.trendItem}>
                  <View style={[styles.trendIcon, { backgroundColor: colors.primaryFixed }]}>
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.trendValue}>{stats.weeklyTrend.thisWeek}</Text>
                  <Text style={styles.trendLabel}>Cette semaine</Text>
                </View>
                <View style={styles.trendItem}>
                  <View style={[styles.trendIcon, { backgroundColor: colors.iconBgPurple }]}>
                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.trendValue}>{stats.weeklyTrend.lastWeek}</Text>
                  <Text style={styles.trendLabel}>Semaine dernière</Text>
                </View>
              </View>

              <View
                style={[
                  styles.changeIndicator,
                  stats.weeklyTrend.changePercentage >= 0
                    ? styles.changePositive
                    : styles.changeNegative,
                ]}
              >
                <Ionicons
                  name={stats.weeklyTrend.changePercentage >= 0 ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={stats.weeklyTrend.changePercentage >= 0 ? 'colors.success' : colors.error}
                />
                <Text style={styles.changeText}>
                  {stats.weeklyTrend.changePercentage >= 0 ? '+' : ''}
                  {stats.weeklyTrend.changePercentage}%
                </Text>
                <Text style={styles.changeLabel}>
                  {stats.weeklyTrend.changePercentage >= 0 ? 'Meilleur que' : 'Pire que'} la semaine dernière
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Learning Time */}
        <View style={styles.timeSection}>
          <Text style={styles.sectionTitle}>Temps d'apprentissage</Text>
          <View style={styles.timeCard}>
            <View style={styles.timeGrid}>
              <View style={styles.timeItem}>
                <Text style={styles.timeValue}>{getLearningTime()} min</Text>
                <Text style={styles.timeLabel}>Total</Text>
              </View>
              <View style={styles.timeItem}>
                <Text style={styles.timeValue}>
                  {Math.round((stats?.totalSessions || 0) / Math.max(1, stats?.totalDays || 1))} min
                </Text>
                <Text style={styles.timeLabel}>Moyenne/jour</Text>
              </View>
            </View>
            <View style={styles.timeBar}>
              <View
                style={[
                  styles.timeBarFill,
                  {
                    width: `${Math.min(100, ((stats?.totalSessions || 0) / 30) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.timeBarLabel}>
              {(stats?.totalSessions || 0)} sessions cette semaine
            </Text>
          </View>
        </View>

        {/* Verses by Status */}
        <View style={styles.versesSection}>
          <Text style={styles.sectionTitle}>Verset par statut</Text>
          <View style={styles.versesCard}>
            <TouchableOpacity
              style={styles.verseStatusRow}
              onPress={() => router.push('/progress')}
            >
              <View style={styles.verseStatusLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={styles.verseStatusText}>Maîtrisés</Text>
              </View>
              <Text style={styles.verseStatusCount}>
                {stats?.masteredVerses || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verseStatusRow}
              onPress={() => router.push('/review/queue')}
            >
              <View style={styles.verseStatusLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.verseStatusText}>En cours</Text>
              </View>
              <Text style={styles.verseStatusCount}>
                {stats?.inProgressVerses || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verseStatusRow}
              onPress={() => router.push('/review/queue')}
            >
              <View style={styles.verseStatusLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.error }]} />
                <Text style={styles.verseStatusText}>À réviser</Text>
              </View>
              <Text style={styles.verseStatusCount}>
                {stats?.dueForReview || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verseStatusRow}
              onPress={() => router.push('/bible/explorer')}
            >
              <View style={styles.verseStatusLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.textMuted }]} />
                <Text style={styles.verseStatusText}>Nouveaux</Text>
              </View>
              <Text style={styles.verseStatusCount}>
                {stats?.newVerses || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spacer */}
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
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Overview
  statsOverview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...shadow.md,
  },
  statCardLarge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 38,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Chart Section
  chartSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chartAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surfaceTint,
    borderRadius: 12,
  },
  chartActionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    ...shadow.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    marginTop: 16,
  },
  yAxisContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 24,
    justifyContent: 'space-between',
  },
  yAxisLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    flex: 1,
    marginLeft: 24,
    height: '100%',
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '60%',
    borderRadius: 4,
    minHeight: 4,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  barLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 16,
    color: colors.textTertiary,
    marginTop: 12,
    fontWeight: '600',
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Trend Section
  trendSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  trendCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    ...shadow.md,
  },
  trendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
  },
  trendIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trendValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  trendLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  changePositive: {
    backgroundColor: colors.iconBgGreen,
  },
  changeNegative: {
    backgroundColor: colors.errorLight,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  changeLabel: {
    fontSize: 12,
    color: colors.textTertiary,
  },

  // Time Section
  timeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  timeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    ...shadow.md,
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  timeBar: {
    height: 8,
    backgroundColor: colors.surfaceTint,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  timeBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  timeBarLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Verses Section
  versesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  versesCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 8,
    ...shadow.md,
  },
  verseStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  verseStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  verseStatusText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  verseStatusCount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 24,
  },
});

const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};
