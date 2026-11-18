/**
 * Barre d'onglets — ce qu'on y met, dans quel ordre, avec quels réglages.
 *
 * Auparavant, la barre ne connaissait que quatre pages et un interrupteur
 * binaire par page : « affiché / masqué ». Impossible d'y épingler une
 * fonction qu'on utilise tous les jours (réviser, chercher, la famille), ni
 * de choisir l'ordre, ni d'alléger les libellés.
 *
 * Ici : un catalogue d'entrées épinglables, deux entrées verrouillées
 * (Accueil et Réglages — sans elles, on peut se retrouver sans porte de
 * sortie), un plafond de cinq, et des opérations **pures** que l'écran de
 * réglages comme la barre elle-même consomment. Aucun état ici : les
 * fonctions reçoivent une liste et rendent une nouvelle liste.
 */

export interface BottomBarEntry {
  id: string;
  path: string;
  labelKey: string;
  label: string;
  descriptionKey: string;
  description: string;
  /** Toujours présent : ni désactivable, ni supprimable. */
  locked?: boolean;
}

/** Plafond : au-delà de cinq, les cibles passent sous 44 px sur 390 px. */
export const BOTTOM_BAR_MAX = 5;

/** Plancher : Accueil + Réglages restent, quoi qu'il arrive. */
export const BOTTOM_BAR_MIN = 2;

export const BOTTOM_BAR_ENTRIES: readonly BottomBarEntry[] = [
  {
    id: 'home',
    path: '/tabs/home',
    labelKey: 'common.navHome',
    label: 'Accueil',
    descriptionKey: 'navBar.homeDesc',
    description: 'Votre tableau de bord : verset du jour, série, révisions.',
    locked: true,
  },
  {
    id: 'explore',
    path: '/tabs/explore',
    labelKey: 'common.navBible',
    label: 'Bible',
    descriptionKey: 'navBar.bibleDesc',
    description: 'Lire la Bible : livres, chapitres et traductions.',
  },
  {
    id: 'memorize',
    path: '/memorization/session',
    labelKey: 'nav.memorize',
    label: 'Mémoriser',
    descriptionKey: 'navBar.memorizeDesc',
    description: 'Démarrer une session de mémorisation guidée.',
  },
  {
    id: 'review',
    path: '/review/queue',
    labelKey: 'nav.review',
    label: 'Réviser',
    descriptionKey: 'navBar.reviewDesc',
    description: 'Les versets à revoir aujourd’hui, dans l’ordre FSRS.',
  },
  {
    id: 'progress',
    path: '/tabs/progress',
    labelKey: 'common.navStats',
    label: 'Stats',
    descriptionKey: 'navBar.progressDesc',
    description: 'Série, maîtrise, courbes de rétention.',
  },
  {
    id: 'collections',
    path: '/collections',
    labelKey: 'nav.collections',
    label: 'Collections',
    descriptionKey: 'navBar.collectionsDesc',
    description: 'Regrouper vos versets par thème ou par projet.',
  },
  {
    id: 'search',
    path: '/search',
    labelKey: 'nav.search',
    label: 'Recherche',
    descriptionKey: 'navBar.searchDesc',
    description: 'Chercher un mot, une référence, un passage.',
  },
  {
    id: 'family',
    path: '/family/home',
    labelKey: 'nav.family',
    label: 'Famille',
    descriptionKey: 'navBar.familyDesc',
    description: 'Défis et sessions partagés avec vos proches.',
  },
  {
    id: 'notifications',
    path: '/notifications',
    labelKey: 'nav.notifications',
    label: 'Notifications',
    descriptionKey: 'navBar.notificationsDesc',
    description: 'Rappels, jalons et activité de la famille.',
  },
  {
    id: 'settings',
    path: '/tabs/settings',
    labelKey: 'common.navSettings',
    label: 'Réglages',
    descriptionKey: 'navBar.settingsDesc',
    description: 'Compte, apparence, notifications et données.',
    locked: true,
  },
];

