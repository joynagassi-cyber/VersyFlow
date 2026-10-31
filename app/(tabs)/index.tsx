/**
 * Home Tab — Main screen after onboarding
 * Real data: streak (StreakService), due reviews (MemorizationService),
 * recently memorized verses (MemorizationService).
 * Solar duotone + i18n + 0/1/2 plurals + theme-adapted daily card visual.
 */

import { useState, useEffect, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeLocaleCode } from '@/domains/i18n/config';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  UsersIcon as Users,
  FlameIcon as Flame,
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
import { useFamilySyncStore } from '@/store/family-sync-store';
import { StreakService } from '@/services/streak-service';
import { getMemorizationService } from '@/services/memorization-service-factory';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import { useAppearanceStore } from '@/store/appearance-store';
import { isImageTheme, themeLandscapeUrl } from '@/theme/theme-catalog';
import { PHOTO_THEMES } from '@/theme/photo-themes.generated';
import { formatProgressLabel } from '@/lib/progress-label';

// Fallback "verse of the day" rotation (real records preferred when present)
const DAILY_VERSES_FALLBACK = [
  {
    ref: 'Jean 3:16',
    text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
  },
  {
    ref: 'Psaumes 23:1',
    text: "L'Éternel est mon berger : je ne manquerai de rien.",
  },
  {
    ref: 'Philippiens 4:13',
    text: 'Je puis tout par celui qui me fortifie.',
  },
  {
    ref: 'Romains 8:28',
    text: 'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu.',
  },
  {
    ref: 'Ésaïe 40:31',
    text: "Mais ceux qui espèrent en l'Éternel renaîtront de nouvelles forces.",
  },
];

export function resolveDailyCardVisual(
  colorThemeId: string | null | undefined,
  themeMode: 'light' | 'dark' | 'system',
): string {
  // 1. Si l'utilisateur a choisi un thème image valide (photo ou illustration), on le respecte.
  if (isImageTheme(colorThemeId) && colorThemeId !== 'obj-miroir') {
    return themeLandscapeUrl(colorThemeId!);
  }
  // 2. Si des photos locales sont importées dans le catalogue, on privilégie une vraie photo.
  if (PHOTO_THEMES.length > 0) {
    const preferred =
      themeMode === 'dark'
        ? PHOTO_THEMES.find((p) => p.id.includes('aurore') || p.id.includes('nuit')) ??
          PHOTO_THEMES[0]
        : PHOTO_THEMES[0];
    return themeLandscapeUrl(preferred.id);
  }
  // 3. Repli local garanti existant (sans URL 404 quand colorThemeId vaut 'lumina' / 'rose'…).
  return themeLandscapeUrl(themeMode === 'dark' ? 'lum-lune' : 'nat-trees');
}

export function formatStreakDaysLabel(count: number, lang: string): string {
  const base = lang.split('-')[0].toLowerCase();
  if (base === 'en') {
    return `${count} consecutive ${count === 1 ? 'day' : 'days'}`;
  }
  // Français : 0 jour consécutif, 1 jour consécutif, 2 jours consécutifs.
  const plural = count > 1 ? 's' : '';
  return `${count} jour${plural} consécutif${plural}`;
}

