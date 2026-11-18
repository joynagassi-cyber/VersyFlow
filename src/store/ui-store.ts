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
import {
  DEFAULT_BAR,
  disableEntry,
  enableEntry,
  moveEntry,
  moveEntryTo,
  normalizeBar,
} from '@/domains/navigation/bottom-bar';

export type TabId = 'home' | 'explore' | 'progress' | 'settings';

/** État du rail de bureau : replié (icônes seules) ou déployé (264 px). */
export type RailMode = 'expanded' | 'collapsed';

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
  /**
   * Contenu ordonné de la barre d'onglets : pages ET fonctions épinglables.
   * Source unique — `visibleTabs` en est dérivé à chaque mutation, pour que le
   * rail de bureau (qui ne montre que des pages) ne puisse pas diverger.
   */
  barItems: string[];
  /** Libellés sous les icônes de la barre (défaut : oui). */
  barLabels: boolean;
  /** Barre compacte : icônes et marges réduites. */
  barCompact: boolean;
  visibleTabs: TabId[];
  /** Paths of the hamburger "Navigation" items that are visible. */
  visibleMenuPaths: string[];
  menuOpen: boolean;
  /** Rail de bureau : mémorisé, lu par le CSS via <html data-rail>. */
  railMode: RailMode;
  setRailMode: (mode: RailMode) => void;
  toggleRail: () => void;
  setVisibleTab: (id: TabId, visible: boolean) => void;
  setBarItems: (ids: string[]) => void;
  enableBarItem: (id: string) => void;
  disableBarItem: (id: string) => void;
  moveBarItem: (id: string, delta: number) => void;
  moveBarItemTo: (id: string, index: number) => void;
  setBarLabels: (on: boolean) => void;
  setBarCompact: (on: boolean) => void;
  resetBar: () => void;
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

/** Les pages de la barre, pour le rail de bureau et les anciens appelants. */
function tabsOf(barItems: string[]): TabId[] {
  return barItems.filter((id): id is TabId => DEFAULT_TABS.includes(id as TabId));
}

/**
 * Écrit la barre ET sa conséquence : `visibleTabs` est recalculé à partir des
 * entrées de type page. Un seul point d'écriture, donc pas de désynchronisation
 * possible entre la barre et le rail.
 */
function commitBar(next: string[]): void {
  const barItems = normalizeBar(next);
  useUiStore.setState({ barItems, visibleTabs: normalize(tabsOf(barItems)) });
  void uiStorePersist.save();
}

export const useUiStore = create<UiState>(() => ({
  barItems: [...DEFAULT_BAR],
  barLabels: true,
  barCompact: false,
  visibleTabs: DEFAULT_TABS,
  visibleMenuPaths: DEFAULT_MENU_PATHS,
  menuOpen: false,
  railMode: 'expanded',

  setRailMode(mode) {
    useUiStore.setState({ railMode: mode });
    void uiStorePersist.save();
  },

  toggleRail() {
    const next: RailMode = useUiStore.getState().railMode === 'expanded' ? 'collapsed' : 'expanded';
    useUiStore.getState().setRailMode(next);
  },

  openMenu() {
    useUiStore.setState({ menuOpen: true });
  },
  closeMenu() {
    useUiStore.setState({ menuOpen: false });
  },

  setVisibleTab(id, visible) {
    const cur = useUiStore.getState().barItems;
    const next = visible ? enableEntry(cur, id) : disableEntry(cur, id);
    commitBar(next);
  },

  setAllTabs(ids) {
    // Remplace les pages : les fonctions épinglées restent, les verrouillées
    // sont réinsérées par `normalizeBar`.
    commitBar(ids);
  },

  setBarItems(ids) {
    commitBar(ids);
  },

  enableBarItem(id) {
    commitBar(enableEntry(useUiStore.getState().barItems, id));
  },

  disableBarItem(id) {
    commitBar(disableEntry(useUiStore.getState().barItems, id));
  },

  moveBarItem(id, delta) {
    commitBar(moveEntry(useUiStore.getState().barItems, id, delta));
  },

  moveBarItemTo(id, index) {
    commitBar(moveEntryTo(useUiStore.getState().barItems, id, index));
  },

  setBarLabels(on) {
    useUiStore.setState({ barLabels: on });
    void uiStorePersist.save();
  },

  setBarCompact(on) {
    useUiStore.setState({ barCompact: on });
    void uiStorePersist.save();
  },

  resetBar() {
    commitBar([...DEFAULT_BAR]);
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
    useUiStore.setState({
      barItems: [...DEFAULT_BAR],
      barLabels: true,
      barCompact: false,
      visibleTabs: DEFAULT_TABS,
      visibleMenuPaths: DEFAULT_MENU_PATHS,
      railMode: 'expanded',
    });
    void uiStorePersist.save();
  },
}));

export const uiStorePersist = {
  hydrate: async () => {
    try {
      const raw = await storage.get(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        visibleTabs?: TabId[];
        barItems?: string[];
        barLabels?: boolean;
        barCompact?: boolean;
        menuVisible?: string[];
        railMode?: RailMode;
      };
      if (parsed.railMode === 'expanded' || parsed.railMode === 'collapsed') {
        useUiStore.setState({ railMode: parsed.railMode });
      }
      if (Array.isArray(parsed.barItems) && parsed.barItems.length) {
        const barItems = normalizeBar(parsed.barItems);
        useUiStore.setState({ barItems, visibleTabs: normalize(tabsOf(barItems)) });
      } else if (Array.isArray(parsed.visibleTabs) && parsed.visibleTabs.length) {
        // Migration : anciennes versions = quatre pages, sans fonctions.
        const legacy = normalize(parsed.visibleTabs);
        useUiStore.setState({ visibleTabs: legacy });
        commitBar([...legacy]);
      }
      if (typeof parsed.barLabels === 'boolean') useUiStore.setState({ barLabels: parsed.barLabels });
      if (typeof parsed.barCompact === 'boolean') useUiStore.setState({ barCompact: parsed.barCompact });
      if (Array.isArray(parsed.menuVisible) && parsed.menuVisible.length) {
        useUiStore.setState({ visibleMenuPaths: normalizeMenuPaths(parsed.menuVisible) });
      }
    } catch {
      /* ignore */
    }
  },
  save: async () => {
    const { visibleTabs, barItems, barLabels, barCompact, visibleMenuPaths, railMode } = useUiStore.getState();
    await storage.set(
      KEY,
      JSON.stringify({ visibleTabs, barItems, barLabels, barCompact, menuVisible: visibleMenuPaths, railMode }),
    );
  },
};

export async function initializeUiStore(): Promise<void> {
  try {
    await uiStorePersist.hydrate();
  } catch {
    /* ignore */
  }
}
