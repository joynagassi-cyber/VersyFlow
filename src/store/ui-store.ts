/**
 * UI store - persistent navigation preferences (which bottom tabs are shown).
 * "settings" is always kept available so the user can reach the toggle UI.
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
  menuOpen: boolean;
  setVisibleTab: (id: TabId, visible: boolean) => void;
  setAllTabs: (ids: TabId[]) => void;
  reset: () => void;
  openMenu: () => void;
  closeMenu: () => void;
}

function normalize(ids: TabId[]): TabId[] {
  const clean = ids.filter((t) => DEFAULT_TABS.includes(t));
  if (!clean.includes('settings')) clean.push('settings');
  return clean.length ? clean : ['settings'];
}

export const useUiStore = create<UiState>(() => ({
  visibleTabs: DEFAULT_TABS,
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

  reset() {
    useUiStore.setState({ visibleTabs: DEFAULT_TABS });
    void uiStorePersist.save();
  },
}));

export const uiStorePersist = {
  hydrate: async () => {
    try {
      const raw = await storage.get(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { visibleTabs?: TabId[] };
      if (Array.isArray(parsed.visibleTabs) && parsed.visibleTabs.length) {
        useUiStore.setState({ visibleTabs: normalize(parsed.visibleTabs) });
      }
    } catch {
      /* ignore */
    }
  },
  save: async () => {
    const { visibleTabs } = useUiStore.getState();
    await storage.set(KEY, JSON.stringify({ visibleTabs }));
  },
};

export async function initializeUiStore(): Promise<void> {
  try {
    await uiStorePersist.hydrate();
  } catch {
    /* ignore */
  }
}
