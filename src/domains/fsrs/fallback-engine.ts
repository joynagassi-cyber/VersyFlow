/**
 * Fallback SM-2 Engine (JavaScript)
 * Simple spaced repetition algorithm as backup when WASM/Rust unavailable
 * See docs/13-fsrs-domain.md section "Fallback SM-2 en JS"
 */

import { IFsrsEngine, FsrsState, FsrsReview, Rating, DEFAULT_FSRS_STATE } from '.';

export class Sm2FallbackEngine implements IFsrsEngine {
  newState(): Promise<FsrsState> {
    return Promise.resolve({ ...DEFAULT_FSRS_STATE });
  }

  currentState(state: FsrsState): FsrsState {
    return { ...state };
  }

  review(state: FsrsState, rating: Rating): Promise<FsrsReview> {
    // Classic SM-2 algorithm (simpler but functional fallback)
    const currentDifficulty = state.difficulty;
    const currentInterval = state.lastInterval || 1;

    // Update difficulty: harder ratings increase difficulty
    let newDifficulty = Math.max(0, Math.min(10,
      currentDifficulty - 1.3 + (4 - rating) * 0.5
    ));

    // Calculate new interval based on rating
    let newInterval: number;
    if (rating === Rating.AGAIN) {
      // Reset to 1 day
      newInterval = 1;
    } else if (currentInterval === 0 || currentInterval < 1) {
      // First review or near-zero → 1 day
      newInterval = 1;
    } else if (rating === Rating.EASY) {
      // Maximum boost × 3.0
      newInterval = Math.max(1, Math.round(currentInterval * 3.0));
    } else if (rating === Rating.HARD) {
      // Moderate boost × 1.2
      newInterval = Math.max(1, Math.round(currentInterval * 1.2));
    } else {
      // GOOD — standard boost × 1.5
      newInterval = Math.max(1, Math.round(currentInterval * 1.5));
    }

    // Calculate new stability (approximate)
    const stabilityMultiplier = rating === Rating.EASY ? 3.0 :
      rating === Rating.GOOD ? 2.5 :
      rating === Rating.HARD ? 1.0 : 0.1;
    const newStability = Math.max(0.1, state.stability * stabilityMultiplier);

    const newState: FsrsState = {
      stability: newStability,
      difficulty: newDifficulty,
      recallProbability: Math.max(0.5, 1 - (newDifficulty - 5) * 0.05),
      lastInterval: currentInterval,
      nextInterval: newInterval,
      elapsedDays: newInterval,
      repetitions: state.repetitions + 1,
      requestedRetention: state.requestedRetention,
    };

    return Promise.resolve({
      state: newState,
      due: new Date(Date.now() + newInterval * 86400000),
      stability: newStability,
      scheduledDays: newInterval,
      recurring: true,
    });
  }

  explain(state: FsrsState, _rating: Rating): Record<string, string> {
    return {
      stability: `Stabilité: ${state.stability.toFixed(1)} jours avant oubli`,
      difficulty: `Difficulté: ${state.difficulty.toFixed(1)}/10`,
      interval: `Prochain rappel: dans ${state.nextInterval} jour${state.nextInterval > 1 ? 's' : ''}`,
      recallProbability: `Probabilité de rappel: ${(state.recallProbability * 100).toFixed(0)}%`,
    };
  }

  getDueItems(states: FsrsState[], now: Date): string[] {
    // In real implementation, each state would have an ID
    // For now, return IDs of states where nextReviewAt <= now
    return states
      .filter(s => s.elapsedDays >= s.nextInterval)
      .map(() => 'placeholder'); // Real IDs come from MemorizationRecord
  }
}
