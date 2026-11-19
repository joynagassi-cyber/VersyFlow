/**
 * Bible Domain — index éclaté (métadonnées seules)
 *
 * Le dataset complet (`lsg.json`, 6,9 Mo) est projeté en fichiers par chapitre
 * (`scripts/bible/split-lsg.mjs`). L'index est la seule partie chargée d'office :
 * la structure des 66 livres et le nombre de versets de chaque chapitre, soit
 * ~37 Ko — de quoi rendre la liste des livres, la grille des chapitres et les
 * compteurs sans parser un seul verset.
 *
 * Fonctions pures : aucun I/O. La lecture des fichiers appartient à
 * l'infrastructure (`SplitBibleTextSource`).
 */

import { z } from 'zod';
import { BIBLE_BOOKS } from './entities';

/** Un chapitre annoncé par l'index : son numéro et son nombre de versets. */
export const ChapterMetaSchema = z.object({
  number: z.number().int().positive(),
  verses: z.number().int().nonnegative(),
});
export type ChapterMeta = z.infer<typeof ChapterMetaSchema>;

/** Un livre annoncé par l'index. `chapterCount` = `chapters.length`. */
export const BookMetaSchema = z.object({
  id: z.string().min(2).max(12),
  name: z.record(z.string()),
  testament: z.enum(['old', 'new']),
  chapterCount: z.number().int().nonnegative(),
  chapterVerseCounts: z.array(ChapterMetaSchema),
});
export type BookMeta = z.infer<typeof BookMetaSchema>;

/** L'index complet d'une traduction éclatée. */
export const SplitBibleIndexSchema = z.object({
  id: z.string().min(2).max(16),
  language: z.string().length(2),
  name: z.string().min(1),
  year: z.number().int().positive().optional(),
  books: z.array(BookMetaSchema).min(1),
});
export type SplitBibleIndex = z.infer<typeof SplitBibleIndexSchema>;

const CANON_ORDER: Record<string, number> = Object.fromEntries(
  BIBLE_BOOKS.map((book) => [book.id, book.orderIndex]),
);

/**
 * Valide un index brut et le normalise : ordre canonique, `chapterCount`
 * aligné sur les chapitres annoncés, 66 livres au plus.
 *
 * Un index incohérent (ordre mélangé, compteur qui ment) est corrigé plutôt que
 * rejeté : c'est un artefact généré, la structure canonique fait foi.
 */
export function parseSplitIndex(raw: unknown): SplitBibleIndex {
  const result = SplitBibleIndexSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid split Bible index: ${issues}`);
  }
  const books: BookMeta[] = result.data.books
    .map((book) => ({ ...book, chapterCount: book.chapterVerseCounts.length }))
    .sort((a, b) => (CANON_ORDER[a.id] ?? 999) - (CANON_ORDER[b.id] ?? 999));
  return {
    id: result.data.id,
    language: result.data.language,
    name: result.data.name,
    year: result.data.year,
    books,
  };
}

/** Nombre total de chapitres annoncés par un index. */
export function indexChapterCount(index: SplitBibleIndex): number {
  return index.books.reduce((total, book) => total + book.chapterVerseCounts.length, 0);
}

/** Nombre total de versets annoncés par un index. */
export function indexVerseCount(index: SplitBibleIndex): number {
  return index.books.reduce(
    (total, book) => total + book.chapterVerseCounts.reduce((sum, chapter) => sum + chapter.verses, 0),
    0,
  );
}

/** Métadonnées d'un livre, ou null. */
export function findBookMeta(index: SplitBibleIndex, bookId: string): BookMeta | null {
  return index.books.find((book) => book.id === bookId) ?? null;
}
