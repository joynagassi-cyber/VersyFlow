/**
 * Review Queue Screen — list of verses due for review
 * Real data via ReviewQueueService; Tailwind + i18n + Lucide.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  List,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Loader2,
  Play,
} from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ReviewQueueService } from '@/services/review-queue-service';
import type { MemorizationRecord } from '@/domains/memorization/entities';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const overdue = items.filter((i) => i.isOverdue);
  const due = items.filter((i) => !i.isOverdue);
  const totalDue = items.length;
  const estimatedTime = Math.ceil(totalDue * 2.5);

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return '';
    const diffDays = Math.ceil((timestamp - Date.now()) / 86400000);
    if (diffDays < 0) {
      return t('review.overdue', `En retard de ${Math.abs(diffDays)} jour(s)`);
    }
    if (diffDays === 0) return i18n.language === 'fr' ? "Aujourd'hui" : 'Today';
    if (diffDays === 1) return i18n.language === 'fr' ? 'Demain' : 'Tomorrow';
    return i18n.language === 'fr' ? `Dans ${diffDays} jours` : `In ${diffDays} days`;
  };

  const renderSection = (title: string, list: ReviewItem[], icon: React.ReactNode) =>
    list.length === 0 ? null : (
      <section className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          {icon}
          <h2 className="flex-1 text-base font-bold text-text-primary">{title}</h2>
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
                  'relative overflow-hidden rounded-2xl bg-surface p-4 pl-6 text-left shadow-sm',
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
                  <p className="text-base font-bold text-text-primary">{ref}</p>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold text-white',
                      over ? 'bg-error' : 'bg-primary',
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
      <FullScreenPage title={t('review.todayReviews', 'Révisions du jour')} backPath="/tabs/home">
        <div className="flex flex-col items-center py-24">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="mt-4 text-sm text-text-muted">
            {t('common.loading', 'Chargement des révisions...')}
          </p>
        </div>
      </FullScreenPage>
    );
  }

  if (totalDue === 0) {
    return (
      <FullScreenPage title={t('review.todayReviews', 'Révisions du jour')} backPath="/tabs/home">
        <div className="flex flex-col items-center py-20 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-icon-bg-green">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-text-primary">
            {t('home.noReviews', 'Tout est à jour ! ✓')}
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            {i18n.language === 'fr'
              ? 'Vous n\'avez aucune révision à faire pour le moment.'
              : 'You have no reviews to do right now.'}
          </p>
          <Button className="mt-8" onClick={() => navigate('/tabs/home')}>
            {i18n.language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
          </Button>
        </div>
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage title={t('review.todayReviews', 'Révisions du jour')} backPath="/tabs/home">
      {/* Summary strip */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[13px] font-semibold text-white">
          <List size={14} />
          {t('review.totalDue', { count: totalDue })}
        </span>
        {overdue.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-error px-3 py-1.5 text-[13px] font-semibold text-white">
            <AlertCircle size={14} />
            {overdue.length} {t('review.overdue', 'en retard')}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-3 py-1.5 text-[13px] font-semibold text-text-secondary">
          <Clock size={14} />
          {t('review.estimatedTime', { minutes: estimatedTime })}
        </span>
      </div>

      {renderSection(
        t('review.overdue', 'En retard'),
        overdue,
        <AlertCircle size={18} className="text-error" />,
      )}
      {renderSection(
        t('review.dueSoon', "À l'heure"),
        due,
        <CheckCircle size={18} className="text-primary" />,
      )}

      {/* Start CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/95 p-4 backdrop-blur">
        <Button className="w-full" onClick={() => navigate(`/review/session?recordId=${encodeURIComponent(items[0].record.id)}`)}>
          <Play size={18} />
          {t('review.startReview', 'Commencer la révision')}
          <span className="text-white/80">({totalDue})</span>
        </Button>
      </div>
      <div className="h-24" />
    </FullScreenPage>
  );
}
