/**
 * Store — Memorization Store (Zustand)
 * Placeholder for current memorization session state
 */

import { create } from 'zustand';

interface MemorizationState {
  currentRecordId: string | null;
  isSessionActive: boolean;
  revealedWords: Set<number>;
  sessionStartTime: number | null;

  startSession: (recordId: string) => void;
  revealWord: (index: number) => void;
  endSession: () => void;
}

export const useMemorizationStore = create<MemorizationState>((set, get) => ({
  currentRecordId: null,
  isSessionActive: false,
  revealedWords: new Set(),
  sessionStartTime: null,

  startSession: (recordId) => set({
    currentRecordId: recordId,
    isSessionActive: true,
    revealedWords: new Set(),
    sessionStartTime: Date.now(),
  }),

  revealWord: (index) => set((state) => {
    const newRevealed = new Set(state.revealedWords);
    newRevealed.add(index);
    return { revealedWords: newRevealed };
  }),

  endSession: () => set({
    isSessionActive: false,
    currentRecordId: null,
    revealedWords: new Set(),
    sessionStartTime: null,
  }),
}));
