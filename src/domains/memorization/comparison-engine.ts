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
export type { WordAlignment };

/**
 * Result of a written-recall comparison (P0.1 WRITING RECALL).
 *
 * `wordDiffs` is a deterministic LCS-based alignment:
 *  - `correct` — word present in both (position = index in the expected verse)
 *  - `wrong` — the expected word was replaced by a different word
 *  - `missing` — expected word absent from the written text
 *  - `extra` — word present in the written text but not in the verse
 *            (position = index within the written text)
 *
 * `matchScore` is the LCS length normalised over the expected word count
 * (0..1). No LLM, no network, no new dependency.
 */
export interface WrittenRecallResult {
  /** Similarity score in [0, 1] — LCS length / expected word count. */
  matchScore: number;
  /** Total words in the expected verse. */
  wordCount: number;
  /** One entry per expected word, in verse order, plus trailing extras. */
  wordDiffs: Array<{
    word: string;
    type: 'correct' | 'wrong' | 'missing' | 'extra';
    /** Index of this word in the expected verse (extras: in the written text). */
    position: number;
  }>;
}

/**
 * Comparison Engine — Compare user answer against expected verse
 * Returns structured diagnostic for UI, FSRS adjustment, and user feedback
 * See docs/22-comparison-engine-spec.md
 */

