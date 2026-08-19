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
   * Align expected vs provided words using position-based matching
   * - "correct": expected[i] === provided[i] (case-insensitive match)
   * - "missing": expected word not found at expected position, and not in provided
   * - "substituted": expected[i] !== provided[i] but word exists elsewhere in provided
   * - "extra": provided word not found in expected at all
   * - "transpositions": adjacent words swapped
   */
  private alignWords(expected: string[], provided: string[]): WordAlignment {
    const alignment: WordAlignment = {
      correct: [],
      missing: [],
      extra: [],
      substituted: [],
      transpositions: [],
    };

    const expectedLower = expected.map(w => w.toLowerCase());
    const providedLower = provided.map(w => w.toLowerCase());
    const providedSet = new Set(providedLower);
    const expectedSet = new Set(expectedLower);

    // Detect transpositions (adjacent swapped words)
    for (let i = 0; i < Math.min(expectedLower.length, providedLower.length) - 1; i++) {
      if (
        expectedLower[i] === providedLower[i + 1] &&
        expectedLower[i + 1] === providedLower[i]
      ) {
        alignment.transpositions.push({ first: i, second: i + 1 });
      }
    }

    // Positional alignment
    for (let i = 0; i < expectedLower.length; i++) {
      const expWord = expectedLower[i];
      const provWord = i < providedLower.length ? providedLower[i] : null;

      if (i < providedLower.length && expWord === provWord) {
        // Direct positional match
        alignment.correct.push({ position: i, word: expected[i] });
      } else if (!providedSet.has(expWord)) {
        // Word not in provided at all → missing
        alignment.missing.push({ position: i, word: expected[i] });
      } else if (i < providedLower.length) {
        // Word exists elsewhere in provided but not at this position → substitution
        alignment.substituted.push({
          position: i,
          expected: expected[i],
          got: provided[i] || '',
        });
      } else {
        // No corresponding position in provided
        alignment.missing.push({ position: i, word: expected[i] });
      }
    }

    // Extra words: in provided but not in expected
    for (let i = 0; i < providedLower.length; i++) {
      if (!expectedSet.has(providedLower[i])) {
        alignment.extra.push({ position: i, word: provided[i] });
      }
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
