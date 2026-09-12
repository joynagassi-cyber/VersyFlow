/**
 * Store — Appearance Settings Store (Zustand)
 * Persists display preferences (theme mode, font size, verse numbers, reminder
 * frequency) so that user choices survive app restarts.
 *
 * The theme mode is additionally wired to the `useTheme` hook which applies the
 * CSS variables; this store provides the source of truth and persistence.
 */

import { create } from 'zustand';
import { MmkvStorage } from '@/infrastructure/storage';

// Shared MmkvStorage instance — one handle per store lifecycle
const storage = new MmkvStorage();

const STORAGE_KEY = 'versyflow:appearance:settings';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppearanceState {
  themeMode: ThemeMode;
  fontSize: number;
  showVerseNumbers: boolean;
  reminderFrequency: number;
  reminderEnabled: boolean;
  sessionGoal: number;
  focusMode: boolean;
  reminderTime: string;

  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: number) => void;
  toggleVerseNumbers: () => void;
  setReminderFrequency: (count: number) => void;
  toggleReminders: () => void;
  setSessionGoal: (count: number) => void;
  setFocusMode: (enabled: boolean) => void;
  setReminderTime: (time: string) => void;
  resetToDefaults: () => void;
}

const DEFAULTS: Pick<
  AppearanceState,
  | 'themeMode'
  | 'fontSize'
  | 'showVerseNumbers'
  | 'reminderFrequency'
  | 'reminderEnabled'
  | 'sessionGoal'
  | 'focusMode'
  | 'reminderTime'
> = {
  themeMode: 'system',
  fontSize: 16,
  showVerseNumbers: true,
  reminderFrequency: 1,
  reminderEnabled: true,
  sessionGoal: 3,
  focusMode: false,
  reminderTime: '09:00',
};

export const useAppearanceStore = create<AppearanceState>(() => ({
  ...DEFAULTS,

  setThemeMode(mode: ThemeMode) {
    useAppearanceStore.setState({ themeMode: mode });
    void appearanceStorePersist.save();
  },

  setFontSize(size: number) {
    useAppearanceStore.setState({ fontSize: size });
    void appearanceStorePersist.save();
  },

  toggleVerseNumbers() {
    const next = !useAppearanceStore.getState().showVerseNumbers;
    useAppearanceStore.setState({ showVerseNumbers: next });
    void appearanceStorePersist.save();
  },

  setReminderFrequency(count: number) {
    const clamped = Math.max(1, Math.min(24, count));
    useAppearanceStore.setState({ reminderFrequency: clamped });
    void appearanceStorePersist.save();
  },

  toggleReminders() {
    const next = !useAppearanceStore.getState().reminderEnabled;
    useAppearanceStore.setState({ reminderEnabled: next });
    void appearanceStorePersist.save();
  },

  setSessionGoal(count: number) {
    const clamped = Math.max(1, Math.min(20, count));
    useAppearanceStore.setState({ sessionGoal: clamped });
    void appearanceStorePersist.save();
  },

  setFocusMode(enabled: boolean) {
    useAppearanceStore.setState({ focusMode: enabled });
    void appearanceStorePersist.save();
  },

  setReminderTime(time: string) {
    useAppearanceStore.setState({ reminderTime: time });
    void appearanceStorePersist.save();
  },

  resetToDefaults() {
    useAppearanceStore.setState(DEFAULTS);
    void appearanceStorePersist.save();
  },
}));

// Manual persist helper — reuses the proven MmkvStorage pattern from
// `settings-store.ts` to avoid the zustand v5 `persist` mutator type widening.
export const appearanceStorePersist = {
  hydrate: async () => {
    try {
      const raw = await storage.get(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AppearanceState>;
      useAppearanceStore.setState({
        themeMode: parsed.themeMode ?? DEFAULTS.themeMode,
        fontSize: parsed.fontSize ?? DEFAULTS.fontSize,
        showVerseNumbers: parsed.showVerseNumbers ?? DEFAULTS.showVerseNumbers,
        reminderFrequency: parsed.reminderFrequency ?? DEFAULTS.reminderFrequency,
        reminderEnabled: parsed.reminderEnabled ?? DEFAULTS.reminderEnabled,
        sessionGoal: parsed.sessionGoal ?? DEFAULTS.sessionGoal,
        focusMode: parsed.focusMode ?? DEFAULTS.focusMode,
        reminderTime: parsed.reminderTime ?? DEFAULTS.reminderTime,
      });
    } catch {
      /* ignore */
    }
  },
  save: async () => {
    const s = useAppearanceStore.getState();
    const value = JSON.stringify({
      themeMode: s.themeMode,
      fontSize: s.fontSize,
      showVerseNumbers: s.showVerseNumbers,
      reminderFrequency: s.reminderFrequency,
      reminderEnabled: s.reminderEnabled,
      sessionGoal: s.sessionGoal,
      focusMode: s.focusMode,
      reminderTime: s.reminderTime,
    });
    await storage.set(STORAGE_KEY, value);
  },
};

export async function initializeAppearanceStore(): Promise<void> {
  try {
    await appearanceStorePersist.hydrate();
  } catch (error) {
    console.error('Failed to rehydrate appearance store:', error);
  }
}
