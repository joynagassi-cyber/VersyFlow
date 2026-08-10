/**
 * Domain Events — Event Bus and Event Types
 * Centralized event system for cross-domain communication
 */

/**
 * Domain Event interface — all domain events must conform to this shape
 */
export interface DomainEvent {
  /** Unique identifier for this event instance */
  id: string;
  /** Event type, format: "{domain}.{action}" */
  type: string;
  /** When the event occurred (Unix timestamp ms) */
  timestamp: number;
  /** Payload data — must be serializable to JSON */
  payload: Record<string, unknown>;
}

/**
 * Event type registry — central enum to avoid typos
 */
export const DomainEventTypes = {
  // Bible
  VERSE_SELECTED: 'bible.verse_selected',
  TRANSLATION_CHANGED: 'bible.translation_changed',

  // Memorization
  MEMORIZATION_STARTED: 'memorization.started',
  VERSE_MEMORIZED: 'memorization.verse_memorized',
  SESSION_ABANDONED: 'memorization.session_abandoned',
  FAVORITE_TOGGLED: 'memorization.favorite_toggled',

  // Review
  REVIEW_SESSION_STARTED: 'review.session_started',
  REVIEW_COMPLETED: 'review.completed',
  REVIEW_SESSION_FINISHED: 'review.session_finished',

  // Progress
  STREAK_INCREMENTED: 'progress.streak_incremented',
  PROGRESS_MILESTONE_REACHED: 'progress.milestone_reached',

  // Settings
  LANGUAGE_CHANGED: 'settings.language_changed',
  PROGRESS_RESET: 'settings.progress_reset',

  // Errors
  FSRS_ENGINE_FAILURE: 'error.fsrs_engine_failure',

  // Learner Profile
  PROFILE_CREATED: 'learner_profile.created',
  PROFILE_UPDATED: 'learner_profile.updated',
  PROFILE_DELETED: 'learner_profile.deleted',
  PROFILE_SELECTED: 'learner_profile.selected',

  // Passage Memorization
  TARGET_MEMORIZED: 'memorization.target_memorized',
  PASSAGE_STARTED: 'memorization.passage_started',
  SEGMENT_COMPLETED: 'memorization.segment_completed',
  TARGET_REVIEWED: 'review.target_completed',
  PASSAGE_REVIEWED: 'review.passage_completed',
} as const;

/**
 * Simple in-memory event bus for cross-domain communication.
 * In V1+, replace with a proper event store if needed.
 */
export class EventBus {
  private handlers = new Map<string, Set<(event: DomainEvent) => void>>();

  on(type: string, handler: (event: DomainEvent) => void): void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler);
    this.handlers.set(type, set);
  }

  emit(event: DomainEvent): void {
    const handlers = this.handlers.get(event.type) ?? new Set();
    handlers.forEach((h) => h(event));
  }

  off(type: string, handler: (event: DomainEvent) => void): void {
    const handlers = this.handlers.get(type);
    handlers?.delete(handler);
  }
}

export const eventBus = new EventBus();
