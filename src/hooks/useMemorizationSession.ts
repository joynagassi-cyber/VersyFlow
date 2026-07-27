/**
 * Hook pour gérer les sessions de mémorisation
 * Fournit le contrôle de la session et l'intégration avec le moteur FSRS
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { IFsrsEngine, Rating, Sm2FallbackEngine } from '@/domains/fsrs';
import { MmkvStorage } from '@/infrastructure/storage';
import { MemorizationService } from '@/domains/memorization/service';
import { BibleRepository } from '@/domains/bible/repository';
import { useSettingsStore } from '@/store/settings-store';

// Singleton pour le service de méméorisation
let memorizationService: MemorizationService | null = null;
let fsrsEngine: IFsrsEngine | null = null;

/**
 * Initialise le moteur FSRS (fallback SM-2 pour MVP)
 */
const initFsrsEngine = (): IFsrsEngine => {
  if (!fsrsEngine) {
    // Pour le MVP, utilise le fallback SM-2 (pas de WASM requis)
    fsrsEngine = new Sm2FallbackEngine();
  }
  return fsrsEngine;
};

/**
 * Initialise le service de méméorisation avec stockage et moteur FSRS
 */
const initializeService = () => {
  if (!memorizationService) {
    const storage = new MmkvStorage();
    const engine = initFsrsEngine();
    memorizationService = new MemorizationService(storage, engine);
  }
  return memorizationService;
};

/**
 * Hook personnalisé pour la gestion de session de méméorisation
 * Fournit les méthodes pour démarrer, avancer et terminer une session
 */
export function useMemorizationSession() {
  const settingsStore = useSettingsStore();
  const [sessionState, setSessionState] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const serviceRef = useRef<MemorizationService | null>(null);

  // Initialiser le service au montage
  useEffect(() => {
    const service = initializeService();
    serviceRef.current = service;
    setIsLoaded(true);
  }, []);

  /**
   * Démarre une nouvelle session de méméorisation pour un verset spécifique
   */
  const startSession = useCallback((bookId: string, chapter: number, verse: number, text: string) => {
    const service = serviceRef.current;
    if (!service) {
      throw new Error('Service de méméorisation non initialisé');
    }

    // Préparer l'état de la session
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const session = {
      phase: 'preview',
      verseText: text,
      bookId,
      chapter,
      verse,
      words,
      revealedWords: new Set<number>(),
      startTime: Date.now(),
      isComplete: false,
      rating: null as Rating | null,
    };

    setSessionState(session);
    return session;
  }, []);

  /**
   * Révèle le mot suivant dans la session (mode révélation progressive)
   */
  const revealNextWord = useCallback(() => {
    if (!sessionState || sessionState.phase !== 'revealing') return;

    const words = sessionState.words;
    const revealed = new Set(sessionState.revealedWords);

    // Trouver le premier mot non révélé
    let nextIndex = -1;
    for (let i = 0; i < words.length; i++) {
      if (!revealed.has(i)) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex !== -1) {
      revealed.add(nextIndex);
      setSessionState(prev => ({
        ...prev,
        revealedWords: revealed,
        wordsRevealed: revealed.size,
      }));
    }

    return nextIndex;
  }, [sessionState]);

  /**
   * Révèle un mot spécifique (pour le mode tap-to-reveal)
   */
  const revealWordAt = useCallback((index: number) => {
    if (!sessionState || sessionState.phase !== 'revealing') return;
    if (index < 0 || index >= sessionState.words.length) return;

    const revealed = new Set(sessionState.revealedWords);
    if (!revealed.has(index)) {
      revealed.add(index);
      setSessionState(prev => ({
        ...prev,
        revealedWords: revealed,
        wordsRevealed: revealed.size,
      }));
    }
  }, [sessionState]);

  /**
   * Vérifie la réponse de l'utilisateur (mode saisie de texte)
   */
  const verifyAnswer = useCallback((userInput: string) => {
    if (!sessionState) return null;

    const expected = sessionState.verseText.trim().toLowerCase();
    const provided = userInput.trim().toLowerCase();

    // Comparaison mot à mot
    const expectedWords = expected.split(/\s+/);
    const providedWords = provided.split(/\s+/);

    const correctWords: string[] = [];
    const missingWords: string[] = [];
    const extraWords: string[] = [];
    const substitutedWords: Array<{ expected: string; got: string }> = [];

    // Mots corrects
    expectedWords.forEach(word => {
      if (providedWords.includes(word)) {
        correctWords.push(word);
      } else {
        missingWords.push(word);
      }
    });

    // Mots en trop
    providedWords.forEach(word => {
      if (!expectedWords.includes(word)) {
        extraWords.push(word);
      }
    });

    // Mots substitués (correction simple)
    expectedWords.forEach((expWord, i) => {
      const provWord = providedWords[i];
      if (provWord && provWord !== expWord && !providedWords.includes(expWord)) {
        substitutedWords.push({ expected: expWord, got: provWord });
      }
    });

    // Score de similarité (pourcentage de mots corrects)
    const similarity = expectedWords.length > 0
      ? correctWords.length / expectedWords.length
      : 0;

    return {
      similarity,
      correctWords,
      missingWords,
      extraWords,
      substitutedWords,
    };
  }, []);

  /**
   * Termine la session avec un rating (utilisé par FSRS)
   */
  const completeSession = useCallback((rating: Rating) => {
    if (!sessionState || !serviceRef.current) return null;

    const service = serviceRef.current;
    const isComplete = sessionState.revealedWords.size === sessionState.words.length;

    if (!isComplete) {
      // Si la session n'est pas complète, on considère que c'est "again"
      rating = Rating.AGAIN;
    }

    // Dans une version complète, ceci appellerait service.memorizeVerse()
    // Pour le MVP, on met juste à jour l'état
    const completedState = {
      ...sessionState,
      phase: 'confirmed',
      isComplete,
      rating,
      completedAt: Date.now(),
    };

    setSessionState(completedState);

    return {
      ...completedState,
      service,
    };
  }, [sessionState]);

  /**
   * Réinitialise la session (pour recommencer)
   */
  const resetSession = useCallback(() => {
    if (!sessionState) return;
    setSessionState(prev => ({
      ...prev,
      phase: 'preview',
      revealedWords: new Set<number>(),
      wordsRevealed: 0,
      isComplete: false,
      rating: null,
    }));
  }, [sessionState]);

  /**
   * Passe en mode révélation (de preview à revealing)
   */
  const startRevealing = useCallback(() => {
    if (sessionState && sessionState.phase === 'preview') {
      setSessionState(prev => ({ ...prev, phase: 'revealing' }));
    }
  }, [sessionState]);

  /**
   * Abandonne la session
   */
  const abandonSession = useCallback(() => {
    setSessionState(prev => ({ ...prev, phase: 'abandoned' }));
  }, []);

  return {
    sessionState,
    isLoaded,
    startSession,
    startRevealing,
    revealNextWord,
    revealWordAt,
    verifyAnswer,
    completeSession,
    resetSession,
    abandonSession,
    getService: () => serviceRef.current,
  };
}
