/**
 * Statut d'un verset dans l'atelier — une seule règle, testable sans DOM.
 *
 * Extraite de `app/memorization/workspace.tsx` (2026-11-19) parce qu'elle
 * décide de la pastille affichée sous la référence ET du ton du résultat :
 * « nouveau », « à revoir », « consolidation ». La laisser dans le fichier
 * d'écran rendait la règle impossible à vérifier autrement qu'en montant tout
 * l'atelier (services Bible, FSRS, store de réglages).
 *
 * Aucune dépendance : le module reçoit ce que l'écran avait déjà.
 */

export type WorkspaceStatusTone = 'new' | 'due' | 'consolidated';

/** Ce que la règle a besoin de connaître du record — pas le record entier. */
export interface WorkspaceStatusInput {
  status?: string | null;
}

export interface WorkspaceStatusContext {
  record: WorkspaceStatusInput | null | undefined;
  nextReviewAt: Date | null;
  /** Injecté pour être testable ; défaut = maintenant. */
  now?: number;
}

/**
 * Trois tons, dans cet ordre :
 *  1. aucun record → `new` (le verset n'a jamais été travaillé) ;
 *  2. échéance atteinte → `due` (même un verset « maîtrisé » qui revient) ;
 *  3. maîtrisé et pas encore échu → `consolidated` ;
 *  4. sinon → `due` (un verset en cours est toujours « à revoir »).
 */
export function workspaceStatusTone({
  record,
  nextReviewAt,
  now = Date.now(),
}: WorkspaceStatusContext): WorkspaceStatusTone {
  if (!record) return 'new';
  const due = nextReviewAt ? nextReviewAt.getTime() <= now : false;
  if (record.status === 'mastered' && !due) return 'consolidated';
  return 'due';
}
