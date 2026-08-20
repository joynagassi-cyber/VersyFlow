/**
 * Bible Domain — Zod Validation Schema
 *
 * Valide le schéma JSON des données Bible (LSG.json) à l'exécution.
 * Utilise Zod pour la validation runtime-safe.
 *
 * See: docs/21-bible-data-spec.md section 3. Validation du Schéma
 */

import { z } from 'zod';

// ============================================
// Schema d'un verset Biblique
// ============================================

export const BibleVerseSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1),
});

// ============================================
// Schema d'un chapitre Biblique
// ============================================

export const BibleChapterSchema = z.object({
  number: z.number().int().positive(),
  verses: z.array(BibleVerseSchema).nonempty(),
});

// ============================================
// Schema d'un livre Biblique
// ============================================

export const BibleBookSchema = z.object({
  id: z.string().min(2).max(8),
  name: z.record(z.string()),
  testament: z.enum(['old', 'new']),
  chapterCount: z.number().int().positive(),
  chapters: z.array(BibleChapterSchema).nonempty(),
});

// ============================================
// Schéma complet de la traduction Bible
// ============================================

export const BibleTranslationSchema = z.object({
  id: z.string().min(2).max(10),
  name: z.string().min(1),
  year: z.number().int().positive(),
  language: z.string().length(2),
  style: z.enum(['classique', 'moderne', 'paraphrase']),
  publicDomain: z.boolean(),
  author: z.string().min(1),
  books: z.array(BibleBookSchema).nonempty(),
});

// Type dérivé des schemas
export type BibleTranslation = z.infer<typeof BibleTranslationSchema>;
export type BibleBook = z.infer<typeof BibleBookSchema>;
export type BibleChapter = z.infer<typeof BibleChapterSchema>;
export type BibleVerse = z.infer<typeof BibleVerseSchema>;

// ============================================
// Fonction de validation
// ============================================

/**
 * Valide un objet de donnée Bible contre le schéma Zod.
 * Lance une erreur si la validation échoue.
 *
 * @param data - Les données à valider
 * @ Retour {BibleTranslation} les données validées
 */
export function validateBibleData(data: unknown): BibleTranslation {
  const result = BibleTranslationSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Validation Bible échouée: ${errors}`);
  }
  return result.data;
}

/**
 * Valide des données de chapitre spécifique.
 */
export function validateBookData(data: unknown): BibleBook {
  const result = BibleBookSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation livre échouée: ${result.error.issues.map((e: any) => e.message).join(', ')}`);
  }
  return result.data;
}
