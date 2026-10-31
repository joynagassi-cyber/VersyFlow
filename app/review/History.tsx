import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  BookOpen01Icon as BookOpen,
  ArrowRight01Icon as ArrowRight,
  TrendingUpIcon as TrendingUp,
  CheckmarkCircle02Icon as CheckCircle2,
  RefreshIcon as RefreshCw,
  Medal01Icon as Medal,
  CalendarClockIcon as CalendarClock,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Rating } from '@/services/review-rating-service';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import {
  getReviewLogRepository,
  getSyncUserIdProvider,
} from '@/infrastructure/repository/powersync-repositories';
import type {
  MemorizationRecord,
  ReviewLogEntry as DomainReviewLogEntry,
} from '@/domains/memorization/entities';
import { normalizeLocaleCode } from '@/domains/i18n/config';
import { formatProgressLabel } from '@/lib/progress-label';
import { cn } from '@/lib/utils';

interface HistoryItem {
  id: string;
  recordId: string;
  reference: string;
  verseText: string;
  answeredAt: number;
  rating: Rating | 'legacy';
  stabilityBefore: number;
  stabilityAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
  legacyTotalReviews?: number;
}

const RATING_MAP: Record<DomainReviewLogEntry['rating'], Rating> = {
  again: Rating.AGAIN,
  hard: Rating.HARD,
  good: Rating.GOOD,
  easy: Rating.EASY,
};

function ratingConfig(rating: Rating | 'legacy') {
  if (rating === 'legacy') {
    return {
      cls: 'bg-surface-tint text-text-primary',
      labelKey: 'history.lastKnown',
      label: 'Dernière connue',
      Icon: CalendarClock,
    };
  }
  switch (rating) {
    case Rating.AGAIN:
      return {
        cls: 'bg-error text-on-status',
        labelKey: 'session.ratingAgain',
        label: 'À revoir',
        Icon: RefreshCw,
      };
    case Rating.HARD:
      return {
        cls: 'bg-warning text-on-status',
        labelKey: 'session.ratingHard',
        label: 'Difficile',
        Icon: RefreshCw,
      };
    case Rating.GOOD:
      return {
        cls: 'bg-success text-on-status',
        labelKey: 'session.ratingGood',
        label: 'Bon',
        Icon: CheckCircle2,
      };
    case Rating.EASY:
      return {
        cls: 'bg-info text-on-status',
        labelKey: 'session.ratingEasy',
        label: 'Facile',
        Icon: CheckCircle2,
      };
    default:
      return {
        cls: 'bg-primary text-on-primary',
        labelKey: 'session.ratingGood',
        label: 'Bon',
        Icon: CheckCircle2,
      };
  }
}

