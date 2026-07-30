/**
 * Telemetry Domain — Entities for Data Collection
 * See docs/12-capabilities/TELEMETRY_SCHEMA.md
 */

import { FsrsState } from '@/domains/fsrs';
import { Rating } from '@/domains/fsrs';

/**
 * Exercise strategy used during the session
 */
export type ExerciseStrategy =
  | 'active-recall'
  | 'progressive-masking'
  | 'incremental-reveal'
  | 'cloze-deletion'
  | 'first-letter-mode'
  | 'reference-recall'
  | 'typing-mode'
  | 'chunk-learning'
  | 'interleaving'
  | 'overlearning'
  | 'heat-words'
  | 'memory-fingerprint';

/**
 * Telemetry Event Type
 */
export type EventType =
  | 'exercise.completed'
  | 'exercise.abandoned'
  | 'review.started'
  | 'review.completed'
  | 'memory.session.started'
  | 'memory.session.completed'
  | 'error.occurred'
  | 'feature.accessed';

/**
 * Telemetry Event payload for exercise completion
 */
export interface ExerciseCompletedTelemetry {
  eventType: 'exercise.completed';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    /** Unique identifier for the memorized verse (hash) */
    recordId: string;
    /** Exercise strategy used */
    exerciseType: ExerciseStrategy;
    /** Duration in milliseconds */
    durationMs: number;
    /** User's self-assessment rating */
    rating: Rating;
    /** Verification result from ComparisonEngine */
    verification: {
      score: number;
      correctWords: number;
      missingWords: number;
      extraWords: number;
      substitutedWords: number;
    };
    /** FSRS state before the exercise */
    fsrsBefore: FsrsState;
    /** FSRS state after the exercise */
    fsrsAfter: FsrsState;
    /** Context of the exercise (book, chapter, verse) */
    context: {
      bookId: string;
      chapterNumber: number;
      verseNumber: number;
      translationId: string;
    };
  };
}

/**
 * Telemetry Event payload for exercise abandonment
 */
export interface ExerciseAbandonedTelemetry {
  eventType: 'exercise.abandoned';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    recordId: string;
    exerciseType: ExerciseStrategy;
    elapsedMs: number;
    wordsRevealed: number;
    totalWords: number;
    reason: 'user_close' | 'navigation_away' | 'app_crash';
    fsrsState: FsrsState;
    context: {
      bookId: string;
      chapterNumber: number;
      verseNumber: number;
      translationId: string;
    };
  };
}

/**
 * Telemetry Event payload for review session start
 */
export interface ReviewStartedTelemetry {
  eventType: 'review.started';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    versesCount: number;
    overdueCount: number;
    scheduledCount: number;
  };
}

/**
 * Telemetry Event payload for review completion
 */
export interface ReviewCompletedTelemetry {
  eventType: 'review.completed';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    recordId: string;
    rating: Rating;
    previousStability: number;
    newStability: number;
    previousDifficulty: number;
    newDifficulty: number;
    predictedInterval: number;
    timeSpentMs: number;
    exerciseType?: ExerciseStrategy;
  };
}

/**
 * Telemetry Event payload for memory session start
 */
export interface MemorySessionStartedTelemetry {
  eventType: 'memory.session.started';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    recordId: string;
    exerciseType: ExerciseStrategy;
    context: {
      bookId: string;
      chapterNumber: number;
      verseNumber: number;
      translationId: string;
    };
  };
}

/**
 * Telemetry Event payload for memory session completion
 */
export interface MemorySessionCompletedTelemetry {
  eventType: 'memory.session.completed';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    recordId: string;
    rating: Rating;
    sessionDurationMs: number;
    wordsRevealed: number;
    totalWords: number;
    fsrsBefore: FsrsState;
    fsrsAfter: FsrsState;
    context: {
      bookId: string;
      chapterNumber: number;
      verseNumber: number;
      translationId: string;
    };
  };
}

/**
 * Telemetry Event payload for error occurrence
 */
export interface ErrorOccurredTelemetry {
  eventType: 'error.occurred';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    errorType: string;
    errorMessage: string;
    stack?: string;
    context?: Record<string, unknown>;
  };
}

/**
 * Telemetry Event payload for feature access
 */
export interface FeatureAccessedTelemetry {
  eventType: 'feature.accessed';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    featureName: string;
    screen?: string;
  };
}

/**
 * Union of all telemetry event types
 */
export type TelemetryEvent =
  | ExerciseCompletedTelemetry
  | ExerciseAbandonedTelemetry
  | ReviewStartedTelemetry
  | ReviewCompletedTelemetry
  | MemorySessionStartedTelemetry
  | MemorySessionCompletedTelemetry
  | ErrorOccurredTelemetry
  | FeatureAccessedTelemetry;

/**
 * Local storage entry for offline telemetry
 */
export interface TelemetryQueueItem {
  id: string;
  event: TelemetryEvent;
  queuedAt: number;
  sent: boolean;
}
