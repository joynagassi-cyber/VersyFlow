/**
 * Progress Tab — Dashboard with stats and streak
 * Features: StatsGrid, WeeklyChart, StreakBadge
 * See docs/08-ui-screens.md §10
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

// Données de mock pour le dashboard
const WEEKLY_DATA = [
  { day: 'Lun', value: 3 },
  { day: 'Mar', value: 5 },
  { day: 'Mer', value: 2 },
  { day: 'Jeu', value: 7 },
  { day: 'Ven', value: 4 },
  { day: 'Sam', value: 1 },
  { day: 'Dim', value: 6 },
];

export default function ProgressScreen() {
  const router = useRouter();
  const [streak, setStreak] = useState(3);
  const [dailyGoal, setDailyGoal] = useState(5);

  useEffect(() => {
    // Charger les données de progression en temps réel
    const interval = setInterval(() => {
      // Simulation de mise à jour en temps réel
      setStreak(prev => Math.max(0, prev + (Math.random() > 0.7 ? 1 : -1)));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const totalVerses = 124;
  const mastered = 47;
  const inProgress = 32;
  const newVerses = 45;

  const percentage = Math.round((mastered / totalVerses) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header avec la streak */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakTitle}>Feu d'objectif 🔥</Text>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Text style={styles.streakSettings}>Paramètres</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.streakMain}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>jour(s) de suite</Text>
          </View>
          <View style={styles.streakProgress}>
            <View
              style={[
                styles.streakProgressFill,
                { width: `${Math.min(streak * 10, 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* Statistiques principales */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalVerses}</Text>
            <Text style={styles.statLabel}>Mémorisés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{mastered}</Text>
            <Text style={styles.statLabel}>Maîtrisés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{percentage}%</Text>
            <Text style={styles.statLabel}>Taux</Text>
          </View>
        </View>

        {/* Objectif quotidien */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objectif quotidien</Text>
          <View style={styles.goalCard}>
            <Text style={styles.goalText}>
              Révisez {dailyGoal} verset(s) aujourd'hui
            </Text>
            <TouchableOpacity
              style={styles.goalButton}
              onPress={() => setDailyGoal(d => Math.max(1, d - 1))}
            >
              <Text style={styles.goalButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.goalValue}>{dailyGoal}</Text>
            <TouchableOpacity
              style={styles.goalButton}
              onPress={() => setDailyGoal(d => d + 1)}
            >
              <Text style={styles.goalButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Graphique hebdomadaire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Révisions cette semaine</Text>
          <View style={styles.weeklyChart}>
            {WEEKLY_DATA.map((item, index) => (
              <View key={index} style={styles.weeklyBarContainer}>
                <View style={styles.weeklyDayLabel}>
                  <Text style={styles.dayText}>{item.day}</Text>
                </View>
                <View style={styles.weeklyBar}>
                  <View
                    style={[
                      styles.weeklyBarFill,
                      { height: `${item.value * 15}px`, backgroundColor: '#E91E8C' },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Statistiques détaillées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail des versets</Text>
          <View style={styles.detailList}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Nouveaux</Text>
              <Text style={styles.detailValue}>{newVerses}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>En cours</Text>
              <Text style={styles.detailValue}>{inProgress}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>À réviser</Text>
              <Text style={styles.detailValue}>{Math.max(0, dailyGoal - Math.floor(Math.random() * 5))}</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/memorization/session')}
          >
            <Text style={styles.actionButtonText}>Commencer une session</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push('/review/queue')}
          >
            <Text style={styles.actionButtonText}>Révisions du jour</Text>
          </TouchableOpacity>
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
  streakCard: {
    backgroundColor: '#E91E8C',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...shadow.md,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  streakSettings: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  streakMain: {
    alignItems: 'center',
    marginBottom: 12,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  streakProgress: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  streakProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    ...shadow.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E91E8C',
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.sm,
  },
  goalText: {
    flex: 1,
    fontSize: 14,
    color: '#2D2D2D',
  },
  goalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButtonText: {
    fontSize: 20,
    color: '#E91E8C',
    fontWeight: '600',
  },
  goalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E91E8C',
    marginHorizontal: 12,
  },
  weeklyChart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...shadow.sm,
  },
  weeklyBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyDayLabel: {
    width: 40,
  },
  dayText: {
    fontSize: 12,
    color: '#6E6E6E',
  },
  weeklyBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  weeklyBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  detailList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...shadow.sm,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailItemLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6E6E6E',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  actions: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E91E8C',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
};
