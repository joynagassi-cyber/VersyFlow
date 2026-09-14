/**
 * Ionic Router Provider
 *
 * Sets up React Router DOM v6 with all VersyFlow routes.
 * Replaces React Navigation (expo-router) stack and tab navigation.
 */

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton } from '@ionic/react';
import { home, book, analytics, add, ellipsisVertical, time, personCircle, flame, star, text, people, settings, calendar, notifications, helpCircle, download, chevronForward, close } from 'ionicons/icons';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter, useLocalSearchParams } from '@/hooks/useIonicNavigation';
import React, { useState, useEffect } from 'react';

// ─── Lazy-loaded page components ──────────────────────────────────────────────

const HomePage = React.lazy(() => import('@/app/(tabs)/index'));
const ExplorePage = React.lazy(() => import('@/app/(tabs)/explore'));
const ProgressPage = React.lazy(() => import('@/app/(tabs)/progress'));
const SettingsPage = React.lazy(() => import('@/app/(tabs)/settings'));
const AuthLogin = React.lazy(() => import('@/app/(tabs)/auth/login'));
const AuthSignup = React.lazy(() => import('@/app/(tabs)/auth/signup'));
const AuthVerify = React.lazy(() => import('@/app/(tabs)/auth/verify'));
const SplashScreen = React.lazy(async () => {
  const mod = await import('@/app/splash');
  return {
    default: (props: { onFinish?: () => void }) => (
      <mod.default onFinish={props.onFinish ?? (() => {}) } />
    ),
  };
});
const BootPage = React.lazy(() => import('@/app/boot'));
const BibleExplorer = React.lazy(() => import('@/app/bible/explorer'));
const BibleBook = React.lazy(() => import('@/app/bible/book'));
const BibleChapter = React.lazy(() => import('@/app/bible/chapter'));
const MemorizationSession = React.lazy(() => import('@/app/memorization/session'));
const MemorizationConfirm = React.lazy(() => import('@/app/memorization/confirm'));
const MemorizationFlashcard = React.lazy(() => import('@/app/memorization/flashcard'));
const ReviewQueue = React.lazy(() => import('@/app/review/queue'));
const ReviewSession = React.lazy(() => import('@/app/review/session'));
const ReviewSummary = React.lazy(() => import('@/app/review/summary'));
const ReviewHistory = React.lazy(() => import('@/app/review/History'));
const ReviewCalendar = React.lazy(() => import('@/app/review/calendar'));
const ProfileIndex = React.lazy(() => import('@/app/profile/index'));
const ProfileCreate = React.lazy(() => import('@/app/profile/create'));
const ProfileSelect = React.lazy(() => import('@/app/profile/select'));
const FamilyHome = React.lazy(() => import('@/app/family/home'));
const FamilyInvite = React.lazy(() => import('@/app/family/invite'));
const FamilyJoin = React.lazy(() => import('@/app/family/join'));
const FamilyMembers = React.lazy(() => import('@/app/family/members'));
const SettingsAppearance = React.lazy(() => import('@/app/settings/appearance'));
const SettingsLanguages = React.lazy(() => import('@/app/settings/languages'));
const SettingsBackup = React.lazy(() => import('@/app/settings/backup'));
const SettingsPrivacy = React.lazy(() => import('@/app/settings/privacy'));
const SettingsAbout = React.lazy(() => import('@/app/settings/about'));
const SettingsSession = React.lazy(() => import('@/app/settings/session'));
const SettingsReminders = React.lazy(() => import('@/app/settings/reminders'));
const SettingsAvailableTranslations = React.lazy(
  () => import('@/app/settings/available-translations'),
);
const NotificationsPage = React.lazy(() => import('@/app/notifications'));
const OnboardingWelcome = React.lazy(() => import('@/app/onboarding/welcome'));
const OnboardingLanguageSelect = React.lazy(() => import('@/app/onboarding/language-select'));
const OnboardingTranslationSelect = React.lazy(() => import('@/app/onboarding/translation-select'));
const OnboardingSessionConfig = React.lazy(() => import('@/app/onboarding/session-config'));
const OnboardingReminderConfig = React.lazy(() => import('@/app/onboarding/reminder-config'));
const OnboardingFsrsIntroduction = React.lazy(() => import('@/app/onboarding/fsrs-introduction'));
const AnalyticsDashboard = React.lazy(() => import('@/app/analytics/dashboard'));
const AiCoachPage = React.lazy(() => import('@/app/ai-coach'));
const MemoryStart = React.lazy(async () => {
  const mod = await import('@/app/memory/start');
  const { useLocalSearchParams } = await import('@/hooks/useIonicNavigation');
  return {
    default: () => {
      const sp = useLocalSearchParams();
      const verseData = {
        reference: sp.reference ?? 'Jean 3:16',
        text: sp.text ?? '',
        bookId: sp.bookId ?? 'joh',
        chapter: Number(sp.chapter ?? 3),
        verse: Number(sp.verse ?? 16),
      };
      return <mod.default verseData={verseData} />;
    },
  };
});
const MemoryFlashcard = React.lazy(() => import('@/app/memory/flashcard'));
const MemoryRecallWriting = React.lazy(() => import('@/app/memory/recall-writing'));
const ComparisonResult = React.lazy(async () => {
  const mod = await import('@/app/comparison/result');
  const { useLocalSearchParams } = await import('@/hooks/useIonicNavigation');
  return {
    default: () => {
      const sp = useLocalSearchParams();
      const record = {
        id: sp.recordId ?? 'local',
        learnerProfileId: 'local',
        bookId: sp.bookId ?? 'joh',
        chapterNumber: Number(sp.chapter ?? 3),
        verseNumber: Number(sp.verse ?? 16),
        translationId: 'lsg',
        bibleVerseReference: sp.reference ?? 'Jean 3:16',
        bibleVerseText: sp.verseText ?? '',
        status: 'in-progress' as const,
        fsrsState: { stability: 0, difficulty: 0, recallProbability: 0, lastInterval: 0, nextInterval: 0, elapsedDays: 0, repetitions: 0, requestedRetention: 0.9 },
        favorite: false,
        tags: [],
        createdAt: Date.now(),
        lastReviewedAt: null,
        nextReviewAt: null,
        reviewCount: 0,
        totalReviewMinutes: 0,
        wordPerformance: [],
      } satisfies MemorizationRecord;
      const userAnswer = sp.userAnswer ?? '';
      return <mod.default record={record} userAnswer={userAnswer} />;
    },
  };
});
const AchievementsPage = React.lazy(() => import('@/app/achievements'));
const CollectionsPage = React.lazy(() => import('@/app/collections'));
const MasteryPage = React.lazy(() => import('@/app/mastery'));
const SearchPage = React.lazy(() => import('@/app/search'));
const NotFound = React.lazy(() => import('@/app/+not-found'));

