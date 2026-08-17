/**
 * Hook pour gérer les sessions de méméorisation
 * Fournit le contrôle de la session et l'intégration avec le moteur FSRS
 * Extension passage: startSessionForTarget() pour support MemorizationTarget
 *
 * Dépendances injectées via `deps` paramètre (defaults: MmkvStorage + fsrs-factory).
 * Testable en injectant des mocks: useMemorizationSession({ storage: mockStorage, fsrsEngine: mockFsrs })
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { IFsrsEngine, Rating } from '@/domains/fsrs';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { IStorage } from '@/infrastructure/storage/storage-types';
import { MemorizationService } from '@/domains/memorization/service';
import { ExerciseStrategy, DEFAULT_MVP_STRATEGY, MemorizationTarget, MemorizationTargetType } from '@/domains/memorization/entities';
import { useSettingsStore } from '@/store/settings-store';
import { SessionEngine } from '@/domains/memorization/session-engine';

/**
 * Dépendances injectables pour le hook
 */
export interface MemorizationSessionDeps {
  storage?: IStorage;
  fsrsEngine?: IFsrsEngine;
}

/**
 * Hook personnalisé pour la gestion de session de méméorisation
 * Fournit les méthodes pour démarrer, avancer et terminer une session
 * Supporte single-verse et passage (multiple versets)
 */
