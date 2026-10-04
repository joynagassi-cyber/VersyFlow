/**
 * UI store — persistent navigation preferences (bottom tab visibility and
 * hamburger-menu page visibility).
 *
 * - `visibleTabs` — which bottom-tab pages are shown. "settings" is always
 *   kept available so the user can reach the toggle UI.
 * - `visibleMenuPaths` — which hamburger-menu items (Navigation section) are
 *   shown. The Account section (profile / theme / settings / sign-out) is
 *   intentionally NOT toggleable: it stays visible so the user can never
 *   lock themselves out of settings or sign-out.
 */

import { create } from 'zustand';
import { MmkvStorage } from '@/infrastructure/storage';

export type TabId = 'home' | 'explore' | 'progress' | 'settings';

export interface TabDef {
  id: TabId;
  path: string;
  labelKey: string;
  label: string;
}

/**
 * Canonical list of every hamburger-menu "Navigation" item.
 *
 * Kept in the store (not in the component) so the visibility toggles in
 * `app/settings/navigation.tsx` can render one row per item from a single
 * source of truth. The labels are FR-only because the store layer must
 * not depend on i18next — components translate via `labelKey` + `label`
 * fallback.
 */
export const ALL_MENU_ITEMS: { path: string; labelKey: string; label: string }[] = [
  { path: '/bible/explorer', labelKey: 'nav.explore', label: 'Bible' },
  { path: '/memorization/session', labelKey: 'nav.memorize', label: 'Memorisation' },
  { path: '/review/queue', labelKey: 'nav.review', label: 'Revisions' },
  { path: '/semantic', labelKey: 'nav.semantic', label: 'Semantique' },
  { path: '/analytics/dashboard', labelKey: 'nav.analytics', label: 'Analytics' },
  { path: '/collections', labelKey: 'nav.collections', label: 'Collections' },
  { path: '/achievements', labelKey: 'nav.achievements', label: 'Succes' },
  { path: '/search', labelKey: 'nav.search', label: 'Recherche' },
  { path: '/mastery', labelKey: 'nav.mastery', label: 'Mastery' },
  { path: '/notifications', labelKey: 'nav.notifications', label: 'Notifications' },
  { path: '/review/history', labelKey: 'nav.history', label: 'Review history' },
  { path: '/comparison/translation', labelKey: 'nav.compare', label: 'Compare' },
  { path: '/family/home', labelKey: 'nav.family', label: 'Famille' },
];

const DEFAULT_MENU_PATHS: string[] = ALL_MENU_ITEMS.map((i) => i.path);

const storage = new MmkvStorage();
const KEY = 'versyflow:ui:tabs';

export const ALL_TABS: TabDef[] = [
  { id: 'home', path: '/tabs/home', labelKey: 'common.navHome', label: 'Accueil' },
  { id: 'explore', path: '/tabs/explore', labelKey: 'common.navBible', label: 'Bible' },
  { id: 'progress', path: '/tabs/progress', labelKey: 'common.navStats', label: 'Stats' },
  { id: 'settings', path: '/tabs/settings', labelKey: 'common.navSettings', label: 'Réglages' },
];

const DEFAULT_TABS: TabId[] = ['home', 'explore', 'progress', 'settings'];

interface UiState {
  visibleTabs: TabId[];
  /** Paths of the hamburger "Navigation" items that are visible. */
  visibleMenuPaths: string[];
  menuOpen: boolean;
  setVisibleTab: (id: TabId, visible: boolean) => void;
  setAllTabs: (ids: TabId[]) => void;
  setMenuPathVisible: (path: string, visible: boolean) => void;
  toggleMenuPath: (path: string) => void;
  reset: () => void;
  openMenu: () => void;
  closeMenu: () => void;
}

function normalize(ids: TabId[]): TabId[] {
  const clean = ids.filter((t) => DEFAULT_TABS.includes(t));
  if (!clean.includes('settings')) clean.push('settings');
  return clean.length ? clean : ['settings'];
}

/** Keep only paths that exist in the canonical menu list (order preserved). */
function normalizeMenuPaths(paths: string[]): string[] {
  const clean = paths.filter((p) => DEFAULT_MENU_PATHS.includes(p));
  // Preserve the canonical ordering of the known paths.
  return DEFAULT_MENU_PATHS.filter((p) => clean.includes(p));
}

export const useUiStore = create<UiState>(() => ({
  visibleTabs: DEFAULT_TABS,
  visibleMenuPaths: DEFAULT_MENU_PATHS,
  menuOpen: false,

  openMenu() {
    useUiStore.setState({ menuOpen: true });
  },
  closeMenu() {
    useUiStore.setState({ menuOpen: false });
  },

  setVisibleTab(id, visible) {
    const cur = useUiStore.getState().visibleTabs;
    const next = visible
      ? (cur.includes(id) ? cur : [...cur, id])
      : cur.filter((t) => t !== id);
    useUiStore.setState({ visibleTabs: normalize(next) });
    void uiStorePersist.save();
  },

  setAllTabs(ids) {
    useUiStore.setState({ visibleTabs: normalize(ids) });
    void uiStorePersist.save();
  },

  setMenuPathVisible(path, visible) {
    const cur = useUiStore.getState().visibleMenuPaths;
    const next = visible
      ? (cur.includes(path) ? cur : [...cur, path])
      : cur.filter((p) => p !== path);
    useUiStore.setState({ visibleMenuPaths: normalizeMenuPaths(next) });
    void uiStorePersist.save();
  },

  toggleMenuPath(path) {
    const cur = useUiStore.getState().visibleMenuPaths;
    const visible = !cur.includes(path);
    useUiStore.getState().setMenuPathVisible(path, visible);
  },

  reset() {
    useUiStore.setState({ visibleTabs: DEFAULT_TABS, visibleMenuPaths: DEFAULT_MENU_PATHS });
    void uiStorePersist.save();
  },
}));

export const uiStorePersist = {
  hydrate: async () => {
    try {
      const raw = await storage.get(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { visibleTabs?: TabId[]; menuVisible?: string[] };
      if (Array.isArray(parsed.visibleTabs) && parsed.visibleTabs.length) {
        useUiStore.setState({ visibleTabs: normalize(parsed.visibleTabs) });
      }
      if (Array.isArray(parsed.menuVisible) && parsed.menuVisible.length) {
        useUiStore.setState({ visibleMenuPaths: normalizeMenuPaths(parsed.menuVisible) });
      }
    } catch {
      /* ignore */
    }
  },
  save: async () => {
    const { visibleTabs, visibleMenuPaths } = useUiStore.getState();
    await storage.set(KEY, JSON.stringify({ visibleTabs, menuVisible: visibleMenuPaths }));
  },
};

export async function initializeUiStore(): Promise<void> {
  try {
    await uiStorePersist.hydrate();
  } catch {
    /* ignore */
  }
}
