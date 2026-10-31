/**
 * Review Queue Screen — list of verses due for review
 * Real data via ReviewQueueService; Tailwind + i18n + Lucide.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ListIcon as List,
  AlertCircleIcon as AlertCircle,
  CheckmarkCircle01Icon as CheckCircle,
  Clock01Icon as Clock,
  PlayIcon as Play,
} from '@/components/ui/solar-icons';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { relativeDayLabel } from '@/lib/relative-day';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ReviewQueueService } from '@/services/review-queue-service';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import { LoadingBlock } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface ReviewItem {
  record: MemorizationRecord;
  isOverdue: boolean;
}

export default function ReviewQueueScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const service = getMemorizationService(profileId);
      const queue = new ReviewQueueService(service, getFsrsEngine(), profileId);
      const prioritized = await queue.getPrioritizedQueue();
      const now = Date.now();
      setItems(
        prioritized.map((r) => ({
          record: r,
          isOverdue: r.nextReviewAt !== null && r.nextReviewAt < now,
        })),
      );
    } catch (error) {
      console.error('[ReviewQueue] load failed:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
}, [profileId]);

  const overdue = items.filter((i) => i.isOverdue);
  const due = items.filter((i) => !i.isOverdue);
  const totalDue = items.length;
  const estimatedTime = Math.ceil(totalDue * 2.5);

  // Une seule règle de date pour toute l'app : le jour de CALENDRIER local,
  // formaté par Intl dans la langue de l'utilisateur (45 locales), et non un
  // ternaire français/anglais doublé d'un arrondi en tranches de 24 h.
  const formatDate = (timestamp: number | null) =>
    timestamp ? relativeDayLabel(timestamp, i18n.resolvedLanguage || i18n.language) : '';

  const renderSection = (title: string, list: ReviewItem[], icon: React.ReactNode) =>
    list.length === 0 ? null : (
      <section className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          {icon}
          <h2 className="card-title flex-1">{title}</h2>
          <span className="rounded-full bg-surface-tint px-2.5 py-0.5 text-sm font-semibold text-text-muted">
            {list.length}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {list.map(({ record, isOverdue: over }) => {
            const ref =
              record.bibleVerseReference ||
              `${record.bookId} ${record.chapterNumber}:${record.verseNumber}`;
            return (
              <button
                key={record.id}
                onClick={() =>
                  navigate(`/review/session?recordId=${encodeURIComponent(record.id)}`)
                }
                className={cn(
                  'g2 relative overflow-hidden p-4 pl-6 text-left',
                  over && 'ring-1 ring-error',
                )}
              >
                <span
                  className={cn(
                    'absolute bottom-0 left-0 top-0 w-1',
                    over ? 'bg-error' : 'bg-primary',
                  )}
                />
                <div className="flex items-center justify-between">
                  <span className="card-title">{ref}</span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-2xs font-semibold',
                      over ? 'bg-error text-on-status' : 'bg-primary text-on-primary',
                    )}
                  >
                    {over ? t('review.overdue', 'En retard') : t('review.dueSoon', "À l'heure")}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-text-secondary">
                  {record.bibleVerseText}
                </p>
                <div className="mt-2 text-xs text-text-muted">
                  {formatDate(record.nextReviewAt)}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );

  if (loading) {
    return (
      <FullScreenPage title={t('review.todayReviews', 'Révisions du jour')} backPath="/tabs/home" column="narrow">
        <LoadingBlock label={t('common.loading', 'Chargement des révisions...')} />
      </FullScreenPage>
    );
  }

  if (totalDue === 0) {
    return (
      <FullScreenPage title={t('review.todayReviews', 'Révisions du jour')} backPath="/tabs/home" column="narrow">
        <EmptyState
          className="border-0 py-16"
          icon={<DuoIcon icon={CheckCircle} size={32} className="text-success" />}
          title={t('home.noReviews', 'Tout est à jour')}
          description={t(
            'review.historyEmptyHint',
            'Vous n’avez aucune révision à faire pour le moment.',
          )}
          actionLabel={t('common.backToHome', 'Retour à l’accueil')}
          onAction={() => navigate('/tabs/home')}
        />
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage title={t('review.todayReviews', 'Révisions du jour')} backPath="/tabs/home" column="narrow">
      {/* Summary strip */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary">
          <DuoIcon icon={List} size={14} />
          {t('review.totalDue', { count: totalDue })}
        </span>
        {overdue.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-error px-3 py-1.5 text-sm font-semibold text-on-status">
            <DuoIcon icon={AlertCircle} size={14} />
            {overdue.length} {t('review.overdue', 'en retard')}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-3 py-1.5 text-sm font-semibold text-text-secondary">
          <DuoIcon icon={Clock} size={14} />
          {t('review.estimatedTime', { minutes: estimatedTime })}
        </span>
      </div>

      {renderSection(
        t('review.overdue', 'En retard'),
        overdue,
        <DuoIcon icon={AlertCircle} size={18} className="text-error" />,
      )}
      {renderSection(
        t('review.dueSoon', "À l'heure"),
        due,
        <DuoIcon icon={CheckCircle} size={18} className="text-primary" />,
      )}

      {/* Start CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/95 p-4 backdrop-blur">
        <Button className="w-full" onClick={() => navigate(`/review/session?recordId=${encodeURIComponent(items[0].record.id)}`)}>
          <DuoIcon icon={Play} size={18} />
          {t('review.startReview', 'Commencer la révision')}
          <span className="text-on-primary/80">({totalDue})</span>
        </Button>
      </div>
      <div className="h-24" />
    </FullScreenPage>
  );
}
