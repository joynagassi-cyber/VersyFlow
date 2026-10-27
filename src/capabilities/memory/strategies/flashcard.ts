/**
 * Flashcard Strategy
 * Shows one word at a time for focused recall
 */

import { useState, useCallback } from 'react';
import { useMemoryCapability } from '../store';

export function useFlashcard() {
  const { sessionState, updateSession } = useMemoryCapability();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const nextWord = useCallback(() => {
    if (!sessionState) return;
    if (currentWordIndex < sessionState.words.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
      setIsRevealed(false);
    }
  }, [sessionState, currentWordIndex]);

  const prevWord = useCallback(() => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex((prev) => prev - 1);
      setIsRevealed(false);
    }
  }, [currentWordIndex]);

  const revealWord = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const markKnown = useCallback(() => {
    if (!sessionState) return;
    const newSet = new Set(sessionState.revealedWordIndices);
    newSet.add(currentWordIndex);
    updateSession({ revealedWordIndices: newSet });
    nextWord();
  }, [sessionState, currentWordIndex, updateSession, nextWord]);

  const markUnknown = useCallback(() => {
    if (!sessionState) return;
    // Remove from revealed if present
    const newSet = new Set(sessionState.revealedWordIndices);
    newSet.delete(currentWordIndex);
    updateSession({ revealedWordIndices: newSet });
    nextWord();
  }, [sessionState, currentWordIndex, updateSession, nextWord]);

  const restart = useCallback(() => {
    setCurrentWordIndex(0);
    setIsRevealed(false);
    if (sessionState) {
      updateSession({ revealedWordIndices: new Set() });
    }
  }, [sessionState, updateSession]);

  return {
    currentWordIndex,
    totalWords: sessionState?.words.length || 0,
    isRevealed,
    nextWord,
    prevWord,
    revealWord,
    markKnown,
    markUnknown,
    restart,
    currentWord: sessionState?.words[currentWordIndex],
    isComplete: currentWordIndex >= (sessionState?.words.length || 0) - 1,
  };
}
