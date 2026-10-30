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
import '@/styles/tweakcn-presets.css';
import '@/styles/gradients.css';

// Serif font bundle for bible text (referenced by `--vf-font-bible` and
// `tokens.typography.bible = 'Source Serif 4'`). Self-hosted — no network
// fetch, works offline. Other @fontsource packages are available for
// theme font choices (playfair-display, lora, merriweather, etc.) but
// are not imported by default — add them on demand when a theme
// references a specific one.
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/400-italic.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/source-serif-4/700.css';

// Lazy loaded route pages
const TabLayout = lazy(() => import('../app/(tabs)/_layout'));
const HomePage = lazy(() => import('../app/(tabs)/index'));
const ExplorePage = lazy(() => import('../app/(tabs)/explore'));
const ProgressPage = lazy(() => import('../app/(tabs)/progress'));
const SettingsPage = lazy(() => import('../app/(tabs)/settings'));
const AuthLogin = lazy(() => import('../app/(tabs)/auth/login'));
const AuthSignup = lazy(() => import('../app/(tabs)/auth/signup'));
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
const MemorizationWorkspace = lazy(() => import('../app/memorization/workspace'));

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
const FamilyPresentation = lazy(() => import('../app/family/presentation'));
const FamilyCreate = lazy(() => import('../app/family/create'));
const FamilyProfile = lazy(() => import('../app/family/profile'));
const FamilySelectProfile = lazy(() => import('../app/family/select-profile'));
const FamilyMember = lazy(() => import('../app/family/member'));
const FamilyLeaderboard = lazy(() => import('../app/family/leaderboard'));
const FamilyPoints = lazy(() => import('../app/family/points'));
const FamilyChallenges = lazy(() => import('../app/family/challenges/index'));
const FamilyChallengeNew = lazy(() => import('../app/family/challenges/new'));
const FamilyChallengeDetail = lazy(() => import('../app/family/challenges/detail'));
const FamilyChallengeResults = lazy(() => import('../app/family/challenges/results'));
const FamilySettings = lazy(() => import('../app/family/settings'));
const FamilySessionPrepare = lazy(() => import('../app/family/session/prepare'));
const FamilySessionLive = lazy(() => import('../app/family/session/live'));
const FamilySessionSummary = lazy(() => import('../app/family/session/summary'));
const FamilyActivity = lazy(() => import('../app/family/activity'));
const FamilySync = lazy(() => import('../app/family/sync'));
const NotesPage = lazy(() => import('../app/notes'));

// Settings sub-pages
const SettingsLanguages = lazy(() => import('../app/settings/languages'));
const SettingsAppearance = lazy(() => import('../app/settings/appearance'));
const SettingsBackup = lazy(() => import('../app/settings/backup'));
const SettingsAbout = lazy(() => import('../app/settings/about'));
const SettingsPrivacy = lazy(() => import('../app/settings/privacy'));
const SettingsSession = lazy(() => import('../app/settings/session'));
const SettingsReminders = lazy(() => import('../app/settings/reminders'));
const SettingsIndex = lazy(() => import('../app/settings/index'));
const SettingsAvailableTranslations = lazy(() => import('../app/settings/available-translations'));
const SettingsThemePicker = lazy(() => import('../app/settings/theme-picker'));
const SettingsNavigation = lazy(() => import('../app/settings/navigation'));
const SettingsData = lazy(() => import('../app/settings/data'));

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
const MemoryStart = lazy(() => import('../app/memory/start'));
const MemoryFlashcard = lazy(() => import('../app/memory/flashcard'));
const MemoryRecallWriting = lazy(() => import('../app/memory/recall-writing'));
// Semantic tree views (LOCAL_ONLY semantic store, tree UI — P0.2)
const SemanticIndex = lazy(() => import('../app/semantic/index'));
const SemanticConcept = lazy(() => import('../app/semantic/concept'));
const SemanticVerse = lazy(() => import('../app/semantic/verse'));
const SemanticCommunity = lazy(() => import('../app/semantic/community'));
const SemanticTags = lazy(() => import('../app/semantic/tags'));
const SemanticTagNew = lazy(() => import('../app/semantic/tags/new'));
const SemanticTree = lazy(() => import('../app/semantic/tree'));
const SemanticNode = lazy(() => import('../app/semantic/node'));
const SemanticSuggestions = lazy(() => import('../app/semantic/suggestions'));
const SemanticReview = lazy(() => import('../app/semantic/review'));
const SemanticAttach = lazy(() => import('../app/semantic/attach'));
const SemanticData = lazy(() => import('../app/semantic/data'));

