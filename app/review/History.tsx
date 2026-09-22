import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Medal,
  Loader2,
} from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Rating } from '@/domains/fsrs';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getReviewLogRepository } from '@/infrastructure/repository/powersync-repositories';
import type { ReviewLogEntry as DomainReviewLogEntry } from '@/domains/memorization/entities';

interface ReviewLogEntry {
  id: string;
  answeredAt: number;
  rating: Rating | string;
  stabilityBefore: number;
  stabilityAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
  elapsedDays: number;
  repetitions: number;
}

interface VerseRecord {
  id: string;
  reference: string;
  text: string;
  totalReviews: number;
  averageStability: number;
  masteryLevel: string;
}

const RATING_MAP: Record<DomainReviewLogEntry['rating'], Rating> = {
  again: Rating.AGAIN,
  hard: Rating.HARD,
  good: Rating.GOOD,
  easy: Rating.EASY,
};

function ratingConfig(rating: Rating | string) {
  const r =
    typeof rating === 'string'
      ? RATING_MAP[rating as DomainReviewLogEntry['rating']] ?? Rating.AGAIN
      : rating;
  switch (r) {
    case Rating.AGAIN:
      return { cls: 'bg-error text-white', label: 'A revoir', Icon: RefreshCw };
    case Rating.HARD:
      return { cls: 'bg-warning text-white', label: 'Difficile', Icon: RefreshCw };
    case Rating.GOOD:
      return { cls: 'bg-success text-white', label: 'Bon', Icon: CheckCircle2 };
    case Rating.EASY:
      return { cls: 'bg-info text-white', label: 'Facile', Icon: CheckCircle2 };
    default:
      return { cls: 'bg-primary text-white', label: 'Bon', Icon: CheckCircle2 };
  }
}

