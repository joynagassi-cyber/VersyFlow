/**
 * Passages proposés quand on démarre une mémorisation sans avoir choisi de
 * verset.
 *
 * Pourquoi cette liste existe : les points d'entrée « Mémoriser » (accueil,
 * barre d'onglets mobile, rail de bureau, menu) ouvraient `/memorization/session`
 * **sans coordonnées**, et l'écran répondait « verset non disponible » — un
 * cul-de-sac. Un écran de choix a besoin de matière : ces dix passages sont des
 * textes courts, connus, et **présents dans la LSG** (identifiants de livres
 * vérifiés sur `data/bible/lsg.json`).
 *
 * Les libellés sont des clés i18n (`memorize.starters.<id>`) avec la référence
 * française en repli, pour que l'écran reste lisible dans les 44 langues.
 */
export interface StarterPassage {
  /** Identifiant de livre du jeu de données (`joh`, `psa`, `phil`…). */
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  /** Clé i18n du titre affiché. */
  labelKey: string;
  /** Repli lisible : la référence, identique dans toutes les langues. */
  reference: string;
}

export const STARTER_PASSAGES: StarterPassage[] = [
  { bookId: 'joh', chapter: 3, verseStart: 16, verseEnd: 16, labelKey: 'memorize.starters.john316', reference: 'Jean 3:16' },
  { bookId: 'psa', chapter: 23, verseStart: 1, verseEnd: 6, labelKey: 'memorize.starters.psalm23', reference: 'Psaume 23:1-6' },
  { bookId: 'phil', chapter: 4, verseStart: 13, verseEnd: 13, labelKey: 'memorize.starters.phil413', reference: 'Philippiens 4:13' },
  { bookId: 'rom', chapter: 8, verseStart: 28, verseEnd: 28, labelKey: 'memorize.starters.rom828', reference: 'Romains 8:28' },
  { bookId: 'isa', chapter: 41, verseStart: 10, verseEnd: 10, labelKey: 'memorize.starters.isa4110', reference: 'Ésaïe 41:10' },
  { bookId: 'mat', chapter: 11, verseStart: 28, verseEnd: 30, labelKey: 'memorize.starters.mat1128', reference: 'Matthieu 11:28-30' },
  { bookId: 'prov', chapter: 3, verseStart: 5, verseEnd: 6, labelKey: 'memorize.starters.pro35', reference: 'Proverbes 3:5-6' },
  { bookId: 'jos', chapter: 1, verseStart: 9, verseEnd: 9, labelKey: 'memorize.starters.josh19', reference: 'Josué 1:9' },
  { bookId: 'gal', chapter: 5, verseStart: 22, verseEnd: 23, labelKey: 'memorize.starters.gal522', reference: 'Galates 5:22-23' },
  { bookId: 'psa', chapter: 91, verseStart: 1, verseEnd: 2, labelKey: 'memorize.starters.psalm91', reference: 'Psaume 91:1-2' },
];

/** Construit la query string d'une session pour un passage donné. */
export function passageQuery(passage: StarterPassage, translationId?: string): string {
  const params = new URLSearchParams({
    bookId: passage.bookId,
    chapter: String(passage.chapter),
    verseStart: String(passage.verseStart),
    verseEnd: String(passage.verseEnd),
  });
  if (translationId) params.set('translationId', translationId);
  return params.toString();
}
