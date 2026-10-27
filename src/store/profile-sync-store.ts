/**
 * Profile Sync Store — Lightweight sync-status wrapper
 *
 * Wraps the existing profile-store with lastSyncAt and syncError tracking.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LearnerProfile } from '@/domains/learner-profile';

export interface ProfileSyncState {
  activeProfileId: string | null;
  profiles: LearnerProfile[];
  isLoading: boolean;
  lastSyncAt: number | null;
  syncError: string | null;
  syncInProgress: boolean;

  setProfiles: (profiles: LearnerProfile[]) => void;
  selectProfile: (id: string) => void;
  addProfile: (profile: LearnerProfile) => void;
  removeProfile: (id: string) => void;
  clearActiveProfile: () => void;
  autoSelectIfSingle: () => void;
  setLastSyncAt: (ts: number) => void;
  setSyncError: (error: string | null) => void;
  setSyncInProgress: (inProgress: boolean) => void;
}

export const useProfileSyncStore = create<ProfileSyncState>()(
  persist(
    (set, get) => ({
      activeProfileId: null,
      profiles: [],
      isLoading: false,
      lastSyncAt: null,
      syncError: null,
      syncInProgress: false,

      setProfiles: (profiles) => set({ profiles }),
      selectProfile: (id) => set({ activeProfileId: id }),
      addProfile: (profile) => {
        const { profiles, activeProfileId } = get();
        const newProfiles = [...profiles, profile];
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
      setLastSyncAt: (ts) => set({ lastSyncAt: ts }),
      setSyncError: (error) => set({ syncError: error }),
      setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),
    }),
    {
      name: 'versyflow-profile-sync-storage',
      partialize: (state) => ({
        activeProfileId: state.activeProfileId,
        profiles: state.profiles,
        lastSyncAt: state.lastSyncAt,
        syncError: state.syncError,
      }),
    },
  ),
);
