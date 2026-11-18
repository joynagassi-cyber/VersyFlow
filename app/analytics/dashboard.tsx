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
import { useTranslation } from 'react-i18next';
import { useAnalyticsCapability } from '@/capabilities/analytics/store';
import { fireAndForget } from '@/lib/fire-and-forget';
import { ScreenSkeleton } from '@/components/ui/ScreenSkeleton';
import { StatsDashboard } from '@/components/charts/StatsDashboard';
import { useActiveProfile } from '@/hooks/useActiveProfile';

export default function AnalyticsDashboardScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { stats, calculateStats, getLearningTime } =
    useAnalyticsCapability();
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      await calculateStats();
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
        {/* E04 : un squelette qui réserve la place des cartes, pas un spinner
            qui ne dit rien de la forme du contenu (et qui tourne à l'infini). */}
        <ScreenSkeleton rows={3} withTitle={false} />
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage
      title={t('analytics.title', 'Progression')}
      showBack
      right={
        <button
          onClick={() => fireAndForget(loadData(), 'analytics:reload')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-tint"
        >
          <DuoIcon icon={RefreshCw} size={16} className="text-primary" />
        </button>
      }
    >
      <div className="screen-column space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass col-span-2 flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-on-primary">
              <DuoIcon icon={BookOpen} size={24} />
            </span>
            <div>
              <p className="text-3xl font-extrabold text-text-primary tabular-nums">
                {stats?.totalVerses || 0}
              </p>
              <p className="text-xs text-text-muted">
                {t('analytics.versesMemorized', 'Versets memorises')}
              </p>
            </div>
          </div>
          <div className="glass rounded-2xl bg-surface p-4 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-success tabular-nums">
              {stats?.masteredVerses || 0}
            </p>
            <p className="text-xs text-text-muted">
              {t('analytics.mastered', 'Maitrises')}
            </p>
          </div>
          <div className="glass rounded-2xl bg-surface p-4 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-error tabular-nums">
              {stats?.streakCount || 0}
            </p>
            <p className="text-xs text-text-muted">{t('analytics.streak', 'Streak')}</p>
          </div>
        </div>

        {/* Tableau de bord : huit graphiques (chaleur, courbe, barres, anneau,
            radar, jauge, empilées, horizontales) sur les mêmes données réelles. */}
        <section>
          <p className="mb-3 text-base font-bold text-text-primary">
            {t('analytics.charts', 'Graphiques')}
          </p>
          <StatsDashboard profileId={profileId} />
        </section>

        {/* Weekly trend */}
        {stats?.weeklyTrend && (
          <div className="glass rounded-3xl bg-surface p-5 shadow-sm">
            <p className="mb-3 text-base font-bold text-text-primary">
              {t('analytics.weeklyTrend', 'Tendance hebdomadaire')}
            </p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-surface-tint p-4">
                <p className="text-2xl font-extrabold text-text-primary tabular-nums">
                  {stats.weeklyTrend.thisWeek}
                </p>
                <p className="text-xs text-text-muted">
                  {t('analytics.thisWeek', 'Cette semaine')}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-tint p-4">
                <p className="text-2xl font-extrabold text-text-primary tabular-nums">
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
          <p className="mb-3 text-base font-bold text-text-primary">
            {t('analytics.byStatus', 'Verset par statut')}
          </p>
          <div className="glass overflow-hidden rounded-3xl bg-surface shadow-sm">
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
        <div className="glass rounded-3xl bg-surface p-5 text-center shadow-sm">
          <p className="text-3xl font-extrabold text-text-primary">
            {getLearningTime()} min
          </p>
          <p className="text-xs text-text-muted tabular-nums">
            {t('analytics.totalTime', 'Temps total d\'apprentissage')}
          </p>
        </div>
      </div>
    </FullScreenPage>
  );
}
