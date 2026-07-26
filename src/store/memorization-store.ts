/**
 * Store — Memorization State (Zustand)
 * Enhanced with word reveal tracking and session phase
 */

import { create } from 'zustand';

export interface WordChipState {
  index: number;
  revealed: boolean;
}

interface MemorizationState {
  // Session state
  currentRecordId: string | null;
  verseText: string;
  words: string[];
  wordChips: WordChipState[];
  isSessionActive: boolean;
  sessionPhase: 'idle' | 'preview' | 'revealing' | 'completed' | 'abandoned';
  sessionStartTime: number | null;
  revealedCount: number;
  totalCount: number;

  // Actions
  startSession: (recordId: string, verseText: string, words: string[]) => void;
  revealWord: (index: number) => void;
  revealAllWords: () => void;
  endSession: () => void;
  abandonSession: () => void;
  resetSession: () => void;
  getProgress: () => number;
}

export const useMemorizationStore = create<MemorizationState>((set, get) => ({
  currentRecordId: null,
  verseText: '',
  words: [],
  wordChips: [],
  isSessionActive: false,
  sessionPhase: 'idle',
  sessionStartTime: null,
  revealedCount: 0,
  totalCount: 0,

  startSession: (recordId, verseText, words) => set(() => ({
    currentRecordId: recordId,
    verseText,
    words,
    wordChips: words.map((_, i) => ({ index: i, revealed: false })),
    isSessionActive: true,
    sessionPhase: 'preview',
    sessionStartTime: Date.now(),
    revealedCount: 0,
    totalCount: words.length,
  })),

  revealWord: (index) => set((state) => {
    const newChips = [...state.wordChips];
    if (!newChips[index].revealed) {
      newChips[index] = { ...newChips[index], revealed: true };
    }
    return {
      wordChips: newChips,
      revealedCount: state.revealedCount + (newChips[index].revealed && !newChips[index].revealed ? 1 : 0),
      sessionPhase: 'revealing',
    };
  }),

  revealAllWords: () => set((state) => ({
    wordChips: state.wordChips.map(chip => ({ ...chip, revealed: true })),
    revealedCount: state.totalCount,
    sessionPhase: 'completed',
  })),

  endSession: () => set({
    isSessionActive: false,
    currentRecordId: null,
    sessionPhase: 'completed',
    wordChips: [],
  }),

  abandonSession: () => set({
    isSessionActive: false,
    currentRecordId: null,
    sessionPhase: 'abandoned',
    wordChips: [],
  }),

  resetSession: () => set((state) => ({
    sessionPhase: 'preview',
    wordChips: state.wordChips.map(chip => ({ ...chip, revealed: false })),
    revealedCount: 0,
    sessionStartTime: Date.now(),
  })),

  getProgress: () => {
    const state = get();
    return state.totalCount > 0 ? state.revealedCount / state.totalCount : 0;
  },
}));
