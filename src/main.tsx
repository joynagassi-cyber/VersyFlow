import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { IonApp } from '@ionic/react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { Suspense, lazy, useEffect } from 'react';
import '@/styles/globals.css';

// Lazy loaded route pages
const TabLayout = lazy(() => import('../app/(tabs)/_layout'));
const HomePage = lazy(() => import('../app/(tabs)/index'));
const ExplorePage = lazy(() => import('../app/(tabs)/explore'));
const ProgressPage = lazy(() => import('../app/(tabs)/progress'));
const SettingsPage = lazy(() => import('../app/(tabs)/settings'));
const AuthLogin = lazy(() => import('../app/(tabs)/auth/login'));
const AuthSignup = lazy(() => import('../app/(tabs)/auth/signup'));
const AuthVerify = lazy(() => import('../app/(tabs)/auth/verify'));
const AuthIndex = lazy(() => import('../app/(tabs)/auth'));
const SplashScreen = lazy(() => import('../app/splash'));
const NotFound = lazy(() => import('../app/+not-found'));

// Onboarding
const OnboardingLayout = lazy(() => import('../app/onboarding/_layout'));
const OnboardingWelcome = lazy(() => import('../app/onboarding/welcome'));
const OnboardingLanguage = lazy(() => import('../app/onboarding/language-select'));
const OnboardingTranslation = lazy(() => import('../app/onboarding/translation-select'));
const OnboardingFsrs = lazy(() => import('../app/onboarding/fsrs-introduction'));
const OnboardingSessionConfig = lazy(() => import('../app/onboarding/session-config'));
const OnboardingReminderConfig = lazy(() => import('../app/onboarding/reminder-config'));

// Bible
const BibleExplorer = lazy(() => import('../app/bible/explorer'));
const BibleBook = lazy(() => import('../app/bible/book'));
const BibleChapter = lazy(() => import('../app/bible/chapter'));

// Memorization
const MemorizationSession = lazy(() => import('../app/memorization/session'));
const MemorizationFlashcard = lazy(() => import('../app/memorization/flashcard'));
const MemorizationConfirm = lazy(() => import('../app/memorization/confirm'));

// Review
const ReviewQueue = lazy(() => import('../app/review/queue'));
const ReviewSession = lazy(() => import('../app/review/session'));
const ReviewSummary = lazy(() => import('../app/review/summary'));
const ReviewCalendar = lazy(() => import('../app/review/calendar'));
const ReviewHistory = lazy(() => import('../app/review/History'));

// Family
const FamilyHome = lazy(() => import('../app/family/home'));
const FamilyMembers = lazy(() => import('../app/family/members'));
const FamilyInvite = lazy(() => import('../app/family/invite'));
const FamilyJoin = lazy(() => import('../app/family/join'));

// Settings sub-pages
const SettingsLanguages = lazy(() => import('../app/settings/languages'));
const SettingsAvailableTranslations = lazy(
  () => import('../app/settings/available-translations'),
);
const SettingsAppearance = lazy(() => import('../app/settings/appearance'));
const SettingsBackup = lazy(() => import('../app/settings/backup'));
const SettingsAbout = lazy(() => import('../app/settings/about'));
const SettingsPrivacy = lazy(() => import('../app/settings/privacy'));
const SettingsSession = lazy(() => import('../app/settings/session'));
const SettingsReminders = lazy(() => import('../app/settings/reminders'));
const SettingsIndex = lazy(() => import('../app/settings/index'));

// Misc deep pages
const SearchPage = lazy(() => import('../app/search/index'));
const NotificationsPage = lazy(() => import('../app/notifications'));
const MasteryPage = lazy(() => import('../app/mastery/index'));
const AchievementsPage = lazy(() => import('../app/achievements/index'));
const AnalyticsDashboard = lazy(() => import('../app/analytics/dashboard'));
const ProfileIndex = lazy(() => import('../app/profile/index'));
const ProfileCreate = lazy(() => import('../app/profile/create'));
const ProfileSelect = lazy(() => import('../app/profile/select'));
const CollectionsPage = lazy(() => import('../app/collections/index'));
const ComparisonTranslation = lazy(() => import('../app/comparison/translation'));
const ComparisonResult = lazy(() => import('../app/comparison/result'));
const AiCoachPage = lazy(() => import('../app/ai-coach/index'));
const MemoryStart = lazy(() => import('../app/memory/start'));
const MemoryFlashcard = lazy(() => import('../app/memory/flashcard'));
const MemoryRecallWriting = lazy(() => import('../app/memory/recall-writing'));

