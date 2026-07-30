/**
 * Session Engine — Deterministic workflow for memorization sessions
 * See MEMORY_ENGINE_SPEC.md §3
 */

import { SessionState, SessionPhase, VerificationResult, DEFAULT_MVP_STRATEGY, ExerciseStrategy, MaskingConfig, getMaskingConfigForStability } from './entities';
import { ComparisonEngine } from './comparison-engine';
import { Rating } from '@/domains/fsrs';
import { WordFailureTracker } from '@/services/word-failure-tracker';

/**
 * SessionEngine: manages the complete lifecycle of a memorization session.
 * Pure domain logic — zero UI dependencies.
 */
export class SessionEngine {
  private state: SessionState;
  private strategy: ExerciseStrategy;
  private maskingConfig: MaskingConfig;
  private wordFailureTracker: WordFailureTracker;

  constructor(verseText: string, initialStrategy?: ExerciseStrategy) {
    this.state = {
      phase: 'idle',
      verseText,
      words: verseText.split(/\s+/).filter(w => w.length > 0),
      revealedWordIndices: new Set(),
      startedAt: Date.now(),
      durationSeconds: 0,
      wordsRevealed: 0,
      totalWords: 0,
    };
    this.strategy = initialStrategy || DEFAULT_MVP_STRATEGY;
    this.maskingConfig = {
      maskPercentage: 0,
      smartMasking: false,
      preservedWords: [],
      maskingOrder: 'progressive',
    };
    this.wordFailureTracker = new WordFailureTracker();
  }

  /**
   * Change the exercise strategy during a session
   */
  setStrategy(strategy: ExerciseStrategy): void {
    this.strategy = strategy;
    // Reset state when changing strategy
    this.state.revealedWordIndices.clear();
    this.state.wordsRevealed = 0;
    this.state.phase = 'preview';
  }

  /**
   * START preview phase — user sees full verse for 10 seconds
   */
  startPreview(): void {
    if (this.state.phase !== 'idle' && this.state.phase !== 'abandoned') {
      throw new Error(`SessionEngine: Cannot start preview from state ${this.state.phase}`);
    }

    this.state = {
      ...this.state,
      phase: 'preview',
      revealedWordIndices: new Set(),
      startedAt: Date.now(),
      wordsRevealed: 0,
      totalWords: this.state.words.length,
    };
  }

  /**
   * PROGRESSIVE REVEAL — reveal one word at a time (left-to-right)
   */
  revealNextWord(): void {
    if (this.state.phase !== 'preview' && this.state.phase !== 'revealing') {
      throw new Error(`SessionEngine: Cannot reveal words from state ${this.state.phase}`);
    }

    this.state.phase = 'revealing';

    // Find next unrevealed word index
    for (let i = 0; i < this.state.totalWords; i++) {
      if (!this.state.revealedWordIndices.has(i)) {
        this.state.revealedWordIndices.add(i);
        this.state.wordsRevealed++;
        break;
      }
    }
  }

  /**
   * TAP-TO-REVEAL — user taps specific word to reveal it
   */
  revealWordAt(index: number): void {
    if (this.state.phase !== 'revealing') {
      throw new Error(`SessionEngine: Cannot reveal specific word from state ${this.state.phase}`);
    }

    if (index < 0 || index >= this.state.totalWords) {
      throw new Error(`SessionEngine: Invalid word index ${index}`);
    }

    if (!this.state.revealedWordIndices.has(index)) {
      this.state.revealedWordIndices.add(index);
      this.state.wordsRevealed++;
    }
  }

  /**
   * REVEAL SENTENCE — reveal by sentence segments (for phrase-by-phrase reading)
   * Groups words into sentences based on punctuation
   */
  revealNextSentence(): void {
    if (this.state.phase !== 'preview' && this.state.phase !== 'revealing') {
      throw new Error(`SessionEngine: Cannot reveal sentences from state ${this.state.phase}`);
    }

    this.state.phase = 'revealing';

    // Simple sentence detection (split on .!?)
    const sentenceEnds: number[] = [];
    for (let i = 0; i < this.state.verseText.length; i++) {
      const char = this.state.verseText[i];
      if (char === '.' || char === '!' || char === '?') {
        // Find the next word boundary after this punctuation
        let j = i + 1;
        while (j < this.state.verseText.length && this.state.verseText[j] === ' ') {
          j++;
        }
        sentenceEnds.push(j - 1); // Position before the next word
      }
    }

    // Find the next unrevealed sentence segment
    let nextEnd = -1;
    for (const end of sentenceEnds) {
      // Check if all words up to this point are revealed
      const wordsUpToEnd = this.getWordsUpToPosition(end);
      if (wordsUpToEnd.every(wIndex => !this.state.revealedWordIndices.has(wIndex))) {
        nextEnd = end;
        break;
      }
    }

    if (nextEnd !== -1) {
      // Reveal all words in this sentence segment
      const wordsUpToNextEnd = this.getWordsUpToPosition(nextEnd);
      for (const wordIndex of wordsUpToNextEnd) {
        if (!this.state.revealedWordIndices.has(wordIndex)) {
          this.state.revealedWordIndices.add(wordIndex);
          this.state.wordsRevealed++;
        }
      }
    } else {
      // Fallback: reveal one word at a time
      this.revealNextWord();
    }
  }

