/**
 * Review Calendar Screen
 * Shows upcoming review schedule and spaced repetition calendar
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ReviewDay {
  date: Date;
  dueCount: number;
  isNew: boolean;
}

const generateCalendarData = (): ReviewDay[] => {
  const days: ReviewDay[] = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      date,
      dueCount: Math.floor(Math.random() * 10),
      isNew: i < 7,
    });
  }
  return days;
};

export default function ReviewCalendarScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const [calendarData, setCalendarData] = useState<ReviewDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    setCalendarData(generateCalendarData());
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const days = getDaysInMonth(currentMonth);
  const today = new Date();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendrier de révision</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.monthButton} onPress={() => {
            const newMonth = new Date(currentMonth);
            newMonth.setMonth(newMonth.getMonth() - 1);
            setCurrentMonth(newMonth);
          }}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity style={styles.monthButton} onPress={() => {
            const newMonth = new Date(currentMonth);
            newMonth.setMonth(newMonth.getMonth() + 1);
            setCurrentMonth(newMonth);
          }}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Weekdays Header */}
        <View style={styles.weekdaysRow}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            const isToday = day.toDateString() === today.toDateString();
            const reviewData = calendarData.find(d => d.date.toDateString() === day.toDateString());
            const dueCount = reviewData?.dueCount || 0;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                  dueCount > 0 && styles.hasReviewsCell,
                ]}
                onPress={() => dueCount > 0 && router.push('/review/queue')}
              >
                <Text style={[
                  styles.dayText,
                  isToday && styles.todayText,
                  dueCount > 0 && styles.hasReviewsText,
                ]}>
                  {day.getDate()}
                </Text>
                {dueCount > 0 && (
                  <View style={[styles.dueBadge, { backgroundColor: dueCount > 3 ? 'colors.error' : colors.primary }]}>
                    <Text style={styles.dueBadgeText}>{dueCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>À réviser</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>En retard</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.todayDot]} />
            <Text style={styles.legendText}>Aujourd'hui</Text>
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Résumé du mois</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>23</Text>
              <Text style={styles.statLabel}>Jours de streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>Verset révisés</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>94%</Text>
              <Text style={styles.statLabel}>Taux de rétention</Text>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
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
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surfaceTint,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
  },
  dayCell: {
    width: '13.33%',
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  todayCell: {
    backgroundColor: colors.surfaceTint,
    borderRadius: 12,
  },
  hasReviewsCell: {
    backgroundColor: colors.border,
    borderRadius: 12,
  },
  dayText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  todayText: {
    color: colors.primary,
    fontWeight: '700',
  },
  hasReviewsText: {
    color: colors.primary,
    fontWeight: '600',
  },
  dueBadge: {
    position: 'absolute',
    bottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dueBadgeText: {
    fontSize: 10,
    color: colors.surface,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  todayDot: {
    backgroundColor: colors.surfaceTint,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  legendText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  statsCard: {
    margin: 20,
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
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 24,
  },
});
