/**
 * BottomTabs — modern pill-style tab bar.
 *
 * Replaces the Ionic <IonTabBar> with a Tailwind bar: each tab is an
 * icon + label column; the active tab gets a soft pill highlight around
 * its icon (material-3 vibe). Only enabled tabs render.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  BookOpen01Icon,
  ChartBarLineIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons';
import { ALL_TABS, useUiStore, type TabId } from '@/store/ui-store';
import { cn } from '@/lib/utils';

const ICONS: Record<TabId, typeof Home01Icon> = {
  home: Home01Icon,
  explore: BookOpen01Icon,
  progress: ChartBarLineIcon,
  settings: Settings01Icon,
};

export function BottomTabs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const visibleTabs = useUiStore((s) => s.visibleTabs);

  const tabs = ALL_TABS.filter((tab) => visibleTabs.includes(tab.id));

  return (
    <nav
      aria-label="Navigation principale"
      className="border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-3 py-2">
        {tabs.map((tab) => {
          const Icon = ICONS[tab.id];
          const active =
            location.pathname === tab.path ||
            location.pathname.startsWith(`${tab.path}/`);
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              aria-current={active ? 'page' : undefined}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-1.5"
            >
              <span
                className={cn(
                  'flex h-8 w-12 items-center justify-center rounded-full transition-colors',
                  active ? 'bg-primary/12' : 'bg-transparent',
                )}
              >
                <HugeiconsIcon
                  icon={Icon}
                  size={23}
                  strokeWidth={active ? 2.4 : 1.8}
                  color={active ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                />
              </span>
              {active && <span className="h-1 w-1 rounded-full bg-primary" />}
              <span
                className={cn(
                  'max-w-[72px] truncate text-[11px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-text-muted',
                )}
              >
                {t(tab.labelKey, tab.label)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomTabs;
