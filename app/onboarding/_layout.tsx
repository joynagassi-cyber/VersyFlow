/**
 * Onboarding Layout — simple React Router layout for the onboarding flow
 * (no Expo Router — VersyFlow runs on React Router + Ionic)
 */

import { Outlet } from 'react-router-dom';
import { IonPage } from '@ionic/react';

export default function OnboardingLayout() {
  return (
    <IonPage>
      <div className="flex h-full overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </IonPage>
  );
}
