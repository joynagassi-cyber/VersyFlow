/**
 * Analytics Capability — Progress tracking and deterministic insights.
 *
 * Uses the active learner profile (via `useProfileSyncStore` / `useProfileStore`)
 * and computes daily retention strictly from real `ReviewLogEntry` rows (never
 * `Math.random()`). When no review logs exist in live mode, `getRetentionCurve()`
 * returns `[]` honestly so the UI displays the empty state instead of fake bars.
 */

import { create } from 'zustand';
import type { ProgressStats } from '@/services/progress-service';
import type { ReviewLogEntry } from '@/domains/memorization/entities';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import {
  getReviewLogRepository,
  getSyncUserIdProvider,
} from '@/infrastructure/repository/powersync-repositories';
import { useProfileStore } from '@/store/profile-store';
import { useProfileSyncStore } from '@/store/profile-sync-store';

export interface RetentionPoint {
  date: string;
  retention: number;
}

export interface AnalyticsState {
  stats: ProgressStats | null;
  isCalculating: boolean;
  weeklyData: Array<{ date: string; count: number }>;
  retentionCurve: RetentionPoint[];

  // Actions
  calculateStats: () => Promise<void>;
  getRetentionCurve: () => RetentionPoint[];
  getLearningTime: () => number;
}

function computeRetentionCurve(logs: ReviewLogEntry[]): RetentionPoint[] {
  if (logs.length === 0) return [];
  const byDay = new Map<string, { total: number; recalled: number }>();
  for (const log of logs) {
    const day = new Date(log.answeredAt).toISOString().slice(0, 10);
    const bucket = byDay.get(day) ?? { total: 0, recalled: 0 };
    bucket.total += 1;
    if (log.rating !== 'again') {
      bucket.recalled += 1;
    }
    byDay.set(day, bucket);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, { total, recalled }]) => ({
      date,
      retention: total > 0 ? Math.round((recalled / total) * 100) / 100 : 0,
    }));
}

export const useAnalyticsCapability = create<AnalyticsState>((set, get) => ({
  stats: null,
  isCalculating: false,
  weeklyData: [],
  retentionCurve: [],

  calculateStats: async () => {
    set({ isCalculating: true });
    try {
      const profileId =
        useProfileSyncStore.getState().activeProfileId ??
        useProfileStore.getState().activeProfileId ??
        'default';
      const userId = (await getSyncUserIdProvider().resolveUserId()) ?? profileId;
      const service = getMemorizationService(profileId);
      const progressService = new ProgressService(service, getFsrsEngine(), undefined, profileId);
      const [stats, logs] = await Promise.all([
        progressService.getStats(),
        getReviewLogRepository()
          .listByUser(userId)
          .catch(() => [] as ReviewLogEntry[]),
      ]);
      const retentionCurve = computeRetentionCurve(logs);
      set({ stats, retentionCurve, isCalculating: false });
    } catch {
      set({ isCalculating: false });
    }
  },

  getRetentionCurve: () => {
    return get().retentionCurve;
  },

  getLearningTime: () => {
    return get().stats?.avgSessionDurationMin ?? 0;
  },
}));
