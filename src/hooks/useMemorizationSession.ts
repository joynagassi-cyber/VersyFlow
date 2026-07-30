/**
 * Hook pour gérer les sessions de méméorisation
 * Fournit le contrôle de la session et l'intégration avec le moteur FSRS
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { IFsrsEngine, Rating, FsrsState } from '@/domains/fsrs';
import { MmkvStorage } from '@/infrastructure/storage';
import { MemorizationService } from '@/domains/memorization/service';
import { ExerciseStrategy, DEFAULT_MVP_STRATEGY } from '@/domains/memorization/entities';
import { BibleRepository } from '@/domains/bible/repository';
import { useSettingsStore } from '@/store/settings-store';
import { SessionEngine } from '@/domains/memorization/session-engine';

// Singleton pour le service de méméorisation
let memorizationService: MemorizationService | null = null;
let fsrsEngine: IFsrsEngine | null = null;
let sessionEngine: SessionEngine | null = null;

/**
 * Initialise le moteur FSRS (fallback SM-2 pour MVP)
 */
const initFsrsEngine = (): IFsrsEngine => {
  if (!fsrsEngine) {
    // Pour le MVP, utilise le fallback SM-2 (pas de WASM requis)
    fsrsEngine = {
      async newState(repetitions: number) {
        return { state: { stability: 2.5, repetitions, recallProbability: 0.7 }, due: new Date() };
      },
      async review(state: any, rating: Rating) {
        // Simplification: augmentation simple de stabilité selon le rating
        let multiplier = 1;
        if (rating === 'easy') multiplier = 1.5;
        else if (rating === 'good') multiplier = 1.2;
        else if (rating === 'hard') multiplier = 0.9;
        else multiplier = 0.5; // again

        return {
          state: { ...state, stability: state.stability * multiplier },
          due: new Date(Date.now() + 86400000), // 1 day par défaut
        };
      },
    };
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
  const startSession = useCallback((bookId: string, chapter: number, verse: number, text: string, reference: string) => {
    if (!memorizationService) {
      throw new Error('Service de méméorisation non initialisé');
    }

    // Créer l'engine de session avec la stratégie par défaut
    sessionEngine = new SessionEngine(text, DEFAULT_MVP_STRATEGY);

    // Préparer l'état de la session
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const session = {
      phase: 'preview',
      verseText: text,
      reference,
      bookId,
      chapter,
      verse,
      translationId: 'lsg', // default pour le MVP
      words,
      revealedWords: new Set<number>(),
      wordsRevealed: 0,
      startTime: Date.now(),
      isComplete: false,
      rating: null as Rating | null,
      nextReviewAt: 0,
    };

    setSessionState(session);
    return session;
  }, []);

  /**
   * Passe en mode révélation (de preview à revealing)
   */
  const startRevealing = useCallback(() => {
    if (sessionState && sessionState.phase === 'preview') {
      setSessionState(prev => ({ ...prev, phase: 'revealing' }));
    }
  }, [sessionState]);

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
    // Utiliser le SessionEngine pour comparer la réponse
    const session = new SessionEngine(sessionState.verseText, DEFAULT_MVP_STRATEGY);
    session.startPreview();
    // Révéler tous les mots pour que le moteur considère que la session est prête
    sessionState.revealedWords.forEach(index => {
      session.revealWordAt(index);
    });
    return session.verifyAnswer(userInput);
  }, [sessionState]);

  /**
   * Termine la session et enregistre le rating dans le service
   */
  const completeSession = useCallback(async (rating: Rating) => {
    if (!sessionState || !memorizationService) return null;

    const service = memorizationService;
    const isComplete = sessionState.revealedWords.size >= sessionState.words.length;

    if (!isComplete && rating !== 'again') {
      console.warn('Session pas complète, rating forcé à AGAIN');
      rating = 'again';
    }

    // Dans une version complète, appellerait service.memorizeVerse()
    // Pour le MVP, on met juste à jour l'état local
    const completedState = {
      ...sessionState,
      rating,
      completedAt: Date.now(),
      phase: 'confirmed',
    };

    setSessionState(completedState);

    return { ...completedState, service };
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
   * Abandonne la session
   */
  const abandonSession = useCallback(() => {
    setSessionState(prev => ({ ...prev, phase: 'abandoned' }));
  }, []);

  /**
   * Récupère l'instance du service (pour accès direct si nécessaire)
   */
  const getService = useCallback(() => memorizationService, []);

  /**
   * Change l'exercice策略 pendant la session
   */
  const setStrategy = useCallback((strategy: ExerciseStrategy) => {
    if (!sessionEngine) return;
    sessionEngine.setStrategy(strategy);
    resetSession();
  }, [resetSession, sessionEngine]);

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
    getService,
    setStrategy,
  };
}
