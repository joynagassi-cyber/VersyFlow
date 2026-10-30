/**
 * Progress Tab — dashboard with real progress statistics
 * Connects to ProgressService for live data.
 * Tailwind + i18n + Lucide.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  FlameIcon as Flame,
  TrendingUpIcon as TrendingUp,
  TrendingDownIcon as TrendingDown,
} from '@/components/ui/solar-icons';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import type { ProgressStats } from '@/services/stats-calculator';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { formatProgressLabel } from '@/lib/progress-label';
import { Skeleton } from '@/components/ui/Skeleton';

/** Chargement qui garde la forme du contenu : quatre tuiles puis deux cartes,
 *  aux mêmes paddings que les vraies. Un squelette qui ne ressemble pas à la
 *  page fait sauter la mise en page à l'arrivée des chiffres. */
function ProgressSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="progress-stat-grid">
        {[0, 1, 2, 3].map((i) => (
          <article className="g2 progress-stat" key={i} aria-hidden="true">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-10 w-24" />
          </article>
        ))}
      </div>
      <div className="progress-detail-grid mt-4" aria-hidden="true">
        <section className="g2 progress-card">
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="mt-4 h-32 w-full rounded-2xl" />
        </section>
        <section className="g2 progress-card">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="mt-4 h-32 w-full rounded-2xl" />
        </section>
      </div>
    </div>
  );
}

// Exemples de présentation : jamais écrits dans les dépôts ou services FSRS.
const DEMO_STATS: ProgressStats = { totalVerses: 42, masteredVerses: 18, inProgressVerses: 24, dueForReview: 5, streakCount: 7, longestStreak: 12, weeklyTrend: { thisWeek: 6, lastWeek: 4, changePercentage: 50 }, avgSessionDurationMin: 4.5 };

export default function ProgressScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  const [realStats, setStats] = useState<ProgressStats | null>(null);
  const [demo, setDemo] = useState(false);
  const stats = demo ? DEMO_STATS : realStats;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStats(null);
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

  const change = stats?.weeklyTrend.changePercentage ?? 0;
  const hasComparison = (stats?.weeklyTrend.lastWeek ?? 0) > 0;
  const statCards = stats ? [
    { label: t('progress.totalVerses', 'Versets'), value: stats.totalVerses },
    { label: formatProgressLabel(t('progress.mastered', 'Maîtrisés'), stats.masteredVerses, i18n.resolvedLanguage || i18n.language), value: stats.masteredVerses },
    { label: t('progress.streak', 'Série'), value: stats.streakCount },
    { label: t('progress.toReview', 'À réviser'), value: stats.dueForReview },
  ] : [];
  const mastery = stats && stats.totalVerses > 0 ? Math.round((stats.masteredVerses / stats.totalVerses) * 100) : null;

  return (
    <div className="screen-column progress-premium h-full overflow-y-auto">
      <div className="progress-content">
        <header className="g1 tab-heading progress-heading">
          <p className="section-label">{t('nav.progress', 'Progression')}</p>
          <h1 className="page-title mt-2">{t('progress.yourProgress', 'Votre progression')}</h1>
          <button type="button" className="progress-demo-toggle" aria-pressed={demo} onClick={() => setDemo((value) => !value)}>{demo ? t('demo.exit', 'Quitter la démo') : t('demo.enter', 'Voir la démo')}</button>
          {demo && <p className="progress-demo-notice" role="status">{t('demo.notice', 'Données fictives pour cet écran uniquement. Vos données réelles ne sont pas modifiées.')}</p>}
        </header>
        {loading && !demo ? (
          <ProgressSkeleton label={t('progress.loading', 'Chargement des statistiques…')} />
        ) : !stats ? (
          <section className="g3 progress-message" role="status">
            <h2>{t('progress.unavailable', 'Statistiques indisponibles')}</h2>
            <p>{t('progress.unavailableHint', 'Réessayez plus tard pour afficher votre progression.')}</p>
            <button className="home-secondary" onClick={() => navigate('/bible/explorer')}>{t('bible.explorer', 'Explorer la Bible')}</button>
          </section>
        ) : (
          <>
            <div className="progress-stat-grid">
              {statCards.map(({ label, value }) => <article className="g2 progress-stat" key={label}><p className="section-label">{label}</p><strong>{value}</strong></article>)}
            </div>
            <div className="progress-detail-grid">
              <section className="g2 progress-card">
                <h2>{t('progress.trend', 'Tendance hebdomadaire')}</h2>
                <div className="progress-trend-values">
                  <div><span>{t('progress.thisWeek', 'Cette semaine')}</span><strong>{stats.weeklyTrend.thisWeek}</strong></div>
                  <div><span>{t('progress.lastWeek', 'Semaine dernière')}</span><strong>{stats.weeklyTrend.lastWeek}</strong></div>
                </div>
                <p className="progress-trend-change">{hasComparison ? <><DuoIcon icon={change < 0 ? TrendingDown : TrendingUp} size={20} /> {change > 0 ? '+' : ''}{change}% {t('progress.vsLastWeek', 'vs semaine précédente')}</> : t('progress.noComparison', 'Pas de comparaison disponible')}</p>
              </section>
              <section className="g2 progress-card">
                <h2>{t('progress.masteryTitle', 'Maîtrise')}</h2>
                <div className="progress-mastery">
                  <strong>{mastery === null ? '—' : `${mastery}%`}</strong>
                  <p>{t('progress.masteryExplanation', 'Versets maîtrisés sur le total mémorisé')}</p>
                </div>
                {mastery !== null && <div className="progress-track" role="progressbar" aria-label={t('progress.masteryTitle', 'Maîtrise')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={mastery}><span style={{ width: `${mastery}%` }} /></div>}
              </section>
            </div>
            <div className="progress-detail-grid">
              <button type="button" onClick={() => navigate('/review/calendar')} className="g2 progress-card progress-streak">
                <span className="icon-chip progress-icon"><DuoIcon icon={Flame} size={24} /></span>
                <span><strong>{t('progress.consecutive', 'Série consécutive')}</strong><small>{stats.streakCount} {formatProgressLabel(t('progress.days', 'jours'), stats.streakCount, i18n.resolvedLanguage || i18n.language)}</small></span>
              </button>
              <section className="g2 progress-card progress-metric">
                <h2>{t('progress.sessionMetrics', 'Métriques de session')}</h2>
                <p>{t('progress.avgReview', 'Temps moyen par révision')}</p>
                <strong>{stats.avgSessionDurationMin > 0 ? `${stats.avgSessionDurationMin.toFixed(1)} min` : '—'}</strong>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
