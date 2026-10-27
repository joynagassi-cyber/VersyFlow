/**
 * Progressive Masking Strategy
 * Reveals words from left to right progressively
 */

import { useState, useCallback } from 'react';
import { useMemoryCapability } from '../store';

export function useProgressiveMask() {
  const { sessionState, updateSession } = useMemoryCapability();

  const [revealedCount, setRevealedCount] = useState(0);

  const revealNextWord = useCallback(() => {
    if (!sessionState) return;
    const nextCount = Math.min(revealedCount + 1, sessionState.words.length);
    setRevealedCount(nextCount);
    updateSession({
      revealedWordIndices: new Set(
        Array.from({ length: nextCount }, (_, i) => i)
      ),
    });
  }, [sessionState, revealedCount, updateSession]);

  const revealWordAt = useCallback(
    (index: number) => {
      if (!sessionState || index >= sessionState.words.length) return;
      const newSet = new Set(sessionState.revealedWordIndices);
      newSet.add(index);
      setRevealedCount(newSet.size);
      updateSession({ revealedWordIndices: newSet });
    },
    [sessionState, updateSession]
  );

  const revealAll = useCallback(() => {
    if (!sessionState) return;
    const allIndices = new Set(sessionState.words.map((_, i) => i));
    setRevealedCount(sessionState.words.length);
    updateSession({ revealedWordIndices: allIndices });
  }, [sessionState, updateSession]);

  return {
    revealedCount,
    revealNextWord,
    revealWordAt,
    revealAll,
    isComplete: revealedCount >= (sessionState?.words.length || 0),
  };
}
