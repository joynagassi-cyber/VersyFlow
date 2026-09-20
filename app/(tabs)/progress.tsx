/**
 * Progress Tab — dashboard with real progress statistics
 * Connects to ProgressService for live data.
 * Tailwind + i18n + Lucide.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Flame, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import type { ProgressStats } from '@/services/stats-calculator';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { cn } from '@/lib/utils';

export default function ProgressScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const progressService = new ProgressService(
          service,
          getFsrsEngine(),
          undefined,
          profileId,
        );
        const data = await progressService.getStats();
        if (!cancelled) setStats(data);
      } catch (error) {
        console.error('[Progress] Stats load failed:', error);
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
      <div className="flex min-h-full items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-background p-8 text-center">
        <span className="text-6xl">📊</span>
        <p className="mt-4 text-xl font-bold text-text-primary">
          {t('progress.mastered', 'Aucune progression enregistrée')}
        </p>
        <p className="mt-2 text-sm text-text-muted">
          {t('progress.inProgress', 'Commencez à mémoriser des versets pour voir vos statistiques')}
        </p>
        <button
          onClick={() => navigate('/bible/explorer')}
          className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-rose"
        >
          {t('bible.explorer', 'Explorer la Bible')}
        </button>
      </div>
    );
  }

  const statCards = [
    { label: t('progress.versesMemorized', 'Verset(s) mémorisé(s)'), value: stats.totalVerses },
    { label: t('progress.mastered', 'Maîtrisé(s)'), value: stats.masteredVerses },
    { label: t('progress.streak', 'Série'), value: stats.streakCount },
    { label: t('progress.toReview', 'À réviser'), value: stats.dueForReview },
  ];

  const change = stats.weeklyTrend.changePercentage;

  return (
    <div className="min-h-full overflow-y-auto bg-background p-4 pb-24">
      <h1 className="mb-4 text-2xl font-bold text-text-primary">
        {t('progress.yourProgress', 'Votre Progression')}
      </h1>

      {/* Stats grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl bg-surface p-4 text-center shadow-sm">
            <p className="text-xs uppercase tracking-wide text-text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Weekly trend */}
      <div className="mt-4 rounded-xl bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">
            {t('progress.thisWeek', 'Tendance hebdomadaire')}
          </h2>
          <span
            className={cn(
              'flex items-center gap-1 text-sm font-bold',
              change >= 0 ? 'text-success' : 'text-error',
            )}
          >
            {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(change)}%
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-text-muted">{t('progress.thisWeek', 'Cette semaine')}</p>
            <p className="text-2xl font-bold text-text-primary">{stats.weeklyTrend.thisWeek}</p>
          </div>
          <div className="h-10 w-px bg-divider" />
          <div className="text-center">
            <p className="text-xs text-text-muted">{t('progress.lastWeek', 'Semaine dernière')}</p>
            <p className="text-2xl font-bold text-text-primary">{stats.weeklyTrend.lastWeek}</p>
          </div>
        </div>
      </div>

      {/* Streak card */}
      {stats.streakCount > 0 && (
        <button
          onClick={() => navigate('/review/calendar')}
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Flame size={26} className="text-primary" />
            <div className="text-left">
              <p className="text-base font-semibold text-text-primary">
                {t('progress.streak', 'Série consécutive')}
              </p>
              <p className="text-sm text-text-secondary">
                {t('home.streak', { count: stats.streakCount })}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-surface-tint px-3 py-1.5 text-xs font-semibold text-primary">
            {t('progress.retention', 'Calendrier')}
          </span>
        </button>
      )}

      {/* Session metrics */}
      <div className="mt-4 rounded-xl bg-surface p-4 shadow-sm">
        <h2 className="text-base font-semibold text-text-primary">
          {t('progress.inProgress', 'Métriques de session')}
        </h2>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-text-muted">
            {t('progress.versesMemorized', 'Temps moyen par session')}
          </span>
          <span className="font-semibold text-text-primary">
            {stats.avgSessionDurationMin.toFixed(1)} min
          </span>
        </div>
      </div>
    </div>
  );
}
