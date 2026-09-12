/**
 * Review Session Screen — immersive review with real FSRS rating.
 * Loads the prioritized due queue (ReviewQueueService), reveals word chips,
 * and persists ratings via MemorizationService + FSRS engine.
 * Tailwind + i18n + Lucide.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Bookmark, Hand, RefreshCw, RotateCcw, Star, Check, X } from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ReviewQueueService } from '@/services/review-queue-service';
import { Rating } from '@/domains/fsrs';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import { eventBus, DomainEventTypes } from '@/domains/events';

interface ReviewItem {
  record: MemorizationRecord;
  reference: string;
  text: string;
  words: string[];
}

export default function ReviewSessionScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [selected, setSelected] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ scheduledDays: number; label: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const queue = new ReviewQueueService(service, getFsrsEngine(), profileId);
        const prioritized = await queue.getPrioritizedQueue();
        if (cancelled) return;
        const startId = params.get('recordId');
        let list = prioritized.map((record) => ({
          record,
          reference:
            record.bibleVerseReference ||
            `${record.bookId} ${record.chapterNumber}:${record.verseNumber}`,
          text: record.bibleVerseText,
          words: record.bibleVerseText.split(/\s+/).filter(Boolean),
        }));
        if (startId) {
          const pos = list.findIndex((i) => i.record.id === startId);
          if (pos > 0) list = [...list.slice(pos), ...list.slice(0, pos)];
        }
        setItems(list);
        // Telemetry: a review session is now active. Count is derived from
        // the prioritized queue that the ReviewQueueService produced.
        const overdue = list.filter((i) => i.record.nextReviewAt && i.record.nextReviewAt <= Date.now()).length;
        eventBus.emit({
          id: crypto.randomUUID(),
          type: DomainEventTypes.REVIEW_SESSION_STARTED,
          timestamp: Date.now(),
          payload: {
            versesCount: list.length,
            overdueCount: overdue,
            scheduledCount: list.length - overdue,
          },
        });
      } catch (error) {
        console.error('[ReviewSession] load failed:', error);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const current = items[index];
  const progress = items.length > 0 ? ((index + 1) / items.length) * 100 : 0;

  const resetCard = () => {
    setRevealed(false);
    setShowRating(false);
    setSelected(null);
    setFeedback(null);
  };

  const goNext = () => {
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
      resetCard();
    } else {
      navigate('/review/summary', { replace: true });
    }
  };

  const rate = async (rating: Rating) => {
    if (!current) return;
    setSelected(rating);
    setShowRating(true);
    try {
      const engine = getFsrsEngine();
      const review = await engine.review(current.record.fsrsState, rating);
      await getMemorizationService(profileId).updateRecordAfterReview(
        current.record.id,
        rating,
        review.state,
        review.due.getTime(),
      );
      setFeedback({ scheduledDays: review.scheduledDays, label: ratingLabel(rating) });
    } catch (error) {
      console.error('[ReviewSession] rating failed:', error);
      setFeedback({ scheduledDays: 1, label: ratingLabel(rating) });
    }
  };

  const ratingLabel = (rating: Rating) => {
    switch (rating) {
      case Rating.AGAIN:
        return t('session.ratingAgain', 'À revoir');
      case Rating.HARD:
        return t('session.ratingHard', 'Difficile');
      case Rating.GOOD:
        return t('session.ratingGood', 'Bon');
      case Rating.EASY:
        return t('session.ratingEasy', 'Facile');
      default:
        return '';
    }
  };

  const ratingOptions = useMemo(
    () => [
      { rating: Rating.AGAIN, icon: <RotateCcw size={20} />, cls: 'bg-error text-white' },
      { rating: Rating.HARD, icon: <X size={20} />, cls: 'bg-warning text-white' },
      { rating: Rating.GOOD, icon: <Check size={20} />, cls: 'bg-success text-white' },
      { rating: Rating.EASY, icon: <Star size={20} />, cls: 'bg-info text-white' },
    ],
    [],
  );

  if (loading) {
    return (
      <FullScreenPage title={t('review.startReview', 'Révision')} backPath="/review/queue">
        <div className="flex flex-col items-center py-24">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="mt-4 text-sm text-text-muted">
            {t('common.loading', 'Chargement de la session...')}
          </p>
        </div>
      </FullScreenPage>
    );
  }

  if (!current) {
    return (
      <FullScreenPage title={t('review.todayReviews', 'Révisions du jour')} backPath="/review/queue">
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-lg font-semibold text-text-primary">
            {t('home.noReviews', 'Tout est à jour ! ✓')}
          </p>
          <Button className="mt-6" onClick={() => navigate('/review/queue')}>
            {t('review.startReview', 'Retour à la file')}
          </Button>
        </div>
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage
      title={t('review.startReview', 'Révision')}
      showBack={false}
      right={
        <button
          onClick={() => (index > 0 ? setIndex((i) => i - 1) : navigate('/review/queue'))}
          className="rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-text-secondary shadow-sm"
        >
          {index > 0 ? t('common.back', 'Précédent') : t('common.skip', 'Quitter')}
        </button>
      }
    >
      {/* Progress */}
      <div className="mb-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tint">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-center text-xs text-text-muted">
          {index + 1} / {items.length}
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-surface p-6 shadow-lg">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-3 py-1.5 text-xs font-semibold text-primary">
          <Bookmark size={14} />
          {current.reference}
        </span>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="flex w-full flex-col items-center gap-4 rounded-xl py-8"
          >
            <div className="flex flex-wrap justify-center gap-2">
              {current.words.map((_, i) => (
                <span
                  key={i}
                  className="rounded-full bg-surface-tint px-3 py-1.5 text-sm text-text-muted"
                >
                  •••
                </span>
              ))}
            </div>
            <span className="flex items-center gap-2 text-sm text-text-muted">
              <Hand size={16} className="text-primary" />
              {t('session.tapToReveal', 'Tape pour révéler le verset')}
            </span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="bible-text text-center text-lg leading-7 text-text-primary">
              {current.text}
            </p>
            <span className="flex items-center gap-2 border-t border-border pt-4 text-sm text-text-muted">
              <RefreshCw size={14} />
              {t('review.iRecalled', 'Comment te souvenais-tu de ce verset ?')}
            </span>
          </div>
        )}
      </div>

      {/* Rating */}
      {revealed && !showRating && (
        <div className="mt-5 grid grid-cols-4 gap-2">
          {ratingOptions.map(({ rating, icon, cls }) => (
            <button
              key={rating}
              onClick={() => rate(rating)}
              className={cn('flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-bold', cls)}
            >
              {icon}
              {ratingLabel(rating)}
            </button>
          ))}
        </div>
      )}

      {/* Feedback */}
      {showRating && feedback && selected && (
        <div className="mt-5 rounded-2xl bg-surface p-5 shadow-md">
          <div className="mb-3 flex items-center gap-2">
            <Check size={22} className="text-success" />
            <p className="text-lg font-bold text-text-primary">{feedback.label}</p>
          </div>
          <div className="flex items-center justify-between border-b border-divider pb-3">
            <span className="text-sm text-text-tertiary">
              {t('session.nextReview', 'Prochain rappel')}
            </span>
            <span className="text-sm font-semibold text-text-primary">
              {t('session.nextReview', { days: feedback.scheduledDays })}
            </span>
          </div>
          <Button className="mt-4 w-full" onClick={goNext}>
            {index < items.length - 1 ? t('session.proceed', 'Continuer') : t('common.done', 'Terminer')}
          </Button>
        </div>
      )}
    </FullScreenPage>
  );
}
