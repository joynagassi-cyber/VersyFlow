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
  number: z.number().int().positive().description('Numéro du verset (1-based)'),
  text: z.string().min(1).description('Texte du verset'),
});

// ============================================
// Schema d'un chapitre Biblique
// ============================================

export const BibleChapterSchema = z.object({
  number: z.number().int().positive().description('Numéro du chapitre (1-based)'),
  verses: z.array(BibleVerseSchema).nonempty().description('Tableau des versets'),
});

// ============================================
// Schema d'un livre Biblique
// ============================================

export const BibleBookSchema = z.object({
  id: z.string().min(2).max(8).description('Code standard du livre (ex: "gen", "exo")'),
  name: z.record(z.string()).description('Noms localisés du livre pour toutes les langues'),
  testament: z.enum(['old', 'new']).description('Testament : "old" ou "new"'),
  chapterCount: z.number().int().positive().description('Nombre total de chapitres'),
  chapters: z.array(BibleChapterSchema).nonempty().description('Tableau des chapitres'),
});

// ============================================
// Schéma complet de la traduction Bible
// ============================================

export const BibleTranslationSchema = z.object({
  id: z.string().min(2).max(10).description('Identifiant de la traduction (ex: "lsg")'),
  name: z.string().min(1).description('Nom complet de la traduction'),
  year: z.number().int().positive().description('Année de publication'),
  language: z.string().length(2).description('Code langue ISO 639-1'),
  style: z.enum(['classique', 'moderne', 'paraphrase']).description('Style de la traduction'),
  publicDomain: z.boolean().description('Statut du domaine public'),
  author: z.string().min(1().description('Nom du traducteur'),
  books: z.array(BibleBookSchema).nonempty().description('Tableau des 66 livres'),
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
    const errors = result.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
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
    throw new Error(`Validation livre échouée: ${result.errors.map(e => e.message).join(', ')}`);
  }
  return result.data;
}