export default function ReviewHistoryScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ReviewLogEntry[]>([]);
  const [verse, setVerse] = useState<VerseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const records = await service.getAllMemorized();
        const withReviews = records
          .filter((r) => r.reviewCount > 0)
          .sort((a, b) => (b.lastReviewedAt ?? 0) - (a.lastReviewedAt ?? 0));
        const record = withReviews[0];
        if (!record) {
          if (!cancelled) {
            setNoData(true);
            setLoading(false);
          }
          return;
        }
        const domainLogs = await getReviewLogRepository().listByRecord(record.id);
        const mapped: ReviewLogEntry[] = domainLogs.map((log) => ({
          id: log.id,
          answeredAt: log.answeredAt,
          rating: RATING_MAP[log.rating] ?? Rating.AGAIN,
          stabilityBefore: log.stabilityBefore,
          stabilityAfter: log.stabilityAfter,
          difficultyBefore: log.difficultyBefore,
          difficultyAfter: log.difficultyAfter,
          elapsedDays: Math.max(
            0,
            Math.round((log.answeredAt - (record.createdAt || log.answeredAt)) / 86400000),
          ),
          repetitions: record.reviewCount,
        }));
        if (cancelled) return;
        setLogs(mapped);
        setVerse({
          id: record.id,
          reference: record.bibleVerseReference,
          text: record.bibleVerseText,
          totalReviews: record.reviewCount,
          averageStability: record.fsrsState?.stability ?? 0,
          masteryLevel:
            record.status === 'mastered'
              ? t('history.mastered', 'Maitrise')
              : t('history.inProgress', 'En cours'),
        });
        setNoData(false);
        setLoading(false);
      } catch (e) {
        console.error('[ReviewHistory] data load failed:', e);
        if (!cancelled) {
          setNoData(true);
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId, t]);

  const formatTimestamp = (timestamp: number): string => {
    const diffDays = Math.floor((new Date().getTime() - timestamp) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('history.today', "Aujourd'hui");
    if (diffDays === 1) return t('history.yesterday', 'Hier');
    if (diffDays < 7) {
      return t('history.daysAgo', {
        count: diffDays,
        defaultValue: 'Il y a ' + diffDays + ' jours',
      });
    }
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <FullScreenPage title={t('nav.history', 'Historique')} showBack>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-text-muted">{t('common.loading', 'Chargement...')}</p>
        </div>
      </FullScreenPage>
    );
  }

  if (noData || !verse) {
    return (
      <FullScreenPage title={t('nav.history', 'Historique')} showBack>
        <div className="mx-auto max-w-md">
          <EmptyState
            title={t('review.historyEmpty', 'Aucune revision enregistree')}
            description={t('review.historyEmptyHint', 'Revisez des versets pour construire votre historique.')}
            actionLabel={t('review.goQueue', 'Voir la file')}
            onAction={() => navigate('/review/queue')}
          />
        </div>
      </FullScreenPage>
    );
  }

  const goodOrEasy = logs.filter(
    (h) => h.rating === Rating.GOOD || h.rating === Rating.EASY,
  ).length;
  const progress = logs.length === 0 ? 0 : Math.round((goodOrEasy / logs.length) * 100);

  return (
    <FullScreenPage title={t('nav.history', 'Historique')} showBack backPath="/review/queue">
      <div className="mx-auto max-w-md space-y-6">
        <div className="rounded-3xl bg-surface p-5 shadow-sm">
          <div className="flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-tint">
              <BookOpen size={22} className="text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-text-primary">{verse.reference}</p>
              <p className="line-clamp-2 text-sm text-text-secondary">{verse.text}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 divide-x divide-[color:var(--color-divider)] text-center">
            <div>
              <p className="text-xl font-extrabold text-primary">{verse.totalReviews}</p>
              <p className="text-[11px] text-text-muted">{t('history.reviews', 'Revisions')}</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-primary">
                {verse.averageStability.toFixed(1)}j
              </p>
              <p className="text-[11px] text-text-muted">{t('history.stability', 'Stabilite')}</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-primary">{progress}%</p>
              <p className="text-[11px] text-text-muted">{t('history.success', 'Reussite')}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-base font-bold text-text-primary">
            {t('history.timeline', 'Chronologie des revisions')}
          </h2>
          <div className="space-y-3">
            {logs.map((log, i) => {
              const cfg = ratingConfig(log.rating);
              return (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={'flex h-8 w-8 items-center justify-center rounded-full ' + cfg.cls}
                    >
                      <cfg.Icon size={14} />
                    </span>
                    {i < logs.length - 1 && (
                      <span className="mt-1 w-0.5 flex-1 bg-[color:var(--color-divider)]" />
                    )}
                  </div>
                  <div className="flex-1 rounded-2xl bg-surface p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-primary">
                        {formatTimestamp(log.answeredAt)}
                      </span>
                      <span
                        className={'rounded-full px-2.5 py-0.5 text-xs font-semibold ' + cfg.cls}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-text-muted">
                          {t('history.stability', 'Stabilite')}
                        </p>
                        <p className="font-medium text-text-primary">
                          {log.stabilityBefore.toFixed(1)}
                          <ArrowRight size={10} className="mx-1 inline text-text-muted" />
                          {log.stabilityAfter.toFixed(1)}j
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-text-muted">
                          {t('history.difficulty', 'Difficulte')}
                        </p>
                        <p className="font-medium text-text-primary">
                          {log.difficultyBefore.toFixed(1)}
                          <ArrowRight size={10} className="mx-1 inline text-text-muted" />
                          {log.difficultyAfter.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-base font-bold text-text-primary">
            {t('history.stats', 'Statistiques')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
                <TrendingUp size={20} />
              </span>
              <div>
                <p className="text-2xl font-extrabold text-text-primary">
                  {(verse.averageStability * 10).toFixed(0)}%
                </p>
                <p className="text-xs text-text-muted">
                  {t('history.retention', 'Retention estimee')}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-surface p-4 text-center shadow-sm">
              <p className="text-2xl font-extrabold text-success">{goodOrEasy}</p>
              <p className="text-xs text-text-muted">{t('history.goodEasy', 'Bon / Facile')}</p>
            </div>
            <div className="rounded-2xl bg-surface p-4 text-center shadow-sm">
              <p className="text-2xl font-extrabold text-error">
                {logs.filter((h) => h.rating === Rating.AGAIN).length}
              </p>
              <p className="text-xs text-text-muted">{t('history.toReview', 'A revoir')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-surface p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Medal size={20} className="text-warning" />
            <p className="text-base font-bold text-text-primary">
              {t('history.mastery', 'Niveau de maitrise')}
            </p>
          </div>
          <span className="inline-block rounded-full bg-surface-tint px-4 py-1.5 text-sm font-semibold text-primary">
            {verse.masteryLevel}
          </span>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-tint">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: Math.min(100, verse.averageStability * 10) + '%' }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-text-muted">
            {verse.averageStability.toFixed(1)}
            {t('history.daysOfStability', ' jours de stabilite')}
          </p>
        </div>

        <Button variant="default" className="w-full" onClick={() => navigate('/review/queue')}>
          {t('history.backQueue', 'Retour a la file')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
