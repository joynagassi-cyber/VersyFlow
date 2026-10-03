/**
 * Appearance Settings Store (Zustand).
 * Persists display preferences (theme mode, accent, font size, verse numbers,
 * reminders) so user choices survive restarts.
 */

import { create } from 'zustand';
import { MmkvStorage } from '@/infrastructure/storage';
import { DEFAULT_ACCENT, type AccentKey } from '@/theme/theme-presets';

const storage = new MmkvStorage();

const STORAGE_KEY = 'versyflow:appearance:settings';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppearanceState {
  themeMode: ThemeMode;
  accent: AccentKey;
  /** Image-based color theme id (from theme-catalog) — null when a plain
   *  accent preset is active. The portrait illustration is applied as the
   *  app background; the accent color is the theme's core hex. */
  colorThemeId: string | null;
  fontSize: number;
  showVerseNumbers: boolean;
  reminderFrequency: number;
  reminderEnabled: boolean;
  sessionGoal: number;
  focusMode: boolean;
  reminderTime: string;

  setThemeMode: (mode: ThemeMode) => void;
  setAccent: (key: AccentKey) => void;
  setColorTheme: (id: string | null) => void;
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
  | 'accent'
  | 'colorThemeId'
  | 'fontSize'
  | 'showVerseNumbers'
  | 'reminderFrequency'
  | 'reminderEnabled'
  | 'sessionGoal'
  | 'focusMode'
  | 'reminderTime'
> = {
  themeMode: 'system',
  accent: DEFAULT_ACCENT,
  colorThemeId: null,
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

  setAccent(key: AccentKey) {
    useAppearanceStore.setState({ accent: key, colorThemeId: null });
    void appearanceStorePersist.save();
  },

  setColorTheme(id: string | null) {
    useAppearanceStore.setState({ colorThemeId: id, accent: id ?? DEFAULT_ACCENT });
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

const PERSISTED_KEYS: (keyof AppearanceState)[] = [
  'themeMode',
  'accent',
  'colorThemeId',
  'fontSize',
  'showVerseNumbers',
  'reminderFrequency',
  'reminderEnabled',
  'sessionGoal',
  'focusMode',
  'reminderTime',
];

export const appearanceStorePersist = {
  hydrate: async () => {
    try {
      const raw = await storage.get(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AppearanceState>;
      const patch: Partial<AppearanceState> = {};
      for (const k of PERSISTED_KEYS) {
        const v = parsed[k];
        if (v !== undefined) (patch as Record<string, unknown>)[k] = v;
      }
      if (parsed.themeMode) patch.themeMode = parsed.themeMode;
      if (parsed.accent) patch.accent = parsed.accent;
      useAppearanceStore.setState(patch);
    } catch {
      /* ignore */
    }
  },
  save: async () => {
    const s = useAppearanceStore.getState();
    const value = JSON.stringify({
      themeMode: s.themeMode,
      accent: s.accent,
      colorThemeId: s.colorThemeId,
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
