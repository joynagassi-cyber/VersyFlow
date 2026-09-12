/**
 * Comparison Capability — Verse verification and analysis
 */

import { create } from 'zustand';
import type { VerificationResult } from '@/domains/memorization/entities';

export interface ComparisonCapabilityState {
  lastVerification: VerificationResult | null;
  isVerifying: boolean;

  // Actions
  verifyAnswer: (expected: string, provided: string) => VerificationResult;
  clearVerification: () => void;
}

export const useComparisonCapability = create<ComparisonCapabilityState>(
  (set) => ({
    lastVerification: null,
    isVerifying: false,

    verifyAnswer: (expected: string, provided: string): VerificationResult => {
      set({ isVerifying: true });

      // Normalize strings
      const normalize = (s: string) =>
        s.toLowerCase().trim().replace(/[.,;:!?]/g, '');

      const expectedWords = normalize(expected).split(/\s+/);
      const providedWords = normalize(provided).split(/\s+/);

      // Calculate score
      let correctWords = 0;
      const missingWords: string[] = [];
      const extraWords: string[] = [];
      const substitutedWords: Array<{ expected: string; got: string }> = [];

      const maxLen = Math.max(expectedWords.length, providedWords.length);

      for (let i = 0; i < maxLen; i++) {
        if (expectedWords[i] === providedWords[i]) {
          correctWords++;
        } else if (expectedWords[i] && !providedWords[i]) {
          missingWords.push(expectedWords[i]);
        } else if (!expectedWords[i] && providedWords[i]) {
          extraWords.push(providedWords[i]);
        } else if (expectedWords[i] && providedWords[i]) {
          substitutedWords.push({
            expected: expectedWords[i],
            got: providedWords[i],
          });
        }
      }

      const score = expectedWords.length > 0 ? correctWords / expectedWords.length : 0;

      // Identify weak portions
      const fragilePortions: Array<{ start: number; end: number; accuracy: number }> = [];
      const strongPortions: Array<{ start: number; end: number; accuracy: number }> = [];
      let currentStart = 0;
      let currentCorrect = 0;

      for (let i = 0; i < expectedWords.length; i++) {
        if (expectedWords[i] === providedWords[i]) {
          currentCorrect++;
        } else {
          const accuracy = currentCorrect / Math.max(1, i - currentStart);
          if (accuracy < 0.7) {
            fragilePortions.push({ start: currentStart, end: i, accuracy });
          } else {
            strongPortions.push({ start: currentStart, end: i, accuracy });
          }
          currentStart = i + 1;
          currentCorrect = 0;
        }
      }

      // Handle last portion
      if (currentStart < expectedWords.length) {
        const accuracy = currentCorrect / Math.max(1, expectedWords.length - currentStart);
        const portion = { start: currentStart, end: expectedWords.length, accuracy };
        if (accuracy < 0.7) fragilePortions.push(portion);
        else strongPortions.push(portion);
      }

      const result: VerificationResult = {
        score,
        wordCount: expectedWords.length,
        correctWords: Array.from({ length: correctWords }, (_, i) => expectedWords[i]),
        missingWords,
        extraWords,
        substitutedWords,
        characterDiffs: [],
        strongPortions,
        fragilePortions,
      };

      set({
        lastVerification: result,
        isVerifying: false,
      });

      return result;
    },

    clearVerification: () => set({ lastVerification: null }),
  })
);
