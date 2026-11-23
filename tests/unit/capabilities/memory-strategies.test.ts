/**
 * Capability mémoire — la stratégie active décide des actions disponibles.
 *
 * Le défaut que ces tests empêchent de revenir : `use-memory.ts` enchaînait
 * quatre `case 'heat-words'` successifs, si bien que `flashcard`,
 * `recall-writing` et le masquage aléatoire étaient **inatteignables** — trois
 * stratégies déclarées dans l'énumération, jamais branchées. Un `switch` sur un
 * littéral ne se plaint pas d'un bras mort et `tsc` non plus : seule une
 * vérification du comportement le voit.
 *
 * Chaque test monte le hook avec une stratégie donnée et regarde la forme des
 * actions rendues (leurs clés), pas leur implémentation.
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMemoryCapability } from '@/capabilities/memory/store';
import {
  PLAYABLE_STRATEGIES,
  isPlayableStrategy,
  useMemoryCapabilityHook,
} from '@/capabilities/memory/use-memory';
import type { ExerciseStrategy } from '@/domains/memorization/entities';

const SESSION = {
  phase: 'revealing' as const,
  verseText: 'Car Dieu a tant aimé le monde',
  words: ['Car', 'Dieu', 'a', 'tant', 'aimé', 'le', 'monde'],
  revealedWordIndices: new Set<number>(),
  startedAt: 1_700_000_000_000,
  durationSeconds: 0,
  wordsRevealed: 0,
  totalWords: 7,
};

/** Monte le hook avec une stratégie active et une session en cours. */
function mount(strategy: ExerciseStrategy) {
  useMemoryCapability.setState({ currentStrategy: strategy, sessionState: SESSION });
  return renderHook(() => useMemoryCapabilityHook());
}

/** Signature d'un jeu d'actions : ses clés, triées. */
function shape(actions: object): string[] {
  return Object.keys(actions).sort();
}

beforeEach(() => {
  useMemoryCapability.setState({
    currentStrategy: 'progressive-masking',
    sessionState: null,
  });
});

describe('useMemoryCapabilityHook — disposition des stratégies', () => {
  it('déclare six stratégies jouables, et seulement des valeurs de l’énumération', () => {
    expect(PLAYABLE_STRATEGIES).toEqual([
      'progressive-masking',
      'incremental-reveal',
      'active-recall',
      'flashcard',
      'recall-writing',
      'smart-masking',
    ]);
    expect(isPlayableStrategy('typing-mode')).toBe(false);
    expect(isPlayableStrategy('flashcard')).toBe(true);
  });

  it('le masquage progressif expose la révélation mot à mot', () => {
    const { result } = mount('progressive-masking');
    expect(shape(result.current.actions)).toEqual([
      'isComplete',
      'revealAll',
      'revealNextWord',
      'revealWordAt',
      'revealedCount',
    ]);
  });

  it('le masquage intelligent expose le basculement mot par mot', () => {
    const { result } = mount('smart-masking');
    expect(shape(result.current.actions)).toEqual(['maskPercentage', 'setMaskLevel', 'toggleMask']);
  });

  it('le mode carte expose la navigation entre mots', () => {
    const { result } = mount('flashcard');
    const keys = shape(result.current.actions);
    expect(keys).toContain('nextWord');
    expect(keys).toContain('markKnown');
    expect(keys).not.toContain('revealNextWord');
  });

  it('le rappel écrit expose la saisie et la vérification', () => {
    const { result } = mount('recall-writing');
    const keys = shape(result.current.actions);
    expect(keys).toContain('handleInputChange');
    expect(keys).toContain('submitAnswer');
    expect(keys).toContain('getVerificationResult');
  });

  it('les quatre stratégies de masquage ne renvoient pas toutes le même jeu', () => {
    // C'est exactement ce que les quatre `case 'heat-words'` empêchaient : la
    // comparaison porte sur les signatures, pas sur un nom de fonction.
    const signatures = new Map(
      (['progressive-masking', 'smart-masking', 'flashcard', 'recall-writing'] as const).map(
        (strategy) => [strategy, shape(mount(strategy).result.current.actions).join(',')],
      ),
    );
    expect(new Set(signatures.values()).size).toBe(4);
  });

  it('une stratégie sans exécution retombe sur le masquage progressif', () => {
    const { result } = mount('typing-mode');
    expect(shape(result.current.actions)).toEqual([
      'isComplete',
      'revealAll',
      'revealNextWord',
      'revealWordAt',
      'revealedCount',
    ]);
  });

  it('le mode aléatoire ne s’active que sur `heat-words`', () => {
    const heat = mount('heat-words');
    expect(shape(heat.result.current.actions)).not.toContain('applyRandomMask');

    act(() => heat.result.current.setRandomMasking(true));
    expect(shape(heat.result.current.actions)).toContain('applyRandomMask');

    const other = mount('progressive-masking');
    act(() => other.result.current.setRandomMasking(true));
    expect(shape(other.result.current.actions)).not.toContain('applyRandomMask');
  });

  it('changer de stratégie repart d’une session vide', () => {
    const { result } = mount('flashcard');
    expect(result.current.sessionState).not.toBeNull();
    act(() => result.current.changeStrategy('recall-writing'));
    expect(useMemoryCapability.getState().currentStrategy).toBe('recall-writing');
    expect(result.current.sessionState).toBeNull();
  });
});
