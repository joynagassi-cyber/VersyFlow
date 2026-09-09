import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import IonicThemeProvider from '@/theme/IonicThemeProvider';
import { applyIonicVariables } from '@/theme/ionic-variables';
import { I18nService } from '@/i18n';
import React, { Suspense, lazy } from 'react';

// Lazy load pages - using absolute paths
const HomePage = lazy(() => import('../app/(tabs)/index'));
const ExplorePage = lazy(() => import('../app/(tabs)/explore'));
const ProgressPage = lazy(() => import('../app/(tabs)/progress'));
const SettingsPage = lazy(() => import('../app/(tabs)/settings'));
const AuthLogin = lazy(() => import('../app/(tabs)/auth/login'));
const AuthSignup = lazy(() => import('../app/(tabs)/auth/signup'));
const SplashScreen = lazy(() => import('../app/splash'));
const NotFound = lazy(() => import('../app/+not-found'));

// Initialize CSS variables
applyIonicVariables();

// Initialize i18n
const i18n = I18nService.getInstance();
i18n.setLanguage('fr');

function App() {
  return (
    <StrictMode>
      <BrowserRouter>
        <IonicThemeProvider>
          <IonApp>
            <IonRouterOutlet>
              <Routes>
                <Route path="/" element={<Navigate to="/tabs/home" replace />} />
                <Route path="/tabs/home" element={<HomePage />} />
                <Route path="/tabs/explore" element={<ExplorePage />} />
                <Route path="/tabs/progress" element={<ProgressPage />} />
                <Route path="/tabs/settings" element={<SettingsPage />} />
                <Route path="/auth/login" element={<AuthLogin />} />
                <Route path="/auth/signup" element={<AuthSignup />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </IonRouterOutlet>
          </IonApp>
        </IonicThemeProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = createRoot(rootElement);
root.render(<App />);
