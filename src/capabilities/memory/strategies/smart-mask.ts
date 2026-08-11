/**
 * Smart Masking Strategy
 * Masks words based on difficulty and past performance
 */

import { useState, useCallback } from 'react';
import { useMemoryCapability } from '../store';

export function useSmartMask() {
  const { sessionState, updateSession } = useMemoryCapability();
  const [maskPercentage, setMaskPercentage] = useState(70);

  const toggleMask = useCallback(
    (index: number) => {
      if (!sessionState) return;
      const newSet = new Set(sessionState.revealedWordIndices);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      updateSession({ revealedWordIndices: newSet });
    },
    [sessionState, updateSession]
  );

  const setMaskLevel = useCallback(
    (percentage: number) => {
      setMaskPercentage(percentage);
      if (!sessionState) return;

      // Sort words by difficulty (simple heuristic: longer words = harder)
      const words = sessionState.words;
      const sorted = words
        .map((word, idx) => ({ word, idx, difficulty: word.length }))
        .sort((a, b) => b.difficulty - a.difficulty);

      const maskCount = Math.floor((percentage / 100) * words.length);
      const maskedIndices = new Set(sorted.slice(0, maskCount).map((w) => w.idx));

      updateSession({ revealedWordIndices: maskedIndices });
    },
    [sessionState, updateSession]
  );

  return {
    maskPercentage,
    toggleMask,
    setMaskLevel,
  };
}
