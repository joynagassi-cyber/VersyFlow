import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  CheckCircle2,
  Flame,
  TrendingUp,
  TrendingDown,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getFsrsEngine } from '@/services/fsrs-factory';
import type { ProgressStats } from '@/services/progress-service';
import { ProgressService } from '@/services/progress-service';
import { getMemorizationService } from '@/services/memorization-service-factory';

export default function ProgressDashboardScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { activeProfile } = useActiveProfile();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const service = getMemorizationService(activeProfile?.id ?? 'default');
        const progressService = new ProgressService(
          service,
          getFsrsEngine(),
          undefined,
          activeProfile?.id ?? 'default',
        );
        const s = await progressService.getStats();
        setStats(s);
      } catch (error) {
        console.error('Error loading progress stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-4">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-sm text-text-muted">
          {t('progress.loading', 'Chargement des statistiques...')}
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-full overflow-y-auto bg-background p-4">
        <div className="mx-auto max-w-md">
          <EmptyState
            title={t('progress.empty', 'Aucune progression enregistree')}
            description={t('progress.emptyHint', 'Commencez a memoriser des versets.')}
            actionLabel={t('progress.startNow', 'Commencer')}
            onAction={() => navigate('/memorization/session')}
          />
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: BookOpen, label: t('progress.totalVerses', 'Versets'), value: stats.totalVerses },
    { icon: CheckCircle2, label: t('progress.mastered', 'Maitrises'), value: stats.masteredVerses },
    { icon: Flame, label: t('progress.streak', 'Streak'), value: stats.streakCount },
    { icon: BarChart3, label: t('progress.due', 'A reviser'), value: stats.dueForReview },
  ];

  return (
    <div className="h-full overflow-y-auto bg-background p-4">
      <div className="mx-auto max-w-md space-y-4 pb-20">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((c, i) => (
            <div key={i} className="rounded-2xl bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-2 text-text-muted">
                <c.icon size={18} className="text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide">{c.label}</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-primary">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Weekly trend */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="mb-3 text-base font-bold text-text-primary">
            {t('progress.trend', 'Tendance hebdomadaire')}
          </p>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-tint">
              <TrendingUp size={20} className="text-primary" />
            </span>
            <div className="flex flex-1 items-center justify-around">
              <div className="text-center">
                <p className="text-xs text-text-muted">{t('progress.thisWeek', 'Cette semaine')}</p>
                <p className="text-2xl font-extrabold text-text-primary">
                  {stats.weeklyTrend.thisWeek}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted">
                  {t('progress.lastWeek', 'Semaine derniere')}
                </p>
                <p className="text-2xl font-extrabold text-text-primary">
                  {stats.weeklyTrend.lastWeek}
                </p>
              </div>
            </div>
          </div>
          <div
            className={
              'mt-3 flex items-center justify-center gap-2 rounded-xl py-2 ' +
              (stats.weeklyTrend.changePercentage >= 0
                ? 'bg-success/10 text-success'
                : 'bg-error/10 text-error')
            }
          >
            {stats.weeklyTrend.changePercentage >= 0 ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span className="font-bold">
              {Math.abs(stats.weeklyTrend.changePercentage)}%
            </span>
            <span className="text-xs">
              {t('progress.vsLastWeek', 'vs semaine precedente')}
            </span>
          </div>
        </div>

        {/* Streak */}
        {stats.streakCount > 0 && (
          <div className="gradient-hero glow-primary rounded-2xl p-4 text-white">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold opacity-90">
                {t('progress.consecutive', 'Serie consecutive')}
              </span>
              <Flame size={22} />
            </div>
            <p className="text-center text-xl font-extrabold">
              {stats.streakCount} {t('progress.days', 'jours')}
            </p>
          </div>
        )}

        {/* Session metrics */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="mb-2 text-base font-bold text-text-primary">
            {t('progress.sessionMetrics', 'Metriques de session')}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {t('progress.avgSession', 'Temps moyen par session')}
            </span>
            <span className="text-sm font-bold text-text-primary">
              {stats.avgSessionDurationMin.toFixed(1)} min
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
