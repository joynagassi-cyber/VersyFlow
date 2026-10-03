/**
 * Highlight store — user-applied verse highlights (translucent, light & fluid).
 *
 * One persisted `Set` of canonical verse keys (`bookId:ch:verse`). The
 * highlight is applied on top of the manuscript text (a 12 % tint of the
 * accent color, readable on both white #FFFFFF and black #121212).
 *
 * The "Tag" action of the verse floating bar marks the verse in this set
 * (as a lightweight user flag, consumable later by the semantic tree as a
 * personal node) and routes to `/semantic/verse?verseRef=…` where the
 * concepts for that verse are browsed/added.
 */

import { create } from 'zustand';
import { MmkvStorage } from '@/infrastructure/storage';

const storage = new MmkvStorage();
const STORAGE_KEY = 'versyflow:highlights';

export interface HighlightState {
  /** Canonical verse keys the user has highlighted (`bookId:ch:verse`). */
  keys: string[];
  toggle: (key: string) => void;
  has: (key: string) => boolean;
}

function loadInitial(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function persist(keys: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}

const initial = loadInitial();

export const useHighlightStore = create<HighlightState>(() => ({
  keys: initial,
  toggle: (key) => {
    const next = useHighlightStore.getState().keys.includes(key)
      ? useHighlightStore.getState().keys.filter((k) => k !== key)
      : [...useHighlightStore.getState().keys, key];
    useHighlightStore.setState({ keys: next });
    persist(next);
    void storage.set(STORAGE_KEY, JSON.stringify(next));
  },
  has: (key) => useHighlightStore.getState().keys.includes(key),
}));