import { I18nService } from '@/i18n';
import i18next, { initI18next } from '@/i18n/i18next-init';
import { initializeSettingsStore, useSettingsStore } from '@/store/settings-store';
import { initializeAppearanceStore } from '@/store/appearance-store';
import { ThemeManager } from '@/components/ThemeManager';
import { useAuthStore } from '@/store/auth-store';
import { useFamilySyncBridge } from '@/hooks/useFamilySyncBridge';
import { useProfileSyncBridge } from '@/hooks/useProfileSyncBridge';
import { attachSyncCompletionHandlers } from '@/services/sync-completion-service';
import { wireAppTelemetry } from '@/services/app-telemetry-wiring';
import { wireStreakCoordinator } from '@/services/streak-wiring';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import { isRTL } from '@/domains/i18n/config';

// Initialize i18n (async — runs on import; app renders after ready)
(async () => {
  await initI18next();
  const savedLanguage =
    localStorage.getItem('versyflow:ui:language') ?? 'fr';
  I18nService.getInstance().setLanguage(savedLanguage);
  document.documentElement.dir = isRTL(savedLanguage) ? 'rtl' : 'ltr';
  initializeSettingsStore();
  initializeAppearanceStore();
  // Boot-time one-shot wiring: PowerSync lifecycle → sync stores,
  // telemetry listener + periodic flush, streak event-driven writer.
  attachSyncCompletionHandlers();
  wireAppTelemetry();
  wireStreakCoordinator();
})();

/** Guard: redirects to onboarding if it hasn't been completed yet */
function RequireOnboarded() {
  const onboardingCompleted = useSettingsStore(
    (s) => s.onboardingCompleted,
  );
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding/welcome" replace />;
  }
  return <Outlet />;
}

/** Root redirect: onboarding or home depending on completion state */
function RootRedirect() {
  const onboardingCompleted = useSettingsStore(
    (s) => s.onboardingCompleted,
  );
  return <Navigate to={onboardingCompleted ? '/tabs/home' : '/onboarding/welcome'} replace />;
}

/** Applies RTL/LTR document direction whenever the i18n language changes */
function DirSync() {
  useEffect(() => {
    const apply = () => {
      const lng = i18next.language ?? 'fr';
      document.documentElement.dir = isRTL(lng) ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    };
    apply();
    i18next.on('languageChanged', apply);
    return () => {
      i18next.off('languageChanged', apply);
    };
  }, []);
  return null;
}

/** Mounts the PowerSync → store bridges for family & profile data.
 *  Activated whenever the user is authenticated; the bridges are
 *  offline-safe and re-sync on the `initialized` event. */
function SyncBridges() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useFamilySyncBridge(isAuthenticated);
  useProfileSyncBridge(isAuthenticated);
  return null;
}

/** Auth gate with navigation handlers */
function AuthGateRoute() {
  const navigate = useNavigate();
  return (
    <AuthIndex
      onLogin={() => navigate('/auth/login')}
      onSignup={() => navigate('/auth/signup')}
      onSkip={() => navigate('/tabs/home')}
    />
  );
}

/** Splash that continues to the root redirect on finish */
function SplashRoute() {
  const navigate = useNavigate();
  return <SplashScreen onFinish={() => navigate('/', { replace: true })} />;
}

/** Comparison result — needs session data via router state */
function ComparisonResultRoute() {
  const location = useLocation();
  const state = location.state as {
    record?: MemorizationRecord;
    userAnswer?: string;
  } | null;
  if (!state?.record || !state?.userAnswer) {
    return <Navigate to="/comparison/translation" replace />;
  }
  return <ComparisonResult record={state.record} userAnswer={state.userAnswer} />;
}

/** Memory start — needs verse data via router state */
function MemoryStartRoute() {
  const location = useLocation();
  const state = location.state as {
    verseData?: {
      reference: string;
      text: string;
      bookId: string;
      chapter: number;
      verse: number;
    };
  } | null;
  if (!state?.verseData) {
    return <Navigate to="/memorization/session" replace />;
  }
  return <MemoryStart verseData={state.verseData} />;
}

