/**
 * Store — Settings Store (Zustand)
 * Persists user preferences using MMKV or AsyncStorage fallback
 * See docs/10-data-model.md for storage keys
 */

import { create } from 'zustand';
import { MmkvStorage } from '@/infrastructure/storage';

// Shared MmkvStorage instance — one handle per store lifecycle
const storage = new MmkvStorage();

// Storage keys for settings
const STORAGE_KEYS = {
  UI_LANGUAGE: 'versyflow:ui:language',
  BIBLE_TRANSLATION: 'versyflow:bible:translation',
  ONBOARDING_COMPLETED: 'versyflow:onboarding:completed',
};

export interface SettingsState {
  uiLanguage: string;
  bibleTranslation: string;
  onboardingCompleted: boolean;

  setUiLanguage: (lang: string) => void;
  setBibleTranslation: (id: string) => void;
  completeOnboarding: () => void;
  resetToDefaults: () => void;
}

// `persist` with an async JSON storage adapter widens the state to
// `SettingsState | null` (to represent "not yet rehydrated").
// We keep the public type as `SettingsState` but allow the null-ish shape
// internally to satisfy the generic inference.
export type SettingsPersistState = SettingsState | null;

// Initial state defaults
const DEFAULTS: Pick<SettingsState, 'uiLanguage' | 'bibleTranslation' | 'onboardingCompleted'> = {
  uiLanguage: 'fr',
  bibleTranslation: 'lsg',
  onboardingCompleted: false,
};

export const useSettingsStore = create<SettingsState>(() => ({
  ...DEFAULTS,

  setUiLanguage(lang: string) {
    const supported = ['fr', 'en', 'ar', 'de', 'zh'];
    if (!supported.includes(lang)) {
      console.warn(`Unsupported language: ${lang}, defaulting to fr`);
      lang = 'fr';
    }
    useSettingsStore.setState({ uiLanguage: lang });
    void settingsStorePersist.save();
  },

  setBibleTranslation(id: string) {
    useSettingsStore.setState({ bibleTranslation: id });
    void settingsStorePersist.save();
  },

  completeOnboarding() {
    useSettingsStore.setState({ onboardingCompleted: true });
    void settingsStorePersist.save();
  },

  resetToDefaults() {
    useSettingsStore.setState(DEFAULTS);
    void settingsStorePersist.save();
  },
}));

// Manual persist helper — avoids the zustand v5 `persist` mutator type conflict
// that arises with async JSON storage adapters (`SettingsState | null` widening).
export const settingsStorePersist = {
  hydrate: async () => {
    try {
      const raw = await storage.get('versyflow-settings-storage');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      useSettingsStore.setState({
        uiLanguage: parsed.uiLanguage ?? 'fr',
        bibleTranslation: parsed.bibleTranslation ?? 'lsg',
        onboardingCompleted: parsed.onboardingCompleted ?? false,
      });
    } catch {
      /* ignore */
    }
  },
  save: async () => {
    const { uiLanguage, bibleTranslation, onboardingCompleted } = useSettingsStore.getState();
    const value = JSON.stringify({ uiLanguage, bibleTranslation, onboardingCompleted });
    await storage.set('versyflow-settings-storage', value);
  },
};

// Load initial values from storage on app start
export async function initializeSettingsStore(): Promise<void> {
  try {
    await settingsStorePersist.hydrate();
  } catch (error) {
    console.error('Failed to rehydrate settings store:', error);
  }

  try {
    const savedLang = await storage.get(STORAGE_KEYS.UI_LANGUAGE);
    if (savedLang) {
      const settingsStore = useSettingsStore.getState();
      if (settingsStore.uiLanguage === 'fr' && savedLang !== 'fr') {
        useSettingsStore.setState({ uiLanguage: savedLang });
      }
    }

    const savedTrans = await storage.get(STORAGE_KEYS.BIBLE_TRANSLATION);
    if (savedTrans) {
      useSettingsStore.setState({ bibleTranslation: savedTrans });
    }

    const savedOnboard = await storage.get(STORAGE_KEYS.ONBOARDING_COMPLETED);
    if (savedOnboard === 'true') {
      useSettingsStore.setState({ onboardingCompleted: true });
    }
  } catch (error) {
    console.error('Failed to initialize settings store:', error);
  }
}
