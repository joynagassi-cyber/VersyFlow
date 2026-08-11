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
  // Snapshot of personal state for quick restoration
  personalSnapshot: {
    activeProfileId: string | null;
    activeFamilyId: string | null;
  } | null;

  setContext: (context: AppContext) => void;
  setFamily: (familyId: string | null) => void;
  setLearner: (learnerId: string | null) => void;
  switchToFamily: (familyId: string) => void;
  switchToPersonal: () => void;
  savePersonalSnapshot: (profileId: string, familyId: string | null) => void;
  restorePersonal: () => void;
  resetContext: () => void;
}

export const useContextStore = create<ContextState>()(
  persist(
    (set, get) => ({
      activeContext: 'personal',
      activeFamilyId: null,
      activeLearnerId: null,
      personalSnapshot: null,

      setContext: (context) => set({ activeContext: context }),

      setFamily: (familyId) => set({ activeFamilyId: familyId }),

      setLearner: (learnerId) => set({ activeLearnerId: learnerId }),

      switchToFamily: (familyId) => {
        const { activeProfileId, activeFamilyId: currentFamily } = get();
        // Save personal snapshot before switching
        set({
          activeContext: 'family',
          activeFamilyId: familyId,
          personalSnapshot: { activeProfileId, activeFamilyId: currentFamily },
        });
      },

      switchToPersonal: () => {
        const { personalSnapshot } = get();
        set({
          activeContext: 'personal',
          activeFamilyId: null,
          activeLearnerId: null,
          personalSnapshot: null,
        });
        // Restore snapshot if available
        if (personalSnapshot) {
          // Note: profile restore is handled by the profile store
        }
      },

      savePersonalSnapshot: (profileId, familyId) => {
        set({ personalSnapshot: { activeProfileId: profileId, activeFamilyId: familyId } });
      },

      restorePersonal: () => {
        const { personalSnapshot } = get();
        set({
          activeContext: 'personal',
          activeFamilyId: null,
          activeLearnerId: null,
          personalSnapshot: null,
        });
      },

      resetContext: () =>
        set({ activeContext: 'personal', activeFamilyId: null, activeLearnerId: null, personalSnapshot: null }),
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
