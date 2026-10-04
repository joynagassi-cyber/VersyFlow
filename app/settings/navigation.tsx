/**
 * Settings — Navigation & Pages screen.
 *
 * Lets the user toggle which bottom-nav pages are visible in the app.
 * Each feature (semantic tree, analytics, collections, etc.) maps to a
 * tab id; toggling hides that page from the bottom bar without removing
 * the feature from the app.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LayoutGrid, Star, BarChart3, BookOpen, SlidersHorizontal } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { ListItem } from '@/components/ui/ListItem';
import { useUiStore, type TabId } from '@/store/ui-store';

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

export default function NavigationSettingsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const visibleTabs = useUiStore((s) => s.visibleTabs);
  const setVisibleTab = useUiStore((s) => s.setVisibleTab);

  const toggle = (tabId: TabId) => {
    setVisibleTab(tabId, !visibleTabs.includes(tabId));
  };

  return (
    <FullScreenPage
      title={t('settings.navigation', 'Navigation & Pages')}
      showBack
      backPath="/settings"
    >
      <div className="mx-auto max-w-md space-y-5">
        <p className="px-1 text-sm text-text-muted">
          {t('settings.navigationHint', 'Choisissez quelles pages sont visibles dans la barre de navigation en bas de l’appli. Désactiver une page ne supprime pas sa fonctionnalité.') }
        </p>

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
                  <span
                    className={
                      'rounded-full px-3 py-1 text-xs font-bold ' +
                      (visible ? 'bg-success-light text-success' : 'bg-surface-tint text-text-muted')
                    }
                  >
                    {visible ? t('common.on', 'Visible') : t('common.off', 'Masquée')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced: toggle sub-features reachable from the hamburger menu */}
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <div className="px-4 pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
              {t('settings.navigationMenu', 'Pages du menu (hamburger)')}
            </p>
          </div>
          <div className="mt-2 flex flex-col divide-y divide-[color:var(--color-divider)]">
            {[
              { path: '/semantic', i18nKey: 'nav.semantic', defaultLabel: 'Arbre sémantique' },
              { path: '/analytics/dashboard', i18nKey: 'nav.analytics', defaultLabel: 'Analytique' },
              { path: '/collections', i18nKey: 'nav.collections', defaultLabel: 'Collections' },
              { path: '/achievements', i18nKey: 'nav.achievements', defaultLabel: 'Succès' },
            ].map(({ path, i18nKey, defaultLabel }) => (
              <ListItem
                key={path}
                icon={Star}
                label={t(i18nKey, defaultLabel)}
                value={t('common.active', 'Active')}
                onClick={() => navigate(path)}
                showChevron
                iconBgClass="bg-surface-tint text-primary"
              />
            ))}
          </div>
        </div>
      </div>
    </FullScreenPage>
  );
}
