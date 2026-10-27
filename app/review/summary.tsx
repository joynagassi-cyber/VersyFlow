/**
 * Review Summary Screen — session stats after a review pass.
 * Real data via ProgressService (streak, retention, counts).
 * Tailwind + i18n + Lucide.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flame, Loader2, TrendingUp, CheckCircle, Clock, BookOpen } from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import { getMemorizationService } from '@/services/memorization-service-factory';
import type { ProgressStats } from '@/services/stats-calculator';

export default function ReviewSummaryScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

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
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (loading) {
    return (
      <FullScreenPage title={t('review.summary', 'Résumé de session')} backPath="/review/queue">
        <div className="flex flex-col items-center py-24">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </FullScreenPage>
    );
  }

  const mastered = stats?.masteredVerses ?? 0;
  const inProgress = stats?.inProgressVerses ?? 0;
  const total = stats?.totalVerses ?? 0;
  const retention = total > 0 ? Math.round((mastered / total) * 100) : 0;

  const statCards = [
    { value: total, label: t('progress.versesMemorized', 'Verset(s) mémorisé(s)'), icon: <BookOpen size={16} /> },
    { value: mastered, label: t('progress.mastered', 'Maîtrisé(s)'), icon: <CheckCircle size={16} /> },
    { value: inProgress, label: t('progress.inProgress', 'En cours'), icon: <Clock size={16} /> },
    { value: retention + '%', label: t('progress.retention', 'Rétention'), icon: <TrendingUp size={16} /> },
  ];

  return (
    <FullScreenPage title={t('review.summary', 'Résumé de session')} backPath="/review/queue">
      {/* Streak hero */}
      <div className="mb-5 flex flex-col items-center rounded-2xl bg-primary p-6 text-white shadow-rose">
        <span className="flex items-center gap-1.5 text-sm text-white/90">
          <Flame size={16} />
          {t('progress.streak', 'Série quotidienne')} 🔥
        </span>
        <span className="mt-2 text-5xl font-extrabold">{stats?.streakCount ?? 0}</span>
        <span className="mt-1 text-sm text-white/90">
          {t('home.streak', { count: stats?.streakCount ?? 0 })}
        </span>
      </div>

      {/* Stat grid */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="flex flex-col items-center rounded-xl bg-surface p-4 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-tint text-primary">
              {card.icon}
            </span>
            <p className="mt-2 text-2xl font-bold text-text-primary">{card.value}</p>
            <p className="text-xs text-text-muted">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Retention bar */}
      <div className="mb-5 rounded-xl bg-surface p-4 shadow-sm">
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
