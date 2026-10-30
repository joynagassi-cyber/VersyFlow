/**
 * family-scoring — le barème de points **local** des écrans Famille.
 *
 * D'où viennent ces nombres ?
 * ---------------------------
 * Ils sont repris **tels quels** du kit de design (`m9_famille_points_et_niveaux`) :
 * étape de parcours +10, révision FSRS +10, passage terminé +30, jour de série
 * +5, défi réussi +50, plafond quotidien 100 pour garder le jeu équitable.
 * Ce ne sont donc pas des valeurs inventées côté code : c'est le contrat
 * affiché à l'utilisateur, et il est calculé à partir de données réelles —
 * les enregistrements de mémorisation locaux et les défis de la famille.
 *
 * Ce module est PUR (aucun I/O, aucun React) pour être testable :
 * `tests/unit/services/family-scoring.test.ts`.
 */

export const FAMILY_POINTS = {
  /** Étape du parcours terminée. */
  step: 10,
  /** Révision FSRS terminée. */
  review: 10,
  /** Passage mémorisé en entier. */
  passage: 30,
  /** Par jour de série. */
  streakDay: 5,
  /** Défi d'équipe réussi. */
  challenge: 50,
} as const;

/** Plafond quotidien : au-delà, la journée ne rapporte plus (équité). */
export const DAILY_CAP = 100;

/** Paliers de niveau : chaque niveau demande 240 points de plus que le précédent. */
const TIER_SIZE = 240;

export interface LevelInfo {
  level: number;
  /** Points cumulés nécessaires pour atteindre le niveau courant. */
  floor: number;
  /** Points cumulés du palier suivant. */
  next: number;
  /** Points restants avant le palier suivant. */
  remaining: number;
}

/** Niveau atteint pour un total de points (niveau 1 = 0 point). */
export function levelFor(points: number): LevelInfo {
  const safe = Math.max(0, Math.floor(points));
  const level = Math.floor(safe / TIER_SIZE) + 1;
  const floor = (level - 1) * TIER_SIZE;
  const next = level * TIER_SIZE;
  return { level, floor, next, remaining: next - safe };
}

/**
 * Points gagnés pour un lot d'enregistrements de mémorisation.
 *
 * Un enregistrement `mastered` vaut un passage complet (+30) ; un
 * enregistrement en cours vaut une étape (+10). Les deux ne se cumulent pas
 * pour un même verset : on compte le meilleur des deux.
 */
export function pointsForRecords(
  records: Array<{ status?: string; mastered?: boolean }>,
): number {
  let total = 0;
  for (const record of records) {
    const mastered = record.mastered === true || record.status === 'mastered';
    total += mastered ? FAMILY_POINTS.passage : FAMILY_POINTS.step;
  }
  return total;
}

/** Points d'un défi : bonus fixe s'il est réussi, sinon proportionnel. */
export function pointsForChallenge(challenge: {
  status: 'active' | 'done';
  target: number;
  progress: Record<string, number>;
}, participant: string): number {
  if (challenge.status === 'done') return FAMILY_POINTS.challenge;
  const value = challenge.progress[participant] ?? 0;
  if (challenge.target <= 0) return 0;
  const ratio = Math.min(1, value / challenge.target);
  // Pro rata du bonus complet, plafonné à la moitié tant que le défi n'est pas
  // clos : 5/10 sur un objectif de 10 vaut donc 25, et 20/10 reste à 25.
  // (Un 20/10 non plafonné vaudrait 50, soit le bonus d'un défi terminé.)
  return Math.round(Math.min(FAMILY_POINTS.challenge / 2, FAMILY_POINTS.challenge * ratio));
}

/** Applique le plafond quotidien : renvoie les points réellement crédités. */
export function applyDailyCap(earned: number, alreadyToday = 0): number {
  return Math.max(0, Math.min(earned, DAILY_CAP - alreadyToday));
}
