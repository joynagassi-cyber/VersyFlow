/**
 * Telemetry Domain — Entities for Data Collection
 * See docs/12-capabilities/TELEMETRY_SCHEMA.md
 */

import type { FsrsState } from '@/domains/fsrs';
import type { Rating } from '@/domains/fsrs';

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
  | 'passage.started'
  | 'passage.segment.completed'
  | 'error.occurred'
  | 'feature.accessed'
  | 'streak.incremented'
  | 'milestone.reached';

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
 * Telemetry Event payload for passage start
 */
export interface PassageStartedTelemetry {
  eventType: 'passage.started';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    /** Target ID for the passage */
    targetId: string;
    /** Display reference (e.g. "Jean 3:16-18") */
    displayReference: string;
    /** Number of verses in the passage */
    passageLength: number;
    /** Exercise strategy */
    exerciseType: ExerciseStrategy;
    /** Book/chapter/verse context */
    context: {
      bookId: string;
      chapterNumber: number;
      startVerse: number;
      endVerse: number;
      translationId: string;
    };
  };
}

/**
 * Telemetry Event payload for passage segment (verse) completion
 */
export interface PassageSegmentCompletedTelemetry {
  eventType: 'passage.segment.completed';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    /** Target ID for the passage */
    targetId: string;
    /** Verse number just completed */
    verseNumber: number;
    /** Index within passage (0-based) */
    segmentIndex: number;
    /** Total verses in passage */
    totalSegments: number;
    /** Words revealed in this segment */
    wordsRevealed: number;
    /** Total words in this segment */
    totalWords: number;
    /** Duration for this segment in ms */
    segmentDurationMs: number;
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
 * Telemetry Event payload for streak increment
 */
export interface StreakIncrementedTelemetry {
  eventType: 'streak.incremented';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    streakDelta: number;
    previousStreak: number;
    newStreak: number;
  };
}

/**
 * Telemetry Event payload for milestone reached
 */
export interface MilestoneReachedTelemetry {
  eventType: 'milestone.reached';
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: {
    milestoneType: string;
    totalVerses: number;
    totalMastered: number;
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
  | PassageStartedTelemetry
  | PassageSegmentCompletedTelemetry
  | ErrorOccurredTelemetry
  | FeatureAccessedTelemetry
  | StreakIncrementedTelemetry
  | MilestoneReachedTelemetry;

/**
 * Internal fields that must never be sent in telemetry (contain raw verse text or PII)
 */
const SENSITIVE_FIELDS = [
  'bibleVerseText',
  'verseText',
  'verseTexts',
  'word',
  'words',
  'transcript',
  'rawText',
  'content',
] as const;

/**
 * Redact a telemetry event by stripping any sensitive fields.
 * This is a pure function — no I/O, fully testable in isolation.
 * Only ids, durations, fsrs state transitions, streak deltas, and accuracy buckets are preserved.
 */
export function redact(event: TelemetryEvent): TelemetryEvent {
  const sensitiveSet = new Set(SENSITIVE_FIELDS);

  const redactPayload = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveSet.has(key)) {
        continue;
      }
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = redactPayload(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    return result;
  };

  return {
    ...event,
    payload: redactPayload(event.payload as Record<string, unknown>),
  };
}

/**
 * Local storage entry for offline telemetry
 */
export interface TelemetryQueueItem {
  id: string;
  event: TelemetryEvent;
  queuedAt: number;
  sent: boolean;
}

/**
 * Aggregated telemetry summary for analytics dashboards
 */
export interface TelemetrySummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  lastActivity: number | null;
  queueSize: number;
}
