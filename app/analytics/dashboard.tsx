import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Flame,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2,
  LineChart,
} from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { useTranslation } from 'react-i18next';
import { useAnalyticsCapability } from '@/capabilities/analytics/store';

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
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <FullScreenPage title={t('analytics.title', 'Progression')} showBack>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-text-muted">
            {t('analytics.loading', 'Chargement des statistiques...')}
          </p>
        </div>
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
          onClick={loadData}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-tint"
        >
          <RefreshCw size={16} className="text-primary" />
        </button>
      }
    >
      <div className="mx-auto max-w-md space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
              <BookOpen size={22} />
            </span>
            <div>
              <p className="text-3xl font-extrabold text-text-primary">
                {stats?.totalVerses || 0}
              </p>
              <p className="text-xs text-text-muted">
                {t('analytics.versesMemorized', 'Versets memorises')}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-surface p-4 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-success">
              {stats?.masteredVerses || 0}
            </p>
            <p className="text-xs text-text-muted">
              {t('analytics.mastered', 'Maitrises')}
            </p>
          </div>
          <div className="rounded-2xl bg-surface p-4 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-error">
              {stats?.streakCount || 0}
            </p>
            <p className="text-xs text-text-muted">{t('analytics.streak', 'Streak')}</p>
          </div>
        </div>

        {/* Retention chart */}
        <div className="rounded-3xl bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base font-bold text-text-primary">
              {t('analytics.retention30', 'Retention sur 30 jours')}
            </p>
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
                  <span className="text-[10px] text-text-muted">
                    {new Date(p.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <LineChart size={32} className="text-text-muted" />
              <p className="text-sm font-semibold text-text-primary">
                {t('analytics.noData', 'Aucune donnee de retention')}
              </p>
              <p className="text-xs text-text-muted">
                {t('analytics.noDataHint', 'Commencez a memoriser pour voir vos courbes')}
              </p>
            </div>
          )}
        </div>

        {/* Weekly trend */}
        {stats?.weeklyTrend && (
          <div className="rounded-3xl bg-surface p-5 shadow-sm">
            <p className="mb-3 text-base font-bold text-text-primary">
              {t('analytics.weeklyTrend', 'Tendance hebdomadaire')}
            </p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-surface-tint p-4">
                <p className="text-2xl font-extrabold text-text-primary">
                  {stats.weeklyTrend.thisWeek}
                </p>
                <p className="text-xs text-text-muted">
                  {t('analytics.thisWeek', 'Cette semaine')}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-tint p-4">
                <p className="text-2xl font-extrabold text-text-primary">
                  {stats.weeklyTrend.lastWeek}
                </p>
                <p className="text-xs text-text-muted">
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
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
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
          <p className="mb-3 text-base font-bold text-text-primary">
            {t('analytics.byStatus', 'Verset par statut')}
          </p>
          <div className="overflow-hidden rounded-3xl bg-surface shadow-sm">
            {[
              { label: t('analytics.mastered', 'Maitrises'), value: stats?.masteredVerses || 0, dot: 'var(--color-success)', to: '/tabs/progress' },
              { label: t('analytics.inProgress', 'En cours'), value: stats?.inProgressVerses || 0, dot: 'var(--color-primary)', to: '/review/queue' },
              { label: t('analytics.toReview', 'A reviser'), value: stats?.dueForReview || 0, dot: 'var(--color-error)', to: '/review/queue' },
            ].map((row, i) => (
              <button
                key={i}
                onClick={() => navigate(row.to)}
                className="flex w-full items-center justify-between border-b border-[color:var(--color-divider)] px-4 py-4 last:border-0"
              >
                <span className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: row.dot }}
                  />
                  <span className="text-base font-medium text-text-primary">{row.label}</span>
                </span>
                <span className="text-lg font-bold text-primary">{row.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Learning time */}
        <div className="rounded-3xl bg-surface p-5 text-center shadow-sm">
          <p className="text-3xl font-extrabold text-text-primary">
            {getLearningTime()} min
          </p>
          <p className="text-xs text-text-muted">
            {t('analytics.totalTime', 'Temps total d\'apprentissage')}
          </p>
        </div>
      </div>
    </FullScreenPage>
  );
}
