/**
 * Analytics Capability — Progress tracking and insights
 */

import { create } from 'zustand';
import type { ProgressStats } from '@/services/progress-service';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import { useProfileStore } from '@/store/profile-store';

export interface AnalyticsState {
  stats: ProgressStats | null;
  isCalculating: boolean;
  weeklyData: Array<{ date: string; count: number }>;

  // Actions
  calculateStats: () => Promise<void>;
  getRetentionCurve: () => Array<{ date: string; retention: number }>;
  getLearningTime: () => number;
}

export const useAnalyticsCapability = create<AnalyticsState>((set, get) => ({
  stats: null,
  isCalculating: false,
  weeklyData: [],

  calculateStats: async () => {
    set({ isCalculating: true });
    try {
      const profileId = useProfileStore.getState().activeProfileId ?? 'default';
      const service = getMemorizationService(profileId);
      const progressService = new ProgressService(service, getFsrsEngine(), undefined, profileId);
      const stats = await progressService.getStats();
      set({ stats, isCalculating: false });
    } catch (error) {
      set({ isCalculating: false });
    }
  },

  getRetentionCurve: () => {
    // Mock data - would come from analytics service
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000)
        .toISOString()
        .split('T')[0],
      retention: Math.random() * 0.3 + 0.7,
    })).reverse();
  },

  getLearningTime: () => {
    // Real value once calculateStats() has populated stats (session logs via ProgressStats).
    return get().stats?.avgSessionDurationMin ?? 0;
  },
}));
