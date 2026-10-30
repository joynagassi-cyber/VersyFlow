/**
 * Home Tab — Main screen after onboarding
 * Real data: streak (StreakService), due reviews (MemorizationService),
 * recently memorized verses (MemorizationService).
 * Tailwind + i18n + Lucide.
 */

import { useState, useEffect, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeLocaleCode } from '@/domains/i18n/config';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  UsersIcon as Users,
  FlameIcon as Flame,
  Clock01Icon as Clock,
  UserCircleIcon as CircleUserRound,
  CompassIcon as Compass,
  GemIcon as Gem,
  ScrollTextIcon as ScrollText,
  CalendarClockIcon as CalendarClock,
  TrendingUpIcon as TrendingUp,
  HeartHandshakeIcon as HeartHandshake,
  LibraryIcon as Library,
  FeatherIcon as Feather,
} from '@/components/ui/solar-icons';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamilyStore } from '@/store/family-store';
import { StreakService } from '@/services/streak-service';
import { getMemorizationService } from '@/services/memorization-service-factory';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import { useAppearanceStore } from '@/store/appearance-store';
import { themeLandscapeUrl } from '@/theme/theme-catalog';

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
  const families = useFamilyStore((s) => s.families);
  const activeFamilyId = useFamilyStore((s) => s.activeFamilyId);
  const imageTheme = useAppearanceStore((s) => s.colorThemeId);
  const dailyVisual = themeLandscapeUrl(imageTheme && imageTheme !== 'obj-miroir' ? imageTheme : 'nat-trees');

  const [streak, setStreak] = useState<number | null>(null);
  const [reviewsDue, setReviewsDue] = useState<number | null>(null);
  const [recentVerses, setRecentVerses] = useState<MemorizationRecord[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [mastered, setMastered] = useState<number | null>(null);

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
        setTotal(allRecords.length);
        setMastered(allRecords.filter((record) => record.status === 'mastered').length);
        setRecentVerses(
          [...allRecords]
            .sort((a, b) => (b.lastReviewedAt ?? b.createdAt) - (a.lastReviewedAt ?? a.createdAt))
            .slice(0, 5),
        );
      } catch (error) {
        console.error('[Home] Data load failed:', error);
        if (!cancelled) {
          setReviewsDue(null);
          setStreak(null);
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

  const locale = normalizeLocaleCode(i18n.resolvedLanguage || i18n.language);
  const dateLabel = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const quickActions = [
    { icon: Compass, label: t('home.explore', 'Explorer la Bible'), desc: t('home.exploreDesc', 'Livre & chapitre'), action: () => navigate('/bible/explorer') },
    { icon: Gem, label: t('session.memorizing', 'Mémorisation'), desc: t('home.memorizeDesc', 'Nouveau verset'), action: () => navigate('/memorization/session') },
    { icon: ScrollText, label: t('home.passage', 'Passage'), desc: t('home.passageDesc', 'Multi-versets'), action: () => navigate('/bible/chapter') },
    { icon: CalendarClock, label: t('home.review', 'Réviser'), desc: t('home.reviewDesc', 'Méthode FSRS'), action: () => navigate('/review/queue') },
    { icon: TrendingUp, label: t('home.progress', 'Progression'), desc: t('home.progressDesc', 'Statistiques'), action: () => navigate('/analytics/dashboard') },
    { icon: HeartHandshake, label: t('home.family', 'Famille'), desc: t('home.familyDesc', 'Partager'), action: () => navigate('/family/home') },
    { icon: Library, label: t('home.bibleVersions', 'Versions de la Bible'), desc: t('home.bibleVersionsDesc', 'Téléchargées'), action: () => navigate('/settings/available-translations') },
    { icon: Feather, label: t('home.notes', 'Notes & tags'), desc: t('home.notesDesc', 'Mémoire sémantique'), action: () => navigate('/semantic') },
  ];

  return (
    <div className="screen-column home-premium h-full overflow-y-auto">
      <div className="home-content">
        <section className="g2 home-greeting">
          <p className="home-label">{dateLabel}</p>
          <h1>{t('home.greeting', 'Bonjour')}{activeProfile?.displayName ? `, ${activeProfile.displayName}` : ''}</h1>
          {activeFamily && <p className="home-muted"><DuoIcon icon={Users} size={16} /> {activeFamily.name}</p>}
          <button onClick={() => navigate('/tabs/settings')} className="home-profile" aria-label={t('settings.settings', 'Paramètres')}><DuoIcon icon={CircleUserRound} size={24} /></button>
        </section>
        <div className="home-feature-grid">
          <article className="g3 home-verse home-daily-card" style={{ '--daily-image': `url("${dailyVisual}")` } as CSSProperties}>
            <p className="home-label">{t('home.dailyVerse', 'Verset du jour')}</p>
            <h2>{todayVerse.ref}</h2>
            <p className="home-verse-text">{todayVerse.text}</p>
            <div className="home-actions">
              <button className="home-primary" onClick={() => navigate('/memorization/session')}>{t('bible.memorize', 'Mémoriser')}</button>
              <button className="home-secondary" onClick={() => navigate('/bible/explorer')}>{t('home.explore', 'Explorer la Bible')}</button>
            </div>
          </article>
          <article className="g2 home-streak">
            <p className="home-label"><DuoIcon icon={Flame} size={20} /> {t('home.streakLabel', 'Série de jours')}</p>
            <div
              className="home-ring"
              aria-label={
                streak === null
                  ? t('home.streakUnavailable', 'Série indisponible')
                  : t('home.streakRing', '{{done}} jours sur les 7 derniers', {
                      done: Math.min(streak, 7),
                    })
              }
            >
              <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="home-ring-track" cx="50" cy="50" r="44" fill="none" strokeWidth="6" /><circle className="home-ring-progress" cx="50" cy="50" r="44" fill="none" strokeWidth="6" strokeDasharray={`${Math.min(streak ?? 0, 7) / 7 * 276.46} 276.46`} /></svg>
              <strong>{streak ?? '—'}</strong>
            </div>
            <div
              className="home-week"
              aria-label={t(
                'home.streakWeekLabel',
                'Série sur les sept derniers jours, en temps universel',
              )}
            >
              {Array.from({ length: 7 }, (_, index) => { const daysAgo = 6 - index; const day = new Date(Date.now() - daysAgo * 86400000); return <span key={daysAgo} data-active={streak !== null && daysAgo < streak} title={day.toLocaleDateString(locale, { timeZone: 'UTC', dateStyle: 'medium' })}>{day.toLocaleDateString(locale, { timeZone: 'UTC', weekday: 'narrow' })}</span>; })}
            </div>
            <p className="home-muted">
              {streak === null
                ? t('home.dataUnavailable', 'Données indisponibles')
                : t('home.streakDays', '{{count}} jours consécutifs', { count: streak })}
            </p>
            <button className="home-secondary" onClick={() => navigate('/tabs/progress')}>
              {t('home.viewProgress', 'Voir la progression')}
            </button>
          </article>
        </div>
        <div className="home-stats">
          {[
            [t('progress.versesMemorized', 'Versets mémorisés'), total],
            [t('progress.mastered', 'Versets maîtrisés'), mastered],
            [t('review.due', 'Révisions à faire'), reviewsDue],
          ].map(([label, value]) => (
            <div className="g2 home-stat" key={String(label)}>
              <span className="home-label">{label}</span>
              <strong>{value ?? '—'}</strong>
            </div>
          ))}
        </div>
        <h2 className="g1 home-section-title">{t('home.quickActions', 'Actions rapides')}</h2>
        <div className="home-quick-grid">
          {quickActions.map(({ icon: Icon, label, desc, action }) => <button key={label} onClick={action} className="g2 action-card home-action-card"><span className="icon-chip"><DuoIcon icon={Icon} size={24} /></span><span><strong>{label}</strong><small>{desc}</small></span></button>)}
        </div>
        <h2 className="g1 home-section-title">{t('home.recentVerses', 'Récemment mémorisés')}</h2>
        <div className="home-recent">
          {recentVerses.length === 0 ? <p className="g2 home-empty">
              {total === null
                ? t('home.dataUnavailable', 'Données indisponibles')
                : t('home.noRecentVerses', 'Aucun verset mémorisé pour le moment')}
            </p> : recentVerses.map((verse) => <button key={verse.id} className="g2 home-recent-card" onClick={() => navigate(verse.bookId && verse.chapterNumber ? `/bible/chapter/${verse.bookId}/${verse.chapterNumber}` : '/bible/chapter')}><strong>{verse.bibleVerseReference || `${verse.bookId} ${verse.chapterNumber}:${verse.verseNumber}`}</strong><span>{verse.bibleVerseText}</span><small>
                {verse.status === 'mastered'
                  ? t('progress.mastered', 'Maîtrisé')
                  : t('progress.inProgress', 'En cours')}
              </small><span className="home-mastery" aria-hidden="true"><i style={{ width: verse.status === 'mastered' ? '100%' : '0%' }} /></span></button>)}
        </div>
      </div>
    </div>
  );
}
