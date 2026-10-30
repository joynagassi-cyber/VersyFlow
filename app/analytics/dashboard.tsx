import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  BookOpen01Icon as BookOpen,
  RefreshIcon as RefreshCw,
  TrendingUpIcon as TrendingUp,
  TrendingDownIcon as TrendingDown,
  ChartLineData01Icon as LineChart,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { LoadingBlock } from '@/components/ui/Skeleton';
import { useTranslation } from 'react-i18next';
import { useAnalyticsCapability } from '@/capabilities/analytics/store';
import { fireAndForget } from '@/lib/fire-and-forget';

interface DataPoint {
  date: string;
  retention: number;
}

export default function AnalyticsDashboardScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { stats, calculateStats, getRetentionCurve, getLearningTime } =
    useAnalyticsCapability();
  const [loading, setLoading] = useState(true);
  const [curve, setCurve] = useState<DataPoint[]>([]);

  const loadData = async () => {
    try {
      await calculateStats();
      setCurve(getRetentionCurve().slice(-30));
    } catch (e) {
      console.error('analytics load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (loading) {
    return (
      <FullScreenPage title={t('analytics.title', 'Progression')} showBack>
        <LoadingBlock
          className="min-h-[50vh] justify-center py-0"
          label={t('analytics.loading', 'Chargement des statistiques…')}
        />
      </FullScreenPage>
    );
  }

  const barColor = (r: number) =>
    r > 0.8 ? 'var(--color-success)' : r > 0.5 ? 'var(--color-primary)' : 'var(--color-error)';

  return (
    <FullScreenPage
      title={t('analytics.title', 'Progression')}
      showBack
      right={
        <button
          onClick={() => fireAndForget(loadData(), 'analytics:reload')}
          aria-label={t('analytics.reload', 'Actualiser')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-tint"
        >
          <DuoIcon icon={RefreshCw} size={16} className="text-primary" />
        </button>
      }
    >
      <div className="screen-column space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass col-span-2 flex items-center gap-4 rounded-3xl p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-on-primary">
              <DuoIcon icon={BookOpen} size={22} />
            </span>
            <div>
              <p className="stat-value text-3xl">
                {stats?.totalVerses || 0}
              </p>
              <p className="stat-label mt-1">
                {t('analytics.versesMemorized', 'Versets memorises')}
              </p>
            </div>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="stat-value text-2xl">
              {stats?.masteredVerses || 0}
            </p>
            <p className="stat-label mt-1">
              {t('analytics.mastered', 'Maitrises')}
            </p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="stat-value text-2xl">
              {stats?.streakCount || 0}
            </p>
            <p className="stat-label mt-1">{t('analytics.streak', 'Streak')}</p>
          </div>
        </div>

        {/* Retention chart */}
        <div className="glass rounded-3xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2>{t('analytics.retention30', 'Retention sur 30 jours')}</h2>
          </div>
          {curve.length > 0 ? (
            <div className="flex h-40 items-end gap-1">
              {curve.slice(-14).map((p, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: Math.max(6, p.retention * 100) + 'px',
                      backgroundColor: barColor(p.retention),
                    }}
                  />
                  <span className="text-3xs text-text-muted">
                    {new Date(p.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <DuoIcon icon={LineChart} size={32} className="text-text-muted" />
              <p className="text-sm font-semibold text-text-primary">
                {t('analytics.noData', 'Aucune donnee de retention')}
              </p>
              <p className="stat-label mt-1">
                {t('analytics.noDataHint', 'Commencez a memoriser pour voir vos courbes')}
              </p>
            </div>
          )}
        </div>

        {/* Weekly trend */}
        {stats?.weeklyTrend && (
          <div className="glass rounded-3xl p-5">
            <h2 className="card-title mb-3">
              {t('analytics.weeklyTrend', 'Tendance hebdomadaire')}
            </h2>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-surface-tint p-4">
                <p className="stat-value text-2xl">
                  {stats.weeklyTrend.thisWeek}
                </p>
                <p className="stat-label mt-1">
                  {t('analytics.thisWeek', 'Cette semaine')}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-tint p-4">
                <p className="stat-value text-2xl">
                  {stats.weeklyTrend.lastWeek}
                </p>
                <p className="stat-label mt-1">
                  {t('analytics.lastWeek', 'Semaine derniere')}
                </p>
              </div>
            </div>
            <div
              className={
                'mt-3 flex items-center justify-center gap-2 rounded-xl py-3 ' +
                (stats.weeklyTrend.changePercentage >= 0
                  ? 'bg-success/10 text-success'
                  : 'bg-error/10 text-error')
              }
            >
              {stats.weeklyTrend.changePercentage >= 0 ? (
                <DuoIcon icon={TrendingUp} size={16} />
              ) : (
                <DuoIcon icon={TrendingDown} size={16} />
              )}
              <span className="font-bold">
                {(stats.weeklyTrend.changePercentage >= 0 ? '+' : '') +
                  stats.weeklyTrend.changePercentage +
                  '%'}
              </span>
              <span className="text-xs">
                {stats.weeklyTrend.changePercentage >= 0
                  ? t('analytics.betterThan', 'Meilleure que')
                  : t('analytics.worseThan', 'Moins bien que')}{' '}
                {t('analytics.lastWeek', 'la semaine derniere')}
              </span>
            </div>
          </div>
        )}

        {/* Verses by status */}
        <div>
          <h2 className="card-title mb-3">
            {t('analytics.byStatus', 'Verset par statut')}
          </h2>
          <div className="glass overflow-hidden rounded-3xl">
            {[
              { label: t('analytics.mastered', 'Maîtrisés'), value: stats?.masteredVerses ?? 0, dot: 'bg-success', to: '/tabs/progress' },
              { label: t('analytics.inProgress', 'En cours'), value: stats?.inProgressVerses ?? 0, dot: 'bg-primary', to: '/review/queue' },
              { label: t('analytics.toReview', 'À réviser'), value: stats?.dueForReview ?? 0, dot: 'bg-warning', to: '/review/queue' },
            ].map((row, i) => (
              <button
                key={i}
                onClick={() => navigate(row.to)}
                className="flex w-full items-center justify-between border-b border-[color:var(--color-divider)] px-4 py-4 last:border-0"
              >
                <span className="flex items-center gap-3">
                  <span className={'h-2.5 w-2.5 shrink-0 rounded-full ' + row.dot} />
                  <span className="text-base font-medium text-text-primary">{row.label}</span>
                </span>
                <span className="stat-value text-lg">{row.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Learning time */}
        <div className="glass rounded-3xl p-5 text-center">
          <p className="stat-value text-3xl">
            {getLearningTime()} min
          </p>
          <p className="stat-label mt-1">
            {t('analytics.totalTime', 'Temps total d\'apprentissage')}
          </p>
        </div>
      </div>
    </FullScreenPage>
  );
}