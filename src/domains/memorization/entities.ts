/**
 * Memorization Domain — Entities & Types
 * See docs/MEMORY_ENGINE_SPEC.md for complete memory engine specification
 */

import { Rating, FsrsState } from '@/domains/fsrs';

// ====================
// Memorization Record
// ====================
export interface MemorizationRecord {
  /** Unique ID: bookId:chapter:verse:translationId hashed */
  id: string;

  /** Book identifier (gen, exo, joh...) */
  bookId: string;

  /** Chapter number */
  chapterNumber: number;

  /** Verse number */
  verseNumber: number;

  /** Translation ID (lsg, kjv, niv...) */
  translationId: string;

  /** Cached display reference ("Jean 3:16") */
  bibleVerseReference: string;

  /** Cached verse text from selected translation */
  bibleVerseText: string;

  /** Current memorization status */
  status: MemorizationStatus;

  /** FSRS state for scheduling reviews */
  fsrsState: FsrsState;

  /** User can favorite verses */
  favorite: boolean;

  /** Thematic tags (future V1+) */
  tags: string[];

  /** Creation timestamp (Unix ms) */
  createdAt: number;

  /** Last review timestamp */
  lastReviewedAt: number | null;

  /** Next optimal review timestamp */
  nextReviewAt: number | null;

  /** Total review count */
  reviewCount: number;

  /** Total time spent in minutes */
  totalReviewMinutes: number;

  /** Word-by-word engagement data */
  wordPerformance: WordPerformance[];
}

// ====================
// Memorization Status
// ====================
export type MemorizationStatus = 'new' | 'in-progress' | 'mastered';

export const MEMORIZATION_STATUS_ORDER: MemorizationStatus[] = [
  'new',
  'in-progress',
  'mastered',
];

/** Transition rules between statuses */
export function canTransition(from: MemorizationStatus, to: MemorizationStatus): boolean {
  const fromIndex = MEMORIZATION_STATUS_ORDER.indexOf(from);
  const toIndex = MEMORIZATION_STATUS_ORDER.indexOf(to);

  // Only allow forward transitions (+1) or reset (-1)
  if (toIndex === fromIndex + 1) return true;
  if (toIndex === fromIndex - 1) return true; // Reset needed

  return false;
}

/** Mastered criteria (per UC-MEM-001 RB-4) */
export function isMastered(record: MemorizationRecord): boolean {
  return record.status === 'mastered';
}

/** Calculate mastery level based on FSRS state */
export function calculateMasteryLevel(record: MemorizationRecord): MasteryLevel {
  if (record.status === 'mastered') return MasteryLevel.MASTERED;

  const stability = record.fsrsState.stability;
  const repetitions = record.fsrsState.repetitions;
  const recallProb = record.fsrsState.recallProbability;

  if (stability > 30 && repetitions >= 5 && recallProb > 0.9) {
    return MasteryLevel.MASTERED;
  } else if (stability > 7) {
    return MasteryLevel.IN_PROGRESS_STRONG;
  } else if (stability > 1) {
    return MasteryLevel.IN_PROGRESS;
  } else {
    return MasteryLevel.IN_PROGRESS_WEAK;
  }
}

export enum MasteryLevel {
  IN_PROGRESS_WEAK = 'in-progress-weak',      // stability < 1 day
  IN_PROGRESS = 'in-progress',                 // 1-7 days stability
  IN_PROGRESS_STRONG = 'in-progress-strong',   // 7-30 days stability
  MASTERED = 'mastered',                       // > 30 days + 5+ reviews
}

// ====================
// Word Performance Tracking
// ====================
export interface WordPerformance {
  /** Word index in the verse */
  wordIndex: number;

  /** How many times this word was recalled correctly */
  correctRecalls: number;

  /** How many times this word was missed or misspelled */
  failedRecalls: number;

  /** Average time to recall this word (ms) */
  avgRecallTimeMs: number;

  /** Word itself (for debugging/display) */
  word: string;
}

// ====================
// Exercise Strategy
// ====================
export type ExerciseStrategy =
  | 'active-recall'           // MVP: basic recall with progressive masking
  | 'cloze-deletion'          // V1: fill-in-the-blank
  | 'progressive-masking'     // MVP variant: left-to-right mask
  | 'first-letter-mode'       // V1: show first letters only
  | 'reference-recall'        // Future: recall verse by reference only
  | 'typing-mode'             // Future: type entire verse
  | 'chunk-learning'          // Future: learn in segments
  | 'incremental-reveal'      // MVP variant: reveal one word at a time
  | 'interleaving'            // V1: mix with other verses
  | 'overlearning'            // V1: continue after mastery threshold
  | 'heat-words'              // V1: highlight words frequently missed
  | 'memory-fingerprint'      // V1: personalized pattern of words always forgotten

