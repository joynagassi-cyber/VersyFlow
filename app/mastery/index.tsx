import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Leaf,
  BookOpen,
  Brain,
  GraduationCap,
  Trophy,
  Lock,
  Flame,
  BarChart3,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { StreakService } from '@/services/streak-service';

type LvlIcon = 'leaf' | 'book' | 'brain' | 'school' | 'trophy';
const ICON_MAP: Record<LvlIcon, typeof Leaf> = {
  leaf: Leaf,
  book: BookOpen,
  brain: Brain,
  school: GraduationCap,
  trophy: Trophy,
};

interface MasteryLevel {
  id: string;
  name: string;
  description: string;
  icon: LvlIcon;
  color: string;
  requiredStability: number;
}
interface LiveStats {
  totalMemorized: number;
  inProgress: number;
  dueForReview: number;
  mastered: number;
  averageStability: number;
  currentStreak: number;
  totalReviews: number;
}

// Level accent colors map to semantic design tokens (defined in
// src/styles/globals.css) so mastery levels adapt to light/dark themes.
const MASTERY_LEVELS: MasteryLevel[] = [
  { id: 'novice', name: 'Novice', description: 'Premiers pas dans la memorisation', icon: 'leaf', color: 'var(--color-text-muted)', requiredStability: 0 },
  { id: 'learner', name: 'Apprenti', description: 'Debutant avec des bases solides', icon: 'book', color: 'var(--color-info)', requiredStability: 2 },
  { id: 'memorizer', name: 'Memorisateur', description: 'Maitrise reguliere des versets', icon: 'leaf', color: 'var(--color-primary)', requiredStability: 5 },
  { id: 'scholar', name: 'Erudit', description: 'Profonde connaissance des Ecritures', icon: 'school', color: 'var(--color-warning)', requiredStability: 10 },
  { id: 'master', name: "Maitre", description: 'Maitrise exceptionnelle', icon: 'trophy', color: 'var(--color-success)', requiredStability: 20 },
];

/** 12% translucent tint of a token color, for soft circular backgrounds. */
const levelTint = (color: string) => `color-mix(in srgb, ${color} 12%, transparent)`;