import type { VerificationResult } from './entities';
export type { VerificationResult } from './entities';

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
   * Compare a verse written from memory against the expected verse text.
   *
   * P0.1 WRITING RECALL: deterministic LCS word diff. The expected verse
   * is rendered as word chips: correct (green), wrong (red, with the
   * substituted word), missing (highlighted). Extra words are listed
   * after the verse. No second cognitive score is derived — the caller
   * should not layer a memorization assessment on top of this result.
   *
   * Pure and synchronous. Public for unit testing.
   */
  compareWrittenRecall(written: string, expected: string): WrittenRecallResult {
    const expectedWords = this.tokenize(this.normalize(expected));
    const writtenWords = this.tokenize(this.normalize(written));

    const lcs = this.lcsLength(expectedWords, writtenWords);
    const wordDiffs: WrittenRecallResult['wordDiffs'] = [];

    // Traceback over the LCS table (recomputed lazily, word-level so
    // memory stays O(len^2) of the verse — small and bounded).
    const diff = this.diffWords(expectedWords, writtenWords);
    for (const step of diff) {
      if (step.kind === 'equal') {
        wordDiffs.push({
          word: expectedWords[step.i],
          type: 'correct',
          position: step.i,
        });
      } else if (step.kind === 'substitute') {
        wordDiffs.push({
          word: expectedWords[step.i],
          type: 'wrong',
          position: step.i,
        });
      } else if (step.kind === 'delete') {
        // Expected word absent from the written text.
        wordDiffs.push({
          word: expectedWords[step.i],
          type: 'missing',
          position: step.i,
        });
      } else {
        // Word in the written text that is not part of the verse.
        wordDiffs.push({
          word: writtenWords[step.j],
          type: 'extra',
          position: step.j,
        });
      }
    }

    return {
      matchScore: expectedWords.length === 0 ? 1 : lcs / expectedWords.length,
      wordCount: expectedWords.length,
      wordDiffs,
    };
  }

  /**
   * LCS length between two word arrays (case-insensitive, on normalized
   * words). O(n*m) dynamic programming.
   * Public for unit testing.
   */
  lcsLength(expected: string[], written: string[]): number {
    const a = expected.map((w) => w.toLowerCase());
    const b = written.map((w) => w.toLowerCase());
    const prev = new Array<number>(b.length + 1).fill(0);
    for (let i = 1; i <= a.length; i++) {
      const cur = [0];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = a[i - 1] === b[j - 1]
          ? prev[j - 1] + 1
          : Math.max(prev[j], cur[j - 1]);
      }
      prev.splice(0, prev.length, ...cur);
    }
    return prev[b.length];
  }

  /**
   * Word-level diff steps from an LCS alignment (a = expected, b = written).
   * `substitute` pairs one delete + one insert that face each other so the
   * UI can render "expected word → what was written" as a single wrong chip.
   * Public for unit testing.
   */
  diffWords(
    a: string[],
    b: string[],
  ): Array<
    | { kind: 'equal'; i: number; j: number }
    | { kind: 'substitute'; i: number; j: number }
    | { kind: 'delete'; i: number }
    | { kind: 'insert'; j: number }
  > {
    type Step =
      | { kind: 'equal'; i: number; j: number }
      | { kind: 'substitute'; i: number; j: number }
      | { kind: 'delete'; i: number }
      | { kind: 'insert'; j: number };

    const la = a.map((w) => w.toLowerCase());
    const lb = b.map((w) => w.toLowerCase());
    const n = la.length;
    const m = lb.length;

    // dp[i][j] = LCS length of la[i..n] × lb[j..m]
    const dp: number[][] = Array.from({ length: n + 1 }, () =>
      new Array<number>(m + 1).fill(0),
    );
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] =
          la[i] === lb[j]
            ? dp[i + 1][j + 1] + 1
            : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    // Tie-breaking rule: at a position where the words differ, prefer to
    // PAIR the expected word with the written word (substitution) unless
    // doing so would break a future equality. This keeps the diff calm:
    // "le monde" vs "la terre" renders as two substitutions, not one
    // deletion + one insertion.
    const steps: Step[] = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (la[i] === lb[j]) {
        steps.push({ kind: 'equal', i, j });
        i++;
        j++;
      } else if (
        // Substitution: pair la[i] with lb[j] only when doing so still
        // preserves the optimal LCS — the pairing must itself be part of
        // an optimal alignment (dp[i][j] = dp[i+1][j+1] + 1) AND no
        // optimal alignment of the remainder avoids pairing
        // la[i+1]/lb[j+1] with each other. This keeps the diff calm
        // ("le monde" vs "la terre" → two substitutions, "a b" vs "b a"
        // → two substitutions) while never sacrificing a future equality
        // ("Dieu a tant" vs "Dieu tant aimé" → 'a' stays missing,
        // 'aimé' stays extra).
        dp[i + 1][j + 1] + 1 === dp[i][j] &&
        dp[i + 1][j + 1] === dp[i + 1][j] &&
        dp[i + 1][j + 1] === dp[i][j + 1]
      ) {
        steps.push({ kind: 'substitute', i, j });
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        steps.push({ kind: 'delete', i });
        i++;
      } else {
        steps.push({ kind: 'insert', j });
        j++;
      }
    }
    while (i < n) {
      steps.push({ kind: 'delete', i });
      i++;
    }
    while (j < m) {
      steps.push({ kind: 'insert', j });
      j++;
    }

    // Safety: collapse any residual adjacent delete + insert pairs (can
    // only occur at the very tail of the sequences) into substitutions.
    const merged: Step[] = [];
    let k = 0;
    while (k < steps.length) {
      const s = steps[k];
      const next = steps[k + 1];
      if (
        s &&
        s.kind === 'delete' &&
        next &&
        next.kind === 'insert'
      ) {
        merged.push({ kind: 'substitute', i: s.i, j: next.j });
        k += 2;
      } else {
        merged.push(s);
        k++;
      }
    }
    return merged;
  }

  /**
   * Normalize text: lowercase, trim, remove punctuation, normalize whitespace
   * Public for unit testing.
   */
  normalize(text: string): string {
    return text.toLowerCase().trim()
      .replace(/[.,;:'!?"]/g, '')  // Remove common punctuation
      .replace(/\s+/g, ' ');        // Normalize multiple spaces to single space
  }

  /**
   * Split text into words, filtering empty strings
   * Public for unit testing.
   */
  tokenize(text: string): string[] {
    return text.split(' ').filter(w => w.length > 0);
  }

  /**
   * Align expected vs provided words using position-based matching
   * - "correct": expected[i] === provided[i] (case-insensitive match)
   * - "missing": expected word not found at expected position, and not in provided
   * - "substituted": expected[i] !== provided[i] but word exists elsewhere in provided
   * - "extra": provided word not found in expected at all
   * - "transpositions": adjacent words swapped
   * Public for unit testing.
   */
  alignWords(expected: string[], provided: string[]): WordAlignment {
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
   * Public for unit testing.
   */
  calculateSimilarityScore(alignment: WordAlignment, totalWords: number): number {
    const correctCount = alignment.correct.length;
    return correctCount / Math.max(totalWords, 1);
  }

  /**
   * Analyze the verse into strong (consistently correct) and fragile (error-prone) portions
   * Based on the alignment of correct words
   * Public for unit testing.
   */
  analyzePortions(alignment: WordAlignment, totalWords: number): {
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
