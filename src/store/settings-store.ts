/**
 * Store — Settings Store (Zustand)
 * Persists user preferences using MMKV or AsyncStorage fallback
 * See docs/10-data-model.md for storage keys
 */

import { create } from 'zustand';
import i18next from 'i18next';
import { MmkvStorage } from '@/infrastructure/storage';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, normalizeLocaleCode } from '@/domains/i18n/config';

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
  uiLanguage: DEFAULT_LANGUAGE,
  bibleTranslation: 'lsg',
  onboardingCompleted: false,
};

export const useSettingsStore = create<SettingsState>(() => ({
  ...DEFAULTS,

  setUiLanguage(lang: string) {
    // Validate against the canonical registry (single source of truth).
    const codes: string[] = SUPPORTED_LANGUAGES.map((l) => l.code);
    if (!codes.includes(lang)) {
      console.warn(`Unsupported language: ${lang}, defaulting to ${DEFAULT_LANGUAGE}`);
      lang = DEFAULT_LANGUAGE;
    }
    useSettingsStore.setState({ uiLanguage: lang });
    void settingsStorePersist.save();
    // Also persist to localStorage for main.tsx boot-time restore.
    localStorage.setItem(STORAGE_KEYS.UI_LANGUAGE, lang);
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
        uiLanguage: parsed.uiLanguage ? normalizeLocaleCode(parsed.uiLanguage) : DEFAULT_LANGUAGE,
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
    // Mirror the language to the localStorage key that main.tsx boot-time
    // restore reads, so the persisted choice survives an app restart
    // (single source of truth for 'versyflow:ui:language').
    localStorage.setItem(STORAGE_KEYS.UI_LANGUAGE, uiLanguage);
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
    // Sync the i18next-active language into the store if the store is still
    // on its default. This happens on first launch when the language
    // detector picked a non-default language (e.g. navigator locale 'es')
    // but no user action has yet persisted a choice — without this, a later
    // settingsStorePersist.save() would mirror the stale default back to
    // localStorage and clobber the detected language on the next launch.
    // The detector can return compound tags (e.g. 'es-419'); normalize them
    // to a supported bare code before persisting.
    const detectedLang = normalizeLocaleCode(i18next.language);
    if (detectedLang !== DEFAULT_LANGUAGE) {
      const current = useSettingsStore.getState();
      if (current.uiLanguage === DEFAULT_LANGUAGE) {
        useSettingsStore.setState({ uiLanguage: detectedLang });
      }
    }

    const savedLang = await storage.get(STORAGE_KEYS.UI_LANGUAGE);
    if (savedLang) {
      const settingsStore = useSettingsStore.getState();
      if (settingsStore.uiLanguage === DEFAULT_LANGUAGE && savedLang !== DEFAULT_LANGUAGE) {
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
