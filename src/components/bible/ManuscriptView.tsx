/**
 * ManuscriptView — rendu « manuscrit » d'un chapitre.
 *
 * Un seul bloc de texte serif continu, pas une carte par verset. Chaque verset
 * garde son numéro en exposant, sauf le premier : la lettrine porte le numéro
 * de chapitre, et afficher « 1 » juste après elle donnerait deux nombres
 * concurrents au même endroit.
 *
 * TROIS RÈGLES D'ÉTAT, ET AUCUNE AUTRE
 * ------------------------------------
 * 1. Survol d'une pastille → rien. Rien ne doit dépendre du survol pour être
 *    compris : sur mobile il n'existe pas.
 * 2. **Sélection** → un soulignement fin pointillé, et rien d'autre. Pas de
 *    fond (il entrait en collision avec le surlignage), pas de gras, pas de
 *    changement de couleur du texte. Une simple pression sélectionne, une
 *    seconde désélectionne.
 * 3. **Surlignage** → un lavis léger et fin, qui court sous le texte entier,
 *    espaces compris. La teinte vient de la pastille choisie, pas d'une
 *    constante : le premier choix est la couleur d'accent active.
 *
 * La différence entre les deux se lit donc sans couleur : un trait sous le
 * texte pour « je suis en train de choisir », un lavis derrière le texte pour
 * « c'est décidé ». Lisible en niveaux de gris, et pour un daltonien.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatChapterCount } from '@/lib/chapter-count';
import type { BibleVerseData } from '@/domains/bible/repository-local';
import type { ChapterSemanticTags } from '@/hooks/useSemanticTags';
import { useHighlightStore, type HighlightState } from '@/store/highlight-store';
import VerseSemanticTags from '@/components/semantic/VerseSemanticTags';
import { useAppearanceStore } from '@/store/appearance-store';

interface ManuscriptViewProps {
  bookId: string;
  bookName?: string;
  translationId?: string;
  chapter: number;
  verses: BibleVerseData[];
  /** Chapter semantic tags (verse → concepts), already locale-resolved. */
  tags?: ChapterSemanticTags | null;
  /** Versets sélectionnés (multi-sélection : appui = ajoute, second appui = retire). */
  selectedVerses: number[];
  onToggleVerse: (verse: number) => void;
  /** Show per-verse concept chips in-flow for the selected verse (default true). */
  showSemanticTags?: boolean;
  embedded?: boolean;
  showBookTitle?: boolean;
}