/**
 * Laboratoire de prévisualisation — **développement uniquement**.
 *
 * Le `import()` est dans une branche que Vite remplace par `false` en
 * production : le module, la route et les iframes n'existent pas dans le
 * bundle livré (vérifié par `grep` sur `www/assets` après `npm run build`).
 */
const ResponsivePreview = import.meta.env.DEV
  ? lazy(() => import('../app/__dev/responsive-preview'))
  : null;

import i18next, { initI18next } from '@/i18n/i18next-init';
import { initializeSettingsStore, useSettingsStore } from '@/store/settings-store';
import { initializeAppearanceStore, useAppearanceStore } from '@/store/appearance-store';
import { initializeUiStore } from '@/store/ui-store';
import { ThemeManager } from '@/components/ThemeManager';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth-store';
import { useFamilySyncBridge } from '@/hooks/useFamilySyncBridge';
import { useProfileSyncBridge } from '@/hooks/useProfileSyncBridge';
import { attachSyncCompletionHandlers } from '@/services/sync-completion-service';
import { wireAppTelemetry } from '@/services/app-telemetry-wiring';
import { wireStreakCoordinator } from '@/services/streak-wiring';
import { notificationService } from '@/services/notification-service';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import { isRTL, DEFAULT_LANGUAGE, normalizeLocaleCode } from '@/domains/i18n/config';

// Initialize i18n + boot-time one-shot wiring (PowerSync lifecycle,
// telemetry listener + periodic flush, streak event-driven writer).
//
// The three `initialize*Store()` calls below hydrate the settings,
// appearance and ui Zustand stores asynchronously (MmkvStorage →
// localStorage reads) BEFORE React's first render. This is required
// for `RootRedirect` to read the persisted `versyflow:onboarding:completed`
// flag before the first route evaluation: otherwise the router always
// lands on `/onboarding/welcome` on a hard reload, because the Zustand
// store still holds its default `onboardingCompleted: false` at the
// moment `Navigate` fires, and the router does not re-evaluate the `/`
// redirect after it has pushed to a sub-route. The reads are
// localStorage-backed (MmkvStorage), so they resolve in <1 ms on the
// deployed SPA host and add no perceptible startup cost.
/**
 * Module de prévisualisation, chargé **à la demande** et seulement dans une
 * frame ouverte par `preview-frame.html` (`window.__VF_PREVIEW_ROLE__`).
 *
 * Une double barrière empêche sa présence en production :
 *  1. `import.meta.env.DEV` est remplacé par `false` au build, donc tout le
 *     corps ci-dessous — y compris le `import()` — est éliminé ;
 *  2. la frame doit avoir été marquée par `preview-frame.html`, fichier absent
 *     du build.
 */
type PreviewModule = typeof import('@/dev/preview-session');
let previewModule: PreviewModule | null = null;

function isPreviewFrame(): boolean {
  return typeof window !== 'undefined' && typeof window.__VF_PREVIEW_ROLE__ === 'string';
}

async function loadPreviewModule(): Promise<PreviewModule | null> {
  if (!import.meta.env.DEV) return null;
  if (!isPreviewFrame()) return null;
  const module = await import('@/dev/preview-session');
  previewModule = module;
  return module;
}

const bootStoresPromise = (async () => {
  // Cadre de prévisualisation : le stockage est déjà en mémoire (posé par
  // `preview-frame.html`), on y sème le jeu de démonstration AVANT toute
  // hydratation — sinon les stores partiraient sur l'onboarding ou sans
  // profil — et on place l'URL sur l'écran demandé avant le montage du
  // routeur. Aucun effet hors prévisualisation, aucun effet en production.
  const preview = await loadPreviewModule();
  if (preview?.isPreviewRequest()) {
    preview.seedPreviewStorage();
    preview.applyInitialPath();
  }

  await initI18next();
  const activeLanguage = normalizeLocaleCode(i18next.language ?? DEFAULT_LANGUAGE);
  document.documentElement.dir = isRTL(activeLanguage) ? 'rtl' : 'ltr';
  await Promise.all([
    initializeSettingsStore(),
    initializeAppearanceStore(),
    initializeUiStore(),
  ]);
  // Sync-side wiring runs after the stores are hydrated so the
  // `initializeSettingsStore()` side-effects above (language sync,
  // persisted flag restore) have already landed in the Zustand state.
  attachSyncCompletionHandlers();
  wireAppTelemetry();
  wireStreakCoordinator();
  wireSessionRefresh();
  void scheduleBootReminders();
})();

