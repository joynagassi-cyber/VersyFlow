/**
 * Translation Comparison Service
 *
 * Single point of instantiation. Wraps the pure domain engine + wired deps.
 */

import {
  TranslationComparisonEngine,
  type ITranslationComparisonEngine,
} from '@/capabilities/comparison/translation-comparison';
import { LocalBibleRepository } from '@/domains/bible/repository-local';
import type { ILocalBibleRepository, IBibleTextSource } from '@/domains/bible/repository-local';
import { BibleTranslationRegistry } from '@/domains/bible/registry';
import type { IBibleTranslationRegistry } from '@/domains/bible/registry';

/**
 * Factory — creates a ready-to-use engine with injected dependencies.
 */
export function createTranslationComparisonService(
  source: IBibleTextSource,
  registry?: IBibleTranslationRegistry,
): ITranslationComparisonEngine {
  const repo: ILocalBibleRepository = new LocalBibleRepository(source);
  const reg: IBibleTranslationRegistry = registry ?? new BibleTranslationRegistry([]);
  return new TranslationComparisonEngine(repo, reg);
}

export { TranslationComparisonEngine };
export type { ITranslationComparisonEngine, BibleReference, TranslationComparisonResult }
  from '@/capabilities/comparison/translation-comparison';
