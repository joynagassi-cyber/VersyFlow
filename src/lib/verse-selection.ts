/**
 * Sélection de versets — ce qui relève du calcul, pas du rendu.
 *
 * Isolé ici pour deux raisons : la barre d'actions n'a pas à connaître le
 * formatage des références, et une fonction pure se teste sans monter React.
 */

/**
 * Référence compacte d'une sélection : `Genèse 1:3`, `Genèse 1:3-5` pour une
 * plage continue, `Genèse 1:3.5.9` pour des versets disjoints.
 *
 * Une énumération à virgules (`1, 2, 3, 4…`) débordait de la pilule de la
 * barre dès six versets ; les points tiennent dans la moitié de la largeur.
 */
export function formatSelectionReference(
  bookName: string,
  chapter: number,
  verses: number[],
): string {
  if (verses.length === 0) return `${bookName} ${chapter}`;
  const sorted = [...verses].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const continuous = last - first === sorted.length - 1;
  if (sorted.length === 1) return `${bookName} ${chapter}:${first}`;
  if (continuous) return `${bookName} ${chapter}:${first}-${last}`;
  return `${bookName} ${chapter}:${sorted.join('.')}`;
}

/**
 * Applique un appui à une sélection. Même verset deux fois = il sort.
 *
 * La sélection est bornée à un seul chapitre : on surligne un passage, pas un
 * intervalle canonique. Toucher un verset d'un autre chapitre repart donc de
 * zéro plutôt que de fabriquer une sélection incohérente.
 */
export interface VerseSelection {
  bookId: string;
  chapter: number;
  verses: number[];
}

export function toggleVerseInSelection(
  current: VerseSelection | null,
  bookId: string,
  chapter: number,
  verse: number,
): VerseSelection | null {
  if (!current || current.bookId !== bookId || current.chapter !== chapter) {
    return { bookId, chapter, verses: [verse] };
  }
  const verses = current.verses.includes(verse)
    ? current.verses.filter((n) => n !== verse)
    : [...current.verses, verse].sort((a, b) => a - b);
  return verses.length === 0 ? null : { ...current, verses };
}