/** Boot-time reminder scheduling with the notification body translated in
 *  the active UI language and the reminder config read from the store —
 *  the service itself stays dependency-injected (no store/i18next access). */
async function scheduleBootReminders() {
  const {
    reminderEnabled,
    reminderFrequency,
    reminderTime,
  } = useAppearanceStore.getState();
  await notificationService.scheduleDailyReminders(
    { enabled: reminderEnabled, frequency: reminderFrequency, time: reminderTime },
    i18next.t('reminders.notificationBody', 'Temps de révision !'),
  );
}

/** SPA equivalent of the Supabase "session refresh" middleware: re-checks and
 *  refreshes the auth session periodically so long-lived webview/native
 *  sessions don't expire unnoticed. No-op when signed out. */
function wireSessionRefresh() {
  const REFRESH_EVERY_MS = 10 * 60 * 1000;
  setInterval(() => {
    const { isAuthenticated, refreshSession } = useAuthStore.getState();
    if (isAuthenticated) void refreshSession();
  }, REFRESH_EVERY_MS);
}

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
      const lng = normalizeLocaleCode(i18next.language ?? DEFAULT_LANGUAGE);
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
    <AuthIndex onSkip={() => navigate('/tabs/home')} />
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
          <ErrorBoundary>
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

              {/* Bible — the explorer is URL-driven: each view is a route */}
              <Route path="/bible/explorer" element={<BibleExplorer />} />
              <Route path="/bible/explorer/:bookId" element={<BibleExplorer />} />
              <Route path="/bible/explorer/:bookId/:chapter" element={<BibleExplorer />} />
              <Route path="/bible/book/:bookId" element={<BibleBook />} />
              <Route path="/bible/book" element={<Navigate to="/bible/explorer" replace />} />
              <Route path="/bible/chapter" element={<Navigate to="/bible/explorer" replace />} />
              <Route path="/bible/chapter/:bookId/:chapterNumber" element={<BibleChapter />} />

              {/* Memorization */}
              <Route path="/memorization/session" element={<MemorizationSession />} />
              <Route path="/memorization/flashcard" element={<MemorizationFlashcard />} />
              <Route path="/memorization/confirm" element={<MemorizationConfirm />} />
              <Route path="/memorization/workspace" element={<MemorizationWorkspace />} />

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
              <Route path="/family/presentation" element={<FamilyPresentation />} />
              <Route path="/family/create" element={<FamilyCreate />} />
              <Route path="/family/profile" element={<FamilyProfile />} />
              <Route path="/family/select-profile" element={<FamilySelectProfile />} />
              <Route path="/family/member/:accountId" element={<FamilyMember />} />
              <Route path="/family/leaderboard" element={<FamilyLeaderboard />} />
              <Route path="/family/points" element={<FamilyPoints />} />
              <Route path="/family/challenges" element={<FamilyChallenges />} />
              <Route path="/family/challenges/new" element={<FamilyChallengeNew />} />
              <Route path="/family/challenges/:challengeId" element={<FamilyChallengeDetail />} />
              <Route path="/family/challenges/:challengeId/results" element={<FamilyChallengeResults />} />
              <Route path="/family/settings" element={<FamilySettings />} />
              <Route path="/family/session/prepare" element={<FamilySessionPrepare />} />
              <Route path="/family/session/live" element={<FamilySessionLive />} />
              <Route path="/family/session/summary" element={<FamilySessionSummary />} />
              <Route path="/family/activity" element={<FamilyActivity />} />
              <Route path="/family/sync" element={<FamilySync />} />

              {/* Settings sub-pages */}
              <Route path="/settings" element={<SettingsIndex />} />
              <Route path="/settings/languages" element={<SettingsLanguages />} />
              <Route path="/settings/appearance" element={<SettingsAppearance />} />
              <Route path="/settings/backup" element={<SettingsBackup />} />
              <Route path="/settings/about" element={<SettingsAbout />} />
              <Route path="/settings/privacy" element={<SettingsPrivacy />} />
              <Route path="/settings/session" element={<SettingsSession />} />
              <Route path="/settings/reminders" element={<SettingsReminders />} />
              <Route path="/settings/available-translations" element={<SettingsAvailableTranslations />} />
              <Route path="/settings/theme-picker" element={<SettingsThemePicker />} />
              <Route path="/settings/navigation" element={<SettingsNavigation />} />
              <Route path="/settings/data" element={<SettingsData />} />

              {/* Misc */}
              <Route path="/search" element={<SearchPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/mastery" element={<MasteryPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/analytics/dashboard" element={<AnalyticsDashboard />} />
              <Route path="/profile" element={<ProfileIndex />} />
              <Route path="/profile/create" element={<ProfileCreate />} />
              <Route path="/profile/select" element={<ProfileSelect />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/comparison/translation" element={<ComparisonTranslation />} />
              <Route path="/comparison/result" element={<ComparisonResultRoute />} />
              <Route path="/memory/start" element={<MemoryStartRoute />} />
              <Route path="/memory/flashcard" element={<MemoryFlashcard />} />
              <Route path="/memory/recall-writing" element={<MemoryRecallWriting />} />

              {/* Semantic tree views */}
              <Route path="/semantic" element={<SemanticIndex />} />
              <Route path="/semantic/concept" element={<SemanticConcept />} />
              <Route path="/semantic/verse" element={<SemanticVerse />} />
              <Route path="/semantic/community" element={<SemanticCommunity />} />
              <Route path="/semantic/tags" element={<SemanticTags />} />
              <Route path="/semantic/tags/new" element={<SemanticTagNew />} />
              <Route path="/semantic/tree" element={<SemanticTree />} />
              <Route path="/semantic/node" element={<SemanticNode />} />
              <Route path="/semantic/suggestions" element={<SemanticSuggestions />} />
              <Route path="/semantic/review" element={<SemanticReview />} />
              <Route path="/semantic/attach" element={<SemanticAttach />} />
              <Route path="/semantic/data" element={<SemanticData />} />
            </Route>

            {/* Public routes */}
            {/*
              Laboratoire responsive (dev uniquement) : hors du garde
              d'onboarding, justement pour pouvoir l'ouvrir sans session et
              sans dépendre de l'état persisté d'un vrai utilisateur.
            */}
            {import.meta.env.DEV && ResponsivePreview && (
              <Route path="/__dev/responsive-preview" element={<ResponsivePreview />} />
            )}

            <Route path="/splash" element={<SplashRoute />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
          <ToastProvider />
        </IonApp>
      </BrowserRouter>
    </StrictMode>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = createRoot(rootElement);

/**
 * Gate React's first render on the boot-time store hydration
 * (`initializeSettingsStore` / `initializeAppearanceStore` /
 * `initializeUiStore`, awaited inside `bootStoresPromise`).
 *
 * Without this gate the router evaluates `/` before the persisted
 * `versyflow:onboarding:completed` flag has reached the Zustand store,
 * so `RootRedirect` always fires `Navigate` to `/onboarding/welcome`
 * on a hard reload — and the router never re-evaluates the `/` route
 * afterwards, so the screen is stuck on onboarding even when the user
 * has already completed it. i18next resources also finish loading in
 * the same async block, so deferring the render there guarantees both
 * the store and the translations are ready before the first paint.
 */
function BootSplash() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fbf9f9',
        color: 'var(--color-primary, #e6067a)',
        fontFamily: 'Georgia, serif',
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      VersyFlow…
    </div>
  );
}

/**
 * Précharge TOUTES les pages paresseuses après le premier rendu (au repos,
 * dans l'ordre) : chaque chunk est déjà en cache quand l'utilisateur
 * navigue, donc aucun écran d'attente n'apparaît lors des transitions.
 */
function preloadAllPages() {
  const load = () => {
    void import('../app/(tabs)/_layout');
    void import('../app/(tabs)/auth');
    void import('../app/(tabs)/auth/login');
    void import('../app/(tabs)/auth/signup');
    void import('../app/(tabs)/explore');
    void import('../app/(tabs)/index');
    void import('../app/(tabs)/progress');
    void import('../app/(tabs)/settings');
    void import('../app/+not-found');
    void import('../app/achievements/index');
    void import('../app/analytics/dashboard');
    void import('../app/bible/book');
    void import('../app/bible/chapter');
    void import('../app/bible/explorer');
    void import('../app/collections/index');
    void import('../app/comparison/result');
    void import('../app/comparison/translation');
    void import('../app/family/home');
    void import('../app/family/invite');
    void import('../app/family/join');
    void import('../app/family/members');
    void import('../app/family/activity');
    void import('../app/family/challenges/detail');
    void import('../app/family/challenges/index');
    void import('../app/family/challenges/new');
    void import('../app/family/challenges/results');
    void import('../app/family/create');
    void import('../app/family/leaderboard');
    void import('../app/family/member');
    void import('../app/family/points');
    void import('../app/family/presentation');
    void import('../app/family/profile');
    void import('../app/family/select-profile');
    void import('../app/family/session/live');
    void import('../app/family/session/prepare');
    void import('../app/family/session/summary');
    void import('../app/family/settings');
    void import('../app/family/sync');
    void import('../app/mastery/index');
    void import('../app/memorization/confirm');
    void import('../app/memorization/flashcard');
    void import('../app/memorization/session');
    void import('../app/memorization/workspace');
    void import('../app/memory/flashcard');
    void import('../app/memory/recall-writing');
    void import('../app/memory/start');
    void import('../app/notifications');
    void import('../app/onboarding/_layout');
    void import('../app/onboarding/fsrs-introduction');
    void import('../app/onboarding/language-select');
    void import('../app/onboarding/reminder-config');
    void import('../app/onboarding/session-config');
    void import('../app/onboarding/translation-select');
    void import('../app/onboarding/welcome');
    void import('../app/profile/create');
    void import('../app/profile/index');
    void import('../app/profile/select');
    void import('../app/review/History');
    void import('../app/review/calendar');
    void import('../app/review/queue');
    void import('../app/review/session');
    void import('../app/review/summary');
    void import('../app/search/index');
    void import('../app/semantic/community');
    void import('../app/semantic/concept');
    void import('../app/semantic/index');
    void import('../app/semantic/verse');
    void import('../app/semantic/attach');
    void import('../app/semantic/data');
    void import('../app/semantic/node');
    void import('../app/semantic/review');
    void import('../app/semantic/suggestions');
    void import('../app/semantic/tags');
    void import('../app/semantic/tags/new');
    void import('../app/semantic/tree');
    void import('../app/notes');
    void import('../app/settings/about');
    void import('../app/settings/appearance');
    void import('../app/settings/available-translations');
    void import('../app/settings/backup');
    void import('../app/settings/data');
    void import('../app/settings/index');
    void import('../app/settings/languages');
    void import('../app/settings/navigation');
    void import('../app/settings/privacy');
    void import('../app/settings/reminders');
    void import('../app/settings/session');
    void import('../app/settings/theme-picker');
    void import('../app/splash');
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(load);
  else setTimeout(load, 600);
}

let rendered = false;
function renderApp() {
  if (rendered) return;
  rendered = true;
  root.render(
    <I18nextProvider i18n={i18next}>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </I18nextProvider>,
  );
  preloadAllPages();
  // Le pont n'est branché que dans une frame de prévisualisation : il relaie
  // la navigation et le thème envoyés par le laboratoire.
  if (import.meta.env.DEV && previewModule?.isPreviewRequest()) {
    previewModule.attachPreviewBridge();
  }
}

// Ne jamais rester sur un écran blanc : si l'initialisation (i18n, stores,
// sync…) traîne ou échoue, on rend quand même l'app après 2 s. Les
// composants ont des littéraux de secours quand i18next n'est pas prêt.
const bootTimeout = new Promise<void>((resolve) => {
  setTimeout(() => {
    console.warn('[boot] Initialisation lente — rendu de secours après 2 s.');
    resolve();
  }, 2000);
});
Promise.race([bootStoresPromise, bootTimeout]).then(renderApp, (error: unknown) => {
  console.error('Failed to initialise i18n/stores at boot:', error);
  renderApp();
});
