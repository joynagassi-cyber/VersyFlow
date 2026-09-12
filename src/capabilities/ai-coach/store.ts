/**
 * AI Coach Capability — Store backed by IAiCoachPort
 *
 * The store delegates all data fetching to the injected port.
 * No mock data, no LLM, no external API calls from this file.
 */

import { create } from 'zustand';
import type { IAiCoachPort, IAiCoachRecommendation, IAiCoachInsight, IAiCoachDailyPlan, IAiCoachWeeklyReport } from './types';

/** Mutable holder for the injected port — avoids polluting the store state. */
const portRef: { current: IAiCoachPort | null } = { current: null };

export interface AICoachState {
  recommendations: IAiCoachRecommendation[];
  insights: IAiCoachInsight[];
  dailyPlan: IAiCoachDailyPlan | null;
  weeklyReport: IAiCoachWeeklyReport | null;
  isAnalyzing: boolean;

  // Actions
  analyzePerformance: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  setPort: (port: IAiCoachPort) => void;
  getWeeklyReport: () => Promise<IAiCoachWeeklyReport | null>;
}

export const useAICoachStore = create<AICoachState>((set) => ({
  recommendations: [],
  insights: [],
  dailyPlan: null,
  weeklyReport: null,
  isAnalyzing: false,

  setPort: (port: IAiCoachPort) => {
    portRef.current = port;
  },

  analyzePerformance: async () => {
    set({ isAnalyzing: true });
    try {
      const port = portRef.current;
      if (!port) {
        set({
          recommendations: [],
          insights: [],
          dailyPlan: null,
          weeklyReport: null,
          isAnalyzing: false,
        });
        return;
      }

      const [recommendations, insights, dailyPlan, weeklyReport] = await Promise.all([
        port.getRecommendations(),
        port.getInsights(),
        port.getDailyPlan(),
        port.getWeeklyReport(),
      ]);

      set({
        recommendations,
        insights,
        dailyPlan,
        weeklyReport,
        isAnalyzing: false,
      });
    } catch {
      set({ isAnalyzing: false });
    }
  },

  refreshRecommendations: async () => {
    const port = portRef.current;
    if (!port) return;
    const recommendations = await port.getRecommendations();
    set({ recommendations });
  },

  refreshInsights: async () => {
    const port = portRef.current;
    if (!port) return;
    const insights = await port.getInsights();
    set({ insights });
  },

  getWeeklyReport: async () => {
    const port = portRef.current;
    if (!port) return null;
    return port.getWeeklyReport();
  },
}));

// ── Aliases required by consumers ──────────────────────────────────────────
/**
 * Alias of `useAICoachStore` for call-sites that use the capability name.
 */
export const useAICoachCapability = useAICoachStore;

export type { IAiCoachRecommendation as AIRecommendation } from './types';
