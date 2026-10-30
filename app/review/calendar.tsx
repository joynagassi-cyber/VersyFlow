/**
 * Review Calendar Screen — upcoming review schedule.
 * Due counts are derived from real records' nextReviewAt dates.
 * Tailwind + i18n + Lucide.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
  FlameIcon as Flame,
  BookOpen01Icon as BookOpen,
  TrendingUpIcon as TrendingUp,
} from '@/components/ui/solar-icons';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import { getMemorizationService } from '@/services/memorization-service-factory';
import type { ProgressStats } from '@/services/stats-calculator';
import type {
  MemorizationRecord,
  ReviewLogEntry,
} from '@/domains/memorization/entities';
import { getReviewLogRepository, getSyncUserIdProvider } from '@/infrastructure/repository/powersync-repositories';
import { formatProgressLabel } from '@/lib/progress-label';
import { normalizeLocaleCode } from '@/domains/i18n/config';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const RATING_LABELS: Record<ReviewLogEntry['rating'], { fr: string; en: string }> = {
  again: { fr: 'À revoir', en: 'Again' },
  hard: { fr: 'Difficile', en: 'Hard' },
  good: { fr: 'Bon', en: 'Good' },
  easy: { fr: 'Facile', en: 'Easy' },
};

interface DayEvent {
  id: string;
  at: number;
  kind: 'review' | 'legacy-review' | 'created';
  reference: string;
  recordId?: string;
  rating?: ReviewLogEntry['rating'];
  legacyCount?: number;
}

export default function ReviewCalendarScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [dueByDay, setDueByDay] = useState<Map<string, number>>(new Map());
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [records, setRecords] = useState<MemorizationRecord[]>([]);
  const [logs, setLogs] = useState<ReviewLogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const [progress, records] = await Promise.all([
          new ProgressService(service, getFsrsEngine(), undefined, profileId).getStats(),
          service.getAllMemorized(),
        ]);
        // Historique complet : les journaux de révision sont append-only, ils
        // portent chaque révision (pas seulement la dernière du verset).
        const userId = await getSyncUserIdProvider().resolveUserId();
        const reviewLogs = userId
          ? await getReviewLogRepository().listByUser(userId).catch(() => [])
          : [];
        if (cancelled) return;
        setStats(progress);
        setRecords(records);
        setLogs(reviewLogs);
        const map = new Map<string, number>();
        for (const r of records) {
          if (!r.nextReviewAt) continue;
          const key = new Date(r.nextReviewAt).toDateString();
          map.set(key, (map.get(key) ?? 0) + 1);
        }
        setDueByDay(map);
      } catch (error) {
        console.error('[ReviewCalendar] load failed:', error);
        if (!cancelled) setStats(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const daysInMonth = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const total = new Date(year, m + 1, 0).getDate();
    const firstWeekday = (new Date(year, m, 1).getDay() + 6) % 7; // Monday-first
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(year, m, d));
    return cells;
  }, [month]);

  const today = new Date();
  const dayKey = (ts: number) => new Date(ts).toDateString();

  const recordsById = useMemo(
    () => new Map(records.map((record) => [record.id, record])),
    [records],
  );

  /**
   * Agenda complet : une entrée par révision (`review_logs`, append-only) plus
   * une entrée par mémorisation ajoutée. On n'affiche donc plus seulement la
   * « dernière révision » de chaque verset.
   */
  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    const loggedRecordIds = new Set<string>();
    const push = (ts: number, event: DayEvent) => {
      const key = dayKey(ts);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    };
    for (const log of logs) {
      loggedRecordIds.add(log.memorizationRecordId);
      const record = recordsById.get(log.memorizationRecordId);
      push(log.answeredAt, {
        id: `log-${log.id}`,
        at: log.answeredAt,
        kind: 'review',
        recordId: log.memorizationRecordId,
        reference: record?.bibleVerseReference ?? t('reviewCalendar.unknownVerse', 'Verset'),
        rating: log.rating,
      });
    }
    for (const record of records) {
      // Compatibilité descendante : un verset déjà révisé avant l'introduction
      // de `review_logs` conserve sa dernière date connue sans inventer les
      // séances précédentes.
      if (record.reviewCount > 0 && record.lastReviewedAt && !loggedRecordIds.has(record.id)) {
        push(record.lastReviewedAt, {
          id: `legacy-${record.id}`,
          at: record.lastReviewedAt,
          kind: 'legacy-review',
          recordId: record.id,
          reference: record.bibleVerseReference,
          legacyCount: record.reviewCount,
        });
      }
      if (!record.createdAt) continue;
      push(record.createdAt, {
        id: `created-${record.id}`,
        at: record.createdAt,
        kind: 'created',
        recordId: record.id,
        reference: record.bibleVerseReference,
      });
    }
    for (const list of map.values()) list.sort((a, b) => b.at - a.at);
    return map;
  }, [logs, records, recordsById, t]);

  const locale = normalizeLocaleCode(i18n.resolvedLanguage || i18n.language);
  const selectedEvents = eventsByDay.get(selectedDay.toDateString()) ?? [];
  const recentReviews = useMemo(() => {
    const loggedRecordIds = new Set(logs.map((l) => l.memorizationRecordId));
    const legacyFallback: Array<{
      id: string;
      memorizationRecordId: string;
      answeredAt: number;
      rating?: ReviewLogEntry['rating'];
      legacyCount?: number;
    }> = records
      .filter((r) => r.reviewCount > 0 && r.lastReviewedAt && !loggedRecordIds.has(r.id))
      .map((r) => ({
        id: `legacy-${r.id}`,
        memorizationRecordId: r.id,
        answeredAt: r.lastReviewedAt!,
        legacyCount: r.reviewCount,
      }));
    return [
      ...logs.map((l) => ({
        id: l.id,
        memorizationRecordId: l.memorizationRecordId,
        answeredAt: l.answeredAt,
        rating: l.rating,
      })),
      ...legacyFallback,
    ]
      .sort((a, b) => b.answeredAt - a.answeredAt)
      .slice(0, 8);
  }, [logs, records]);
  const monthLabel = month.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (delta: number) => {
    setMonth((prev) => {
      return new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
    });
  };

  const changeMonth = (label: string) =>
    i18n.language === 'fr'
      ? label.charAt(0).toUpperCase() + label.slice(1)
      : label;

  const legendItems = [
    { key: 'review', label: t('review.dueSoon', "À réviser"), cls: 'bg-primary' },
    { key: 'memorized', label: t('reviewCalendar.created', 'Mémorisation ajoutée'), cls: 'bg-primary' },
    { key: 'today', label: i18n.language === 'fr' ? "Aujourd'hui" : 'Today', cls: 'bg-surface-tint ring-2 ring-primary' },
  ];

  const monthSummary = [
    { value: stats?.streakCount ?? 0, label: t('progress.streak', 'Jours de série'), icon: <DuoIcon icon={Flame} size={14} /> },
    { value: stats?.totalVerses ?? 0, label: formatProgressLabel(t('progress.versesMemorized', 'Versets mémorisés'), stats?.totalVerses ?? 0, i18n.resolvedLanguage || i18n.language), icon: <DuoIcon icon={BookOpen} size={14} /> },
    {
      value: `${stats ? Math.round((stats.masteredVerses / Math.max(1, stats.totalVerses)) * 100) : 0}%`,
      label: t('progress.retention', 'Taux de rétention'),
      icon: <DuoIcon icon={TrendingUp} size={14} />,
    },
  ];

  return (
    <FullScreenPage title={t('review.todayReviews', 'Calendrier de révision')} backPath="/review/queue">
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => shiftMonth(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-sm"
          aria-label="Mois précédent"
        >
          <DuoIcon icon={ChevronLeft} size={20} className="text-primary" />
        </button>
        <h2 className="text-lg font-bold text-text-primary">
          {changeMonth(monthLabel)}
        </h2>
        <button
          onClick={() => shiftMonth(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-sm"
          aria-label="Mois suivant"
        >
          <DuoIcon icon={ChevronRight} size={20} className="text-primary" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="mb-2 flex justify-around rounded-xl bg-surface-tint px-2 py-3">
        {WEEKDAYS.map((w) => (
          <span key={w} className="flex-1 text-center text-xs font-semibold text-text-muted">
            {w}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
          const isToday = date.toDateString() === today.toDateString();
          const due = dueByDay.get(date.toDateString()) ?? 0;
          const created = records.filter((record) => new Date(record.createdAt).toDateString() === date.toDateString()).length;
          const reviewed = (eventsByDay.get(date.toDateString()) ?? []).filter(
            (event) => event.kind === 'review' || event.kind === 'legacy-review',
          ).length;
          const selected = date.toDateString() === selectedDay.toDateString();
          return (
            <button
              type="button"
              key={date.toDateString()}
              onClick={() => setSelectedDay(date)}
              aria-pressed={selected}
              aria-label={`${date.toLocaleDateString(locale, { dateStyle: 'full' })} · ${t('reviewCalendar.createdCount', { count: created, defaultValue: '{{count}} ajout(s)' })} · ${t('reviewCalendar.reviewedCount', { count: reviewed, defaultValue: '{{count}} révision(s)' })} · ${t('reviewCalendar.dueCount', { count: due, defaultValue: '{{count}} à réviser' })}`}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm',
                due > 0 && 'bg-primary/10 font-semibold text-primary',
                (isToday || selected) && 'ring-2 ring-primary',
              )}
            >
              <span className={cn(isToday ? 'font-bold text-primary' : 'text-text-primary')}>
                {date.getDate()}
              </span>
              {created > 0 && <span className="review-calendar-dot" aria-hidden="true" />}
              {reviewed > 0 && (
                <span className="text-[9px] font-semibold leading-none text-text-muted" aria-hidden="true">
                  {reviewed}
                </span>
              )}
              {due > 0 && (
                <span
                  className={cn(
                    'mt-0.5 rounded-full px-1.5 text-[10px] font-bold text-[color:var(--on)]',
                    'bg-primary',
                  )}
                >
                  {due}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-around rounded-xl bg-surface px-3 py-3">
        {legendItems.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span className={cn('h-3 w-3 rounded-full', item.cls)} />
            <span className="text-xs text-text-tertiary">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Month summary */}
      <div className="mt-4 rounded-2xl bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-text-primary">
          {t('progress.yourProgress', 'Résumé du mois')}
        </h3>
        <div className="flex justify-around">
          {monthSummary.map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-tint text-primary">
                {item.icon}
              </span>
              <p className="mt-2 text-2xl font-extrabold text-primary">{item.value}</p>
              <p className="text-xs text-text-tertiary">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <section
        className="g2 review-timeline"
        aria-label={t('reviewCalendar.timeline', 'Activité du jour')}
      >
        <h3>{t('reviewCalendar.timeline', 'Activité du jour')}</h3>
        <p>{selectedDay.toLocaleDateString(locale, { dateStyle: 'full' })}</p>
        {selectedEvents.length === 0 ? (
          <p>{t('reviewCalendar.empty', 'Aucune activité enregistrée ce jour.')}</p>
        ) : (
          <ol>
            {selectedEvents.map((event) => {
              const record = event.recordId ? recordsById.get(event.recordId) : undefined;
              return (
                <li key={event.id}>
                  <strong>{event.reference}</strong>
                  <span>
                    {new Date(event.at).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' · '}
                    {event.kind === 'review'
                      ? t(
                          'reviewCalendar.reviewRated',
                          'Révision notée « {{rating}} »',
                          {
                            rating: event.rating
                              ? RATING_LABELS[event.rating][
                                  locale.startsWith('fr') ? 'fr' : 'en'
                                ]
                              : '—',
                          },
                        )
                      : event.kind === 'legacy-review'
                        ? t(
                            'reviewCalendar.legacyReview',
                            'Dernière révision connue ({{count}} au total)',
                            { count: event.legacyCount ?? 1 },
                          )
                        : t('reviewCalendar.added', 'Ajouté à la mémorisation')}
                  </span>
                  {record?.bibleVerseText && <p>{record.bibleVerseText}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="g2 review-timeline" aria-label={t('reviewCalendar.historyTitle', 'Historique récent')}>
        <h3>{t('reviewCalendar.historyTitle', 'Historique récent')}</h3>
        {recentReviews.length === 0 ? (
          <p>{t('reviewCalendar.emptyHistory', 'Aucune révision enregistrée pour l’instant.')}</p>
        ) : (
          <ol>
            {recentReviews.map((log) => {
              const record = recordsById.get(log.memorizationRecordId);
              return (
                <li key={log.id}>
                  <strong>{record?.bibleVerseReference ?? t('reviewCalendar.unknownVerse', 'Verset')}</strong>
                  <span>
                    {new Date(log.answeredAt).toLocaleDateString(locale, {
                      dateStyle: 'medium',
                    })}
                    {' · '}
                    {log.rating
                      ? RATING_LABELS[log.rating][locale.startsWith('fr') ? 'fr' : 'en']
                      : t('reviewCalendar.legacyShort', 'Dernière révision connue')}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <Button
          className="mt-3 w-full"
          variant="outline"
          onClick={() => navigate('/review/history')}
        >
          {t('reviewCalendar.openHistory', 'Ouvrir l’historique complet')}
        </Button>
      </section>

      <Button className="mt-4 w-full" onClick={() => navigate('/review/queue')}>
        {t('review.startReview', 'Commencer la révision')}
      </Button>
    </FullScreenPage>
  );
}
