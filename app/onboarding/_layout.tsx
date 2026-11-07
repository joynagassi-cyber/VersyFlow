/**
 * Onboarding Layout — simple React Router layout for the onboarding flow
 * (no Expo Router — VersyFlow runs on React Router + Ionic)
 */

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { clearOnboardingReady, saveOnboardingProgress } from '@/onboarding/progress';
import { IonPage } from '@ionic/react';

export default function OnboardingLayout() {
  const { pathname } = useLocation();
  const userId = useAuthStore((s) => s.user?.userId);
  useEffect(() => {
    if (!userId) return;
    try { if (pathname !== '/onboarding/journey/success') clearOnboardingReady(userId); saveOnboardingProgress(userId, pathname); } catch { /* Continue without overwriting real data. */ }
  }, [userId, pathname]);
  return (
    <IonPage>
      <div className="app-canvas onboarding-experience flex h-full overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </IonPage>
  );
}
