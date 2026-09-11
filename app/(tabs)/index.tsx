/**
 * Home Tab — Main screen after onboarding
 * Real data: streak (StreakService), due reviews (MemorizationService),
 * recently memorized verses (MemorizationService).
 * Tailwind + i18n + Lucide.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  BrainCircuit,
  FileText,
  Repeat,
  BarChart3,
  Users,
  Flame,
  Star,
  Clock,
  ChevronRight,
  CircleUserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamilyStore } from '@/store/family-store';
import { MmkvStorage } from '@/infrastructure/storage';
import { MemorizationService } from '@/domains/memorization/service';
import { Sm2FallbackEngine } from '@/domains/fsrs';
import { StreakService } from '@/services/streak-service';
import type { MemorizationRecord } from '@/domains/memorization/entities';

// ─── Shared services, cached per learner profile ────────────────────────────
const serviceByProfile = new Map<string, MemorizationService>();
const getMemorizationService = (profileId: string) => {
  if (!serviceByProfile.has(profileId)) {
    serviceByProfile.set(
      profileId,
      new MemorizationService(new MmkvStorage(), new Sm2FallbackEngine(), profileId),
    );
  }
  return serviceByProfile.get(profileId)!;
};

// Fallback "verse of the day" rotation (real records preferred when present)
const DAILY_VERSES_FALLBACK = [
  { ref: 'Jean 3:16', text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle." },
  { ref: 'Psaumes 23:1', text: "L'Éternel est mon berger: je ne manquerai de rien." },
  { ref: 'Philippiens 4:13', text: "Je puis tout par celui qui me fortifie." },
  { ref: 'Romains 8:28', text: "Nous savons au contraire que toutes choses concourent au bien de ceux qui aiment Dieu." },
  { ref: 'Ésaïe 40:31', text: "Mais ceux qui espèrent en l'Éternel renaîtront de nouvelles forces." },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { activeProfile } = useActiveProfile();
  const { families, activeFamilyId } = useFamilyStore();

  const [streak, setStreak] = useState<number | null>(null);
  const [reviewsDue, setReviewsDue] = useState<number | null>(null);
  const [recentVerses, setRecentVerses] = useState<MemorizationRecord[]>([]);

  const activeFamily = families.find((f) => f.id === activeFamilyId) || null;
  const profileId = activeProfile?.id ?? 'default';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const [due, streakCount, allRecords] = await Promise.all([
          service.getDueRecords(),
          new StreakService(service, profileId).calculateStreak(),
          service.getAllMemorized(),
        ]);
        if (cancelled) return;
        setReviewsDue(due.length);
        setStreak(streakCount);
        setRecentVerses(
          [...allRecords]
            .sort((a, b) => (b.lastReviewedAt ?? b.createdAt) - (a.lastReviewedAt ?? a.createdAt))
            .slice(0, 5),
        );
      } catch (error) {
        console.error('[Home] Data load failed:', error);
        if (!cancelled) {
          setReviewsDue(0);
          setStreak(0);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const todayVerse = DAILY_VERSES_FALLBACK[
    Math.floor(Date.now() / 86400000) % DAILY_VERSES_FALLBACK.length
  ];

  const dateLabel = new Date().toLocaleDateString(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const quickActions = [
    { icon: BookOpen, label: t('home.explore', 'Explorer la Bible'), desc: t('bible.explorer', 'Explorer la Bible'), color: 'text-primary', bg: 'bg-icon-bg-rose', action: () => navigate('/bible/explorer') },
    { icon: BrainCircuit, label: t('session.memorizing', 'Mémorisation'), desc: 'Nouveau verset', color: 'text-text-secondary', bg: 'bg-icon-bg-purple', action: () => navigate('/memorization/session') },
    { icon: FileText, label: 'Passage', desc: 'Multi-versets', color: 'text-info', bg: 'bg-icon-bg-blue', action: () => navigate('/bible/chapter') },
    { icon: Repeat, label: 'Réviser', desc: 'FSRS', color: 'text-success', bg: 'bg-icon-bg-green', action: () => navigate('/review/queue') },
    { icon: BarChart3, label: 'Progression', desc: 'Statistiques', color: 'text-primary', bg: 'bg-icon-bg-rose', action: () => navigate('/analytics/dashboard') },
    { icon: Users, label: 'Famille', desc: 'Partager', color: 'text-warning', bg: 'bg-icon-bg-orange', action: () => navigate('/family/home') },
  ];

  return (
    <div className="min-h-full overflow-y-auto bg-background p-4 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">
            {t('home.greeting', 'Bonjour')} 👋
          </h1>
          <p className="mt-1 text-sm capitalize text-text-muted">{dateLabel}</p>
          {activeFamily && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-icon-bg-rose px-2.5 py-1 text-xs font-semibold text-primary">
              <Users size={12} />
              {activeFamily.name}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/tabs/settings')}
          className="rounded-full bg-surface-tint p-2.5"
          aria-label={t('settings.settings', 'Paramètres')}
        >
          <CircleUserRound size={28} className="text-primary" />
        </button>
      </div>

      {/* Review reminder card */}
      {reviewsDue !== null && reviewsDue > 0 && (
        <button
          onClick={() => navigate('/review/queue')}
          className="mt-5 flex w-full items-center rounded-2xl bg-primary p-4 text-white shadow-rose transition-opacity active:opacity-90"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Clock size={22} />
          </span>
          <span className="ml-4 flex-1 text-left">
            <span className="block text-base font-bold">
              {t('home.reviewDue', { count: reviewsDue })}
            </span>
            <span className="mt-0.5 block text-xs text-white/85">
              {t('home.noReviews', 'Ne perdez pas votre progression — révisez maintenant')}
            </span>
          </span>
          <ChevronRight size={20} />
        </button>
      )}

      {/* Streak card */}
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface p-4 shadow-md">
        <div className="flex flex-1 items-center">
          <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-tint">
            <Flame size={28} className={cn(streak && streak >= 7 ? 'text-primary' : 'text-error')} />
          </div>
          <div>
            <p className="text-3xl font-extrabold leading-9 text-primary">
              {streak ?? '–'}
            </p>
            <p className="text-xs text-text-tertiary">
              {t('home.streak', { count: streak ?? 1 })}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/tabs/progress')}
          className="rounded-full bg-surface-tint px-4 py-2 text-sm font-semibold text-primary"
        >
          {t('home.goodJob', 'Voir détails')}
        </button>
      </div>

      {/* Quick actions grid */}
      <h2 className="mb-3 mt-8 text-lg font-bold text-text-primary">
        {t('home.explore', 'Actions rapides')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map(({ icon: Icon, label, desc, color, bg, action }) => (
          <button
            key={label}
            onClick={action}
            className="flex flex-col items-center rounded-2xl bg-surface p-4 shadow-sm transition-transform active:scale-[0.98]"
          >
            <span className={cn('mb-2 flex h-12 w-12 items-center justify-center rounded-full', bg)}>
              <Icon size={24} className={color} />
            </span>
            <span className="text-sm font-bold text-text-primary">{label}</span>
            <span className="mt-0.5 text-center text-[11px] text-text-muted">{desc}</span>
          </button>
        ))}
      </div>

      {/* Verse of the day */}
      <h2 className="mb-3 mt-8 text-lg font-bold text-text-primary">
        {t('home.dailyVerse', 'Verset du jour')}
      </h2>
      <div className="rounded-2xl bg-surface p-4 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-3 py-1.5 text-xs font-semibold text-primary">
            <Star size={13} />
            {t('home.dailyVerse', "Aujourd'hui")}
          </span>
          <button
            onClick={() => navigate('/memorization/session')}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white"
          >
            {t('bible.memorize', 'Mémoriser')}
          </button>
        </div>
        <p className="text-lg font-bold text-text-primary">{todayVerse.ref}</p>
        <p className="bible-text mt-2 text-base leading-7 text-text-secondary">
          {todayVerse.text}
        </p>
      </div>

      {/* Recently memorized */}
      <h2 className="mb-3 mt-8 text-lg font-bold text-text-primary">
        {t('progress.recentVerses', 'Récemment mémorisés')}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {recentVerses.length === 0 ? (
          <div className="w-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-muted">
            {t('bible.memorize', 'Aucun verset mémorisé pour le moment')}
          </div>
        ) : (
          recentVerses.map((verse) => (
            <button
              key={verse.id}
              onClick={() => navigate('/bible/chapter')}
              className="w-40 shrink-0 rounded-xl bg-surface p-4 text-left shadow-sm"
            >
              <span
                className={cn(
                  'mb-2 inline-block h-2 w-2 rounded-full',
                  verse.status === 'mastered' ? 'bg-success' : verse.status === 'in-progress' ? 'bg-primary' : 'bg-text-muted',
                )}
              />
              <p className="text-sm font-bold text-text-primary">
                {verse.bibleVerseReference || `${verse.bookId} ${verse.chapterNumber}:${verse.verseNumber}`}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-4 text-text-secondary">
                {verse.bibleVerseText}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
