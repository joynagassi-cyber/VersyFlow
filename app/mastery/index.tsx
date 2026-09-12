/**
 * Mastery Screen — Verse mastery levels and progress
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { shadowCss } from '@/theme/tokens';
import { useRouter } from '@/hooks/useIonicNavigation';
import { IonIcon } from '@/components/ui/Primitives';
import {
  trophy,
  analytics,
  book,
  checkmarkCircle,
  flame,
  lockClosed,
  time,
  leaf,
  school,
} from 'ionicons/icons';

interface MasteryLevel {
  id: string;
  name: string;
  description: string;
  icon: 'leaf' | 'book' | 'brain' | 'school' | 'trophy';
  color: string;
  requiredStability: number;
  verses: number;
  percentage: number;
}

const LEVEL_ICON_MAP: Record<MasteryLevel['icon'], unknown> = {
  leaf,
  book,
  brain: leaf,
  school,
  trophy,
};

const MASTERY_LEVELS: MasteryLevel[] = [
  {
    id: 'novice',
    name: 'Novice',
    description: 'Premiers pas dans la mémorisation',
    icon: 'leaf',
    color: '#A0A0A0',
    requiredStability: 0,
    verses: 47,
    percentage: 47,
  },
  {
    id: 'learner',
    name: 'Apprenti',
    description: 'Débutant avec des bases solides',
    icon: 'book',
    color: '#007AFF',
    requiredStability: 2,
    verses: 23,
    percentage: 23,
  },
  {
    id: 'memorizer',
    name: 'Mémorisateur',
    description: 'Maîtrise régulière des versets',
    icon: 'leaf',
    color: '#E91E8C',
    requiredStability: 5,
    verses: 12,
    percentage: 12,
  },
  {
    id: 'scholar',
    name: 'Érudit',
    description: 'Profonde connaissance des Écritures',
    icon: 'school',
    color: '#FF9500',
    requiredStability: 10,
    verses: 5,
    percentage: 5,
  },
  {
    id: 'master',
    name: 'Maître',
    description: 'Maîtrise exceptionnelle',
    icon: 'trophy',
    color: '#008733',
    requiredStability: 20,
    verses: 2,
    percentage: 2,
  },
];

const VERSE_STATISTICS = {
  totalMemorized: 89,
  inProgress: 15,
  dueForReview: 8,
  mastered: 66,
  averageStability: 4.2,
  currentStreak: 7,
  totalSessions: 156,
};

export default function MasteryScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
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

        // Level Header
        levelHeader: {
          alignItems: 'center',
          padding: 24,
          backgroundColor: colors.surface,
          marginBottom: 16,
        },
        levelIcon: {
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        },
        levelName: {
          fontSize: 28,
          fontWeight: '800',
          color: colors.textPrimary,
          marginBottom: 8,
        },
        levelDesc: {
          fontSize: 14,
          color: colors.textTertiary,
          textAlign: 'center',
        },

        // Progress Section
        progressSection: {
          marginHorizontal: 20,
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          ...shadowCss('sm'),
        },
        progressHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        },
        progressTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.textPrimary,
        },
        progressPercent: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.primary,
        },
        progressBar: {
          height: 8,
          backgroundColor: colors.surfaceTint,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 8,
        },
        progressFill: {
          height: '100%',
          backgroundColor: colors.primary,
          borderRadius: 4,
        },
        progressInfo: {
          fontSize: 13,
          color: colors.textMuted,
        },

        // Stats Section
        statsSection: {
          paddingHorizontal: 20,
          marginBottom: 16,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: 12,
        },
        statsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
        },
        statCard: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
          ...shadowCss('sm'),
        },
        statCardLarge: {
          width: '100%',
          flexDirection: 'row',
          gap: 16,
        },
        statCardMedium: {
          width: '48%',
        },
        statValue: {
          fontSize: 28,
          fontWeight: '800',
          color: colors.textPrimary,
          marginTop: 8,
        },
        statLabel: {
          fontSize: 12,
          color: colors.textTertiary,
          marginTop: 4,
          textAlign: 'center',
        },

        // Levels Section
        levelsSection: {
          paddingHorizontal: 20,
          marginBottom: 16,
        },
        levelCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          gap: 16,
          ...shadowCss('sm'),
        },
        levelCardSelected: {
          borderWidth: 2,
          borderColor: colors.primary,
        },
        levelCardLocked: {
          opacity: 0.6,
        },
        levelCardIcon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
        levelCardInfo: {
          flex: 1,
        },
        levelCardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        },
        levelCardName: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        lockedBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.surfaceElevated,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        },
        lockedText: {
          fontSize: 11,
          color: colors.textMuted,
        },
        levelCardDesc: {
          fontSize: 13,
          color: colors.textTertiary,
          marginBottom: 8,
        },
        levelCardProgress: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        levelProgressBar: {
          flex: 1,
          height: 6,
          backgroundColor: colors.surfaceTint,
          borderRadius: 3,
          overflow: 'hidden',
        },
        levelProgressFill: {
          height: '100%',
          borderRadius: 3,
        },
        levelCardVerses: {
          fontSize: 12,
          color: colors.textMuted,
          minWidth: 50,
        },

        // Tips Section
        tipsSection: {
          paddingHorizontal: 20,
          marginBottom: 24,
        },
        tipsCard: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          ...shadowCss('sm'),
        },
        tipItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
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
          lineHeight: 20,
        },

        // Bottom spacer
        bottomSpacer: {
          height: 24,
        },
      }),
    [colors],
  );
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string>('novice');

  const currentLevel = MASTERY_LEVELS.find((l) => l.verses >= 47) || MASTERY_LEVELS[0];
  const nextLevel = MASTERY_LEVELS.find((l) => l.verses < 47);
  const progressToNext = nextLevel
    ? ((89 - nextLevel.verses) / (currentLevel.verses - nextLevel.verses)) * 100
    : 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Header */}
        <View style={styles.levelHeader}>
          <View style={[styles.levelIcon, { backgroundColor: currentLevel.color + '20' }]}>
            <IonIcon icon={LEVEL_ICON_MAP[currentLevel.icon] as any} size={40} color={currentLevel.color} />
          </View>
          <Text style={styles.levelName}>{currentLevel.name}</Text>
          <Text style={styles.levelDesc}>{currentLevel.description}</Text>
        </View>

        {/* Progress to Next Level */}
        {nextLevel && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Prochain niveau : {nextLevel.name}</Text>
              <Text style={styles.progressPercent}>{Math.round(progressToNext)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressToNext}%` }]} />
            </View>
            <Text style={styles.progressInfo}>
              Il vous manque {Math.max(0, nextLevel.verses - 89).toFixed(0)} versets pour
              atteindre {nextLevel.name}
            </Text>
          </View>
        )}

        {/* Statistics Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardLarge]}>
              <IonIcon icon={book} size={24} color={colors.primary} />
              <Text style={styles.statValue}>{VERSE_STATISTICS.totalMemorized}</Text>
              <Text style={styles.statLabel}>Versets mémorisés</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMedium]}>
              <IonIcon icon={flame} size={24} color={colors.error} />
              <Text style={styles.statValue}>{VERSE_STATISTICS.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak (jours)</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMedium]}>
              <IonIcon icon={analytics} size={24} color={colors.info} />
              <Text style={styles.statValue}>
                {VERSE_STATISTICS.averageStability.toFixed(1)}j
              </Text>
              <Text style={styles.statLabel}>Stabilité moy.</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMedium]}>
              <IonIcon icon={time} size={24} color={colors.warning} />
              <Text style={styles.statValue}>{VERSE_STATISTICS.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions total</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMedium]}>
              <IonIcon icon={checkmarkCircle} size={24} color={colors.success} />
              <Text style={styles.statValue}>{VERSE_STATISTICS.mastered}</Text>
              <Text style={styles.statLabel}>Maîtrisés</Text>
            </View>
          </View>
        </View>

        {/* Mastery Levels List */}
        <View style={styles.levelsSection}>
          <Text style={styles.sectionTitle}>Niveaux de maîtrise</Text>
          {MASTERY_LEVELS.map((level) => {
            const isUnlocked = VERSE_STATISTICS.totalMemorized >= level.verses;
            const isCurrent = selectedLevel === level.id;

            return (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelCard,
                  isCurrent && styles.levelCardSelected,
                  !isUnlocked && styles.levelCardLocked,
                ]}
                onPress={() => isUnlocked && setSelectedLevel(level.id)}
              >
                <View style={[styles.levelCardIcon, { backgroundColor: level.color + '20' }]}>
                  <IonIcon
                    icon={isUnlocked ? (LEVEL_ICON_MAP[level.icon] as any) : lockClosed}
                    size={24}
                    color={isUnlocked ? level.color : colors.textMuted}
                  />
                </View>
                <View style={styles.levelCardInfo}>
                  <View style={styles.levelCardHeader}>
                    <Text style={[styles.levelCardName, isUnlocked && { color: level.color }]}>
                      {level.name}
                    </Text>
                    {!isUnlocked && (
                      <View style={styles.lockedBadge}>
                        <IonIcon icon={lockClosed} size={14} color={colors.textMuted} />
                        <Text style={styles.lockedText}>Verrouillé</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.levelCardDesc}>{level.description}</Text>
                  <View style={styles.levelCardProgress}>
                    <View style={styles.levelProgressBar}>
                      <View
                        style={[
                          styles.levelProgressFill,
                          {
                            width: `${Math.min(100, (VERSE_STATISTICS.totalMemorized / level.verses) * 100)}%`,
                            backgroundColor: level.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.levelCardVerses}>
                      {Math.min(VERSE_STATISTICS.totalMemorized, level.verses)}/{level.verses}
                    </Text>
                  </View>
                </View>
                {isUnlocked && (
                  <IonIcon icon={checkmarkCircle} size={20} color={level.color} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mastery Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Conseils pour progresser</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <IonIcon icon={checkmarkCircle} size={20} color={colors.success} />
              <Text style={styles.tipText}>Révisez régulièrement pour maintenir votre streak</Text>
            </View>
            <View style={styles.tipItem}>
              <IonIcon icon={checkmarkCircle} size={20} color={colors.success} />
              <Text style={styles.tipText}>Mémorisez 1-2 versets par jour pour progresser</Text>
            </View>
            <View style={styles.tipItem}>
              <IonIcon icon={checkmarkCircle} size={20} color={colors.success} />
              <Text style={styles.tipText}>Utilisez différentes stratégies de mémorisation</Text>
            </View>
            <View style={styles.tipItem}>
              <IonIcon icon={checkmarkCircle} size={20} color={colors.success} />
              <Text style={styles.tipText}>Revoyez les versets avant de les oublier</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}
