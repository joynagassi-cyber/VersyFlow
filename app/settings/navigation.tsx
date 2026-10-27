/**
 * Settings — Navigation & Pages screen.
 *
 * Two independent groups of toggles, both persisted in the UI store:
 *   1. Bottom-nav tabs (explore / progress) — `visibleTabs`.
 *   2. Hamburger-menu items — one toggle per entry of `ALL_MENU_ITEMS`,
 *      persisted as `visibleMenuPaths`. Hiding an item removes it from
 *      the drawer's Navigation section; the Account section (profile,
 *      theme, settings, sign-out) is always visible and cannot be turned
 *      off.
 */

import { useTranslation } from 'react-i18next';
import {
  Eye,
  BarChart3,
  BookOpen,
  SlidersHorizontal,
  BrainCircuit,
  Folder,
  Trophy,
  Search,
  Target,
  Bell,
  History,
  GitCompare,
  Users,
} from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { useUiStore, ALL_MENU_ITEMS, type TabId } from '@/store/ui-store';

interface ToggleRow {
  tabId: TabId;
  icon: typeof Eye;
  i18nKey: string;
  defaultLabel: string;
}

const TOGGLES: ToggleRow[] = [
  { tabId: 'explore', icon: BookOpen, i18nKey: 'nav.explorePage', defaultLabel: 'Bible (lecture)' },
  { tabId: 'progress', icon: BarChart3, i18nKey: 'nav.progressPage', defaultLabel: 'Statistiques & progression' },
];

/** One icon per hamburger-menu item, keyed by route path. */
const MENU_ITEM_ICONS: Record<string, typeof Eye> = {
  '/bible/explorer': BookOpen,
  '/memorization/session': BrainCircuit,
  '/review/queue': History,
  '/semantic': BrainCircuit,
  '/analytics/dashboard': BarChart3,
  '/collections': Folder,
  '/achievements': Trophy,
  '/search': Search,
  '/mastery': Target,
  '/notifications': Bell,
  '/review/history': History,
  '/comparison/translation': GitCompare,
  '/family/home': Users,
};

export default function NavigationSettingsScreen() {
  const { t } = useTranslation();
  const visibleTabs = useUiStore((s) => s.visibleTabs);
  const setVisibleTab = useUiStore((s) => s.setVisibleTab);
  const visibleMenuPaths = useUiStore((s) => s.visibleMenuPaths);
  const toggleMenuPath = useUiStore((s) => s.toggleMenuPath);

  const toggle = (tabId: TabId) => {
    setVisibleTab(tabId, !visibleTabs.includes(tabId));
  };

  const pillClass = (visible: boolean) =>
    'rounded-full px-3 py-1 text-xs font-bold ' +
    (visible ? 'bg-success-light text-success' : 'bg-surface-tint text-text-muted');

  return (
    <FullScreenPage
      title={t('settings.navigation', 'Navigation & Pages')}
      showBack
      backPath="/settings"
    >
      <div className="mx-auto max-w-md space-y-5">
        <p className="px-1 text-sm text-text-muted">
          {t('settings.navigationHint', 'Choisissez quelles pages sont visibles dans la barre de navigation en bas de l’appli. Désactiver une page ne supprime pas sa fonctionnalité.')}
        </p>

        {/* Section 1 — bottom bar toggles */}
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <div className="px-4 pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
              {t('settings.navigationBottomBar', 'Barre de navigation')}
            </p>
          </div>
          <div className="mt-2 flex flex-col divide-y divide-[color:var(--color-divider)]">
            {TOGGLES.map(({ tabId, icon: Icon, i18nKey, defaultLabel }) => {
              const visible = visibleTabs.includes(tabId);
              return (
                <button
                  key={tabId}
                  onClick={() => toggle(tabId)}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} className={visible ? 'text-primary' : 'text-text-muted'} />
                    <span className="text-base text-text-primary">{t(i18nKey, defaultLabel)}</span>
                  </span>
                  <span className={pillClass(visible)}>
                    {visible ? t('common.on', 'Visible') : t('common.off', 'Masquée')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2 — one toggle per hamburger-menu item */}
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <div className="px-4 pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
              {t('settings.navigationMenu', 'Menu hamburger')}
            </p>
            <p className="mt-1 px-4 text-xs text-text-muted">
              {t('settings.navMenuToggleHint', 'Réglez chaque page du menu. La section Compte reste toujours visible.')}
            </p>
          </div>
          <div className="mt-2 flex flex-col divide-y divide-[color:var(--color-divider)]">
            {ALL_MENU_ITEMS.map(({ path, labelKey, label }) => {
              const Icon = MENU_ITEM_ICONS[path] ?? SlidersHorizontal;
              const visible = visibleMenuPaths.includes(path);
              return (
                <button
                  key={path}
                  onClick={() => toggleMenuPath(path)}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} className={visible ? 'text-primary' : 'text-text-muted'} />
                    <span className="text-base text-text-primary">{t(labelKey, label)}</span>
                  </span>
                  <span className={pillClass(visible)}>
                    {visible ? t('common.on', 'Visible') : t('common.off', 'Masquée')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </FullScreenPage>
  );
}
