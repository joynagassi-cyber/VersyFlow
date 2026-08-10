/**
 * Home Tab — Main screen after onboarding
 * Features: Review reminders, Streak, Quick actions, Today's verse
 * See docs/08-ui-screens.md §4
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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ReferenceSearchInput } from '@/components/bible/ReferenceSearchInput';
import { useAppTheme } from '@/theme/useTheme';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, sp, sh, rad } = useAppTheme();
  const [todayVerse, setTodayVerse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(7);
  const [reviewsDue, setReviewsDue] = useState(5);

  useEffect(() => {
    const loadData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setTodayVerse({
          bookName: 'Psaumes',
          chapter: 23,
          verse: 1,
          text: 'L\'Éternel est mon berger: je ne manquerai de rien.',
        });
        setStreak(Math.floor(Math.random() * 14) + 1);
        setReviewsDue(Math.floor(Math.random() * 10));
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with greeting */}
        <View style={[styles.header, { paddingHorizontal: sp.lg, paddingTop: sp.md, paddingBottom: sp.sm }]}>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greeting, { color: colors.textPrimary }]}>Bonjour 👋</Text>
            <Text style={[styles.date, { color: colors.textMuted, marginTop: sp.sm }]}>
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Ionicons name="person-circle" size={40} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={{ paddingHorizontal: sp.lg, marginBottom: sp.md }}>
          <ReferenceSearchInput
            placeholder="Jean 3:16, Psaume 23..."
            onSearch={(ref) => console.log('[Search]', ref)}
          />
        </View>

        {/* Review reminder card (only if reviews due) */}
        {reviewsDue > 0 && (
          <TouchableOpacity
            style={[
              styles.reviewReminderCard,
              { backgroundColor: colors.primary, ...sh.lg },
            ]}
            onPress={() => router.push('/review/queue')}
            activeOpacity={0.9}
          >
            <View style={[styles.reviewIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="time" size={24} color={colors.surface} />
            </View>
            <View style={styles.reviewContent}>
              <Text style={styles.reviewTitle}>
                {reviewsDue} verset{reviewsDue > 1 ? 's' : ''} à réviser
              </Text>
              <Text style={styles.reviewSubtitle}>
                Ne perdez pas votre progression — révisez maintenant
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.surface} />
          </TouchableOpacity>
        )}

        {/* Streak badge */}
        <View
          style={[
            styles.streakCard,
            {
              backgroundColor: colors.surface,
              marginHorizontal: sp.lg,
              marginBottom: sp.xl,
              borderRadius: rad['2xl'],
              padding: sp.lg,
              ...sh.md,
            },
          ]}
        >
          <View style={styles.streakLeft}>
            <View style={[styles.flameContainer, { backgroundColor: colors.surfaceTint }]}>
              <Ionicons
                name="flame"
                size={32}
                color={streak >= 7 ? colors.primary : colors.error}
              />
            </View>
            <View>
              <Text style={[styles.streakCount, { color: colors.primary }]}>{streak}</Text>
              <Text style={[styles.streakLabel, { color: colors.textTertiary }]}>
                {streak === 1 ? 'jour de suite' : 'jours de suite'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.streakButton, { backgroundColor: colors.surfaceTint }]}
            onPress={() => router.push('/progress')}
          >
            <Text style={[styles.streakButtonText, { color: colors.primary }]}>
              Voir détails
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick actions grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, paddingHorizontal: sp.lg }]}>
          Actions rapides
        </Text>
        <View style={[styles.quickActionsGrid, { paddingHorizontal: sp.lg }]}>
          {[
            { icon: 'book', label: 'Explorer', desc: 'La Bible', color: colors.primary, bg: colors.iconBgRose, action: () => router.push('/bible/explorer') },
            { icon: 'learn', label: 'Mémoriser', desc: 'Nouveau verset', color: colors.textSecondary, bg: colors.iconBgPurple, action: () => router.push('/memorization/session') },
            { icon: 'sync', label: 'Réviser', desc: 'FSRS', color: colors.success, bg: colors.iconBgGreen, action: () => router.push('/review/queue') },
            { icon: 'analytics', label: 'Progression', desc: 'Statistiques', color: colors.info, bg: colors.iconBgBlue, action: () => router.push('/analytics/dashboard') },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.quickActionCard,
                { backgroundColor: colors.surface, borderRadius: rad['2xl'], ...sh.sm },
              ]}
              onPress={item.action}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              <Text style={[styles.quickActionDesc, { color: colors.textMuted }]}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's verse */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, paddingHorizontal: sp.lg }]}>
          Verset du jour
        </Text>
        <TouchableOpacity
          style={[
            styles.verseCard,
            {
              backgroundColor: colors.surface,
              marginHorizontal: sp.lg,
              marginBottom: sp.xl,
              borderRadius: rad['2xl'],
              padding: sp.lg,
              ...sh.md,
            },
          ]}
          onPress={() => router.push('/bible/verse')}
          activeOpacity={0.9}
        >
          <View style={styles.verseHeader}>
            <View style={[styles.verseBadge, { backgroundColor: colors.surfaceTint }]}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={[styles.verseBadgeText, { color: colors.primary }]}>Aujourd'hui</Text>
            </View>
            <TouchableOpacity
              style={[styles.memorizeButton, { backgroundColor: colors.primary }]}
              onPress={(e) => {
                e.stopPropagation();
                router.push('/memorization/session');
              }}
            >
              <Text style={styles.memorizeButtonText}>Mémoriser</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.verseReference, { color: colors.textPrimary }]}>
            {todayVerse.bookName} {todayVerse.chapter}:{todayVerse.verse}
          </Text>
          <Text style={[styles.verseText, { color: colors.textSecondary }]} numberOfLines={3}>
            {todayVerse.text}
          </Text>
        </TouchableOpacity>

        {/* Recent verses */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, paddingHorizontal: sp.lg }]}>
          Récemment mémorisés
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recentScroll}
          contentContainerStyle={{ paddingHorizontal: sp.lg }}
        >
          {[
            { ref: 'Jean 3:16', text: 'Car Dieu a tant aimé le monde...', status: 'mastered' },
            { ref: 'Psaume 23:1', text: 'L\'Éternel est mon berger...', status: 'mastered' },
            { ref: 'Romains 8:28', text: 'Nous savons d\'ailleurs que...', status: 'in-progress' },
            { ref: 'Philippiens 4:13', text: 'Je puis tout par celui...', status: 'new' },
          ].map((verse, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.recentVerseCard,
                { backgroundColor: colors.surface, borderRadius: rad.xl, ...sh.sm },
              ]}
              onPress={() => router.push('/bible/verse')}
            >
              <View
                style={[
                  styles.verseStatusDot,
                  { backgroundColor: verse.status === 'mastered' ? colors.success : verse.status === 'in-progress' ? colors.primary : colors.textMuted }
                ]}
              />
              <Text style={[styles.recentVerseRef, { color: colors.textPrimary }]}>{verse.ref}</Text>
              <Text style={[styles.recentVerseText, { color: colors.textSecondary }]} numberOfLines={2}>{verse.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Spacer */}
        <View style={{ height: sp.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  profileButton: {
    marginLeft: 12,
  },

  // Review reminder
  reviewReminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: sp.lg,
    marginHorizontal: sp.lg,
    marginBottom: sp.md,
  },
  reviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewContent: {
    flex: 1,
    marginLeft: sp.md,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  reviewSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },

  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flameContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: sp.md,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  streakLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  streakButton: {
    paddingHorizontal: sp.lg,
    paddingVertical: sp.sm,
    borderRadius: 20,
  },
  streakButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Section titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: sp.md,
  },

  // Quick actions grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: sp.xl,
    gap: sp.md,
  },
  quickActionCard: {
    width: '48%',
    padding: sp.lg,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp.sm,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickActionDesc: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },

  // Verse card
  verseCard: {
    marginBottom: sp.xl,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sp.sm,
  },
  verseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp.md,
    paddingVertical: sp.sm,
    borderRadius: 20,
    gap: 6,
  },
  verseBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memorizeButton: {
    paddingHorizontal: sp.lg,
    paddingVertical: sp.sm,
    borderRadius: 20,
  },
  memorizeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.surface,
  },
  verseReference: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: sp.sm,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
  },

  // Recent verses
  recentScroll: {
    marginBottom: sp.xl,
  },
  recentVerseCard: {
    width: 200,
    padding: sp.md,
    marginRight: sp.md,
  },
  verseStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: sp.sm,
  },
  recentVerseRef: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: sp.sm,
  },
  recentVerseText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
