/**
 * BibleTextService — thin web-accessible loader for local translation text.
 * Caches the LSG book corpus (with chapters/verses) in memory and resolves
 * to null when the dataset is unavailable (e.g. data/bible/lsg.json not
 * bundled for the web build) so screens can gracefully degrade.
 */

import {
  LocalBibleRepository,
  type ILocalBibleRepository,
  type BibleBookData,
} from '@/domains/bible/repository-local';
import { BibleJsonFileSource } from '@/infrastructure/bible/bible-json-source';

let repo: ILocalBibleRepository | null = null;
let books: BibleBookData[] | null = null;
let loadPromise: Promise<BibleBookData[] | null> | null = null;

/** Load (once) the book corpus for a translation; null when unavailable. */
export async function loadTranslationBooks(
  translationId: string = 'lsg',
): Promise<BibleBookData[] | null> {
  if (books) return books;
  if (!loadPromise) {
    if (!repo) {
      repo = new LocalBibleRepository(new BibleJsonFileSource());
    }
    loadPromise = (async () => {
      try {
        books = await repo!.getBooks(translationId);
      } catch (error) {
        console.warn('[BibleTextService] Dataset unavailable:', error);
        books = null;
      }
      return books;
    })();
  }
  return loadPromise;
}
