import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  Leaf01Icon as Leaf,
  BookOpen01Icon as BookOpen,
  BrainIcon as Brain,
  GraduationCapIcon as GraduationCap,
  TrophyIcon as Trophy,
  LockIcon as Lock,
  FlameIcon as Flame,
  BarChartIcon as BarChart3,
  CheckmarkCircle02Icon as CheckCircle2,
  Clock01Icon as Clock,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { StreakService } from '@/services/streak-service';
import { colorTintAlpha } from '@/lib/platform';
import { StatsDashboard } from '@/components/charts/StatsDashboard';
import { ProgressSkeleton } from '@/components/ui/ScreenSkeletons';
import { EmptyState } from '@/components/ui/EmptyState';

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
const levelTint = (color: string) => colorTintAlpha(color, 12);

export default function MasteryScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  // Sans ces trois drapeaux, l'écran affichait « Novice » et cinq zéros entre
  // le montage et la réponse du service, puis gardait les zéros si la lecture
  // échouait. « Novice » n'est pas un chargement : c'est un verdict.
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setFailed(false);
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
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId, attempt]);

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
    <FullScreenPage title={t('nav.mastery', 'Maitrise')} showBack column="wide">
      <div className="screen-column space-y-6">
        {loading ? (
          <ProgressSkeleton label={t('mastery.loading', 'Chargement de votre maitrise…')} />
        ) : failed ? (
          <section className="g3 progress-message" role="alert">
            <h2>{t('mastery.unavailable', 'Maitrise indisponible')}</h2>
            <p>
              {t(
                'mastery.unavailableHint',
                'Votre progression n’a pas pu etre lue. Vos donnees sont intactes : reessayez.',
              )}
            </p>
            <button type="button" className="home-secondary" onClick={() => setAttempt((n) => n + 1)}>
              {t('common.retry', 'Reessayer')}
            </button>
          </section>
        ) : (
        <>
        {/* Level hero */}
        <div className="bg-primary rounded-3xl p-6 text-center text-on-primary">
          <span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface/20">
            <DuoIcon icon={CurrentIcon} size={32} />
          </span>
          <p className="stat-value text-2xl">{currentLevel.name}</p>
          <p className="mt-1 text-sm opacity-90">{currentLevel.description}</p>
        </div>

        {/* Progress to next */}
        {nextLevel && (
          <div className="g2 p-4">
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
            <p className="mt-2 text-xs text-text-muted tabular-nums">
              {t('mastery.stabilityRequired', 'Stabilite moyenne requise')}: {nextLevel.requiredStability}j - {stats.averageStability.toFixed(1)}j
            </p>
          </div>
        )}

        {/* Stats */}
        <div>
          <h2 className="mb-3">
            {t('mastery.stats', 'Statistiques')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((c, i) => (
              <div
                key={i}
                className={
                  'g2 p-4 ' +
                  (i === 0 ? 'col-span-2 flex items-center gap-4' : 'text-center')
                }
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ color: c.color, backgroundColor: 'transparent' }}
                >
                  <DuoIcon icon={c.icon} size={24} />
                </span>
                <div className={i === 0 ? '' : 'mt-1'}>
                  <p className="stat-value text-2xl">{c.value}</p>
                  <p className="text-xs text-text-muted">{c.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Levels */}
        <div>
          <h2 className="mb-3">
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
                    'g2 flex items-center gap-4 p-4 ' +
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
                    <DuoIcon icon={Icon} size={24} />
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
                      <span className="text-xs text-text-muted tabular-nums">
                        {levelCounts[level.id] ?? 0}/{stats.totalMemorized}
                      </span>
                    </div>
                  </div>
                  {isUnlocked && (
                    <DuoIcon icon={CheckCircle2} size={20} style={{ color: level.color }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="g2 p-4">
          <h2 className="mb-2">
            {t('mastery.tips', 'Conseils pour progresser')}
          </h2>
          <div className="space-y-2">
            {[
              t('mastery.tip1', "Revisez regulierement pour maintenir votre streak"),
              t('mastery.tip2', 'Memorisez 1-2 versets par jour'),
              t('mastery.tip3', 'Utilisez diferentes strategies de memorisation'),
            ].map((tip, i) => (
              <p key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                <DuoIcon icon={CheckCircle2} size={16} className="text-success" />
                {tip}
              </p>
            ))}
          </div>
        </div>
        {/* Rien de mémorisé : les cinq niveaux s'affichent tous à zéro, ce qui
            se lit comme un classement plutôt que comme un point de départ. */}
        {stats.totalMemorized === 0 && (
          <EmptyState
            icon={Leaf}
            title={t('mastery.noneYet', 'Votre parcours commence ici')}
            description={t(
              'mastery.noneYetHint',
              'Memorisez un premier verset : le niveau « Novice » s’ouvre des la premiere revision.',
            )}
            actionLabel={t('bible.explorer', 'Explorer la Bible')}
            onAction={() => navigate('/bible/explorer')}
          />
        )}
        <StatsDashboard profileId={profileId} />
        </>
        )}
      </div>
    </FullScreenPage>
  );
}
