/**
 * Tab Navigation Layout — Shell for main app tabs
 * Uses IonTabBar + IonTabButton (Ionic React) with Lucide icons.
 * 4 tabs: Accueil, Explorer, Progression, Paramètres + FAB session.
 */

import {
  IonPage,
  IonTabBar,
  IonTabButton,
  IonFab,
  IonFabButton,
} from '@ionic/react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, BarChart3, Settings, Plus } from 'lucide-react';
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';
import { useTranslation } from 'react-i18next';

interface TabDef {
  path: string;
  label: string;
  Icon: typeof Home;
}

export default function TabLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const TABS: TabDef[] = [
    { path: '/tabs/home', label: t('common.navHome', 'Accueil'), Icon: Home },
    { path: '/tabs/explore', label: t('common.navBible', 'Bible'), Icon: BookOpen },
    { path: '/tabs/progress', label: t('common.navStats', 'Stats'), Icon: BarChart3 },
    { path: '/tabs/settings', label: t('common.navSettings', 'Réglages'), Icon: Settings },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <IonPage>
      {/* Content area — the active tab page renders here */}
      <div className="flex h-full flex-col overflow-hidden">
        {/* Global sync status (single token-only surface — no per-screen `if (offline)`) */}
        <div className="flex items-center justify-end px-2 pt-1">
          <SyncStatusIndicator />
        </div>

        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>

        {/* FAB — start a memorization session */}
        <IonFab horizontal="end" vertical="bottom" style={{ marginBottom: '76px' }}>
          <IonFabButton onClick={() => navigate('/memorization/session')} aria-label="Nouvelle session de mémorisation">
            <Plus size={24} />
          </IonFabButton>
        </IonFab>

        {/* Bottom tab bar */}
        <IonTabBar slot="bottom" className="ion-no-border" color="light">
          {TABS.map(({ path, label, Icon }) => {
            const active = isActive(path);
            return (
              <IonTabButton
                key={path}
                tab={path}
                onClick={() => navigate(path)}
                className="!border-none"
              >
                <Icon
                  size={22}
                  color={active ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span
                  className="mt-0.5 text-[11px] font-semibold"
                  style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                >
                  {label}
                </span>
              </IonTabButton>
            );
          })}
        </IonTabBar>
      </div>
    </IonPage>
  );
}
