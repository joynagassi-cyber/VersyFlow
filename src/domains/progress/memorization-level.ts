/**
 * Niveau de mémorisation — une échelle nommée, dérivée d'un seul fait mesurable.
 *
 * Le niveau n'est pas une décoration : il se calcule à partir du nombre de
 * versets réellement mémorisés (`getAllMemorized()`), il est monotone (on ne
 * redescend pas quand un verset devient « à réviser ») et il annonce toujours
 * la marche suivante. Des paliers nommés plutôt qu'un pourcentage abstrait :
 * « Racine, 30 versets, prochain palier à 60 » se retient, « 47 % » non.
 *
 * Paliers choisis d'après la pratique de mémorisation à long terme : les
 * premiers versets sont les plus coûteux, les suivants s'ajoutent à un rythme
 * qui s'accélère.
 */

export interface MemorizationLevel {
  /** Identifiant stable, utilisé comme clé i18n (`levels.<id>`). */
  id: string;
  /** Nom affichable de repli, si la traduction manque. */
  label: string;
  /** Nombre de versets à partir duquel le palier est atteint. */
  min: number;
  /** Versets nécessaires pour passer au palier suivant (`null` = dernier). */
  nextAt: number | null;
}

export const MEMORIZATION_LEVELS: readonly MemorizationLevel[] = [
  { id: 'graine', label: 'Graine', min: 0, nextAt: 5 },
  { id: 'pousse', label: 'Pousse', min: 5, nextAt: 15 },
  { id: 'racine', label: 'Racine', min: 15, nextAt: 30 },
  { id: 'branche', label: 'Branche', min: 30, nextAt: 60 },
  { id: 'arbre', label: 'Arbre', min: 60, nextAt: 120 },
  { id: 'cedre', label: 'Cèdre', min: 120, nextAt: null },
];

export interface MemorizationProgress {
  level: MemorizationLevel;
  /** Palier suivant, `null` au sommet. */
  next: MemorizationLevel | null;
  /** Versets déjà mémorisés (valeur bornée à ≥ 0). */
  total: number;
  /** Versets restants avant le palier suivant (`null` au sommet). */
  remaining: number | null;
  /** Avancement dans le palier courant, de 0 à 1 (`null` au sommet). */
  ratio: number | null;
}

/** Palier atteint pour `total` versets. Pure et totale. */
export function levelFor(total: number): MemorizationLevel {
  const safe = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  let current = MEMORIZATION_LEVELS[0];
  for (const level of MEMORIZATION_LEVELS) {
    if (safe >= level.min) current = level;
  }
  return current;
}

/** Progression complète : palier, suivant, reste et ratio. */
export function memorizationProgress(total: number): MemorizationProgress {
  const safe = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const level = levelFor(safe);
  if (level.nextAt === null) {
    return { level, next: null, total: safe, remaining: null, ratio: null };
  }
  const next = MEMORIZATION_LEVELS.find((l) => l.min === level.nextAt) ?? null;
  const span = level.nextAt - level.min;
  const done = safe - level.min;
  return {
    level,
    next,
    total: safe,
    remaining: Math.max(0, level.nextAt - safe),
    ratio: span > 0 ? Math.min(1, Math.max(0, done / span)) : 0,
  };
}