// ─── Tab Navigation ───────────────────────────────────────────────────────────

interface TabRouteDef {
  path: string;
  element: React.ElementType;
  icon: string;
  label: string;
}

const tabRoutes: TabRouteDef[] = [
  { path: '/tabs/home', element: HomePage, icon: home, label: 'Accueil' },
  { path: '/tabs/explore', element: ExplorePage, icon: book, label: 'Memorize' },
  { path: '/tabs/progress', element: ProgressPage, icon: analytics, label: 'Stats' },
];

function TabNav() {
  const { colors, sh, sp, rad } = useAppTheme();
  const router = useRouter();
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const plusMenuItems = [
    { id: 'calendar', title: 'Calendrier de révision', subtitle: 'Planification à long terme', icon: 'calendar', iconColor: colors.primary, action: () => router.push('/review/calendar') },
    { id: 'profile', title: 'Profil & Paramètres', subtitle: 'Langue, traduction, compte', icon: 'settings', iconColor: colors.textSecondary, action: () => router.push('/tabs/settings') },
    { id: 'notifications', title: 'Centre de notifications', subtitle: 'Historique des alertes', icon: 'notifications', iconColor: colors.warning, action: () => router.push('/notifications') },
    { id: 'help', title: 'Aide & Support', subtitle: 'FAQ, Tutoriels, Diagnostics', icon: 'help-circle', iconColor: colors.info, action: () => router.push('/settings/about') },
    { id: 'data', title: 'Gestion des données', subtitle: 'Exportation & Accessibilité', icon: 'download', iconColor: colors.success, action: () => router.push('/settings/backup') },
  ];

  return (
    <>
      <IonRouterOutlet>
        <Routes>
          <Route path="/tabs" element={<Navigate to="/tabs/home" replace />} />
          {tabRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={<route.element />} />
          ))}
          <Route path="*" element={<Navigate to="/tabs/home" replace />} />
        </Routes>
      </IonRouterOutlet>

      <IonTabBar style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        height: 64,
        paddingBottom: 8,
        paddingTop: 8,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
      } as any}>
        {tabRoutes.map((route) => (
          <IonTabButton key={route.path} tab={route.path.slice(6)} href={route.path}>
            <IonIcon icon={route.icon} />
            <IonLabel style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>{route.label}</IonLabel>
          </IonTabButton>
        ))}
      </IonTabBar>

      {/* FAB Button */}
      <button
        onClick={() => router.push('/bible/explorer')}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          color: '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(233, 30, 140, 0.3)',
          zIndex: 1000,
        }}
        aria-label="Commencer une session"
      >
        <IonIcon icon={add} size="large" color="light" />
      </button>

      {/* Plus Button */}
      <button
        onClick={() => setShowPlusMenu(true)}
        style={{
          position: 'fixed',
          bottom: 80,
          left: 20,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
        }}
        aria-label="Plus d'options"
      >
        <IonIcon icon={ellipsisVertical} size="large" color={colors.textSecondary} />
      </button>

      {/* Plus Menu Modal */}
      {showPlusMenu && (
        <div
          onClick={() => setShowPlusMenu(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '70%',
              width: '100%',
              boxShadow: '0 -4px 16px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>Plus d'options</span>
              <button onClick={() => setShowPlusMenu(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <IonIcon icon={close} size="large" color={colors.textSecondary} />
              </button>
            </div>
            <div style={{ padding: '8px 0' }}>
              {plusMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { item.action(); setShowPlusMenu(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '16px 20px',
                    gap: 16,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: item.iconColor + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <IonIcon icon={(item.icon as any)} size="small" color={item.iconColor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary }}>{item.title}</div>
                    <div style={{ fontSize: 13, marginTop: 2, color: colors.textMuted }}>{item.subtitle}</div>
                  </div>
                  <IonIcon icon={chevronForward} size="small" color={colors.textMuted} />
                </button>
              ))}
            </div>
            <div style={{ padding: 20, borderTop: `1px solid ${colors.border}`, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: colors.textMuted }}>VersyFlow v0.1.0</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Router ──────────────────────────────────────────────────────────────

export function IonicRouterProvider({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <IonApp>
        <IonContent fullscreen={false} className="ionic-page">
          <Routes>
            {/* Splash & Boot */}
            <Route path="/" element={<SplashScreen />} />

            {/* Tabs */}
            <Route path="/tabs" element={<TabNav />} />

            {/* Auth */}
            <Route path="/auth/login" element={<AuthLogin />} />
            <Route path="/auth/signup" element={<AuthSignup />} />
            <Route path="/auth/verify" element={<AuthVerify />} />

            {/* Onboarding */}
            <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
            <Route path="/onboarding/language-select" element={<OnboardingLanguageSelect />} />
            <Route path="/onboarding/translation-select" element={<OnboardingTranslationSelect />} />
            <Route path="/onboarding/session-config" element={<OnboardingSessionConfig />} />
            <Route path="/onboarding/reminder-config" element={<OnboardingReminderConfig />} />
            <Route path="/onboarding/fsrs-introduction" element={<OnboardingFsrsIntroduction />} />

            {/* Bible */}
            <Route path="/bible/explorer" element={<BibleExplorer />} />
            <Route path="/bible/book/:bookId" element={<BibleBook />} />
            <Route path="/bible/chapter/:bookId/:chapterNumber" element={<BibleChapter />} />

            {/* Memorization */}
            <Route path="/memorization/session" element={<MemorizationSession />} />
            <Route path="/memorization/confirm" element={<MemorizationConfirm />} />
            <Route path="/memorization/flashcard" element={<MemorizationFlashcard />} />

            {/* Review */}
            <Route path="/review/queue" element={<ReviewQueue />} />
            <Route path="/review/session" element={<ReviewSession />} />
            <Route path="/review/summary" element={<ReviewSummary />} />
            <Route path="/review/history" element={<ReviewHistory />} />
            <Route path="/review/calendar" element={<ReviewCalendar />} />

            {/* Profile */}
            <Route path="/profile" element={<ProfileIndex />} />
            <Route path="/profile/create" element={<ProfileCreate />} />
            <Route path="/profile/select" element={<ProfileSelect />} />

            {/* Family */}
            <Route path="/family/home" element={<FamilyHome />} />
            <Route path="/family/invite" element={<FamilyInvite />} />
            <Route path="/family/join" element={<FamilyJoin />} />
            <Route path="/family/members" element={<FamilyMembers />} />

            {/* Settings */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/appearance" element={<SettingsAppearance />} />
            <Route path="/settings/languages" element={<SettingsLanguages />} />
            <Route path="/settings/backup" element={<SettingsBackup />} />
            <Route path="/settings/privacy" element={<SettingsPrivacy />} />
            <Route path="/settings/about" element={<SettingsAbout />} />
            <Route path="/settings/session" element={<SettingsSession />} />
            <Route path="/settings/reminders" element={<SettingsReminders />} />
            <Route
              path="/settings/available-translations"
              element={<SettingsAvailableTranslations />}
            />

            {/* Memory */}
            <Route path="/memory/start" element={<MemoryStart />} />
            <Route path="/memory/flashcard" element={<MemoryFlashcard />} />
            <Route path="/memory/recall-writing" element={<MemoryRecallWriting />} />

            {/* Other */}
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/comparison/result" element={<ComparisonResult />} />
            <Route path="/analytics/dashboard" element={<AnalyticsDashboard />} />
            <Route path="/ai-coach" element={<AiCoachPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/mastery" element={<MasteryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

          {children}
        </IonContent>
      </IonApp>
    </BrowserRouter>
  );
}

export default IonicRouterProvider;
