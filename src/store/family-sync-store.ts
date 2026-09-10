/**
 * Family Sync Store — Lightweight sync-status wrapper
 *
 * Wraps the existing family-store with lastSyncAt and syncError tracking.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Family, FamilyMembership } from '@/domains/family';

export interface FamilySyncState {
  activeFamilyId: string | null;
  families: Family[];
  memberships: FamilyMembership[];
  isLoading: boolean;
  lastSyncAt: number | null;
  syncError: string | null;
  syncInProgress: boolean;

  setFamilies: (families: Family[]) => void;
  setActiveFamily: (id: string) => void;
  addFamily: (family: Family) => void;
  removeFamily: (id: string) => void;
  clearActiveFamily: () => void;
  addMembership: (membership: FamilyMembership) => void;
  removeMembership: (familyId: string, accountId: string) => void;
  setLastSyncAt: (ts: number) => void;
  setSyncError: (error: string | null) => void;
  setSyncInProgress: (inProgress: boolean) => void;
}

export const useFamilySyncStore = create<FamilySyncState>()(
  persist(
    (set) => ({
      activeFamilyId: null,
      families: [],
      memberships: [],
      isLoading: false,
      lastSyncAt: null,
      syncError: null,
      syncInProgress: false,

      setFamilies: (families) => set({ families }),
      setActiveFamily: (id) => set({ activeFamilyId: id }),
      addFamily: (family) =>
        set((state) => ({ families: [...state.families, family] })),
      removeFamily: (id) =>
        set((state) => ({
          families: state.families.filter((f) => f.id !== id),
          activeFamilyId: state.activeFamilyId === id ? null : state.activeFamilyId,
        })),
      clearActiveFamily: () => set({ activeFamilyId: null }),
      addMembership: (membership) =>
        set((state) => ({ memberships: [...state.memberships, membership] })),
      removeMembership: (familyId, accountId) =>
        set((state) => ({
          memberships: state.memberships.filter(
            (m) => !(m.familyId === familyId && m.accountId === accountId),
          ),
        })),
      setLastSyncAt: (ts) => set({ lastSyncAt: ts }),
      setSyncError: (error) => set({ syncError: error }),
      setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),
    }),
    {
      name: 'versyflow-family-sync-storage',
      partialize: (state) => ({
        activeFamilyId: state.activeFamilyId,
        families: state.families,
        memberships: state.memberships,
        lastSyncAt: state.lastSyncAt,
        syncError: state.syncError,
      }),
    },
  ),
);