/** Default strategy for MVP */
export const DEFAULT_MVP_STRATEGY: ExerciseStrategy = 'progressive-masking';

/** Strategies available at each version */
export const STRATEGIES_BY_VERSION: Record<string, ExerciseStrategy[]> = {
  mvp: ['active-recall', 'progressive-masking', 'incremental-reveal'],
  v1: ['cloze-deletion', 'first-letter-mode', 'interleaving', 'overlearning', 'heat-words', 'memory-fingerprint'],
  future: ['reference-recall', 'typing-mode', 'chunk-learning', 'multi-modal-recall'],
};

// ====================
// Masking Configuration
// ====================
export interface MaskingConfig {
  /** Percentage of words to hide (0 = all visible, 100 = all hidden) */
  maskPercentage: number;

  /** Which words to mask first (by frequency of failure) */
  smartMasking: boolean;

  /** Words that are always revealed regardless of mask percentage */
  preservedWords: number[];

  /** Order of masking: progressive (left-to-right) or random */
  maskingOrder: 'progressive' | 'random' | 'by-difficulty';
}

/** Calculate masking config based on FSRS stability */
export function getMaskingConfigForStability(stability: number): MaskingConfig {
  if (stability <= 1) {
    // Almost forgotten — reveal more, mask less
    return {
      maskPercentage: 30,
      smartMasking: false,
      preservedWords: [],
      maskingOrder: 'progressive',
    };
  } else if (stability <= 7) {
    // Medium retention
    return {
      maskPercentage: 50,
      smartMasking: false,
      preservedWords: [],
      maskingOrder: 'progressive',
    };
  } else if (stability <= 30) {
    // Good retention
    return {
      maskPercentage: 80,
      smartMasking: true,
      preservedWords: [],
      maskingOrder: 'by-difficulty',
    };
  } else {
    // Mastery level
    return {
      maskPercentage: 90,
      smartMasking: true,
      preservedWords: [],
      maskingOrder: 'by-difficulty',
    };
  }
}

// ====================
// Review Log Entry
// ====================
export interface ReviewLogEntry {
  /** UUID v4 */
  id: string;

  /** Associated MemorizationRecord */
  memorizationRecordId: string;

  /** Timestamp of the review */
  answeredAt: number;

  /** User's self-assessment rating */
  rating: 'again' | 'hard' | 'good' | 'easy';

  /** Interval that was in effect before this review */
  actualInterval: number | null;

  /** What FSRS predicted the interval would be */
  predictedInterval: number;

  /** Stability values before and after */
  stabilityBefore: number;
  stabilityAfter: number;

  /** Difficulty values before and after */
  difficultyBefore: number;
  difficultyAfter: number;

  /** Word-level performance during this review */
  wordPerformance: WordPerformanceSnapshot[];
}

export interface WordPerformanceSnapshot {
  wordIndex: number;
  word: string;
  recalled: boolean;
  incorrect: boolean;
  timeToRevealMs: number | null;
  suggestedWord: string;
  expectedWord: string;
}

// ====================
// Session State
// ====================
export type SessionPhase =
  | 'idle'                // No session active
  | 'preview'             // Showing full verse (10 seconds)
  | 'revealing'           // Progressive word reveal
  | 'validating'          // User submitting answer
  | 'confirmed'           // Session complete, showing results
  | 'abandoned';          // User quit session

export interface SessionState {
  /** Current phase of the session */
  phase: SessionPhase;

  /** The verse being memorized */
  verseText: string;

  /** Split into words for word-by-word interaction */
  words: string[];

  /** Which words have been revealed so far */
  revealedWordIndices: Set<number>;

  /** Start time of current session (Unix ms) */
  startedAt: number;

  /** Duration in seconds when user taps "J'ai mémorisé" */
  durationSeconds: number;

  /** Number of words revealed */
  wordsRevealed: number;

  /** Total words in the verse */
  totalWords: number;
}

// ====================
// Verification Helpers
// ====================
export interface VerificationResult {
  /** Overall similarity score (0-1, higher = better) */
  score: number;

  /** Words that were correctly recalled */
  correctWords: string[];

  /** Words that were missing */
  missingWords: string[];

  /** Words that were added but shouldn't be */
  extraWords: string[];

  /** Words substituted incorrectly */
  substitutedWords: Array<{ expected: string; got: string }>;

  /** Character-level differences */
  characterDiffs: Array<{ position: number; expected: string; got: string }>;

  /** Portions of the verse that are strong (consistently recalled correctly) */
  strongPortions: Array<{ start: number; end: number; accuracy: number }>;

  /** Portions of the verse that are fragile (frequently missed) */
  fragilePortions: Array<{ start: number; end: number; accuracy: number }>;
}
