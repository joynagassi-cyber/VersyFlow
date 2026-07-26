/**
 * Store — Review Queue State (Zustand)
 */

import { create } from 'zustand';

export interface ReviewQueueItem {
  recordId: string;
  reference: string;
  text: string;
  urgency: 'overdue' | 'scheduled' | 'upcoming';
  nextReviewAt: number;
}

interface ReviewState {
  queue: ReviewQueueItem[];
  isReviewSessionActive: boolean;
  currentIndex: number;

  setQueue: (items: ReviewQueueItem[]) => void;
  startSession: () => void;
  finishCurrent: () => void;
  endSession: () => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  queue: [],
  isReviewSessionActive: false,
  currentIndex: 0,

  setQueue: (items) => set({ queue: items }),

  startSession: () => set({ isReviewSessionActive: true, currentIndex: 0 }),

  finishCurrent: () => set((state) => ({
    currentIndex: Math.min(state.currentIndex + 1, state.queue.length),
  })),

  endSession: () => set({
    isReviewSessionActive: false,
    currentIndex: 0,
  }),
}));
