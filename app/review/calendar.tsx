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
import { relativeDayLabel } from '@/lib/relative-day';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import { getMemorizationService } from '@/services/memorization-service-factory';
import type { ProgressStats } from '@/services/stats-calculator';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import { formatProgressLabel } from '@/lib/progress-label';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const [progress, records] = await Promise.all([
          new ProgressService(service, getFsrsEngine(), undefined, profileId).getStats(),
          service.getAllMemorized(),
        ]);
        if (cancelled) return;
        setStats(progress);
        setRecords(records);
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
  const monthLabel = month.toLocaleDateString(i18n.language, {
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
    { key: 'today', label: relativeDayLabel(Date.now(), i18n.resolvedLanguage || i18n.language), cls: 'bg-surface-tint ring-2 ring-primary' },
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
          const selected = date.toDateString() === selectedDay.toDateString();
          return (
            <button
              key={date.toDateString()}
              onClick={() => setSelectedDay(date)}
              aria-pressed={selected}
              aria-label={`${date.toLocaleDateString(i18n.resolvedLanguage || i18n.language, { dateStyle: 'full' })} · ${t('reviewCalendar.createdCount', { count: created, defaultValue: '{{count}} ajout(s)' })} · ${t('reviewCalendar.dueCount', { count: due, defaultValue: '{{count}} à réviser' })}`}
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
              {due > 0 && (
                <span
                  className={cn(
                    'mt-0.5 rounded-full px-1.5 text-3xs font-bold text-on-primary',
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
      <div className="g2 mt-4 p-5">
        <h3 className="card-title mb-4">
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

      <section className="g2 review-timeline" aria-label={t('reviewCalendar.timeline', 'Activité du jour')}>
        <h3>{t('reviewCalendar.timeline', 'Activité du jour')}</h3>
        <p>{selectedDay.toLocaleDateString(i18n.resolvedLanguage || i18n.language, { dateStyle: 'full' })}</p>
        {records.filter((record) => new Date(record.createdAt).toDateString() === selectedDay.toDateString() || (record.lastReviewedAt && new Date(record.lastReviewedAt).toDateString() === selectedDay.toDateString())).length === 0 ?
          <p>{t('reviewCalendar.empty', 'Aucune activité enregistrée ce jour.')}</p> :
          <ol>{records.filter((record) => new Date(record.createdAt).toDateString() === selectedDay.toDateString() || (record.lastReviewedAt && new Date(record.lastReviewedAt).toDateString() === selectedDay.toDateString())).sort((a, b) => (b.lastReviewedAt ?? b.createdAt) - (a.lastReviewedAt ?? a.createdAt)).map((record) => <li key={record.id}>
            <strong>{record.bibleVerseReference}</strong>
            <span>{record.lastReviewedAt && new Date(record.lastReviewedAt).toDateString() === selectedDay.toDateString() ? t('reviewCalendar.reviewed', 'Dernière révision') : t('reviewCalendar.added', 'Ajouté à la mémorisation')}</span>
            <p>{record.bibleVerseText}</p>
          </li>)}</ol>}
      </section>

      <Button className="mt-4 w-full" onClick={() => navigate('/review/queue')}>
        {t('review.startReview', 'Commencer la révision')}
      </Button>
    </FullScreenPage>
  );
}
