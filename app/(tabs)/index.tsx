/**
 * Home Tab — Main screen after onboarding
 * Features: Review reminders, Streak, Quick actions, Today's verse, Family badge
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
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamilyStore } from '@/store/family-store';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, sp, sh, rad } = useAppTheme();
  const { activeProfile } = useActiveProfile();
  const { families, activeFamilyId } = useFamilyStore();
  const [todayVerse, setTodayVerse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(7);
  const [reviewsDue, setReviewsDue] = useState(5);

  const activeFamily = families.find(f => f.id === activeFamilyId) || null;

  useEffect(() => {
    const loadData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setTodayVerse({
          bookName: 'Psaumes',
          chapter: 23,
          verse: 1,
          text: "L'Éternel est mon berger: je ne manquerai de rien.",
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
            {/* Family badge */}
            {activeFamily && (
              <View style={[styles.familyBadge, { backgroundColor: activeFamily.color + '20', marginTop: sp.sm }]}>
                <Ionicons name={activeFamily.icon as any} size={14} color={activeFamily.color} />
                <Text style={[styles.familyBadgeText, { color: activeFamily.color }]}>{activeFamily.name}</Text>
              </View>
            )}
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
            { icon: 'text', label: 'Passage', desc: 'Multi-versets', color: colors.info, bg: colors.iconBgBlue, action: () => router.push('/bible/chapter') },
            { icon: 'sync', label: 'Réviser', desc: 'FSRS', color: colors.success, bg: colors.iconBgGreen, action: () => router.push('/review/queue') },
            { icon: 'analytics', label: 'Progression', desc: 'Statistiques', color: colors.primary, bg: colors.iconBgRose, action: () => router.push('/analytics/dashboard') },
            { icon: 'people', label: 'Famille', desc: 'Partager', color: colors.warning, bg: colors.iconBgOrange, action: () => router.push('/family/home') },
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

        {/* Today's verse - enhanced card */}
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
            <View style={styles.verseActions}>
              <TouchableOpacity
                style={[styles.memorizeButton, { backgroundColor: colors.primary }]}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push('/memorization/session');
                }}
              >
                <Text style={styles.memorizeButtonText}>Mémoriser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.passageButton, { backgroundColor: colors.surfaceTint, marginLeft: sp.sm }]}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push('/bible/chapter');
                }}
              >
                <Ionicons name="text" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.verseReference, { color: colors.textPrimary }]}>
            {todayVerse.bookName} {todayVerse.chapter}:{todayVerse.verse}
          </Text>
          <Text style={[styles.verseText, { color: colors.textSecondary }]} numberOfLines={3}>
            {todayVerse.text}
          </Text>
          {/* Verse progress indicator */}
          <View style={styles.verseProgress}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '60%' }]} />
            <Text style={[styles.progressText, { color: colors.textMuted, marginLeft: sp.sm }]}>60% mémorisé</Text>
          </View>
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
            { ref: 'Psaume 23:1', text: "L'Éternel est mon berger...", status: 'mastered' },
            { ref: 'Jean 3:16-18', text: 'Passage complet...', status: 'in-progress', isPassage: true },
            { ref: 'Romains 8:28', text: 'Nous savons d\'ailleurs que...', status: 'in-progress' },
            { ref: 'Philippiens 4:13', text: 'Je puis tout par celui...', status: 'new' },
          ].map((verse, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.recentVerseCard,
                { backgroundColor: colors.surface, borderRadius: rad.xl, ...sh.sm },
                verse.isPassage && styles.passageCard,
              ]}
              onPress={() => router.push('/bible/verse')}
            >
              <View style={styles.recentVerseHeader}>
                <View
                  style={[
                    styles.verseStatusDot,
                    { backgroundColor: verse.status === 'mastered' ? colors.success : verse.status === 'in-progress' ? colors.primary : colors.textMuted }
                  ]}
                />
                {verse.isPassage && (
                  <View style={[styles.passageTag, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="text" size={10} color={colors.primary} />
                    <Text style={[styles.passageTagText, { color: colors.primary }]}>Passage</Text>
                  </View>
                )}
              </View>
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
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  familyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileButton: {
    marginLeft: 12,
  },

  // Review reminder
  reviewReminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
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
    marginLeft: 16,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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
    marginRight: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    marginBottom: 16,
  },

  // Quick actions grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
    gap: 16,
  },
  quickActionCard: {
    width: '31%',
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickActionDesc: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },

  // Verse card
  verseCard: {
    marginBottom: 32,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  verseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memorizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  passageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memorizeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  verseReference: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  verseProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    flex: 1,
  },
  progressText: {
    fontSize: 12,
  },

  // Recent verses
  recentScroll: {
    marginBottom: 32,
  },
  recentVerseCard: {
    width: 160,
    padding: 16,
    marginRight: 16,
  },
  passageCard: {
    borderWidth: 1,
    borderColor: '#E91E8C',
  },
  recentVerseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  verseStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  passageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  passageTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  recentVerseRef: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  recentVerseText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
