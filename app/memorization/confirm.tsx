/**
 * Memorization Confirm Screen — Results and rating after session completion
 * Phase 8.5: Supports passage mode (shows passage reference)
 * See docs/08-ui-screens.md §7
 * Figma: https://www.figma.com/design/BL5Cbn6s2aMXAtNDmAVJ8F/VersyFlow
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Animated,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface FSRSResult {
  interval: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  repetitions: number;
}

const FSRS_RESULTS: Record<string, FSRSResult> = {
  again: { interval: 1, stability: 1.2, difficulty: 6.5, elapsedDays: 1, repetitions: 1 },
  hard: { interval: 2, stability: 2.1, difficulty: 5.8, elapsedDays: 2, repetitions: 2 },
  good: { interval: 4, stability: 3.5, difficulty: 5.0, elapsedDays: 3, repetitions: 3 },
  easy: { interval: 7, stability: 5.2, difficulty: 4.2, elapsedDays: 5, repetitions: 4 },
};

export default function MemorizationConfirmScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const rating = (params.rating as string) || 'good';
  const reference = (params.reference as string) || 'Jean 3:16';
  const isPassage = params.targetType === 'passage';
  const [animateIn] = useState(new Animated.Value(0));

  const fsrsResult = FSRS_RESULTS[rating] || FSRS_RESULTS.good;
  const ratingColor = rating === 'again' ? '#F44336' : rating === 'hard' ? '#FF9800' : rating === 'good' ? '#4CAF50' : colors.info;
  const ratingLabel = rating === 'again' ? 'À revoir' : rating === 'hard' ? 'Difficile' : rating === 'good' ? 'Bon' : 'Facile';

  useEffect(() => {
    Animated.spring(animateIn, {
      toValue: 1,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDone = () => {
    router.replace('/(tabs)/index');
  };

  const handleAddAnother = () => {
    router.replace('/bible/explorer');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation */}
        <Animated.View
          style={[
            styles.successContainer,
            {
              opacity: animateIn,
              transform: [
                {
                  scale: animateIn.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.successIcon, { backgroundColor: ratingColor + '20' }]}>
            <Ionicons name="checkmark-circle" size={64} color={ratingColor} />
          </View>
          <Text style={styles.successTitle}>
            {isPassage ? 'Passage mémorisé ! ✨' : 'Verset mémorisé ! ✨'}
          </Text>
          <Text style={styles.successReference}>{reference}</Text>
          {isPassage && (
            <View style={styles.passageBadge}>
              <Ionicons name="text" size={14} color={colors.primary} />
              <Text style={styles.passageBadgeText}>Passage</Text>
            </View>
          )}
        </Animated.View>

        {/* FSRS Result Card */}
        <View style={styles.fsrsCard}>
          <View style={styles.fsrsHeader}>
            <Ionicons name="analytics" size={20} color={colors.primary} />
            <Text style={styles.fsrsTitle}>Résultats FSRS</Text>
          </View>

          <View style={styles.fsrsMetrics}>
            <View style={styles.fsrsMetric}>
              <Text style={styles.fsrsMetricValue}>{fsrsResult.interval}</Text>
              <Text style={styles.fsrsMetricLabel}>Prochain rappel</Text>
              <Text style={styles.fsrsMetricUnit}>dans {fsrsResult.interval} jour{fsrsResult.interval > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.fsrsDivider} />
            <View style={styles.fsrsMetric}>
              <Text style={styles.fsrsMetricValue}>{fsrsResult.stability.toFixed(1)}</Text>
              <Text style={styles.fsrsMetricLabel}>Stabilité</Text>
              <Text style={styles.fsrsMetricUnit}>jours</Text>
            </View>
            <View style={styles.fsrsDivider} />
            <View style={styles.fsrsMetric}>
              <Text style={styles.fsrsMetricValue}>{fsrsResult.difficulty.toFixed(1)}</Text>
              <Text style={styles.fsrsMetricLabel}>Difficulté</Text>
              <Text style={styles.fsrsMetricUnit}>score</Text>
            </View>
          </View>

          <View style={styles.ratingBadge}>
            <View style={[styles.ratingDot, { backgroundColor: ratingColor }]} />
            <Text style={[styles.ratingLabel, { color: ratingColor }]}>{ratingLabel}</Text>
            <Text style={styles.ratingRepeat}>×{fsrsResult.repetitions}</Text>
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Votre progression</Text>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>47</Text>
              <Text style={styles.progressStatLabel}>Versets mémorisés</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>7</Text>
              <Text style={styles.progressStatLabel}>Jours de suite</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>89%</Text>
              <Text style={styles.progressStatLabel}>Rétention</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleDone}
          >
            <Ionicons name="home" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAddAnother}
          >
            <Ionicons name="add" size={20} color={colors.surface} />
            <Text style={styles.primaryButtonText}>
              {isPassage ? 'Mémoriser un autre passage' : 'Mémoriser un autre verset'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Success Animation
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 8,
  },
  successReference: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
  passageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#E91E6315',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  passageBadgeText: {
    fontSize: 13,
    color: '#E91E63',
    fontWeight: '600',
  },

  // FSRS Card
  fsrsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 24,
    marginBottom: 20,
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
  fsrsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  fsrsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  fsrsMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  fsrsMetric: {
    flex: 1,
    alignItems: 'center',
  },
  fsrsMetricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E91E63',
  },
  fsrsMetricLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  fsrsMetricUnit: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 2,
  },
  fsrsDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  ratingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingRepeat: {
    fontSize: 13,
    color: '#999',
  },

  // Progress Card
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 24,
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
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#212121',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  progressDivider: {
    width: 1,
    backgroundColor: '#eee',
  },

  // Actions
  actions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 26,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E91E63',
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
  secondaryButtonText: {
    color: '#E91E63',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E91E63',
    borderRadius: 26,
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#E91E63',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
