/**
 * Store — Settings Store (Zustand)
 * Minimal placeholder — will be wired with MMKV in Sprint 1
 */

import { create } from 'zustand';

interface SettingsState {
  uiLanguage: string;
  bibleTranslation: string;
  onboardingCompleted: boolean;

  setUiLanguage: (lang: string) => void;
  setBibleTranslation: (id: string) => void;
  completeOnboarding: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  uiLanguage: 'fr', // Default
  bibleTranslation: 'lsg', // Default
  onboardingCompleted: false,

  setUiLanguage: (lang) => set({ uiLanguage: lang }),
  setBibleTranslation: (id) => set({ bibleTranslation: id }),
  completeOnboarding: () => set({ onboardingCompleted: true }),
}));
