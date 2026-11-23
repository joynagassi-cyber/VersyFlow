/**
 * Review Summary Screen — session stats after a review pass.
 * Real data via ProgressService (streak, retention, counts).
 * Tailwind + i18n + Lucide.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  FlameIcon as Flame,
  TrendingUpIcon as TrendingUp,
  CheckmarkCircle01Icon as CheckCircle,
  Clock01Icon as Clock,
  BookOpen01Icon as BookOpen,
  AlertCircleIcon as AlertCircle,
} from '@/components/ui/solar-icons';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import { getMemorizationService } from '@/services/memorization-service-factory';
import type { ProgressStats } from '@/services/stats-calculator';
import { ReviewSummarySkeleton } from '@/components/ui/ScreenSkeletons';

export default function ReviewSummaryScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  // Un échec de lecture produisait un résumé de zéros : « 0 verset mémorisé,
  // 0 % de rétention » se lit comme un constat, pas comme une panne.
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const progress = new ProgressService(service, getFsrsEngine(), undefined, profileId);
        const data = await progress.getStats();
        if (!cancelled) setStats(data);
      } catch (error) {
        console.error('[ReviewSummary] stats load failed:', error);
        if (!cancelled) {
          setStats(null);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    setFailed(false);
    setLoading(true);
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId, attempt]);

  if (loading) {
    return (
      <FullScreenPage title={t('review.summary', 'Résumé de session')} backPath="/review/queue">
        <ReviewSummarySkeleton label={t('common.loading', 'Chargement du résumé...')} />
      </FullScreenPage>
    );
  }

  if (failed) {
    return (
      <FullScreenPage title={t('review.summary', 'Résumé de session')} backPath="/review/queue">
        <div role="alert" className="g2 flex flex-col items-start gap-3 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <DuoIcon icon={AlertCircle} size={20} className="text-error" />
            {t('review.summaryUnavailable', 'Résumé indisponible pour le moment')}
          </p>
          <p className="text-sm text-text-muted">
            {t(
              'review.summaryUnavailableHint',
              'Les statistiques n’ont pas pu être lues. Votre séance reste enregistrée.',
            )}
          </p>
          <Button variant="default" onClick={() => setAttempt((n) => n + 1)}>
            {t('common.retry', 'Réessayer')}
          </Button>
        </div>
      </FullScreenPage>
    );
  }

  const mastered = stats?.masteredVerses ?? 0;
  const inProgress = stats?.inProgressVerses ?? 0;
  const total = stats?.totalVerses ?? 0;
  const retention = total > 0 ? Math.round((mastered / total) * 100) : 0;

  const statCards = [
    { value: total, label: t('progress.versesMemorized', 'Verset(s) mémorisé(s)'), icon: <DuoIcon icon={BookOpen} size={16} /> },
    { value: mastered, label: t('progress.mastered', 'Maîtrisé(s)'), icon: <DuoIcon icon={CheckCircle} size={16} /> },
    { value: inProgress, label: t('progress.inProgress', 'En cours'), icon: <DuoIcon icon={Clock} size={16} /> },
    { value: retention + '%', label: t('progress.retention', 'Rétention'), icon: <DuoIcon icon={TrendingUp} size={16} /> },
  ];

  return (
    <FullScreenPage title={t('review.summary', 'Résumé de session')} backPath="/review/queue">
      {/* Streak hero */}
      {/* Série : un chiffre clé, pas un aplat d'accent. Le libellé est une
          micro-capitale du système, la valeur suit `.stat-value` (serif,
          tabulaire, encre d'accent lisible sur les 39 presets). */}
      <div className="g1 mb-5 flex flex-col items-center p-6 text-center">
        <span className="section-label flex items-center gap-1.5">
          <DuoIcon icon={Flame} size={16} />
          {t('progress.streak', 'Série quotidienne')}
        </span>
        <span className="stat-value mt-2 text-5xl">{stats?.streakCount ?? 0}</span>
        <span className="mt-1 text-sm text-text-muted">
          {t('home.streak', { count: stats?.streakCount ?? 0 })}
        </span>
      </div>

      {/* Stat grid */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="g2 flex flex-col items-center p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-tint text-primary">
              {card.icon}
            </span>
            <p className="stat-value mt-2 text-2xl">{card.value}</p>
            <p className="text-xs text-text-muted">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Retention bar */}
      <div className="g2 mb-5 p-4">
        <p className="text-base font-semibold text-text-primary">
          {t('progress.retention', 'Taux de rétention')}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-tint">
            <div className="h-full rounded-full bg-primary" style={{ width: `${retention}%` }} />
          </div>
          <span className="text-lg font-bold text-primary">{retention}%</span>
        </div>
        <p className="mt-2 text-center text-xs text-text-muted">
          {t('progress.mastered', 'Verset(s) maîtrisé(s)')} : {mastered}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button onClick={() => navigate('/review/queue')}>
          {t('review.startReview', 'Revenir à la file')}
        </Button>
        <Button variant="outline" onClick={() => navigate('/tabs/progress')}>
          {t('progress.yourProgress', 'Voir ma progression')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
