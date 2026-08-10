/**
 * AI Coach Screen — Personalized recommendations
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { useAICoachCapability } from '@/capabilities/ai-coach/store';
import { AIRecommendation } from '@/capabilities';

export default function AICoachScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const { recommendations, dailyPlan, analyzePerformance, getWeeklyReport } =
    useAICoachCapability();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzePerformance().then(() => setLoading(false));
  }, []);

  const weeklyReport = getWeeklyReport();

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Analyse en cours...</Text>
      </SafeAreaView>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'colors.error';
      case 'medium':
        return 'colors.warning';
      case 'low':
        return '#4CD964';
      default:
        return 'colors.textMuted';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'verse':
        return '📖';
      case 'exercise':
        return '💪';
      case 'reminder':
        return '⏰';
      case 'insight':
        return '💡';
      default:
        return '📌';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Weekly Report */}
        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>Rapport hebdomadaire</Text>
          <View style={styles.reportGrid}>
            <View style={styles.reportItem}>
              <Text style={styles.reportValue}>{weeklyReport.totalSessions}</Text>
              <Text style={styles.reportLabel}>Sessions</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportValue}>{weeklyReport.versesMemorized}</Text>
              <Text style={styles.reportLabel}>Versets</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportValue}>
                {Math.round(weeklyReport.avgScore * 100)}%
              </Text>
              <Text style={styles.reportLabel}>Score moy.</Text>
            </View>
          </View>
        </View>

        {/* Daily Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan du jour</Text>
          {dailyPlan.map((task, idx) => (
            <View key={idx} style={styles.planItem}>
              <Text style={styles.planNumber}>{idx + 1}</Text>
              <Text style={styles.planText}>{task}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommandations</Text>
          {recommendations.map((rec) => (
            <TouchableOpacity
              key={rec.id}
              style={styles.recommendationCard}
              onPress={rec.action}
            >
              <View style={styles.recHeader}>
                <Text style={styles.recIcon}>{getTypeIcon(rec.type)}</Text>
                <View style={styles.recInfo}>
                  <Text style={styles.recTitle}>{rec.title}</Text>
                  <Text style={styles.recDesc}>{rec.description}</Text>
                </View>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(rec.priority) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      { color: getPriorityColor(rec.priority) },
                    ]}
                  >
                    {rec.priority === 'high'
                      ? 'Important'
                      : rec.priority === 'medium'
                      ? 'Moyen'
                      : 'Faible'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  reportGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reportItem: {
    alignItems: 'center',
  },
  reportValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  reportLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  planNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  recommendationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recInfo: {
    flex: 1,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recDesc: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
