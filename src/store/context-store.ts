/**
 * Context Store — Manages Personal vs Family app context
 * Phase: Context Management (FAM-CTX-001/002)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AppContext = 'personal' | 'family';

interface ContextState {
  activeContext: AppContext;
  activeFamilyId: string | null;
  activeLearnerId: string | null;

  setContext: (context: AppContext) => void;
  setFamily: (familyId: string | null) => void;
  setLearner: (learnerId: string | null) => void;
  switchToFamily: (familyId: string) => void;
  switchToPersonal: () => void;
  resetContext: () => void;
}

export const useContextStore = create<ContextState>()(
  persist(
    (set) => ({
      activeContext: 'personal',
      activeFamilyId: null,
      activeLearnerId: null,

      setContext: (context) => set({ activeContext: context }),

      setFamily: (familyId) => set({ activeFamilyId: familyId }),

      setLearner: (learnerId) => set({ activeLearnerId: learnerId }),

      switchToFamily: (familyId) =>
        set({ activeContext: 'family', activeFamilyId: familyId }),

      switchToPersonal: () =>
        set({ activeContext: 'personal', activeFamilyId: null, activeLearnerId: null }),

      resetContext: () =>
        set({ activeContext: 'personal', activeFamilyId: null, activeLearnerId: null }),
    }),
    {
      name: 'versyflow-context-storage',
      partialize: (state) => ({
        activeContext: state.activeContext,
        activeFamilyId: state.activeFamilyId,
        activeLearnerId: state.activeLearnerId,
      }),
    },
  ),
);
