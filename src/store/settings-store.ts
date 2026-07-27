/**
 * Store — Settings Store (Zustand)
 * Persists user preferences using MMKV or AsyncStorage fallback
 * See docs/10-data-model.md for storage keys
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MmkvStorage } from '@/infrastructure/storage';

// Storage keys for settings
const STORAGE_KEYS = {
  UI_LANGUAGE: 'versyflow:ui:language',
  BIBLE_TRANSLATION: 'versyflow:bible:translation',
  ONBOARDING_COMPLETED: 'versyflow:onboarding:completed',
};

// Custom storage adapter for MMKV persist middleware
const mmkvStorage = {
  async getItem(key: string): Promise<string | null> {
    const storage = new MmkvStorage();
    return await storage.get(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    const storage = new MmkvStorage();
    await storage.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    const storage = new MmkvStorage();
    await storage.delete(key);
  },
};

// Create a JSON storage wrapper using MMKV
const mmkvJSONStorage = {
  async getItem(key: string): Promise<string | null> {
    const raw = await mmkvStorage.getItem(key);
    return raw ? raw : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    await mmkvStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await mmkvStorage.removeItem(key);
  },
};

interface SettingsState {
  uiLanguage: string;
  bibleTranslation: string;
  onboardingCompleted: boolean;

  setUiLanguage: (lang: string) => Promise<void>;
  setBibleTranslation: (id: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetToDefaults: () => void;
}

// Initial state defaults
const DEFAULTS = {
  uiLanguage: 'fr',
  bibleTranslation: 'lsg',
  onboardingCompleted: false,
};

export const useSettingsStore = create<SettingsState>(
  persist(
    (set, get) => ({
      ...DEFAULTS,

      async setUiLanguage(lang: string) {
        // Validate language
        const supported = ['fr', 'en', 'ar', 'de', 'zh'];
        if (!supported.includes(lang)) {
          console.warn(`Unsupported language: ${lang}, defaulting to fr`);
          lang = 'fr';
        }

        set({ uiLanguage: lang });
        // Persist to storage
        await mmkvStorage.setItem(STORAGE_KEYS.UI_LANGUAGE, lang);
      },

      async setBibleTranslation(id: string) {
        set({ bibleTranslation: id });
        await mmkvStorage.setItem(STORAGE_KEYS.BIBLE_TRANSLATION, id);
      },

      async completeOnboarding() {
        set({ onboardingCompleted: true });
        await mmkvStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      },

      resetToDefaults() {
        set(DEFAULTS);
        mmkvStorage.removeItem(STORAGE_KEYS.UI_LANGUAGE);
        mmkvStorage.removeItem(STORAGE_KEYS.BIBLE_TRANSLATION);
        mmkvStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      },
    }),
    {
      name: 'versyflow-settings-storage',
      storage: mmkvJSONStorage,
      skipOnMount: true, // Don't overwrite on first mount
      onRehydrate: (state) => {
        console.log('Settings store rehydrated:', state);
      },
    },
  )
);

// Load initial values from storage on app start
export async function initializeSettingsStore(): Promise<void> {
  const storage = new MmkvStorage();

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

