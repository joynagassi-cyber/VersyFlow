/**
 * Recall Writing Strategy
 * User types the verse from memory
 */

import { useState, useCallback } from 'react';
import { useMemoryCapability } from '../store';

export function useRecallWriting() {
  const { sessionState } = useMemoryCapability();
  const [userInput, setUserInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = useCallback((text: string) => {
    setUserInput(text);
  }, []);

  const submitAnswer = useCallback(() => {
    setIsSubmitted(true);
  }, []);

  const resetWriting = useCallback(() => {
    setUserInput('');
    setIsSubmitted(false);
  }, []);

  const getVerificationResult = useCallback(() => {
    if (!sessionState || !userInput) return null;

    const expected = sessionState.verseText.toLowerCase().trim();
    const provided = userInput.toLowerCase().trim();

    const expectedWords = expected.split(/\s+/);
    const providedWords = provided.split(/\s+/);

    let correctWords = 0;
    let substitutions: Array<{ expected: string; got: string }> = [];

    const maxLen = Math.max(expectedWords.length, providedWords.length);
    for (let i = 0; i < maxLen; i++) {
      if (expectedWords[i] === providedWords[i]) {
        correctWords++;
      } else if (expectedWords[i] && providedWords[i]) {
        substitutions.push({
          expected: expectedWords[i],
          got: providedWords[i],
        });
      }
    }

    const score = correctWords / expectedWords.length;

    return {
      score,
      wordCount: expectedWords.length,
      correctWords,
      missingWords: expectedWords.filter(
        (w, i) => w !== providedWords[i]
      ),
      extraWords: providedWords.filter(
        (w, i) => !expectedWords[i] || expectedWords[i] !== w
      ),
      substitutions,
    };
  }, [sessionState, userInput]);

  return {
    userInput,
    isSubmitted,
    handleInputChange,
    submitAnswer,
    resetWriting,
    getVerificationResult,
  };
}
