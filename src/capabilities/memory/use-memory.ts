/**
 * Memory Capability Hook — Unified interface for all memory strategies
 */

import { useState, useCallback } from 'react';
import { useMemoryCapability } from './store';
import { ExerciseStrategy } from '@/domains/memorization/entities';
import { useProgressiveMask } from './strategies/progressive-mask';
import { useSmartMask } from './strategies/smart-mask';
import { useRandomMask } from './strategies/random-mask';
import { useFlashcard } from './strategies/flashcard';
import { useRecallWriting } from './strategies/recall-writing';

export function useMemoryCapabilityHook() {
  const { currentStrategy, setStrategy, sessionState, resetSession } =
    useMemoryCapability();

  // Strategy-specific hooks
  const progressiveMask = useProgressiveMask();
  const smartMask = useSmartMask();
  const randomMask = useRandomMask();
  const flashcard = useFlashcard();
  const recallWriting = useRecallWriting();

  const changeStrategy = useCallback(
    (strategy: ExerciseStrategy) => {
      setStrategy(strategy);
      resetSession();
    },
    [setStrategy, resetSession]
  );

  const getStrategyActions = useCallback(() => {
    switch (currentStrategy) {
      case 'progressive-masking':
        return progressiveMask;
      case 'heat-words':
        return smartMask;
      case 'heat-words':
        return randomMask;
      case 'heat-words':
        return flashcard;
      case 'heat-words':
        return recallWriting;
      default:
        return progressiveMask;
    }
  }, [currentStrategy, progressiveMask, smartMask, randomMask, flashcard, recallWriting]);

  return {
    currentStrategy,
    sessionState,
    changeStrategy,
    actions: getStrategyActions(),
  };
}