export function useMemorizationSession(deps?: MemorizationSessionDeps) {
  const [sessionState, setSessionState] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // useRef pour le service et le session engine — lié au cycle de vie du hook, pas singleton module-level
  const serviceRef = useRef<MemorizationService | null>(null);
  const sessionEngineRef = useRef<SessionEngine | null>(null);

  // Initialiser le service au montage
  useEffect(() => {
    const storage = deps?.storage;
    const fsrsEngine = deps?.fsrsEngine ?? getFsrsEngine();
    serviceRef.current = new MemorizationService(storage!, fsrsEngine);
    setIsLoaded(true);
  }, []);

  /**
   * Démarre une nouvelle session de méméorisation pour un verset spécifique
   * Signature legacy: startSession(bookId, chapter, verse, text, reference)
   */
  const startSession = useCallback((bookId: string, chapter: number, verse: number, text: string, reference: string) => {
    const engine = new SessionEngine(text, DEFAULT_MVP_STRATEGY);
    sessionEngineRef.current = engine;

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const session = {
      phase: 'preview' as const,
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
      targetId: undefined,
      targetType: 'single-verse' as MemorizationTargetType,
      currentVerseIndex: 0,
      totalVerses: 1,
    };

    setSessionState(session);
    return session;
  }, []);

  /**
   * Démarre une session pour un passage (target-based)
   * Méthode principale pour la Phase 8.4
   * Accepte un MemorizationTarget et les textes de tous les versets du passage
   */
  const startSessionForTarget = useCallback((target: MemorizationTarget, verseTexts: string[]) => {
    const engine = new SessionEngine(verseTexts[0], DEFAULT_MVP_STRATEGY);
    engine.initPassage(verseTexts, target.id, target.type);
    sessionEngineRef.current = engine;

    const firstVerseWords = verseTexts[0].split(/\s+/).filter(w => w.length > 0);
    const session = {
      phase: 'preview' as const,
      verseText: verseTexts[0],
      reference: target.displayReference,
      bookId: target.reference.bookId,
      chapter: target.reference.chapter,
      verse: target.reference.startVerse,
      translationId: target.reference.translationId,
      words: firstVerseWords,
      revealedWords: new Set<number>(),
      wordsRevealed: 0,
      startTime: Date.now(),
      isComplete: false,
      rating: null as Rating | null,
      nextReviewAt: 0,
      targetId: target.id,
      targetType: target.type,
      currentVerseIndex: 0,
      totalVerses: verseTexts.length,
    };

    setSessionState(session);
    return session;
  }, []);

  /**
   * Passe en mode révélation (de preview à revealing)
   */
  const startRevealing = useCallback(() => {
    if (sessionState && sessionState.phase === 'preview') {
      setSessionState((prev: any) => ({ ...prev, phase: 'revealing' }));
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
      setSessionState((prev: any) => ({
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
      setSessionState((prev: any) => ({
        ...prev,
        revealedWords: revealed,
        wordsRevealed: revealed.size,
      }));
    }
  }, [sessionState]);

  /**
   * Passe au verset suivant dans un passage
   * Retourne true si un verset suivant existe
   */
  const revealNextVerse = useCallback(() => {
    const engine = sessionEngineRef.current;
    if (!engine || !sessionState) return false;

    const moved = engine.revealNextVerse();
    if (moved) {
      setSessionState((prev: any) => ({
        ...prev,
        verseText: engine.getState().verseText,
        words: engine.getState().words,
        revealedWords: new Set<number>(),
        wordsRevealed: 0,
        currentVerseIndex: engine.getCurrentVerseIndex(),
        totalVerses: engine.getTotalVerses(),
        phase: 'preview' as const,
      }));
      return true;
    }
    return false;
  }, [sessionState]);

  /**
   * Revient au verset précédent dans un passage
   */
  const revealPrevVerse = useCallback(() => {
    const engine = sessionEngineRef.current;
    if (!engine || !sessionState) return false;

    const moved = engine.revealPrevVerse();
    if (moved) {
      setSessionState((prev: any) => ({
        ...prev,
        verseText: engine.getState().verseText,
        words: engine.getState().words,
        revealedWords: new Set<number>(),
        wordsRevealed: 0,
        currentVerseIndex: engine.getCurrentVerseIndex(),
        totalVerses: engine.getTotalVerses(),
        phase: 'preview' as const,
      }));
      return true;
    }
    return false;
  }, [sessionState]);

  /**
   * Vérifie la réponse de l'utilisateur (mode saisie de texte)
   * Réutilise le sessionEngine existant pour la comparaison
   */
  const verifyAnswer = useCallback((userInput: string) => {
    if (!sessionState) return null;

    const engine = sessionEngineRef.current;
    if (!engine) return null;

    // Restaurer le state de révélation dans l'engine existant
    engine.startPreview();
    Array.from(sessionState.revealedWords as Set<number>).forEach((index: number) => {
      engine.revealWordAt(index);
    });

    return engine.verifyAnswer(userInput);
  }, [sessionState]);

  /**
   * Termine la session et enregistre le rating dans le service
   */
  const completeSession = useCallback(async (rating: Rating) => {
    const service = serviceRef.current;
    if (!sessionState || !service) return null;

    const isComplete = sessionState.revealedWords.size >= sessionState.words.length;

    if (!isComplete && rating !== Rating.AGAIN) {
      console.warn('Session pas complète, rating forcé à AGAIN');
      rating = Rating.AGAIN;
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
    return completedState;
  }, [sessionState]);

  /**
   * Réinitialise la session (pour recommencer)
   */
  const resetSession = useCallback(() => {
    if (!sessionState) return;
    setSessionState((prev: any) => ({
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
    setSessionState((prev: any) => ({ ...prev, phase: 'abandoned' }));
  }, []);

  /**
   * Change l'exercice stratégie pendant la session
   */
  const setStrategy = useCallback((strategy: ExerciseStrategy) => {
    const engine = sessionEngineRef.current;
    if (!engine) return;
    engine.setStrategy(strategy);
    resetSession();
  }, [resetSession]);

  return {
    sessionState,
    isLoaded,
    startSession,
    startSessionForTarget,
    startRevealing,
    revealNextWord,
    revealWordAt,
    revealNextVerse,
    revealPrevVerse,
    verifyAnswer,
    completeSession,
    resetSession,
    abandonSession,
    setStrategy,
  };
}
