/**
 * Achievement Screen — Badges and accomplishments
 */

import { useState } from 'react';
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

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  requirement: string;
  category: 'memorization' | 'review' | 'streak' | 'collection' | 'special';
}

const ACHIEVEMENTS: Achievement[] = [
  // Memorization
  {
    id: 'first_verse',
    title: 'Premier pas',
    description: 'Mémorisez votre premier verset',
    icon: 'book',
    color: colors.primary,
    unlocked: true,
    unlockedAt: 'Il y a 15 jours',
    progress: 100,
    requirement: '1 verset',
    category: 'memorization',
  },
  {
    id: 'ten_verses',
    title: 'Collectionneur',
    description: 'Mémorisez 10 versets',
    icon: 'bookmarks',
    color: colors.info,
    unlocked: true,
    unlockedAt: 'Il y a 7 jours',
    progress: 100,
    requirement: '10 versets',
    category: 'memorization',
  },
  {
    id: 'fifty_verses',
    title: 'Érudit',
    description: 'Mémorisez 50 versets',
    icon: 'school',
    color: colors.warning,
    unlocked: false,
    progress: 89,
    requirement: '50 versets',
    category: 'memorization',
  },
  {
    id: 'hundred_verses',
    title: 'Maître bibliste',
    description: 'Mémorisez 100 versets',
    icon: 'trophy',
    color: colors.success,
    unlocked: false,
    progress: 89,
    requirement: '100 versets',
    category: 'memorization',
  },
  // Streak
  {
    id: 'streak_7',
    title: 'Hébdomadaire',
    description: '7 jours de suite',
    icon: 'flame',
    color: colors.error,
    unlocked: true,
    unlockedAt: 'Aujourd\'hui',
    progress: 100,
    requirement: '7 jours',
    category: 'streak',
  },
  {
    id: 'streak_30',
    title: 'Mensuel',
    description: '30 jours de suite',
    icon: 'fire',
    color: colors.warning,
    unlocked: false,
    progress: 23,
    requirement: '30 jours',
    category: 'streak',
  },
  {
    id: 'streak_100',
    title: 'Dédié',
    description: '100 jours de suite',
    icon: 'star',
    color: colors.primary,
    unlocked: false,
    progress: 7,
    requirement: '100 jours',
    category: 'streak',
  },
  // Review
  {
    id: 'first_review',
    title: 'Révisionné',
    description: 'Révisez votre premier verset',
    icon: 'refresh',
    color: '#7B1FA2',
    unlocked: true,
    unlockedAt: 'Il y a 20 jours',
    progress: 100,
    requirement: '1 révision',
    category: 'review',
  },
  {
    id: 'fifty_reviews',
    title: 'Assidu',
    description: '50 révisions complétées',
    icon: 'checkmark-done',
    color: colors.success,
    unlocked: false,
    progress: 67,
    requirement: '50 révisions',
    category: 'review',
  },
  {
    id: 'hundred_reviews',
    title: 'Perseérant',
    description: '100 révisions complétées',
    icon: 'star',
    color: colors.primary,
    unlocked: false,
    progress: 45,
    requirement: '100 révisions',
    category: 'review',
  },
  // Collection
  {
    id: 'first_collection',
    title: 'Organisateur',
    description: 'Créez votre première collection',
    icon: 'folder',
    color: colors.info,
    unlocked: true,
    unlockedAt: 'Il y a 10 jours',
    progress: 100,
    requirement: '1 collection',
    category: 'collection',
  },
  {
    id: 'five_collections',
    title: 'Archiviste',
    description: 'Créez 5 collections',
    icon: 'folders',
    color: '#3F51B5',
    unlocked: false,
    progress: 40,
    requirement: '5 collections',
    category: 'collection',
  },
  // Special
  {
    id: 'patriarch',
    title: 'Patriarche',
    description: 'Maîtrisez tous les Psaumes',
    icon: 'medal',
    color: '#FFD700',
    unlocked: false,
    progress: 12,
    requirement: '150 versets Psaumes',
    category: 'special',
  },
  {
    id: 'gospel',
    title: 'Évangéliste',
    description: 'Maîtrisez tous les Évangiles',
    icon: 'globe',
    color: colors.primary,
    unlocked: false,
    progress: 25,
    requirement: '91 versets Évangiles',
    category: 'special',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Tous', count: ACHIEVEMENTS.length },
  { id: 'memorization', label: 'Mémorisation', count: ACHIEVEMENTS.filter(a => a.category === 'memorization').length },
  { id: 'streak', label: 'Streak', count: ACHIEVEMENTS.filter(a => a.category === 'streak').length },
  { id: 'review', label: 'Révisions', count: ACHIEVEMENTS.filter(a => a.category === 'review').length },
  { id: 'collection', label: 'Collections', count: ACHIEVEMENTS.filter(a => a.category === 'collection').length },
  { id: 'special', label: 'Spécial', count: ACHIEVEMENTS.filter(a => a.category === 'special').length },
];

export default function AchievementScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;
  const totalCount = ACHIEVEMENTS.length;
  const overallProgress = (unlockedCount / totalCount) * 100;

  const filteredAchievements = selectedCategory === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const displayedAchievements = showAll ? filteredAchievements : filteredAchievements.slice(0, 6);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Succès & Badges</Text>
          <View style={styles.headerRight}>
            <View style={styles.badgeCount}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.badgeCountText}>{unlockedCount}/{totalCount}</Text>
            </View>
          </View>
        </View>

        {/* Overall Progress */}
        <View style={styles.overallProgress}>
          <View style={styles.overallHeader}>
            <Text style={styles.overallTitle}>Progression globale</Text>
            <Text style={styles.overallPercent}>{Math.round(overallProgress)}%</Text>
          </View>
          <View style={styles.overallBar}>
            <View style={[styles.overallFill, { width: `${overallProgress}%` }]} />
          </View>
          <Text style={styles.overallInfo}>
            {unlockedCount} succès débloqués sur {totalCount}
          </Text>
        </View>

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.filterButton, selectedCategory === category.id && styles.filterButtonActive]}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setShowAll(false);
                }}
              >
                <Text style={[styles.filterText, selectedCategory === category.id && styles.filterTextActive]}>
                  {category.label}
                </Text>
                <View style={[styles.filterCount, selectedCategory === category.id && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, selectedCategory === category.id && styles.filterCountTextActive]}>
                    {category.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Achievements Grid */}
        <View style={styles.achievementsSection}>
          {displayedAchievements.map((achievement) => (
            <TouchableOpacity
              key={achievement.id}
              style={styles.achievementCard}
              onPress={() => router.push(`/achievements/${achievement.id}`)}
            >
              <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
                <Ionicons
                  name={achievement.unlocked ? achievement.icon : 'lock-closed'}
                  size={28}
                  color={achievement.unlocked ? achievement.color : colors.textMuted}
                />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementTitle, achievement.unlocked && { color: achievement.color }]}>
                  {achievement.title}
                </Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
                <View style={styles.achievementProgress}>
                  <View style={styles.achievementBar}>
                    <View
                      style={[
                        styles.achievementFill,
                        { width: `${achievement.progress}%`, backgroundColor: achievement.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.achievementProgressText}>
                    {achievement.progress >= 100 ? '✓ Complété' : `${achievement.progress}%`}
                  </Text>
                </View>
              </View>
              {achievement.unlocked && (
                <View style={[styles.unlockedBadge, { backgroundColor: achievement.color }]}>
                  <Ionicons name="checkmark" size={14} color={colors.surface} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Show More */}
        {filteredAchievements.length > 6 && !showAll && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAll(true)}
          >
            <Text style={styles.showMoreText}>Voir tous les succès ({filteredAchievements.length})</Text>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Comment débloquer des succès</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.tipText}>Mémorisez des versets régulièrement</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.tipText}>Maintenez votre streak quotidien</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.tipText}>Créez des collections thématiques</Text>
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
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  badgeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Overall Progress
  overallProgress: {
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
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overallTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  overallPercent: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  overallBar: {
    height: 10,
    backgroundColor: colors.surfaceTint,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  overallFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  overallInfo: {
    fontSize: 13,
    color: colors.textMuted,
  },

  // Filter
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.surface,
  },
  filterCount: {
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterCountText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  filterCountTextActive: {
    color: colors.surface,
  },

  // Achievements
  achievementsSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceTint,
    borderRadius: 3,
    overflow: 'hidden',
  },
  achievementFill: {
    height: '100%',
    borderRadius: 3,
  },
  achievementProgressText: {
    fontSize: 11,
    color: colors.textMuted,
    minWidth: 60,
  },
  unlockedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Show More
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  showMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  // Tips
  tipsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceTint,
  },
  tipItemLast: {
    borderBottomWidth: 0,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 24,
  },
});
