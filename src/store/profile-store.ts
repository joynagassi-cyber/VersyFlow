/**
 * Profile Store — Zustand state for LearnerProfiles
 * Manages profile list and active profile selection
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LearnerProfile } from '@/domains/learner-profile';

interface ProfileState {
  activeProfileId: string | null;
  profiles: LearnerProfile[];
  isLoading: boolean;

  setProfiles: (profiles: LearnerProfile[]) => void;
  selectProfile: (id: string) => void;
  addProfile: (profile: LearnerProfile) => void;
  removeProfile: (id: string) => void;
  clearActiveProfile: () => void;
  autoSelectIfSingle: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      activeProfileId: null,
      profiles: [],
      isLoading: false,

      setProfiles: (profiles) => set({ profiles }),

      selectProfile: (id) => {
        set({ activeProfileId: id });
      },

      addProfile: (profile) => {
        const { profiles, activeProfileId } = get();
        const newProfiles = [...profiles, profile];
        // Auto-select if this is the first profile
        const newActiveId = profiles.length === 0 ? profile.id : activeProfileId;
        set({ profiles: newProfiles, activeProfileId: newActiveId });
      },

      removeProfile: (id) => {
        const { profiles, activeProfileId } = get();
        const newProfiles = profiles.filter((p) => p.id !== id);
        const newActiveId = activeProfileId === id ? (newProfiles[0]?.id ?? null) : activeProfileId;
        set({ profiles: newProfiles, activeProfileId: newActiveId });
      },

      clearActiveProfile: () => set({ activeProfileId: null }),

      autoSelectIfSingle: () => {
        const { profiles, activeProfileId } = get();
        if (!activeProfileId && profiles.length === 1) {
          set({ activeProfileId: profiles[0].id });
        }
      },
    }),
    {
      name: 'versyflow-profile-storage',
      partialize: (state) => ({
        activeProfileId: state.activeProfileId,
        profiles: state.profiles,
      }),
    },
  ),
);