  /**
   * Helper: Get word indices up to a given character position in the verse text
   */
  private getWordsUpToPosition(pos: number): number[] {
    const words: number[] = [];
    let wordStart = 0;
    let charPos = 0;

    for (let i = 0; i < this.state.verseText.length && charPos <= pos; i++) {
      const char = this.state.verseText[i];
      if (char === ' ') {
        // End of a word
        if (i > wordStart && i <= pos + 1) {
          // Find the word index in the words array
          const wordText = this.state.verseText.slice(wordStart, i);
          const wordIndex = this.state.words.findIndex(w => w === wordText && w.length > 0);
          if (wordIndex !== -1 && !words.includes(wordIndex)) {
            words.push(wordIndex);
          }
        }
        wordStart = i + 1;
      }
      charPos++;
    }

    // Add the last word if we haven't reached the end
    if (wordStart < this.state.verseText.length && charPos <= pos) {
      const wordText = this.state.verseText.slice(wordStart);
      const wordIndex = this.state.words.findIndex(w => w === wordText && w.length > 0);
      if (wordIndex !== -1 && !words.includes(wordIndex)) {
        words.push(wordIndex);
      }
    }

    return words;
  }

  /**
   * REVEAL RANDOM — reveal words in random order (for random masking strategy)
   */
  revealNextRandomWord(): void {
    if (this.state.phase !== 'preview' && this.state.phase !== 'revealing') {
      throw new Error(`SessionEngine: Cannot reveal random words from state ${this.state.phase}`);
    }

    this.state.phase = 'revealing';

    // Find all unrevealed words
    const unrevealedIndices: number[] = [];
    for (let i = 0; i < this.state.totalWords; i++) {
      if (!this.state.revealedWordIndices.has(i)) {
        unrevealedIndices.push(i);
      }
    }

    if (unrevealedIndices.length > 0) {
      // Pick a random unrevealed word
      const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      this.state.revealedWordIndices.add(randomIndex);
      this.state.wordsRevealed++;
    }
  }

  /**
   * REVEAL BY DIFFICULTY — reveal hardest words first (for smart masking)
   * Uses failure frequency from wordPerformance data (if available)
   */
  revealNextDifficultyWord(): void {
    if (this.state.phase !== 'preview' && this.state.phase !== 'revealing') {
      throw new Error(`SessionEngine: Cannot reveal by difficulty from state ${this.state.phase}`);
    }

    this.state.phase = 'revealing';

    // For MVP, fall back to progressive reveal
    // In a full implementation, this would use failure frequency from historical data
    this.revealNextWord();
  }

  /**
   * VERIFY answer — compare user input against expected verse
   * Returns structured verification result using ComparisonEngine
   */
  verifyAnswer(userInput: string): VerificationResult {
    const comparisonEngine = new ComparisonEngine();
    return comparisonEngine.compare(userInput, this.state.verseText);
  }

  /**
   * Validate session completeness
   */
  isComplete(): boolean {
    return this.state.revealedWordIndices.size >= this.state.totalWords;
  }

  /**
   * Get session progress (0-1)
   */
  getProgress(): number {
    return this.state.totalWords > 0
      ? this.state.wordsRevealed / this.state.totalWords
      : 0;
  }

  /**
   * END session and calculate final rating
   * Returns the Rating enum value based on user completion
   */
  endSession(complete: boolean): { rating: Rating; progress: number } {
    const progress = this.getProgress();
    let rating: Rating;

    if (!complete) {
      // Abandoned or incomplete
      rating = Rating.AGAIN;
      this.state.phase = 'abandoned';
    } else if (progress >= 0.9) {
      rating = Rating.EASY;
      this.state.phase = 'confirmed';
    } else if (progress >= 0.6) {
      rating = Rating.GOOD;
      this.state.phase = 'confirmed';
    } else if (progress >= 0.3) {
      rating = Rating.HARD;
      this.state.phase = 'confirmed';
    } else {
      rating = Rating.AGAIN;
      this.state.phase = 'confirmed';
    }

    this.state.durationSeconds = Math.round((Date.now() - this.state.startedAt) / 1000);

    return { rating, progress };
  }

  /**
   * Reset session for retry (user tapped "Besoin de plus de temps")
   */
  resetSession(): void {
    this.state.revealedWordIndices.clear();
    this.state.wordsRevealed = 0;
    this.state.phase = 'preview';
    this.state.startedAt = Date.now();
    this.wordFailureTracker.clear();
  }

  /**
   * Record word failures based on verification result
   * Call this after verifyAnswer() to analyze missed words
   */
  recordWordFailures(verification: VerificationResult, now: number): void {
    // Track missing words as failures
    for (const word of verification.missingWords) {
      // Find the position of this word in the verse
      const wordIndex = this.state.words.findIndex(w => w.toLowerCase() === word.toLowerCase());
      if (wordIndex !== -1) {
        this.wordFailureTracker.recordFailure(word, wordIndex, now);
      }
    }

    // Track substituted words as failures
    for (const sub of verification.substitutedWords) {
      // Find the expected word position
      const wordIndex = this.state.words.findIndex(w => w.toLowerCase() === sub.expected.toLowerCase());
      if (wordIndex !== -1) {
        this.wordFailureTracker.recordFailure(sub.expected, wordIndex, now);
      }
    }
  }

  /**
   * Get the most forgotten words for this session
   */
  getMostForgottenWords(count: number = 3): Array<{ word: string; failCount: number; lastFailedAt: number; position: number }> {
    return this.wordFailureTracker.getMostForgottenWords(count);
  }

  /**
   * Check if a word is frequently forgotten
   */
  isWordForgotten(word: string, threshold: number = 2): boolean {
    return this.wordFailureTracker.getFailureRate(word) >= threshold;
  }
}
