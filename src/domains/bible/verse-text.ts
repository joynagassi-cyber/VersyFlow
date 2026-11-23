/**
 * Bible Domain — nettoyage du texte de verset à l'affichage.
 *
 * Le corpus Louis Segond 1910 vient d'un import USFM : certaines indications
 * de mise en page ont survécu sous forme de lettres isolées. Le lecteur les
 * affichait telles quelles, par exemple dans Luc 13,25 :
 *
 *   « j Quand le maître de la maison se sera levé etj*j aura fermé la porte »
 *
 * Trois marqueurs sont concernés, tous collés au texte :
 *
 *   - `j` seul, précédé d'une espace ou du début du verset, suivi d'une
 *     espace : c'est un saut de ligne du manuscrit source (un nouvel
 *     alinéa dans la péricope). On le remplace par une espace simple.
 *   - `j*` collé devant une majuscule (`mal,j*j à cause`) : c'est un retour à
 *     la ligne à l'intérieur d'un paragraphe.
 *   - `j*` collé après une ponctuation de fin (`Dieu.j*`) : c'est la fin d'un
 *     paragraphe ; la marque disparaît.
 *
 * Ce qui n'est JAMAIS touché : un `j` collé à des lettres des deux côtés.
 * C'est le « j » de « justement », « aujourd'hui », « Jésus ». Une première
 * version de cette règle avait supprimé 2 827 de ces lettres dans la Genèse
 * seule — un nettoyage trop large est bien pire que les marqueurs.
 *
 * Fonction pure, sans I/O : elle sert au script de réparation du corpus
 * (`scripts/bible/repair-lsg-text.mjs`) et, en dernier recours, à l'affichage.
 */

/** Lettres accentuées du français : un `j` adjacent à l'une d'elles est un mot. */
const LETTER = 'A-Za-zÀ-ÖØ-öø-ÿ';

/**
 * Un marqueur en début de verset : `j Heureux les pauvres en esprit`.
 * La condition est une ESPACE après le `j`, jamais une apostrophe : `j’ai`
 * est le pronom, et le supprimer donnait « ’ai placé mon arc » dans la
 * Genèse. C'est le second piège de ce nettoyage.
 */
const LEADING = new RegExp(`^j(?=[ \\t]{1,2})[ \\t]+`);

/**
 * Le retour à la ligne collé au mot précédent, sans ponctuation :
 * `il se sera levé etj*j aura fermé la porte`. C'est la forme la plus
 * fréquente (518 occurrences) et la plus facile à rater, parce que la marque
 * est soudée au mot : sans cette règle, on lit « etj aura ».
 */
const GLUED_BREAK = /j\*j/g;

/** Un marqueur après ponctuation et avant une majuscule : `mal,j*j à cause`. */
const MID_PARAGRAPH = new RegExp(`(?<=[.,;:!?»])\\s*\\*?j\\*(?=[${LETTER}])`, 'g');

/** Un `j` isolé entre deux espaces : `dit: j Laisse faire`. */
const ISOLATED = new RegExp(`(?<=\\s)j(?=\\s)(?![${LETTER}])`, 'g');

/** La fin d'un paragraphe : `sort de la bouche de Dieu.j*`. */
const PARAGRAPH_END = /j\*/g;

/**
 * Nettoie un verset. Idempotent : `cleanVerseText(cleanVerseText(x))` rend le
 * même résultat que `cleanVerseText(x)` — le script peut donc tourner deux
 * fois sans effet de bord, et `--check` reste fiable.
 */
export function cleanVerseText(raw: string): string {
  if (!raw) return raw;
  let text = raw;
  text = text.replace(LEADING, '');
  text = text.replace(GLUED_BREAK, ' ');
  text = text.replace(MID_PARAGRAPH, ' ');
  text = text.replace(ISOLATED, ' ');
  text = text.replace(PARAGRAPH_END, '');
  // Les marqueurs laissent parfois deux espaces ou une espace avant une
  // virgule : on remet une typographie propre.
  text = text.replace(/[ \t]{2,}/g, ' ');
  text = text.replace(/[ \t]+([,.;:!?])/g, '$1');
  return text.trim();
}

/**
 * Reste-t-il un marqueur ? Sert de garde : un corpus « réparé » qui contient
 * encore `j*` n'est pas réparé, et le test doit le dire.
 */
export function hasVerseMarkers(raw: string): boolean {
  const LETTERS = new RegExp(`(?<![${LETTER}])j\\*`);
  return LETTERS.test(raw) || new RegExp(`^j(?![${LETTER}*])\\s`).test(raw);
}
