/**
 * Comparison Capability — Verse verification and analysis
 */

import { create } from 'zustand';
import { VerificationResult } from '@/domains/memorization/entities';

export interface ComparisonCapabilityState {
  lastVerification: VerificationResult | null;
  isVerifying: boolean;

  // Actions
  verifyAnswer: (expected: string, provided: string) => VerificationResult;
  clearVerification: () => void;
}

export const useComparisonCapability = create<ComparisonCapabilityState>(
  (set, get) => ({
    lastVerification: null,
    isVerifying: false,

    verifyAnswer: (expected: string, provided: string) => {
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
      const substitutions: Array<{ expected: string; got: string }> = [];

      const maxLen = Math.max(expectedWords.length, providedWords.length);

      for (let i = 0; i < maxLen; i++) {
        if (expectedWords[i] === providedWords[i]) {
          correctWords++;
        } else if (expectedWords[i] && !providedWords[i]) {
          missingWords.push(expectedWords[i]);
        } else if (!expectedWords[i] && providedWords[i]) {
          extraWords.push(providedWords[i]);
        } else if (expectedWords[i] && providedWords[i]) {
          substitutions.push({
            expected: expectedWords[i],
            got: providedWords[i],
          });
        }
      }

      const score = expectedWords.length > 0 ? correctWords / expectedWords.length : 0;

      // Identify weak portions
      const weakPortions: Array<{ start: number; end: number; accuracy: number }> =
        [];
      let currentStart = 0;
      let currentCorrect = 0;

      for (let i = 0; i < expectedWords.length; i++) {
        if (expectedWords[i] === providedWords[i]) {
          currentCorrect++;
        } else {
          if (currentCorrect < 3) {
            weakPortions.push({
              start: currentStart,
              end: i,
              accuracy: currentCorrect / (i - currentStart),
            });
          }
          currentStart = i + 1;
          currentCorrect = 0;
        }
      }

      // Handle last portion
      if (currentCorrect < 3 && currentStart < expectedWords.length) {
        weakPortions.push({
          start: currentStart,
          end: expectedWords.length,
          accuracy: currentCorrect / (expectedWords.length - currentStart),
        });
      }

      const result: VerificationResult = {
        score,
        wordCount: expectedWords.length,
        correctWords,
        missingWords,
        extraWords,
        substitutions,
        characterDiffs: [],
        strongPortions: [],
        fragilePortions: weakPortions,
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
