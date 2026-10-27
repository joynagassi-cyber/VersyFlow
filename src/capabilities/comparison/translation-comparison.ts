/**
 * Translation Comparison — Pure Domain Engine
 *
 * Reads verse texts from injected repository + availability/names from injected
 * registry. NO network/storage/filesystem calls here.
 */

import type { ILocalBibleRepository } from '@/domains/bible/repository-local';
import type { IBibleTranslationRegistry } from '@/domains/bible/registry';

/** A single Bible verse reference. */
export interface BibleReference {
  bookId: string;
  chapter: number;
  verse: number;
}

/** Result of comparing one translation at a reference. */
export interface TranslationComparisonResult {
  translationId: string;
  name: string;
  text: string | null;
  available: boolean;
}

/** Engine interface. */
export interface ITranslationComparisonEngine {
  compare(
    reference: BibleReference,
    translationIds: string[],
  ): Promise<TranslationComparisonResult[]>;
}

/**
 * Default engine implementation.
 */
export class TranslationComparisonEngine implements ITranslationComparisonEngine {
  constructor(
    private readonly repo: ILocalBibleRepository,
    private readonly registry: IBibleTranslationRegistry,
  ) {}

  async compare(
    reference: BibleReference,
    translationIds: string[],
  ): Promise<TranslationComparisonResult[]> {
    const results: TranslationComparisonResult[] = [];

    for (const tid of translationIds) {
      const manifest = this.registry.getById(tid);
      if (!manifest) continue;

      const verse = await this.repo.getVerse(tid, reference.bookId, reference.chapter, reference.verse);

      results.push({
        translationId: tid,
        name: manifest.name,
        text: verse?.text ?? null,
        available: this.registry.isAvailable(tid),
      });
    }

    return results;
  }
}
