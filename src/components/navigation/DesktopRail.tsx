/**
 * DesktopRail — la navigation de bureau.
 *
 * Principes (voir docs/design/desktop-audit-versyflow.md) :
 *  - une seule variable pilote la largeur : `--rail` (264 px / 88 px), posée
 *    sur <html data-rail> et lue par le CSS ;
 *  - le rail RÉUTILISE les listes existantes (`ALL_TABS`, `ALL_MENU_ITEMS`
 *    filtrés par `visibleMenuPaths`) : aucune navigation inventée, aucune
 *    entrée en double avec la barre d'onglets ;
 *  - jamais deux navigations montées en même temps : ce composant n'est rendu
 *    que ≥ 1024 px, et la barre basse n'est pas rendue au-delà ;
 *  - icônes : Hugeicons uniquement, 20 px, `strokeWidth` renforcé sur l'actif
 *    et `aria-current` (un état ne se signale jamais par la seule couleur).
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  BookOpen01Icon,
  ChartBarLineIcon,
  Settings01Icon,
  PlusSignIcon,
  SidebarLeft01Icon,
  Cards01Icon,
  Clock01Icon,
  SparklesIcon,
  Analytics01Icon,
  Layers01Icon,
  Medal01Icon,
  Search01Icon,
  DashboardSquare01Icon,
  Notification01Icon,
  HistoryIcon,
  GitCompareIcon,
  UserGroupIcon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { ALL_MENU_ITEMS, ALL_TABS, useUiStore, type TabId } from '@/store/ui-store';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

type IconType = typeof Home01Icon;

const TAB_ICONS: Record<TabId, IconType> = {
  home: Home01Icon,
  explore: BookOpen01Icon,
  progress: ChartBarLineIcon,
  settings: Settings01Icon,
};

/** Une icône par destination — aucun doublon de signe. */
const MENU_ICONS: Record<string, IconType> = {
  '/bible/explorer': BookOpen01Icon,
  '/memorization/session': Cards01Icon,
  '/review/queue': Clock01Icon,
  '/semantic': SparklesIcon,
  '/analytics/dashboard': Analytics01Icon,
  '/collections': Layers01Icon,
  '/achievements': Medal01Icon,
  '/search': Search01Icon,
  '/mastery': DashboardSquare01Icon,
  '/notifications': Notification01Icon,
  '/review/history': HistoryIcon,
  '/comparison/translation': GitCompareIcon,
  '/family/home': UserGroupIcon,
};

function isActive(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function DesktopRail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const railMode = useUiStore((s) => s.railMode);
  const toggleRail = useUiStore((s) => s.toggleRail);
  const visibleTabs = useUiStore((s) => s.visibleTabs);
  const visibleMenuPaths = useUiStore((s) => s.visibleMenuPaths);

  const collapsed = railMode === 'collapsed';

  // La largeur réelle est décidée par le CSS ; ce composant ne fait que dire
  // dans quel état on est. Une seule source pour `--rail`.
  useEffect(() => {
    document.documentElement.dataset.rail = railMode;
    return () => {
      delete document.documentElement.dataset.rail;
    };
  }, [railMode]);

  const tabs = ALL_TABS.filter((tab) => visibleTabs.includes(tab.id));
  const menuItems = ALL_MENU_ITEMS.filter((item) => visibleMenuPaths.includes(item.path));

  const itemBase =
    'group flex h-9 w-full items-center gap-3 rounded-xl px-2.5 text-start text-sm font-medium transition-colors';
  const iconColumn = 'flex h-6 w-6 flex-none items-center justify-center';

  return (
    <aside
      aria-label="Navigation principale"
      className="desktop-rail fixed inset-y-0 start-0 z-30 flex flex-col border-e border-border bg-surface"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      {/* En-tête : marque + un seul contrôle de repli */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        <button
          type="button"
          onClick={() => navigate('/tabs/home')}
          className={cn(itemBase, 'gap-2.5 px-1 hover:bg-surface-tint')}
          aria-label={t('nav.brandHome', 'VersyFlow — Accueil')}
        >
          <Logo size={28} />
          <span className="rail-label text-primary text-base font-extrabold">VersyFlow</span>
        </button>
        <button
          type="button"
          onClick={toggleRail}
          aria-label={
            collapsed ? t('nav.expandRail', 'Déplier la navigation') : t('nav.collapseRail', 'Replier la navigation')
          }
          aria-expanded={!collapsed}
          className="ms-auto flex h-8 w-8 flex-none items-center justify-center rounded-lg text-text-muted hover:bg-surface-tint hover:text-text-primary"
        >
          <HugeiconsIcon icon={SidebarLeft01Icon} size={19} />
        </button>
      </div>

      {/* Action principale */}
      <div className="px-3 pb-2 pt-3">
        <button
          type="button"
          onClick={() => navigate('/memorization/session')}
          className={cn(
            'flex h-10 w-full items-center gap-2.5 rounded-xl bg-primary text-on-primary transition-opacity hover:opacity-90',
            collapsed ? 'justify-center px-0' : 'px-3',
          )}
          aria-label={t('nav.newSession', 'Nouvelle session')}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={19} strokeWidth={2.2} />
          <span className="rail-label text-sm font-semibold">{t('nav.newSession', 'Nouvelle session')}</span>
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <div className="flex flex-col gap-0.5">
          {tabs.map((tab) => {
            const active = isActive(location.pathname, tab.path);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate(tab.path)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  itemBase,
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-text-secondary hover:bg-surface-tint hover:text-text-primary',
                )}
              >
                <span className={iconColumn}>
                  <HugeiconsIcon
                    icon={TAB_ICONS[tab.id]}
                    size={20}
                    strokeWidth={active ? 2.3 : 1.8}
                  />
                </span>
                <span className="rail-label truncate">{t(tab.labelKey, tab.label)}</span>
              </button>
            );
          })}
        </div>

        <div className="my-2 h-px bg-border" role="presentation" />

        <p className="rail-label px-2.5 pb-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">
          {t('nav.menu', 'Navigation')}
        </p>
        <div className="flex flex-col gap-0.5">
          {menuItems.map((item) => {
            const active = isActive(location.pathname, item.path);
            const Icon = MENU_ICONS[item.path] ?? Layers01Icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                aria-current={active ? 'page' : undefined}
                aria-label={t(item.labelKey, item.label)}
                className={cn(
                  itemBase,
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-text-secondary hover:bg-surface-tint hover:text-text-primary',
                )}
              >
                <span className={iconColumn}>
                  <HugeiconsIcon icon={Icon} size={20} strokeWidth={active ? 2.3 : 1.8} />
                </span>
                <span className="rail-label truncate">{t(item.labelKey, item.label)}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-current={isActive(location.pathname, '/profile') ? 'page' : undefined}
          aria-label={t('nav.profile', 'Profil')}
          className={cn(
            itemBase,
            collapsed && 'justify-center px-0',
            isActive(location.pathname, '/profile')
              ? 'bg-primary/10 font-semibold text-primary'
              : 'text-text-secondary hover:bg-surface-tint hover:text-text-primary',
          )}
        >
          <span className={iconColumn}>
            <HugeiconsIcon icon={UserCircleIcon} size={20} />
          </span>
          <span className="rail-label truncate">{t('nav.profile', 'Profil')}</span>
        </button>
      </div>
    </aside>
  );
}

export default DesktopRail;