export default function MasteryScreen() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<LiveStats>({
    totalMemorized: 0,
    inProgress: 0,
    dueForReview: 0,
    mastered: 0,
    averageStability: 0,
    currentStreak: 0,
    totalReviews: 0,
  });
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const [records, streak] = await Promise.all([
          service.getAllMemorized(),
          new StreakService(service, profileId).calculateStreak(),
        ]);
        if (cancelled) return;
        const mastered = records.filter((r) => r.status === 'mastered').length;
        const due = records.filter((r) => r.nextReviewAt && r.nextReviewAt <= Date.now()).length;
        const avgStability = records.length
          ? records.reduce((s, r) => s + (r.fsrsState?.stability ?? 0), 0) / records.length
          : 0;
        const totalReviews = records.reduce((s, r) => s + (r.reviewCount ?? 0), 0);
        setStats({
          totalMemorized: records.length,
          inProgress: records.length - mastered,
          dueForReview: due,
          mastered,
          averageStability: avgStability,
          currentStreak: streak,
          totalReviews,
        });
        const counts: Record<string, number> = {};
        for (const level of MASTERY_LEVELS) {
          counts[level.id] =
            level.requiredStability <= 0
              ? records.length
              : records.filter((r) => (r.fsrsState?.stability ?? 0) >= level.requiredStability).length;
        }
        setLevelCounts(counts);
      } catch (e) {
        console.error('[Mastery] data load failed:', e);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  let currentIndex = 0;
  MASTERY_LEVELS.forEach((level, i) => {
    if ((levelCounts[level.id] ?? 0) > 0) currentIndex = i;
  });
  const currentLevel = MASTERY_LEVELS[currentIndex];
  const nextLevel = MASTERY_LEVELS[currentIndex + 1] ?? null;
  const progressToNext = nextLevel
    ? Math.max(0, Math.min(100, (stats.averageStability / nextLevel.requiredStability) * 100))
    : 100;
  const CurrentIcon = ICON_MAP[currentLevel.icon];

  const statCards = [
    { icon: BookOpen, color: 'var(--color-primary)', value: String(stats.totalMemorized), label: t('mastery.memorized', 'Versets memorises') },
    { icon: Flame, color: 'var(--color-error)', value: String(stats.currentStreak), label: t('mastery.streak', 'Streak') },
    { icon: BarChart3, color: 'var(--color-info)', value: stats.averageStability.toFixed(1) + 'j', label: t('mastery.avgStability', 'Stabilite moy.') },
    { icon: Clock, color: 'var(--color-warning)', value: String(stats.totalReviews), label: t('mastery.reviews', 'Revisions') },
    { icon: CheckCircle2, color: 'var(--color-success)', value: String(stats.mastered), label: t('mastery.mastered', 'Maitrises') },
  ];

  return (
    <FullScreenPage title={t('nav.mastery', 'Maitrise')} showBack>
      <div className="mx-auto max-w-md space-y-6">
        {/* Level hero */}
        <div className="gradient-hero glow-primary rounded-3xl p-6 text-center text-white">
          <span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <CurrentIcon size={40} />
          </span>
          <p className="text-2xl font-extrabold">{currentLevel.name}</p>
          <p className="mt-1 text-sm opacity-90">{currentLevel.description}</p>
        </div>

        {/* Progress to next */}
        {nextLevel && (
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">
                {t('mastery.nextLevel', 'Prochain niveau')} : {nextLevel.name}
              </p>
              <p className="text-sm font-bold text-primary">{Math.round(progressToNext)}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-tint">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: progressToNext + '%' }}
              />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {t('mastery.stabilityRequired', 'Stabilite moyenne requise')}: {nextLevel.requiredStability}j - {stats.averageStability.toFixed(1)}j
            </p>
          </div>
        )}

        {/* Stats */}
        <div>
          <h2 className="mb-3 text-base font-bold text-text-primary">
            {t('mastery.stats', 'Statistiques')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((c, i) => (
              <div
                key={i}
                className={
                  'rounded-2xl bg-surface p-4 shadow-sm ' +
                  (i === 0 ? 'col-span-2 flex items-center gap-4' : 'text-center')
                }
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ color: c.color, backgroundColor: 'transparent' }}
                >
                  <c.icon size={22} />
                </span>
                <div className={i === 0 ? '' : 'mt-1'}>
                  <p className="text-2xl font-extrabold text-text-primary">{c.value}</p>
                  <p className="text-xs text-text-muted">{c.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Levels */}
        <div>
          <h2 className="mb-3 text-base font-bold text-text-primary">
            {t('mastery.levels', 'Niveaux de maitrise')}
          </h2>
          <div className="space-y-3">
            {MASTERY_LEVELS.map((level) => {
              const isUnlocked = (levelCounts[level.id] ?? 0) > 0;
              const Icon = isUnlocked ? ICON_MAP[level.icon] : Lock;
              const pct = Math.min(
                100,
                ((levelCounts[level.id] ?? 0) / Math.max(1, stats.totalMemorized)) * 100,
              );
              return (
                <div
                  key={level.id}
                  className={
                    'flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm ' +
                    (!isUnlocked ? 'opacity-60' : '')
                  }
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                    style={{
                      color: isUnlocked ? level.color : 'var(--color-text-muted)',
                      backgroundColor: levelTint(level.color),
                    }}
                  >
                    <Icon size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-base font-bold"
                      style={{ color: isUnlocked ? level.color : 'var(--color-text-primary)' }}
                    >
                      {level.name}
                    </p>
                    <p className="text-xs text-text-muted">{level.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-tint">
                        <div
                          className="h-full rounded-full"
                          style={{ width: pct + '%', backgroundColor: level.color }}
                        />
                      </div>
                      <span className="text-xs text-text-muted">
                        {levelCounts[level.id] ?? 0}/{stats.totalMemorized}
                      </span>
                    </div>
                  </div>
                  {isUnlocked && (
                    <CheckCircle2 size={20} style={{ color: level.color }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 className="mb-2 text-base font-bold text-text-primary">
            {t('mastery.tips', 'Conseils pour progresser')}
          </h2>
          <div className="space-y-2">
            {[
              t('mastery.tip1', "Revisez regulierement pour maintenir votre streak"),
              t('mastery.tip2', 'Memorisez 1-2 versets par jour'),
              t('mastery.tip3', 'Utilisez diferentes strategies de memorisation'),
            ].map((tip, i) => (
              <p key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 size={16} className="text-success" />
                {tip}
              </p>
            ))}
          </div>
        </div>
      </div>
    </FullScreenPage>
  );
}