function App() {
  return (
    <StrictMode>
      <DirSync />
      <ThemeManager />
      <SyncBridges />
      <BrowserRouter>
        <IonApp>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            {/* Onboarding (public) */}
            <Route path="/onboarding" element={<OnboardingLayout />}>
              <Route index element={<Navigate to="/onboarding/welcome" replace />} />
              <Route path="welcome" element={<OnboardingWelcome />} />
              <Route path="language-select" element={<OnboardingLanguage />} />
              <Route path="translation-select" element={<OnboardingTranslation />} />
              <Route path="session-config" element={<OnboardingSessionConfig />} />
              <Route path="reminder-config" element={<OnboardingReminderConfig />} />
              <Route path="fsrs-introduction" element={<OnboardingFsrs />} />
            </Route>

            {/* Main tabs (guarded by onboarding) */}
            <Route element={<RequireOnboarded />}>
              <Route path="/tabs" element={<TabLayout />}>
                <Route index element={<Navigate to="/tabs/home" replace />} />
                <Route path="home" element={<HomePage />} />
                <Route path="explore" element={<ExplorePage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Auth */}
              <Route path="/auth" element={<AuthGateRoute />} />
              <Route path="/auth/login" element={<AuthLogin />} />
              <Route path="/auth/signup" element={<AuthSignup />} />
              <Route path="/auth/verify" element={<AuthVerify />} />

              {/* Bible */}
              <Route path="/bible/explorer" element={<BibleExplorer />} />
              <Route path="/bible/book/:bookId" element={<BibleBook />} />
              <Route path="/bible/book" element={<Navigate to="/bible/explorer" replace />} />
              <Route path="/bible/chapter" element={<BibleChapter />} />

              {/* Memorization */}
              <Route path="/memorization/session" element={<MemorizationSession />} />
              <Route path="/memorization/flashcard" element={<MemorizationFlashcard />} />
              <Route path="/memorization/confirm" element={<MemorizationConfirm />} />

              {/* Review */}
              <Route path="/review/queue" element={<ReviewQueue />} />
              <Route path="/review/session" element={<ReviewSession />} />
              <Route path="/review/summary" element={<ReviewSummary />} />
              <Route path="/review/calendar" element={<ReviewCalendar />} />
              <Route path="/review/history" element={<ReviewHistory />} />

              {/* Family */}
              <Route path="/family/home" element={<FamilyHome />} />
              <Route path="/family/members" element={<FamilyMembers />} />
              <Route path="/family/invite" element={<FamilyInvite />} />
              <Route path="/family/join" element={<FamilyJoin />} />

              {/* Settings sub-pages */}
              <Route path="/settings" element={<SettingsIndex />} />
              <Route path="/settings/languages" element={<SettingsLanguages />} />
              <Route
                path="/settings/available-translations"
                element={<SettingsAvailableTranslations />}
              />
              <Route path="/settings/appearance" element={<SettingsAppearance />} />
              <Route path="/settings/backup" element={<SettingsBackup />} />
              <Route path="/settings/about" element={<SettingsAbout />} />
              <Route path="/settings/privacy" element={<SettingsPrivacy />} />
              <Route path="/settings/session" element={<SettingsSession />} />
              <Route path="/settings/reminders" element={<SettingsReminders />} />

              {/* Misc */}
              <Route path="/search" element={<SearchPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/mastery" element={<MasteryPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/analytics/dashboard" element={<AnalyticsDashboard />} />
              <Route path="/profile" element={<ProfileIndex />} />
              <Route path="/profile/create" element={<ProfileCreate />} />
              <Route path="/profile/select" element={<ProfileSelect />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/comparison/translation" element={<ComparisonTranslation />} />
              <Route path="/comparison/result" element={<ComparisonResultRoute />} />
              <Route path="/ai-coach" element={<AiCoachPage />} />
              <Route path="/memory/start" element={<MemoryStartRoute />} />
              <Route path="/memory/flashcard" element={<MemoryFlashcard />} />
              <Route path="/memory/recall-writing" element={<MemoryRecallWriting />} />
            </Route>

            {/* Public routes */}
            <Route path="/splash" element={<SplashRoute />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </IonApp>
      </BrowserRouter>
    </StrictMode>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = createRoot(rootElement);
root.render(
  <I18nextProvider i18n={i18next}>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </I18nextProvider>,
);
