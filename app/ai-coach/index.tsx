import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Dumbbell, AlarmClock, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { useAICoachCapability } from '@/capabilities/ai-coach/store';
import type { IAiCoachWeeklyReport } from '@/capabilities/ai-coach/types';

function typeIcon(type: string) {
  switch (type) {
    case 'verse':
      return BookOpen;
    case 'exercise':
      return Dumbbell;
    case 'reminder':
      return AlarmClock;
    case 'insight':
      return Lightbulb;
    default:
      return Sparkles;
  }
}
function priorityColor(p: string) {
  switch (p) {
    case 'high':
      return 'var(--color-error)';
    case 'medium':
      return 'var(--color-warning)';
    case 'low':
      return 'var(--color-success)';
    default:
      return 'var(--color-text-muted)';
  }
}

export default function AICoachScreen() {
  const { t } = useTranslation();
  const { recommendations, dailyPlan, analyzePerformance, getWeeklyReport } =
    useAICoachCapability();
  const [loading, setLoading] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState<IAiCoachWeeklyReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    analyzePerformance()
      .then(() => {
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    void getWeeklyReport().then((report) => {
      if (!cancelled) setWeeklyReport(report);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <FullScreenPage title={t('coach.title', 'Coach IA')} showBack>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-text-muted">
            {t('coach.analyzing', 'Analyse en cours...')}
          </p>
        </div>
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage title={t('coach.title', 'Coach IA')} showBack>
      <div className="mx-auto max-w-md space-y-6">
        {/* Weekly report */}
        <div className="gradient-hero glow-primary rounded-3xl p-5 text-white">
          <p className="mb-4 text-base font-bold">
            {t('coach.weekly', 'Rapport hebdomadaire')}
          </p>
          {weeklyReport ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl font-extrabold">{weeklyReport.totalSessions}</p>
                <p className="text-xs opacity-80">{t('coach.sessions', 'Sessions')}</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold">{weeklyReport.versesMemorized}</p>
                <p className="text-xs opacity-80">{t('coach.verses', 'Versets')}</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold">
                  {Math.round(weeklyReport.avgScore * 100)}%
                </p>
                <p className="text-xs opacity-80">{t('coach.avgScore', 'Score moy.')}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm opacity-90">
              {t('coach.noReport', 'Pas encore assez de donnees.')}
            </p>
          )}
        </div>

        {/* Daily plan */}
        <div>
          <h2 className="mb-3 text-base font-bold text-text-primary">
            {t('coach.dailyPlan', 'Plan du jour')}
          </h2>
          {dailyPlan?.items.length ? (
            <div className="space-y-2">
              {dailyPlan.items.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-tint text-sm font-bold text-primary">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-base text-text-primary">{task}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              {t('coach.noPlan', "Aucun plan pour aujourd'hui.")}
            </p>
          )}
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="mb-3 text-base font-bold text-text-primary">
            {t('coach.recommendations', 'Recommandations')}
          </h2>
          {recommendations.length ? (
            <div className="space-y-2">
              {recommendations.map((rec) => {
                const Icon = typeIcon(rec.type);
                const pc = priorityColor(rec.priority);
                return (
                  <div
                    key={rec.id}
                    className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ color: pc, backgroundColor: 'transparent' }}
                    >
                      <Icon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-text-primary">{rec.title}</p>
                      <p className="text-sm text-text-muted">{rec.description}</p>
                    </div>
                    <span
                      className="rounded px-2 py-0.5 text-xs font-bold"
                      style={{ color: pc, backgroundColor: pc + '20' }}
                    >
                      {rec.priority === 'high'
                        ? t('coach.high', 'Important')
                        : rec.priority === 'medium'
                          ? t('coach.medium', 'Moyen')
                          : t('coach.low', 'Faible')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              {t('coach.noRecs', 'Aucune recommandation pour le moment.')}
            </p>
          )}
        </div>
      </div>
    </FullScreenPage>
  );
}
