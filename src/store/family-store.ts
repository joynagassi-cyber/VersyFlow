/**
 * Family Store — Zustand state for Families
 * Manages family list and active family selection
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Family, FamilyMembership } from '@/domains/family';

interface FamilyState {
  activeFamilyId: string | null;
  families: Family[];
  memberships: FamilyMembership[];
  isLoading: boolean;

  setFamilies: (families: Family[]) => void;
  setActiveFamily: (id: string) => void;
  addFamily: (family: Family) => void;
  removeFamily: (id: string) => void;
  clearActiveFamily: () => void;
  addMembership: (membership: FamilyMembership) => void;
  removeMembership: (familyId: string, accountId: string) => void;
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      activeFamilyId: null,
      families: [],
      memberships: [],
      isLoading: false,

      setFamilies: (families) => set({ families }),

      setActiveFamily: (id) => set({ activeFamilyId: id }),

      addFamily: (family) => {
        set((state) => ({ families: [...state.families, family] }));
      },

      removeFamily: (id) => {
        set((state) => ({
          families: state.families.filter((f) => f.id !== id),
          activeFamilyId: state.activeFamilyId === id ? null : state.activeFamilyId,
        }));
      },

      clearActiveFamily: () => set({ activeFamilyId: null }),

      addMembership: (membership) => {
        set((state) => ({ memberships: [...state.memberships, membership] }));
      },

      removeMembership: (familyId, accountId) => {
        set((state) => ({
          memberships: state.memberships.filter(
            (m) => !(m.familyId === familyId && m.accountId === accountId),
          ),
        }));
      },
    }),
    {
      name: 'versyflow-family-storage',
      partialize: (state) => ({
        activeFamilyId: state.activeFamilyId,
        families: state.families,
        memberships: state.memberships,
      }),
    },
  ),
);
