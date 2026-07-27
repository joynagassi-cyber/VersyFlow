/**
 * Hook for managing memorization sessions
 * Provides session control and interaction with FSRS engine
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { IFsrsEngine, Rating } from '@/domains/fsrs';
import { MmkvStorage } from '@/infrastructure/storage';
import { MemorizationService } from '@/domains/memorization/service';
import { BibleRepository } from '@/domains/bible/repository';
import { useSettingsStore } from '@/store/settings-store';

// Singleton instance of MemorizationService
let memorizationService: MemorizationService | null = null;

/**
 * Initialize the memorization service with storage and FSRS engine
 * Called once per app session
 */
const initializeService = (fsrsEngine: IFsrsEngine) => {
  if (!memorizationService) {
    const storage = new MmkvStorage();
    memorizationService = new MemorizationService(storage, fsrsEngine);
  }
  return memorizationService;
};

/**
 * Custom hook for memorization session management
 * Provides methods to start, advance, and complete a session
 */
export function useMemorizationSession() {
  const settingsStore = useSettingsStore();
  const [sessionState, setSessionState] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize service on mount (this would be done at app level in production)
  useEffect(() => {
    // In a real app, you would inject the FSRS engine (WASM or fallback)
    // For now, we'll use a mock engine
    const mockFsrsEngine = {
      // Mock implementation - to be replaced with real FSRS engine
      newState: async () => ({ state: { stability: 1, repetitions: 0, recallProbability: 0.5 }, due: new Date() }),
      review: async (state: any, rating: Rating) => ({ state, due: new Date(Date.now() + 86400000) }),
    };

    initializeService(mockFsrsEngine);
    setIsLoaded(true);
  }, []);

  /**
   * Start a new memorization session for a specific verse
   */
  const startSession = useCallback((bookId: string, chapter: number, verse: number, text: string) => {
    if (!memorizationService) {
      throw new Error('Memorization service not initialized');
    }

    // Get verse details from repository (would be passed from UI)
    const verseData = {
      bookId,
      chapter,
      verse,
      text,
      reference: `${bookId}:${chapter}:${verse}`,
    };

    const session = {
      phase: 'preview',
      verseText: text,
      words: text.split(/\s+/).filter(w => w.length > 0),
      revealedWords: new Set(),
      startTime: Date.now(),
      isComplete: false,
    };

    setSessionState(session);
    return session;
  }, []);

  /**
   * Reveal the next word in the session
   */
  const revealNextWord = useCallback(() => {
    if (!sessionState || sessionState.phase !== 'revealing') return;

    const words = sessionState.words;
    const revealed = sessionState.revealedWords;

    // Find next unrevealed word
    for (let i = 0; i < words.length; i++) {
      if (!revealed.has(i)) {
        revealed.add(i);
        break;
      }
    }

    setSessionState(prev => ({ ...prev }));
  }, [sessionState]);

  /**
   * Verify the user's answer (for text entry mode)
   */
  const verifyAnswer = useCallback((userInput: string) => {
    if (!sessionState) return null;

    const expected = sessionState.verseText.trim().toLowerCase();
    const provided = userInput.trim().toLowerCase();

    // Simple similarity check (in production, use proper edit distance)
    const isCorrect = expected === provided;

    return {
      isCorrect,
      similarity: expected.length > 0 ? Math.min(1, provided.length / expected.length) : 0,
    };
  }, [sessionState]);

  /**
   * Complete the session with a rating
   */
  const completeSession = useCallback((rating: Rating) => {
    if (!sessionState || !memorizationService) return null;

    // Update session state
    const updatedState = { ...sessionState, phase: 'confirmed', isComplete: true };
    setSessionState(updatedState);

    // In a real implementation, this would call memorizationService.memorizeVerse()
    // and update the FSRS state

    return {
      ...updatedState,
      rating,
      completedAt: Date.now(),
    };
  }, [sessionState]);

  /**
   * Reset/restart the session
   */
  const resetSession = useCallback(() => {
    if (!sessionState) return;
    setSessionState({ ...sessionState, phase: 'preview', revealedWords: new Set(), isComplete: false });
  }, [sessionState]);

  return {
    sessionState,
    isLoaded,
    startSession,
    revealNextWord,
    verifyAnswer,
    completeSession,
    resetSession,
  };
}
