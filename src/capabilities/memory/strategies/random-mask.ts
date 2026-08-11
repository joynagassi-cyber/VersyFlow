/**
 * Random Masking Strategy
 * Randomly masks words for varied challenge
 */

import { useState, useCallback } from 'react';
import { useMemoryCapability } from '../store';

export function useRandomMask() {
  const { sessionState, updateSession } = useMemoryCapability();
  const [maskPercentage, setMaskPercentage] = useState(60);

  const applyRandomMask = useCallback(() => {
    if (!sessionState) return;

    const words = sessionState.words;
    const maskCount = Math.floor((maskPercentage / 100) * words.length);
    const indices = Array.from({ length: words.length }, (_, i) => i);

    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const maskedIndices = new Set(indices.slice(0, maskCount));
    updateSession({ revealedWordIndices: maskedIndices });
  }, [sessionState, maskPercentage, updateSession]);

  const setMaskLevel = useCallback(
    (percentage: number) => {
      setMaskPercentage(percentage);
    },
    []
  );

  return {
    maskPercentage,
    applyRandomMask,
    setMaskLevel,
  };
}