export const DEFAULT_BAR: readonly string[] = [
  'home',
  'explore',
  'memorize',
  'progress',
  'settings',
];

const BY_ID = new Map(BOTTOM_BAR_ENTRIES.map((entry) => [entry.id, entry]));

export function isKnownEntry(id: string): boolean {
  return BY_ID.has(id);
}

export function entryById(id: string): BottomBarEntry | undefined {
  return BY_ID.get(id);
}

export function isLocked(id: string): boolean {
  return BY_ID.get(id)?.locked === true;
}

/** Identifiants des entrées verrouillées, dans l'ordre du catalogue. */
export const LOCKED_IDS: readonly string[] = BOTTOM_BAR_ENTRIES.filter((e) => e.locked).map((e) => e.id);

/** Les entrées d'une liste, dans l'ordre, sans les inconnues. */
export function resolveEntries(ids: readonly string[]): BottomBarEntry[] {
  return ids.flatMap((id) => {
    const entry = BY_ID.get(id);
    return entry ? [entry] : [];
  });
}

/**
 * Ramène une liste quelconque à un état valide : doublons retirés, entrées
 * inconnues ignorées, verrouillées réinsérées (à leur place d'origine si
 * possible), plafond respecté, plancher garanti.
 */
export function normalizeBar(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const id of ids) {
    if (!BY_ID.has(id) || seen.has(id)) continue;
    seen.add(id);
    cleaned.push(id);
  }

  // Les verrouillées manquantes reviennent à la fin, dans l'ordre du catalogue.
  for (const locked of LOCKED_IDS) {
    if (!seen.has(locked)) {
      cleaned.push(locked);
      seen.add(locked);
    }
  }

  // Plafond : on retire d'abord les non-verrouillées les plus à droite.
  while (cleaned.length > BOTTOM_BAR_MAX) {
    const victim = [...cleaned].reverse().find((id) => !isLocked(id));
    if (!victim) break;
    cleaned.splice(cleaned.indexOf(victim), 1);
  }

  return cleaned;
}

/** Ajoute une entrée si la place le permet. Renvoie la liste inchangée sinon. */
export function enableEntry(ids: readonly string[], id: string): string[] {
  const current = normalizeBar(ids);
  if (!BY_ID.has(id) || current.includes(id)) return current;
  if (current.length >= BOTTOM_BAR_MAX) return current;
  // Avant les verrouillées : la barre garde toujours Réglages en dernier.
  const settingsIndex = current.indexOf('settings');
  if (settingsIndex === -1) return [...current, id];
  return [...current.slice(0, settingsIndex), id, ...current.slice(settingsIndex)];
}

/** Retire une entrée, sauf si elle est verrouillée. */
export function disableEntry(ids: readonly string[], id: string): string[] {
  const current = normalizeBar(ids);
  if (isLocked(id)) return current;
  return current.filter((entry) => entry !== id);
}

export function canEnable(ids: readonly string[]): boolean {
  return normalizeBar(ids).length < BOTTOM_BAR_MAX;
}

/** Déplace une entrée d'un cran (-1 vers la gauche, +1 vers la droite). */
export function moveEntry(ids: readonly string[], id: string, delta: number): string[] {
  const current = normalizeBar(ids);
  const from = current.indexOf(id);
  if (from === -1) return current;
  const to = Math.min(current.length - 1, Math.max(0, from + delta));
  if (to === from) return current;
  const next = [...current];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}

/** Dépose une entrée à une position précise (glisser-déposer). */
export function moveEntryTo(ids: readonly string[], id: string, index: number): string[] {
  const current = normalizeBar(ids);
  const from = current.indexOf(id);
  if (from === -1) return current;
  const bounded = Math.min(current.length - 1, Math.max(0, Math.floor(index)));
  if (bounded === from) return current;
  const next = [...current];
  next.splice(from, 1);
  next.splice(bounded, 0, id);
  return next;
}