export default function ReviewHistoryScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = normalizeLocaleCode(i18n.resolvedLanguage || i18n.language);

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [reviewedRecords, setReviewedRecords] = useState<MemorizationRecord[]>([]);
  const [selectedVerseId, setSelectedVerseId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const records = await service.getAllMemorized();
        const recordsById = new Map(records.map((r) => [r.id, r]));
        const withReviews = records
          .filter((r) => r.reviewCount > 0)
          .sort((a, b) => (b.lastReviewedAt ?? 0) - (a.lastReviewedAt ?? 0));

        const userId = await getSyncUserIdProvider().resolveUserId();
        let domainLogs: DomainReviewLogEntry[] = [];
        if (userId) {
          domainLogs = await getReviewLogRepository()
            .listByUser(userId)
            .catch(() => []);
        }
        if (domainLogs.length === 0 && withReviews.length > 0) {
          const perRecord = await Promise.all(
            withReviews.map((r) =>
              getReviewLogRepository()
                .listByRecord(r.id)
                .catch(() => []),
            ),
          );
          domainLogs = perRecord.flat();
        }

        const loggedRecordIds = new Set<string>();
        const mapped: HistoryItem[] = domainLogs.map((log) => {
          loggedRecordIds.add(log.memorizationRecordId);
          const rec = recordsById.get(log.memorizationRecordId);
          return {
            id: log.id,
            recordId: log.memorizationRecordId,
            reference: rec?.bibleVerseReference || t('reviewCalendar.unknownVerse', 'Verset'),
            verseText: rec?.bibleVerseText || '',
            answeredAt: log.answeredAt,
            rating: RATING_MAP[log.rating] ?? Rating.AGAIN,
            stabilityBefore: log.stabilityBefore,
            stabilityAfter: log.stabilityAfter,
            difficultyBefore: log.difficultyBefore,
            difficultyAfter: log.difficultyAfter,
          };
        });

        // Compatibilité descendante : n'invente jamais d'anciennes séances, mais
        // expose honnêtement la dernière révision enregistrée sur un verset legacy.
        for (const rec of withReviews) {
          if (!loggedRecordIds.has(rec.id) && rec.lastReviewedAt) {
            mapped.push({
              id: `legacy-${rec.id}`,
              recordId: rec.id,
              reference: rec.bibleVerseReference,
              verseText: rec.bibleVerseText,
              answeredAt: rec.lastReviewedAt,
              rating: 'legacy',
              stabilityBefore: rec.fsrsState?.stability ?? 0,
              stabilityAfter: rec.fsrsState?.stability ?? 0,
              difficultyBefore: rec.fsrsState?.difficulty ?? 0,
              difficultyAfter: rec.fsrsState?.difficulty ?? 0,
              legacyTotalReviews: rec.reviewCount,
            });
          }
        }

        mapped.sort((a, b) => b.answeredAt - a.answeredAt);

        if (cancelled) return;
        setReviewedRecords(withReviews);
        setItems(mapped);
        setLoading(false);
      } catch (e) {
        console.error('[ReviewHistory] data load failed:', e);
        if (!cancelled) {
          setReviewedRecords([]);
          setItems([]);
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId, t]);

  const filteredItems = useMemo(
    () =>
      selectedVerseId === 'all'
        ? items
        : items.filter((item) => item.recordId === selectedVerseId),
    [items, selectedVerseId],
  );

  const groupedByDay = useMemo(() => {
    const groups: Array<{ dayKey: string; dayLabel: string; entries: HistoryItem[] }> = [];
    const indexByKey = new Map<string, number>();

    for (const entry of filteredItems) {
      const date = new Date(entry.answeredAt);
      const key = date.toISOString().slice(0, 10);
      let idx = indexByKey.get(key);
      if (idx === undefined) {
        const diffDays = Math.floor((Date.now() - entry.answeredAt) / 86_400_000);
        const dayLabel =
          diffDays === 0
            ? t('history.today', "Aujourd'hui")
            : diffDays === 1
              ? t('history.yesterday', 'Hier')
              : date.toLocaleDateString(locale, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                });
        idx = groups.length;
        indexByKey.set(key, idx);
        groups.push({ dayKey: key, dayLabel, entries: [] });
      }
      groups[idx].entries.push(entry);
    }
    return groups;
  }, [filteredItems, locale, t]);

  const selectedRecord = useMemo(
    () => reviewedRecords.find((r) => r.id === selectedVerseId) ?? null,
    [reviewedRecords, selectedVerseId],
  );

  const avgStability = useMemo(() => {
    if (reviewedRecords.length === 0) return 0;
    const total = reviewedRecords.reduce((acc, r) => acc + (r.fsrsState?.stability ?? 0), 0);
    return total / reviewedRecords.length;
  }, [reviewedRecords]);

  if (loading) {
    return (
      <FullScreenPage title={t('nav.history', 'Historique')} showBack backPath="/review/queue">
        <div className="space-y-3" role="status">
          <div className="h-24 rounded-3xl bg-surface-tint" />
          <div className="h-24 rounded-3xl bg-surface-tint" />
          <p className="text-center text-sm text-text-muted">
            {t('common.loading', 'Chargement...')}
          </p>
        </div>
      </FullScreenPage>
    );
  }

  if (items.length === 0 && reviewedRecords.length === 0) {
    return (
      <FullScreenPage title={t('nav.history', 'Historique')} showBack backPath="/review/queue">
        <EmptyState
          icon={<DuoIcon icon={BookOpen} size={28} />}
          title={t('history.emptyTitle', 'Aucune révision enregistrée')}
          description={t(
            'history.emptyDesc',
            'Vos séances de révision apparaîtront ici par ordre chronologique dès votre première révision.',
          )}
          actionLabel={t('review.startReview', 'Commencer la révision')}
          onAction={() => navigate('/review/queue')}
        />
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage
      title={t('nav.history', 'Historique')}
      subtitle={t('history.chronologicalSubtitle', 'Chronologie et liste complète')}
      showBack
      backPath="/review/queue"
    >
      <div className="screen-column-narrow space-y-5 pb-8">
        {/* Synthèse globale ou du verset filtré */}
        <section className="rounded-3xl bg-surface p-5 shadow-sm">
          {selectedRecord ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold text-text-primary">
                  {selectedRecord.bibleVerseReference}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-tint px-3 py-1 text-xs font-bold text-primary">
                  <DuoIcon icon={Medal} size={14} />
                  {selectedRecord.status === 'mastered'
                    ? t('history.mastered', 'Maîtrisé')
                    : t('history.inProgress', 'En cours')}
                </span>
              </div>
              <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">
                {selectedRecord.bibleVerseText}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
                <div>
                  <p className="text-xs text-text-muted">
                    {t('history.totalReviews', 'Révisions enregistrées')}
                  </p>
                  <p className="text-xl font-extrabold text-primary tabular-nums">
                    {selectedRecord.reviewCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">
                    {t('history.stability', 'Stabilité FSRS')}
                  </p>
                  <p className="text-xl font-extrabold text-primary tabular-nums">
                    {(selectedRecord.fsrsState?.stability ?? 0).toFixed(1)} j
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="stat-value text-2xl">{items.length}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {formatProgressLabel(
                    t('history.sessionsCount', 'Séances'),
                    items.length,
                    locale,
                  )}
                </p>
              </div>
              <div>
                <p className="stat-value text-2xl">{reviewedRecords.length}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {formatProgressLabel(
                    t('progress.versesMemorized', 'Versets mémorisés'),
                    reviewedRecords.length,
                    locale,
                  )}
                </p>
              </div>
              <div>
                <p className="stat-value text-2xl">{avgStability.toFixed(1)} j</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {t('history.avgStability', 'Stabilité moy.')}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Filtre par verset */}
        {reviewedRecords.length > 1 && (
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('history.filterByVerse', 'Filtrer par verset')}
          >
            <button
              type="button"
              aria-pressed={selectedVerseId === 'all'}
              onClick={() => setSelectedVerseId('all')}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                selectedVerseId === 'all'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-text-secondary shadow-sm',
              )}
            >
              {t('history.allVerses', 'Tous les versets')} ({items.length})
            </button>
            {reviewedRecords.map((rec) => {
              const active = selectedVerseId === rec.id;
              return (
                <button
                  type="button"
                  key={rec.id}
                  aria-pressed={active}
                  onClick={() => setSelectedVerseId(rec.id)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    active
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface text-text-secondary shadow-sm',
                  )}
                >
                  {rec.bibleVerseReference}
                </button>
              );
            })}
          </div>
        )}

        {/* Timeline groupée par jour + liste détaillée */}
        <div className="space-y-5">
          {groupedByDay.map((group) => (
            <section key={group.dayKey} aria-label={group.dayLabel} className="space-y-2.5">
              <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-text-muted">
                {group.dayLabel}
              </h3>
              <ol className="relative space-y-3 border-s-2 border-border/70 ps-4">
                {group.entries.map((entry) => {
                  const cfg = ratingConfig(entry.rating);
                  const Icon = cfg.Icon;
                  const delta = entry.stabilityAfter - entry.stabilityBefore;
                  return (
                    <li
                      key={entry.id}
                      className="relative rounded-2xl bg-surface p-4 shadow-sm"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -start-[21px] top-5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-extrabold text-text-primary">
                            {entry.reference}
                          </p>
                          <p className="text-xs text-text-muted">
                            {new Date(entry.answeredAt).toLocaleTimeString(locale, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
                            cfg.cls,
                          )}
                        >
                          <DuoIcon icon={Icon} size={13} />
                          {t(cfg.labelKey, cfg.label)}
                        </span>
                      </div>

                      {entry.verseText && selectedVerseId === 'all' && (
                        <p className="mt-2 line-clamp-2 font-serif text-xs leading-relaxed text-text-secondary">
                          {entry.verseText}
                        </p>
                      )}

                      {entry.rating === 'legacy' ? (
                        <p className="mt-2 text-xs text-text-muted">
                          {t(
                            'history.legacyNotice',
                            'Dernière révision connue ({{count}} au total) — les séances antérieures ne sont pas reconstituées.',
                            { count: entry.legacyTotalReviews ?? 1 },
                          )}
                        </p>
                      ) : (
                        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border/50 pt-2.5 text-xs text-text-secondary">
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <DuoIcon icon={TrendingUp} size={14} className="text-primary" />
                            {t('history.stability', 'Stabilité FSRS')} :{' '}
                            <strong>{entry.stabilityBefore.toFixed(1)}j</strong>
                            <DuoIcon icon={ArrowRight} size={12} />
                            <strong>{entry.stabilityAfter.toFixed(1)}j</strong>
                            {delta !== 0 && (
                              <span className={delta > 0 ? 'text-success' : 'text-error'}>
                                ({delta > 0 ? '+' : ''}
                                {delta.toFixed(1)}j)
                              </span>
                            )}
                          </span>
                          <span className="tabular-nums text-text-muted">
                            {t('history.difficulty', 'Difficulté')} :{' '}
                            {entry.difficultyAfter.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/review/calendar')}
          >
            <DuoIcon icon={CalendarClock} size={16} />
            {t('review.todayReviews', 'Calendrier de révision')}
          </Button>
          <Button className="flex-1" onClick={() => navigate('/review/queue')}>
            {t('review.startReview', 'Commencer la révision')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}
