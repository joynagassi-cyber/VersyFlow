/**
 * Memory Capability Hook — disposition des stratégies de mémorisation.
 *
 * Le store (`./store.ts`) tient la stratégie courante et la session ; ce module
 * répond à une seule question : **pour la stratégie active, quelles actions
 * l'écran peut-il appeler ?**
 *
 * Chaque bras renvoie l'objet du hook correspondant (`revealNextWord`,
 * `applyRandomMask`, `markKnown`…), de sorte que l'appelant n'a pas de `switch`
 * à refaire ni de nom de stratégie à connaître.
 *
 * Ce qui n'est **pas** ici : la liste des stratégies proposées à l'utilisateur
 * (c'est `app/memorization/start.tsx`, qui n'expose que les méthodes réellement
 * jouables). Ce module couvre les six stratégies que la session sait exécuter ;
 * les dix autres valeurs de `ExerciseStrategy` retombent sur le masquage
 * progressif, comme le fait le store.
 */

import { useState, useCallback } from 'react';
import { useMemoryCapability } from './store';
import type { ExerciseStrategy } from '@/domains/memorization/entities';
import { useProgressiveMask } from './strategies/progressive-mask';
import { useSmartMask } from './strategies/smart-mask';
import { useRandomMask } from './strategies/random-mask';
import { useFlashcard } from './strategies/flashcard';
import { useRecallWriting } from './strategies/recall-writing';

/**
 * Stratégies réellement exécutées par une session, et l'action qui les porte.
 *
 * `PROGRESSIVE` est aussi le repli (`DEFAULT_MVP_STRATEGY`) : toute valeur hors
 * de cette table — `cloze-deletion`, `typing-mode`… — n'a pas d'exécution et
 * doit donc se comporter comme le masquage progressif, jamais comme une
 * stratégie sans action.
 */
export type PlayableStrategy =
  | 'progressive-masking'
  | 'incremental-reveal'
  | 'active-recall'
  | 'flashcard'
  | 'recall-writing'
  | 'smart-masking';

export const PLAYABLE_STRATEGIES: readonly PlayableStrategy[] = [
  'progressive-masking',
  'incremental-reveal',
  'active-recall',
  'flashcard',
  'recall-writing',
  'smart-masking',
];

export function isPlayableStrategy(strategy: ExerciseStrategy): strategy is PlayableStrategy {
  return (PLAYABLE_STRATEGIES as readonly string[]).includes(strategy);
}

export function useMemoryCapabilityHook() {
  const { currentStrategy, setStrategy, sessionState, resetSession } = useMemoryCapability();

  // Un hook par stratégie : chacun ne lit que la session, ils peuvent donc
  // cohabiter sans se marcher dessus.
  const progressiveMask = useProgressiveMask();
  const smartMask = useSmartMask();
  const randomMask = useRandomMask();
  const flashcard = useFlashcard();
  const recallWriting = useRecallWriting();
  /** Masquage progressif ou aléatoire — le seul choix que l'écran expose parfois. */
  const [randomMasking, setRandomMasking] = useState(false);

  const changeStrategy = useCallback(
    (strategy: ExerciseStrategy) => {
      setStrategy(strategy);
      resetSession();
    },
    [setStrategy, resetSession],
  );

  const getStrategyActions = useCallback(() => {
    // Les quatre stratégies de masquage partagent le même jeu d'actions
    // (révéler, révéler tout, basculer), avec des règles différentes.
    switch (currentStrategy) {
      case 'smart-masking':
        return smartMask;
      case 'heat-words':
        // V1 : le masquage aléatoire est joué à la demande, depuis une action.
        return randomMasking ? randomMask : progressiveMask;
      case 'flashcard':
        return flashcard;
      case 'recall-writing':
        return recallWriting;
      // `incremental-reveal` et `active-recall` donnent le même geste que le
      // masquage progressif : un mot de plus à chaque appui.
      case 'incremental-reveal':
      case 'active-recall':
      case 'progressive-masking':
        return progressiveMask;
      default:
        // Aucune exécution dédiée : repli explicite, jamais un écran vide.
        return progressiveMask;
    }
  }, [
    currentStrategy,
    randomMasking,
    progressiveMask,
    smartMask,
    randomMask,
    flashcard,
    recallWriting,
  ]);

  return {
    currentStrategy,
    sessionState,
    changeStrategy,
    actions: getStrategyActions(),
    /** Masquage aléatoire disponible quand la stratégie l'autorise. */
    randomMasking,
    setRandomMasking,
  };
}
