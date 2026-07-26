/**
 * Session Engine — Deterministic workflow for memorization sessions
 * See MEMORY_ENGINE_SPEC.md §3
 */

import { SessionState, SessionPhase, VerificationResult, DEFAULT_MVP_STRATEGY, ExerciseStrategy, MaskingConfig, getMaskingConfigForStability } from './entities';
import { Rating } from '../fsrs';

/**
 * SessionEngine: manages the complete lifecycle of a memorization session.
 * Pure domain logic — zero UI dependencies.
 */
export class SessionEngine {
  private state: SessionState;
  private strategy: ExerciseStrategy;
  private maskingConfig: MaskingConfig;

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
   * VERIFY answer — compare user input against expected verse
   * Returns structured verification result
   */
  verifyAnswer(userInput: string): VerificationResult {
    const expected = this.state.verseText.toLowerCase().trim();
    const provided = userInput.toLowerCase().trim();

    // Simple word-by-word comparison
    const expectedWords = expected.split(/\s+/);
    const providedWords = provided.split(/\s+/);

    const result: VerificationResult = {
      score: 0,
      correctWords: [],
      missingWords: [],
      extraWords: [],
      substitutedWords: [],
      characterDiffs: [],
      strongPortions: [],
      fragilePortions: [],
    };

    // Calculate similarity using edit distance approximation
    let matches = 0;
    const maxLen = Math.max(expectedWords.length, providedWords.length);

    for (let i = 0; i < Math.min(expectedWords.length, providedWords.length); i++) {
      if (expectedWords[i] === providedWords[i]) {
        matches++;
        result.correctWords.push(expectedWords[i]);
      } else {
        result.substitutedWords.push({
          expected: expectedWords[i],
          got: providedWords[i],
        });

        // Check if word is present elsewhere (transposition detection)
        if (providedWords.includes(expectedWords[i])) {
          result.extraWords.push(providedWords[i]); // Will be corrected below
        }
      }
    }

    // Handle extra words in provided text
    for (const pw of providedWords) {
      if (!expectedWords.includes(pw) && !result.correctWords.includes(pw)) {
        result.extraWords.push(pw);
      }
    }

    // Handle missing words
    for (const ew of expectedWords) {
      if (!providedWords.includes(ew) && !result.correctWords.includes(ew)) {
        result.missingWords.push(ew);
      }
    }

    // Overall similarity score
    result.score = maxLen > 0 ? matches / maxLen : 0;

    // Segment into portions for strong/fragile analysis
    this.analyzePortions(expectedWords, result);

    return result;
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
  }

  private analyzePortions(words: string[], result: VerificationResult): void {
    // Group consecutive correct/incorrect words into portions
    let currentStart = 0;
    let currentCorrect = 0;

    for (let i = 0; i < words.length; i++) {
      const isCorrect = result.correctWords.includes(words[i]);

      if (isCorrect) {
        currentCorrect++;
      }

      if (!isCorrect || i === words.length - 1) {
        // End of a portion segment
        const accuracy = currentCorrect / (i - currentStart + 1 || 1);
        if (accuracy >= 0.8) {
          result.strongPortions.push({
            start: currentStart,
            end: i,
            accuracy,
          });
        } else if (accuracy < 0.5) {
          result.fragilePortions.push({
            start: currentStart,
            end: i,
            accuracy,
          });
        }

        currentStart = i + 1;
        currentCorrect = 0;
      }
    }
  }
}
