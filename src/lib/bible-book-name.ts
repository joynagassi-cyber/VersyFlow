import { BIBLE_BOOKS } from '@/domains/bible/entities';

const canonicalNames = new Map(BIBLE_BOOKS.map((book) => [book.id, book.name]));

/** Prefer full canonical names over dataset codes, while preserving genuine
 * translations in languages for which no canonical name is bundled. */
export function bibleBookName(id: string, language: string, datasetName?: Record<string, string>): string {
  const base = language.toLowerCase().split('-')[0] || 'fr';
  const canonical = canonicalNames.get(id);
  if (base === 'fr' || base === 'en') return canonical?.[base] ?? datasetName?.[base] ?? id;
  const translated = datasetName?.[language] ?? datasetName?.[base];
  if (translated && translated.trim().toLowerCase().replace(/[^a-z0-9]/g, '') !== id.toLowerCase()) return translated;
  return canonical?.en ?? canonical?.fr ?? translated ?? id;
}
