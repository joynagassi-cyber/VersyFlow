/**
 * Memory Capability — Core memorization strategies
 * Handles different learning modes and masking techniques
 */

import { create } from 'zustand';
import { ExerciseStrategy, SessionState } from '@/domains/memorization/entities';

export interface MemoryCapabilityState {
  currentStrategy: ExerciseStrategy;
  sessionState: SessionState | null;

  // Actions
  setStrategy: (strategy: ExerciseStrategy) => void;
  startSession: (state: SessionState) => void;
  updateSession: (partial: Partial<SessionState>) => void;
  completeSession: () => void;
  resetSession: () => void;
}

export const useMemoryCapability = create<MemoryCapabilityState>((set) => ({
  currentStrategy: 'progressive-masking',
  sessionState: null,

  setStrategy: (strategy) => set({ currentStrategy: strategy }),

  startSession: (state) => set({ sessionState: state }),

  updateSession: (partial) =>
    set((state) => ({
      sessionState: state.sessionState
        ? { ...state.sessionState, ...partial }
        : null,
    })),

  completeSession: () =>
    set((state) => ({
      sessionState: state.sessionState
        ? { ...state.sessionState, phase: 'confirmed' }
        : null,
    })),

  resetSession: () => set({ sessionState: null }),
}));
