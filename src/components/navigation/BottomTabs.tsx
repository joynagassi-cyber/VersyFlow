import { IonTabBar, IonTabButton } from '@ionic/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, BookOpen, BarChart3, Settings } from 'lucide-react';
import { ALL_TABS, useUiStore, type TabId } from '@/store/ui-store';
import { cn } from '@/lib/utils';

const ICONS: Record<TabId, typeof Home> = {
  home: Home,
  explore: BookOpen,
  progress: BarChart3,
  settings: Settings,
};

export function BottomTabs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const visibleTabs = useUiStore((s) => s.visibleTabs);

  const tabs = ALL_TABS.filter((tab) => visibleTabs.includes(tab.id));

  return (
    <IonTabBar slot="bottom" className="ion-no-border !border-t !border-border">
      {tabs.map((tab) => {
        const Icon = ICONS[tab.id];
        const active =
          location.pathname === tab.path ||
          location.pathname.startsWith(`${tab.path}/`);
        return (
          <IonTabButton
            key={tab.id}
            tab={tab.path}
            onClick={() => navigate(tab.path)}
            className="!border-none"
          >
            <Icon
              size={22}
              color={active ? 'var(--color-primary)' : 'var(--color-text-muted)'}
              strokeWidth={active ? 2.4 : 2}
            />
            <span
              className={
                'mt-0.5 text-[11px] font-semibold ' +
                (active ? 'text-primary' : 'text-text-muted')
              }
            >
              {t(tab.labelKey, tab.label)}
            </span>
          </IonTabButton>
        );
      })}
    </IonTabBar>
  );
}

export default BottomTabs;
