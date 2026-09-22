import { IonPage, IonFab, IonFabButton } from '@ionic/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Plus, Menu } from 'lucide-react';
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';
import { BottomTabs } from '@/components/navigation/BottomTabs';
import { QuickDock } from '@/components/navigation/QuickDock';
import { HamburgerMenu } from '@/components/navigation/HamburgerMenu';
import { Logo } from '@/components/brand/Logo';
import { useUiStore } from '@/store/ui-store';

/**
 * Tab shell: brand top bar (logo + hamburger + sync), scrollable active tab,
 * session FAB, and the dynamic bottom tab bar (only enabled tabs render).
 */
export default function TabLayout() {
  const navigate = useNavigate();
  const openMenu = useUiStore((s) => s.openMenu);

  return (
    <>
      <HamburgerMenu />
      <IonPage>
        <div id="main-content" className="flex h-full flex-col overflow-hidden bg-background">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={openMenu}
              className="rounded-full p-1.5 active:bg-surface-tint"
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} className="text-text-primary" />
            </button>
            <div className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-gradient-hero text-base font-extrabold">VersyFlow</span>
            </div>
            <div className="flex w-12 items-center justify-end">
              <SyncStatusIndicator />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </div>

          <IonFab horizontal="end" vertical="bottom" style={{ marginBottom: '116px' }}>
            <IonFabButton
              onClick={() => navigate('/memorization/session')}
              aria-label="Nouvelle session de memorisation"
            >
              <Plus size={24} />
            </IonFabButton>
          </IonFab>

          <QuickDock />
          <BottomTabs />
        </div>
      </IonPage>
    </>
  );
}
