/**
 * Written Recall Comparison Service (P0.1 WRITING RECALL)
 *
 * Single point of instantiation. Wraps the pure {@link ComparisonEngine}
 * word-diff so the recall-writing screen does not construct the engine
 * itself.
 *
 *   - Deterministic LCS-based diff, no LLM, no network, no new dependency.
 *   - Deliberately NOT layered onto the FSRS cognitive score: a written
 *     verse is compared against the expected passage and the errors are
 *     shown — the master prompt forbids a second cognitive score here.
 */

import { ComparisonEngine } from '@/domains/memorization/comparison-engine';
import type { WrittenRecallResult } from '@/domains/memorization/comparison-engine';

let _engine: ComparisonEngine | null = null;

/**
 * The shared engine instance. The ComparisonEngine is stateless (pure
 * functions), so a single instance is safe to share across screens.
 */
export function getComparisonEngine(): ComparisonEngine {
  if (!_engine) _engine = new ComparisonEngine();
  return _engine;
}

/**
 * Compare a verse written from memory against the expected passage.
 *
 * @param written  the user's written attempt
 * @param expected the expected verse/passage text
 * @returns `{ matchScore 0..1, wordCount, wordDiffs }` where each
 *          `wordDiff` is `{ word, type: correct|wrong|missing|extra, position }`
 */
export function compareWrittenRecall(
  written: string,
  expected: string,
): WrittenRecallResult {
  return getComparisonEngine().compareWrittenRecall(written, expected);
}

export type { WrittenRecallResult } from '@/domains/memorization/comparison-engine';
