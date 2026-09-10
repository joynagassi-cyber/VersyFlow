/**
 * AI Coach Capability — Store backed by IAiCoachPort
 *
 * The store delegates all data fetching to the injected port.
 * No mock data, no LLM, no external API calls from this file.
 */

import { create } from 'zustand';
import type { IAiCoachPort, IAiCoachRecommendation, IAiCoachInsight, IAiCoachDailyPlan, IAiCoachWeeklyReport } from './types';

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
}

interface AICoachStore extends AICoachState {
  setPort: (port: IAiCoachPort) => void;
}

export const useAICoachStore = create<AICoachStore>((set, get) => ({
  recommendations: [],
  insights: [],
  dailyPlan: null,
  weeklyReport: null,
  isAnalyzing: false,

  setPort: (_port: IAiCoachPort) => {
    // Port injection point — future implementations will wire real adapters here
  },

  analyzePerformance: async () => {
    set({ isAnalyzing: true });
    try {
      const port = get()._port;
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
    const port = get()._port;
    if (!port) return;
    const recommendations = await port.getRecommendations();
    set({ recommendations });
  },

  refreshInsights: async () => {
    const port = get()._port;
    if (!port) return;
    const insights = await port.getInsights();
    set({ insights });
  },
}));

// Attach port setter to the store for external wiring
Object.defineProperty(useAICoachStore, '_port', {
  writable: true,
  value: null as IAiCoachPort | null,
});

// Patch setPort to actually set the internal port
const originalSetPort = useAICoachStore.getState().setPort;
useAICoachStore.setState({
  setPort: (port: IAiCoachPort) => {
    (useAICoachStore as unknown as { _port: IAiCoachPort | null })._port = port;
  },
});
