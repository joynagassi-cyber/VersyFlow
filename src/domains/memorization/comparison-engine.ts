/**
 * Alignment structure for word comparison results
 */
interface WordAlignment {
  correct: Array<{ position: number; word: string }>;
  missing: Array<{ position: number; word: string }>;
  extra: Array<{ position: number; word: string }>;
  substituted: Array<{ position: number; expected: string; got: string }>;
  transpositions: Array<{ first: number; second: number }>;
}

/**
 * Comparison Engine — Compare user answer against expected verse
 * Returns structured diagnostic for UI, FSRS adjustment, and user feedback
 * See docs/22-comparison-engine-spec.md
 */

import { VerificationResult } from './entities';

/**
 * ComparisonEngine — Pure domain logic for text comparison
 * No external dependencies — fully testable in isolation
 */
export class ComparisonEngine {
  /**
   * Compare the user's input against the expected verse text
   * Returns a structured verification result with word-level analysis
   */
  compare(userInput: string, expectedVerse: string): VerificationResult {
    const normalizedExpected = this.normalize(expectedVerse);
    const normalizedInput = this.normalize(userInput);

    const expectedWords = this.tokenize(normalizedExpected);
    const providedWords = this.tokenize(normalizedInput);

    // Alignment — find matches, missing, extra, substitutions, and transpositions
    const alignment = this.alignWords(expectedWords, providedWords);

    // Calculate similarity score
    const score = this.calculateSimilarityScore(alignment, expectedWords.length);

    // Analyze strong and fragile portions of the verse
    const { strongPortions, fragilePortions } = this.analyzePortions(alignment, expectedWords.length);

    return {
      score,
      wordCount: expectedWords.length,
      correctWords: alignment.correct.map(c => c.word),
      missingWords: alignment.missing.map(m => m.word),
      extraWords: alignment.extra.map(e => e.word),
      substitutedWords: alignment.substituted.map(s => ({
        expected: s.expected,
        got: s.got,
      })),
      characterDiffs: [], // Future: character-level diff
      strongPortions,
      fragilePortions,
    };
  }

  /**
   * Normalize text: lowercase, trim, remove punctuation, normalize whitespace
   */
  private normalize(text: string): string {
    return text.toLowerCase().trim()
      .replace(/[.,;:'!?"]/g, '')  // Remove common punctuation
      .replace(/\s+/g, ' ');        // Normalize multiple spaces to single space
  }

  /**
   * Split text into words, filtering empty strings
   */
  private tokenize(text: string): string[] {
    return text.split(' ').filter(w => w.length > 0);
  }

  /**
   * Align expected vs provided words using simplified approach
   * Detects: matches, missing words, extra words, substitutions, and transpositions
   */
  private alignWords(expected: string[], provided: string[]): WordAlignment {
    const alignment: WordAlignment = {
      correct: [],
      missing: [],
      extra: [],
      substituted: [],
      transpositions: [],
    };

    const expectedSet = new Set(expected);
    const providedSet = new Set(provided);

    // First pass: detect direct matches and classify mismatches
    for (let i = 0; i < expected.length; i++) {
      if (i < provided.length && expected[i] === provided[i]) {
        // Direct match
        alignment.correct.push({ position: i, word: expected[i] });
      } else if (!providedSet.has(expected[i])) {
        // Word is missing from user input
        alignment.missing.push({ position: i, word: expected[i] });
      } else {
        // Potential substitution
        // Check if it's a transposition (swapped adjacent words)
        if (
          i > 0 &&
          i - 1 < provided.length &&
          provided[i - 1] === expected[i] &&
          provided[i] === expected[i - 1]
        ) {
          alignment.transpositions.push({ first: i - 1, second: i });
        } else {
          // Substitution
          const providedWord = provided[i];
          alignment.substituted.push({
            position: i,
            expected: expected[i],
            got: providedWord || '',
          });
        }
      }
    }

    // Handle extra words in provided text (beyond expected length)
    for (let i = Math.min(expected.length, provided.length); i < provided.length; i++) {
      alignment.extra.push({ position: i, word: provided[i] });
    }

    return alignment;
  }

  /**
   * Calculate similarity score based on aligned words
   */
  private calculateSimilarityScore(alignment: any, totalWords: number): number {
    const correctCount = alignment.correct.length;
    return correctCount / Math.max(totalWords, 1);
  }

  /**
   * Analyze the verse into strong (consistently correct) and fragile (error-prone) portions
   * Based on the alignment of correct words
   */
  private analyzePortions(alignment: WordAlignment, totalWords: number): {
    strongPortions: Array<{ start: number; end: number; accuracy: number }>;
    fragilePortions: Array<{ start: number; end: number; accuracy: number }>;
  } {
    const correctPositions = new Set(alignment.correct.map(c => c.position));
    const strongPortions: Array<{ start: number; end: number; accuracy: number }> = [];
    const fragilePortions: Array<{ start: number; end: number; accuracy: number }> = [];

    let currentStart = 0;
    let currentCorrect = 0;

    for (let i = 0; i <= totalWords; i++) {
      const isCorrect = i < totalWords && correctPositions.has(i);

      if (isCorrect) {
        currentCorrect++;
      }

      // End of a portion segment (either wrong word or end of verse)
      if (!isCorrect || i === totalWords) {
        const length = i - currentStart || 1;
        const accuracy = currentCorrect / length;

        // Classify as strong (>=80% accurate) or fragile (<50% accurate)
        if (accuracy >= 0.8) {
          strongPortions.push({
            start: currentStart,
            end: i - 1,
            accuracy,
          });
        } else if (accuracy < 0.5) {
          fragilePortions.push({
            start: currentStart,
            end: i - 1,
            accuracy,
          });
        }

        currentStart = i;
        currentCorrect = 0;
      }
    }

    return { strongPortions, fragilePortions };
  }
}