export function ManuscriptView({
  bookId,
  bookName,
  translationId,
  chapter,
  verses,
  tags,
  selectedVerses,
  onToggleVerse,
  showSemanticTags = true,
  embedded = false,
  showBookTitle = true,
}: ManuscriptViewProps) {
  const { t, i18n } = useTranslation();
  const verseLayout = useAppearanceStore((s) => s.bibleVerseLayout);
  const showVerseNumbers = useAppearanceStore((s) => s.showVerseNumbers);

  const tagsByVerse = useMemo(
    () => new Map((tags?.entries ?? []).map((e) => [e.verse, e.concepts])),
    [tags],
  );

  // Les concepts s'affichent pour UN verset à la fois : celui qu'on vient de
  // toucher. En montrer une ligne par verset rendrait la sélection multiple
  // illisible.
  const focusVerse = selectedVerses.length === 1 ? selectedVerses[0] : null;
  const selectedConcepts = focusVerse != null ? tagsByVerse.get(focusVerse) ?? [] : [];
  const selectedIsUser = focusVerse != null
    ? (tags?.entries.find((e) => e.verse === focusVerse)?.source ?? null) === 'user'
    : false;

  const marks = useHighlightStore((s: HighlightState) => s.marks);
  const selectedSet = useMemo(() => new Set(selectedVerses), [selectedVerses]);

  if (verses.length === 0) {
    return (
      <p className="px-1 py-6 text-sm italic text-text-muted">
        {t('errors.verseNotFound', 'Verset non disponible dans cette traduction')}
      </p>
    );
  }

  return (
    <div className="mx-auto w-full">
      {/* Continuous manuscript text — .bible-card gets the premium
         translucent/blur surface over the image theme (globals.css). */}
      <article className={cn(embedded ? 'reading-chapter' : 'bible-card reading-card mx-auto')}>
        {/* Le numéro de chapitre n'apparaît plus ici : il est déjà le grand
            numéral posé en marge du texte. L'ancienne en-tête l'écrivait une
            seconde fois (« Chapitre 3 »), juste au-dessus du « 3 » — deux
            nombres concurrents pour une seule information. */}
        <div
          className={embedded ? 'reading-chapter-heading' : 'reading-card-heading'}
          // Un chapitre de continuation n'a pas de titre : il n'a donc pas
          // besoin du filet qui sépare une ouverture de ce qui précède.
          data-continuation={embedded && !showBookTitle ? 'true' : undefined}
        >
          <div className="reading-meta">
            {/* Le nom du livre n'apparaît qu'une fois : dans le titre quand il
                y en a un, dans la ligne de métadonnées sinon. Il figurait dans
                les deux, à deux lignes d'écart. */}
            {bookName && !showBookTitle && <span>{bookName}</span>}
            {translationId && <span className="reading-translation">{translationId.toUpperCase()}</span>}
          </div>
          {bookName && showBookTitle && <h2>{bookName}</h2>}
          <p>{formatChapterCount(t('bible.verseCount', { count: verses.length }), verses.length, i18n.resolvedLanguage || i18n.language)}</p>
        </div>

        <p className={cn('verse-flow mt-6 text-text-primary', verseLayout === 'blocks' && 'verse-flow-blocks')}>
          {/* Numéro de chapitre en grand, dans la marge du texte. Il ne se mêle
              pas à la première ligne : la lettrine flottante décalait le
              premier verset de deux lignes à chaque chapitre. */}
          <span className="chapter-numeral" aria-label={`${t('bible.chapter', 'Chapitre')} ${chapter}`}>
            {chapter}
          </span>
          {verses.map((verse, i) => {
            const isSelected = selectedSet.has(verse.number);
            const markColor = marks[`${bookId}:${chapter}:${verse.number}`];
            return (
              <span
                key={verse.number}
                className={cn(
                  'manuscript-verse',
                  isSelected && 'is-selected',
                  markColor != null && 'is-highlighted',
                  i > 0 && verseLayout === 'flow' && 'ml-2',
                )}
                // La couleur du lavis est lue par le CSS via cet attribut :
                // aucune teinte n'est écrite en JavaScript.
                data-hl={markColor ?? undefined}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${t('bible.selectVerseAria', { n: verse.number, defaultValue: `Sélectionner le verset ${verse.number}` })} : ${verse.text ?? ''}`}
                onClick={() => onToggleVerse(verse.number)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggleVerse(verse.number); }
                }}
              >
                {showVerseNumbers && verse.number !== 1 && (
                  <sup className="verse-flow-number" aria-hidden="true">{verse.number}</sup>
                )}
                {verse.text ? verse.text : (
                  <em className="text-sm text-text-muted not-italic">
                    {t('bible.emptyVerse', 'Verset vide dans cette traduction')}
                  </em>
                )}
                {' '}
              </span>
            );
          })}
        </p>

        {/* Semantic concepts for the selected verse, in-flow */}
        {showSemanticTags && focusVerse != null && selectedConcepts.length > 0 && (
          <div className="mt-5 border-t border-[color:var(--color-divider)] pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
              {t('semantic.concepts', 'Concepts')} · {t('bible.verse', 'Verset')} {focusVerse}
            </p>
            <VerseSemanticTags concepts={selectedConcepts} userSource={selectedIsUser} />
          </div>
        )}
      </article>
    </div>
  );
}

export default ManuscriptView;
