/**
 * Ionic Router Provider
 *
 * Sets up React Router DOM with all VersyFlow routes.
 * Replaces React Navigation (expo-router) stack and tab navigation.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton } from '@ionic/react';
import { home, book, analytics, add, ellipsisVertical, time, personCircle, flame, star, text, people, settings, calendar, notifications, helpCircle, download, chevronForward, close } from 'ionicons/icons';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from '@/hooks/useIonicNavigation';
import React, { useState, useEffect } from 'react';

// ─── Lazy-loaded page components ──────────────────────────────────────────────

const HomePage = React.lazy(() => import('@/app/(tabs)/index'));
const ExplorePage = React.lazy(() => import('@/app/(tabs)/explore'));
const ProgressPage = React.lazy(() => import('@/app/(tabs)/progress'));
const SettingsPage = React.lazy(() => import('@/app/(tabs)/settings'));
const AuthLogin = React.lazy(() => import('@/app/(tabs)/auth/login'));
const AuthSignup = React.lazy(() => import('@/app/(tabs)/auth/signup'));
const AuthVerify = React.lazy(() => import('@/app/(tabs)/auth/verify'));
const SplashScreen = React.lazy(() => import('@/app/splash'));
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
const NotificationsPage = React.lazy(() => import('@/app/notifications'));
const OnboardingWelcome = React.lazy(() => import('@/app/onboarding/welcome'));
const OnboardingLanguageSelect = React.lazy(() => import('@/app/onboarding/language-select'));
const OnboardingTranslationSelect = React.lazy(() => import('@/app/onboarding/translation-select'));
const OnboardingFsrsIntroduction = React.lazy(() => import('@/app/onboarding/fsrs-introduction'));
const AnalyticsDashboard = React.lazy(() => import('@/app/analytics/dashboard'));
const AiCoachPage = React.lazy(() => import('@/app/ai-coach'));
const MemoryStart = React.lazy(() => import('@/app/memory/start'));
const MemoryFlashcard = React.lazy(() => import('@/app/memory/flashcard'));
const MemoryRecallWriting = React.lazy(() => import('@/app/memory/recall-writing'));
const ComparisonResult = React.lazy(() => import('@/app/comparison/result'));
const AchievementsPage = React.lazy(() => import('@/app/achievements'));
const CollectionsPage = React.lazy(() => import('@/app/collections'));
const MasteryPage = React.lazy(() => import('@/app/mastery'));
const SearchPage = React.lazy(() => import('@/app/search'));
const NotFound = React.lazy(() => import('@/app/+not-found'));

// ─── Tab Navigation ───────────────────────────────────────────────────────────

interface TabRouteProps {
  path: string;
  exact?: boolean;
  component: React.ComponentType;
  icon: string;
  label: string;
}

const tabRoutes: TabRouteProps[] = [
  { path: '/tabs/home', exact: true, component: HomePage, icon: home, label: 'Accueil' },
  { path: '/tabs/explore', component: ExplorePage, icon: book, label: 'Memorize' },
  { path: '/tabs/progress', component: ProgressPage, icon: analytics, label: 'Stats' },
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
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/tabs" render={() => <Navigate to="/tabs/home" replace />} />
          {tabRoutes.map((route) => (
            <Route key={route.path} path={route.path} exact={route.exact} component={route.component} />
          ))}
        </IonRouterOutlet>

        <IonTabBar style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
        }}>
          {tabRoutes.map((route) => (
            <IonTabButton key={route.path} tab={route.path.slice(6)} href={route.path}>
              <IonIcon icon={route.icon} />
              <IonLabel style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>{route.label}</IonLabel>
            </IonTabButton>
          ))}
        </IonTabBar>
      </IonTabs>

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
            <div style={{ paddingVertical: 8 }}>
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
          <IonRouterOutlet>
            {/* Splash & Boot */}
            <Route path="/" component={SplashScreen} />

            {/* Tabs */}
            <Route path="/tabs" component={TabNav} />

            {/* Auth */}
            <Route path="/auth/login" component={AuthLogin} />
            <Route path="/auth/signup" component={AuthSignup} />
            <Route path="/auth/verify" component={AuthVerify} />

            {/* Onboarding */}
            <Route path="/onboarding/welcome" component={OnboardingWelcome} />
            <Route path="/onboarding/language-select" component={OnboardingLanguageSelect} />
            <Route path="/onboarding/translation-select" component={OnboardingTranslationSelect} />
            <Route path="/onboarding/fsrs-introduction" component={OnboardingFsrsIntroduction} />

            {/* Bible */}
            <Route path="/bible/explorer" component={BibleExplorer} />
            <Route path="/bible/book/:bookId" component={BibleBook} />
            <Route path="/bible/chapter/:bookId/:chapterNumber" component={BibleChapter} />

            {/* Memorization */}
            <Route path="/memorization/session" component={MemorizationSession} />
            <Route path="/memorization/confirm" component={MemorizationConfirm} />
            <Route path="/memorization/flashcard" component={MemorizationFlashcard} />

            {/* Review */}
            <Route path="/review/queue" component={ReviewQueue} />
            <Route path="/review/session" component={ReviewSession} />
            <Route path="/review/summary" component={ReviewSummary} />
            <Route path="/review/history" component={ReviewHistory} />
            <Route path="/review/calendar" component={ReviewCalendar} />

            {/* Profile */}
            <Route path="/profile" component={ProfileIndex} />
            <Route path="/profile/create" component={ProfileCreate} />
            <Route path="/profile/select" component={ProfileSelect} />

            {/* Family */}
            <Route path="/family/home" component={FamilyHome} />
            <Route path="/family/invite" component={FamilyInvite} />
            <Route path="/family/join" component={FamilyJoin} />
            <Route path="/family/members" component={FamilyMembers} />

            {/* Settings */}
            <Route path="/settings" component={SettingsPage} />
            <Route path="/settings/appearance" component={SettingsAppearance} />
            <Route path="/settings/languages" component={SettingsLanguages} />
            <Route path="/settings/backup" component={SettingsBackup} />
            <Route path="/settings/privacy" component={SettingsPrivacy} />
            <Route path="/settings/about" component={SettingsAbout} />

            {/* Memory */}
            <Route path="/memory/start" component={MemoryStart} />
            <Route path="/memory/flashcard" component={MemoryFlashcard} />
            <Route path="/memory/recall-writing" component={MemoryRecallWriting} />

            {/* Other */}
            <Route path="/notifications" component={NotificationsPage} />
            <Route path="/comparison/result" component={ComparisonResult} />
            <Route path="/analytics/dashboard" component={AnalyticsDashboard} />
            <Route path="/ai-coach" component={AiCoachPage} />
            <Route path="/achievements" component={AchievementsPage} />
            <Route path="/collections" component={CollectionsPage} />
            <Route path="/mastery" component={MasteryPage} />
            <Route path="/search" component={SearchPage} />
            <Route path="*" component={NotFound} />
          </IonRouterOutlet>

          {children}
        </IonContent>
      </IonApp>
    </BrowserRouter>
  );
}

export default IonicRouterProvider;
