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
  Users,
  Flame,
  Star,
  Clock,
  ChevronRight,
  CircleUserRound,
  Compass,
  Gem,
  ScrollText,
  CalendarClock,
  TrendingUp,
  HeartHandshake,
  Library,
  Feather,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamilyStore } from '@/store/family-store';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { StreakService } from '@/services/streak-service';
import { getMemorizationService } from '@/services/memorization-service-factory';
import type { MemorizationRecord } from '@/domains/memorization/entities';

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
    { icon: Compass, label: t('home.explore', 'Explorer la Bible'), desc: t('home.exploreDesc', 'Livre & chapitre'), color: 'text-primary', bg: 'bg-icon-bg-rose', action: () => navigate('/bible/explorer') },
    { icon: Gem, label: t('session.memorizing', 'Mémorisation'), desc: 'Nouveau verset', color: 'text-primary', bg: 'bg-icon-bg-purple', action: () => navigate('/memorization/session') },
    { icon: ScrollText, label: t('home.passage', 'Passage'), desc: t('home.passageDesc', 'Multi-versets'), color: 'text-info', bg: 'bg-icon-bg-blue', action: () => navigate('/bible/chapter') },
    { icon: CalendarClock, label: t('home.review', 'Réviser'), desc: t('home.reviewDesc', 'Méthode FSRS'), color: 'text-success', bg: 'bg-icon-bg-green', action: () => navigate('/review/queue') },
    { icon: TrendingUp, label: t('home.progress', 'Progression'), desc: t('home.progressDesc', 'Statistiques'), color: 'text-primary', bg: 'bg-icon-bg-rose', action: () => navigate('/analytics/dashboard') },
    { icon: HeartHandshake, label: t('home.family', 'Famille'), desc: t('home.familyDesc', 'Partager'), color: 'text-warning', bg: 'bg-icon-bg-orange', action: () => navigate('/family/home') },
    { icon: Library, label: t('home.bibleVersions', 'Versions de la Bible'), desc: t('home.bibleVersionsDesc', 'Téléchargées'), color: 'text-info', bg: 'bg-icon-bg-blue', action: () => navigate('/settings/available-translations') },
    { icon: Feather, label: t('home.notes', 'Notes & tags'), desc: 'Mémoire sémantique', color: 'text-primary', bg: 'bg-icon-bg-teal', action: () => navigate('/semantic') },
  ];

  return (
    <div className="h-full overflow-y-auto bg-background p-4 pb-24">
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

      {/* Hero card — streak + due reviews, premium gradient */}
      <div className="gradient-hero glow-primary relative mt-5 overflow-hidden rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              {t('home.streakLabel', 'Série de jours')}
            </p>
            <p className="mt-1 flex items-end gap-2">
              <span className="text-5xl font-black leading-none">
                {streak ?? '–'}
              </span>
              <Flame size={26} className="mb-1 text-white/90" />
            </p>
            <p className="mt-1 text-xs text-white/80">
              {t('home.streak', { count: streak ?? 1 })}
            </p>
          </div>
          <button
            onClick={() => navigate('/tabs/progress')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur active:scale-95"
            aria-label={t('home.goodJob', 'Voir détails')}
          >
            <TrendingUp size={20} />
          </button>
        </div>

        {reviewsDue !== null && reviewsDue > 0 && (
          <button
            onClick={() => navigate('/review/queue')}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-white/15 p-3.5 text-left backdrop-blur transition active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25">
              <Clock size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold">
                {t('home.reviewDue', { count: reviewsDue })}
              </span>
              <span className="block text-[11px] text-white/80">
                {t('home.noReviews', 'Ne perdez pas votre progression — révisez maintenant')}
              </span>
            </span>
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Quick actions grid */}
      <h2 className="mb-3 mt-8 text-lg font-bold text-text-primary">
        {t('home.quickActions', 'Actions rapides')}
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
              onClick={() =>
                navigate(
                  verse.bookId && verse.chapterNumber
                    ? `/bible/chapter/${verse.bookId}/${verse.chapterNumber}`
                    : '/bible/chapter',
                )
              }
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