export function formatLastSevenDaysAria(count: number, lang: string): string {
  const capped = Math.min(Math.max(0, count), 7);
  const base = lang.split('-')[0].toLowerCase();
  if (base === 'en') {
    return `${capped} ${capped === 1 ? 'day' : 'days'} out of the last 7`;
  }
  const plural = capped > 1 ? 's' : '';
  return `${capped} jour${plural} sur les 7 derniers`;
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { activeProfile } = useActiveProfile();
  const localFamilies = useFamilyStore((s) => s.families);
  const localFamilyId = useFamilyStore((s) => s.activeFamilyId);
  const syncFamilies = useFamilySyncStore((s) => s.families);
  const syncFamilyId = useFamilySyncStore((s) => s.activeFamilyId);
  const imageTheme = useAppearanceStore((s) => s.colorThemeId);
  const themeMode = useAppearanceStore((s) => s.themeMode);
  const dailyVisual = resolveDailyCardVisual(imageTheme, themeMode);

  const [streak, setStreak] = useState<number | null>(null);
  const [reviewsDue, setReviewsDue] = useState<number | null>(null);
  const [recentVerses, setRecentVerses] = useState<MemorizationRecord[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [mastered, setMastered] = useState<number | null>(null);

  const activeFamily =
    syncFamilies.find((f) => f.id === syncFamilyId) ??
    syncFamilies[0] ??
    localFamilies.find((f) => f.id === localFamilyId) ??
    localFamilies[0] ??
    null;

  const profileId = activeProfile?.id ?? 'default';
  const customName =
    typeof window !== 'undefined' ? localStorage.getItem('versyflow:profile:name') : null;
  const greetingName = customName || activeProfile?.displayName || '';

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

  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const todayVerse =
    recentVerses.length > 0
      ? {
          ref:
            recentVerses[dayIndex % recentVerses.length].bibleVerseReference ||
            DAILY_VERSES_FALLBACK[dayIndex % DAILY_VERSES_FALLBACK.length].ref,
          text:
            recentVerses[dayIndex % recentVerses.length].bibleVerseText ||
            DAILY_VERSES_FALLBACK[dayIndex % DAILY_VERSES_FALLBACK.length].text,
        }
      : DAILY_VERSES_FALLBACK[dayIndex % DAILY_VERSES_FALLBACK.length];

  const locale = normalizeLocaleCode(i18n.resolvedLanguage || i18n.language);
  const dateLabel = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const quickActions = [
    {
      icon: Compass,
      label: t('home.explore', 'Explorer la Bible'),
      desc: t('home.exploreDesc', 'Livre & chapitre'),
      action: () => navigate('/bible/explorer'),
    },
    {
      icon: Gem,
      label: t('session.memorizing', 'Mémorisation'),
      desc: t('home.newVerseDesc', 'Nouveau verset'),
      action: () => navigate('/memorization/session'),
    },
    {
      icon: ScrollText,
      label: t('home.passage', 'Passage'),
      desc: t('home.passageDesc', 'Multi-versets'),
      action: () => navigate('/bible/chapter'),
    },
    {
      icon: CalendarClock,
      label: t('home.review', 'Réviser'),
      desc: t('home.reviewDesc', 'Méthode FSRS'),
      action: () => navigate('/review/queue'),
    },
    {
      icon: TrendingUp,
      label: t('home.progress', 'Progression'),
      desc: t('home.progressDesc', 'Statistiques'),
      action: () => navigate('/analytics/dashboard'),
    },
    {
      icon: HeartHandshake,
      label: t('home.family', 'Famille'),
      desc: t('home.familyDesc', 'Partager'),
      action: () => navigate('/family/home'),
    },
    {
      icon: Library,
      label: t('home.bibleVersions', 'Versions de la Bible'),
      desc: t('home.bibleVersionsDesc', 'Téléchargées'),
      action: () => navigate('/settings/available-translations'),
    },
    {
      icon: Feather,
      label: t('home.notes', 'Notes & tags'),
      desc: t('home.notesDesc', 'Mémoire sémantique'),
      action: () => navigate('/semantic'),
    },
  ];

  const statItems: Array<[string, number | null]> = [
    [
      formatProgressLabel(
        t('progress.versesMemorized', 'Versets mémorisés'),
        total ?? 0,
        locale,
      ),
      total,
    ],
    [
      formatProgressLabel(
        t('progress.versesMastered', 'Versets maîtrisés'),
        mastered ?? 0,
        locale,
      ),
      mastered,
    ],
    [
      formatProgressLabel(
        t('home.reviewsDue', 'Révisions à faire'),
        reviewsDue ?? 0,
        locale,
      ),
      reviewsDue,
    ],
  ];

  return (
    <div className="screen-column home-premium h-full overflow-y-auto">
      <div className="home-content">
        <section className="g1 tab-heading home-greeting">
          <p className="section-label">{dateLabel}</p>
          <h1 className="display-title mt-2">
            {t('home.greeting', 'Bonjour')}
            {greetingName ? `, ${greetingName}` : ''}
          </h1>
          {activeFamily && (
            <p className="home-muted">
              <DuoIcon icon={Users} size={16} /> {activeFamily.name}
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="home-profile"
            aria-label={t('common.profil', 'Profil')}
          >
            <DuoIcon icon={CircleUserRound} size={24} />
          </button>
        </section>
        <div className="home-feature-grid">
          <article
            className="g3 home-verse home-daily-card"
            style={{ '--daily-image': `url("${dailyVisual}")` } as CSSProperties}
          >
            <p className="section-label">{t('home.dailyVerse', 'Verset du jour')}</p>
            <h2>{todayVerse.ref}</h2>
            <p className="home-verse-text">{todayVerse.text}</p>
            <div className="home-actions">
              <button
                type="button"
                className="home-primary"
                onClick={() => navigate('/memorization/session')}
              >
                {t('bible.memorize', 'Mémoriser')}
              </button>
              <button
                type="button"
                className="home-secondary"
                onClick={() => navigate('/bible/explorer')}
              >
                {t('home.explore', 'Explorer la Bible')}
              </button>
            </div>
          </article>
          <article className="g2 home-streak">
            <p className="section-label">
              <DuoIcon icon={Flame} size={20} /> {t('home.streakLabel', 'Série de jours')}
            </p>
            <div
              className="home-ring"
              aria-label={
                streak === null
                  ? t('home.streakUnavailable', 'Série indisponible')
                  : formatLastSevenDaysAria(streak, locale)
              }
            >
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  className="home-ring-track"
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  strokeWidth="6"
                />
                <circle
                  className="home-ring-progress"
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  strokeWidth="6"
                  strokeDasharray={`${(Math.min(streak ?? 0, 7) / 7) * 276.46} 276.46`}
                />
              </svg>
              <strong>{streak ?? '–'}</strong>
            </div>
            <div
              className="home-week"
              aria-label={t(
                'home.weekAria',
                'Série sur les sept derniers jours en temps universel',
              )}
            >
              {Array.from({ length: 7 }, (_, index) => {
                const daysAgo = 6 - index;
                const day = new Date(Date.now() - daysAgo * 86_400_000);
                return (
                  <span
                    key={daysAgo}
                    data-active={streak !== null && daysAgo < streak}
                    title={day.toLocaleDateString(locale, {
                      timeZone: 'UTC',
                      dateStyle: 'medium',
                    })}
                  >
                    {day.toLocaleDateString(locale, {
                      timeZone: 'UTC',
                      weekday: 'narrow',
                    })}
                  </span>
                );
              })}
            </div>
            <p className="home-muted">
              {streak === null
                ? t('home.dataUnavailable', 'Données indisponibles')
                : formatStreakDaysLabel(streak, locale)}
            </p>
            <button
              type="button"
              className="home-secondary"
              onClick={() => navigate('/tabs/progress')}
            >
              {t('home.viewProgress', 'Voir la progression')}
            </button>
          </article>
        </div>
        <div className="home-stats">
          {statItems.map(([label, value]) => (
            <div className="g2 home-stat" key={label}>
              <span className="section-label">{label}</span>
              <strong>{value ?? '–'}</strong>
            </div>
          ))}
        </div>
        <h2 className="g1 home-section-title">
          {t('home.quickActions', 'Actions rapides')}
        </h2>
        <div className="home-quick-grid">
          {quickActions.map(({ icon: Icon, label, desc, action }) => (
            <button
              type="button"
              key={label}
              onClick={action}
              className="g2 action-card home-action-card"
            >
              <span className="icon-chip">
                <DuoIcon icon={Icon} size={24} />
              </span>
              <span>
                <strong>{label}</strong>
                <small>{desc}</small>
              </span>
            </button>
          ))}
        </div>
        <h2 className="g1 home-section-title">
          {t('home.recentVerses', 'Récemment mémorisés')}
        </h2>
        <div className="home-recent">
          {recentVerses.length === 0 ? (
            <p className="g2 home-empty">
              {total === null
                ? t('home.dataUnavailable', 'Données indisponibles')
                : t('home.noMemorizedYet', 'Aucun verset mémorisé pour le moment')}
            </p>
          ) : (
            recentVerses.map((verse) => (
              <button
                type="button"
                key={verse.id}
                className="g2 home-recent-card"
                onClick={() =>
                  navigate(
                    verse.bookId && verse.chapterNumber
                      ? `/bible/chapter/${verse.bookId}/${verse.chapterNumber}`
                      : '/bible/chapter',
                  )
                }
              >
                <strong>
                  {verse.bibleVerseReference ||
                    `${verse.bookId} ${verse.chapterNumber}:${verse.verseNumber}`}
                </strong>
                <span>{verse.bibleVerseText}</span>
                <small>
                  {verse.status === 'mastered'
                    ? t('progress.masteredSingle', 'Maîtrisé')
                    : t('progress.inProgressSingle', 'En cours')}
                </small>
                <span className="home-mastery" aria-hidden="true">
                  <i style={{ width: verse.status === 'mastered' ? '100%' : '0%' }} />
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
