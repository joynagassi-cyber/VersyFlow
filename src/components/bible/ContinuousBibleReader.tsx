/**
 * ContinuousBibleReader — lecture d'un chapitre, étendue aux suivants.
 *
 * Le lecteur ne charge que ce qu'il affiche : le composant reçoit la
 * **structure** (index de la traduction) et un accès paresseux aux chapitres
 * (`getChapter`). Un chapitre est demandé quand il entre dans la fenêtre de
 * lecture, puis gardé en mémoire pour la session.
 *
 * Le défilement continu n'est pas un changement de route : les chapitres
 * s'ajoutent à la suite du manuscrit, sans saut de page ni perte de sélection.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppearanceStore } from '@/store/appearance-store';
import type { BibleChapterData } from '@/domains/bible/repository-local';
import type { SplitBibleIndex } from '@/domains/bible/split-index';
import { bibleBookName } from '@/lib/bible-book-name';
import { useChapterSemanticTags } from '@/hooks/useSemanticTags';
import ManuscriptView from './ManuscriptView';
import { VerseTextSkeleton } from '@/components/ui/Skeleton';
import VerseActionBar from './VerseActionBar';
import { toggleVerseInSelection, type VerseSelection } from '@/lib/verse-selection';

/** Une position de lecture : un chapitre d'un livre, sans son texte. */
export interface ReaderChapterRef {
  bookId: string;
  chapter: number;
}

/** La suite ordonnée des chapitres d'une traduction (ordre canonique). */
export function flattenChapters(index: SplitBibleIndex): ReaderChapterRef[] {
  return index.books.flatMap((book) =>
    book.chapterVerseCounts.map((chapter) => ({ bookId: book.id, chapter: chapter.number })),
  );
}

interface Props {
  index: SplitBibleIndex;
  initialBookId: string;
  initialChapter: number;
  translationId: string;
  getChapter: (bookId: string, chapterNumber: number) => Promise<BibleChapterData | null>;
}

/** Nombre de chapitres lus d'avance, au-delà de la fenêtre visible. */
const PREFETCH = 2;

/** Un manuscrit qui s'étend au fil du défilement, pas une route par chapitre. */
export default function ContinuousBibleReader({
  index,
  initialBookId,
  initialChapter,
  translationId,
  getChapter,
}: Props) {
  const { t, i18n } = useTranslation();
  const continuous = useAppearanceStore((s) => s.bibleContinuous);
  const navigate = useNavigate();
  const chapters = useMemo(() => flattenChapters(index), [index]);
  const initial = chapters.findIndex(
    ({ bookId, chapter }) => bookId === initialBookId && chapter === initialChapter,
  );
  const [range, setRange] = useState(() => ({
    start: Math.max(0, initial),
    end: Math.min(chapters.length, Math.max(0, initial) + 2),
  }));

  /** Texte des chapitres déjà lus, par `bookId:chapter`. */
  const [loaded, setLoaded] = useState<Record<string, BibleChapterData | null>>({});

  /**
   * Sélection MULTIPLE, bornée à un seul chapitre.
   *
   * Une sélection qui traverserait les chapitres rendrait la barre d'actions
   * ambiguë (« surligner 12 versets répartis sur 3 chapitres, dans quelle
   * couleur ? ») pour un bénéfice nul : on surligne un passage, pas un
   * intervalle canonique. Changer de chapitre vide donc la sélection — mais
   * seulement si les versets choisis n'appartiennent pas au nouveau chapitre.
   */
  const [selection, setSelection] = useState<VerseSelection | null>(null);
  const { tags } = useChapterSemanticTags(selection?.bookId ?? null, selection?.chapter ?? null);
  const root = useRef<HTMLDivElement>(null);
  const before = useRef<HTMLDivElement>(null);
  const after = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef<{ element: HTMLElement; height: number; top: number } | null>(null);

  const loadPrevious = useCallback(() => {
    if (range.start <= 0) return;
    const scroller = root.current?.closest<HTMLElement>('.app-canvas');
    if (scroller && !pendingScroll.current) {
      pendingScroll.current = { element: scroller, height: scroller.scrollHeight, top: scroller.scrollTop };
    }
    setRange((current) => ({ ...current, start: Math.max(0, current.start - 1) }));
  }, [range.start]);

  const loadNext = useCallback(() => {
    setRange((current) => ({ ...current, end: Math.min(chapters.length, current.end + 1) }));
  }, [chapters.length]);

  useLayoutEffect(() => {
    setRange({
      start: Math.max(0, initial),
      end: Math.min(chapters.length, Math.max(0, initial) + 2),
    });
    setSelection(null);
  }, [initial, chapters.length, translationId]);

  // Charge les chapitres de la fenêtre, plus quelques-uns d'avance.
  useEffect(() => {
    let cancelled = false;
    const from = continuous ? range.start : initial;
    const to = continuous ? Math.min(chapters.length, range.end + PREFETCH) : initial + 1;
    for (let i = Math.max(0, from); i < to; i += 1) {
      const ref = chapters[i];
      if (!ref) continue;
      const key = `${ref.bookId}:${ref.chapter}`;
      if (key in loaded) continue;
      void getChapter(ref.bookId, ref.chapter).then((data) => {
        if (cancelled) return;
        setLoaded((current) => (key in current ? current : { ...current, [key]: data }));
      });
    }
    return () => {
      cancelled = true;
    };
    // `loaded` est volontairement hors dépendances : le test d'existence se
    // fait au moment de la boucle, et l'ajouter relancerait l'effet à chaque
    // chapitre arrivé (rafale de requêtes). Le plugin `react-hooks` n'est pas
    // activé dans ce dépôt : on documente la raison au lieu d'une directive
    // qui ne correspond à aucune règle chargée.
  }, [continuous, range.start, range.end, initial, chapters, getChapter, translationId]);

  /** Appui = ajoute. Second appui sur le même verset = retire. */
  const toggleVerse = useCallback((bookId: string, chapter: number, verse: number) => {
    setSelection((current) => toggleVerseInSelection(current, bookId, chapter, verse));
  }, []);

  useLayoutEffect(() => {
    const pending = pendingScroll.current;
    if (pending) {
      pending.element.scrollTop = pending.top + pending.element.scrollHeight - pending.height;
      pendingScroll.current = null;
    }
  }, [range.start]);

  useLayoutEffect(() => {
    const scrollRoot = root.current?.closest<HTMLElement>('.app-canvas');
    if (!continuous || !scrollRoot || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.target === before.current) loadPrevious();
          if (entry.target === after.current) loadNext();
        }
      },
      { root: scrollRoot, rootMargin: '300px 0px' },
    );
    if (before.current && range.start > 0) observer.observe(before.current);
    if (after.current && range.end < chapters.length) observer.observe(after.current);
    return () => observer.disconnect();
  }, [continuous, range.start, range.end, chapters.length, loadPrevious, loadNext]);

  const navigateChapter = (index2: number) => {
    const target = chapters[index2];
    if (!target) return;
    // Une seule hiérarchie d'URL Bible : le chapitre est toujours adressable
    // par l'explorateur (voir `BibleLegacyRedirect` pour les anciens chemins).
    navigate(`/bible/explorer/${target.bookId}/${target.chapter}`);
    root.current?.closest<HTMLElement>('.app-canvas')?.scrollTo({ top: 0 });
  };

  if (initial < 0) {
    return <p>{t('errors.verseNotFound', 'Verset non disponible dans cette traduction')}</p>;
  }

  const visible = chapters
    .slice(continuous ? range.start : initial, continuous ? range.end : initial + 1)
    .map((ref, offset) => ({
      ref,
      index: (continuous ? range.start : initial) + offset,
      data: loaded[`${ref.bookId}:${ref.chapter}`] ?? null,
    }));

  const selectedData =
    selection == null
      ? null
      : loaded[`${selection.bookId}:${selection.chapter}`] ?? null;

  return (
    <div className="continuous-reader" ref={root}>
      <div className="bible-card reading-card continuous-manuscript">
        <div ref={before} className="continuous-boundary">
          {continuous && range.start > 0 && (
            <button type="button" className="continuous-more" onClick={loadPrevious}>
              {t('bible.previousPassages', 'Afficher les passages précédents')}
            </button>
          )}
        </div>
        {visible.map(({ ref, index: position, data }) => {
          const isSelectedChapter =
            selection?.bookId === ref.bookId && selection.chapter === ref.chapter;
          const showBook =
            !continuous ||
            position === range.start ||
            chapters[position - 1]?.bookId !== ref.bookId;
          // `undefined` = en cours de lecture, `null` = chapitre absent de la
          // traduction. Les deux ne disent pas la même chose : un squelette qui
          // ne finit jamais est un mensonge.
          if (data === null) {
            return (
              <p
                key={`${ref.bookId}:${ref.chapter}`}
                className="manuscript-empty"
                role="status"
              >
                {t('bible.chapterNotInTranslation', 'Ce chapitre n’est pas présent dans cette traduction.')}
              </p>
            );
          }
          if (data === undefined) {
            // Deux barres muettes ne réservaient pas la place d'un chapitre :
            // le texte arrivait, la page sautait. `VerseTextSkeleton` reprend
            // la mesure, l'interligne et le nombre de paragraphes du vrai
            // texte, et porte son libellé une seule fois.
            return (
              <VerseTextSkeleton
                key={`${ref.bookId}:${ref.chapter}`}
                label={t('bible.chapterLoading', 'Chargement du chapitre…')}
                paragraphs={3}
              />
            );
          }
          const meta = index.books.find((book) => book.id === ref.bookId);
          return (
            <ManuscriptView
              key={`${ref.bookId}:${ref.chapter}`}
              embedded
              bookId={ref.bookId}
              bookName={bibleBookName(
                ref.bookId,
                i18n.resolvedLanguage || i18n.language,
                meta?.name,
              )}
              showBookTitle={showBook}
              translationId={showBook ? translationId : undefined}
              chapter={ref.chapter}
              verses={data.verses}
              tags={isSelectedChapter ? tags : null}
              selectedVerses={isSelectedChapter ? selection?.verses ?? [] : []}
              onToggleVerse={(verse) => toggleVerse(ref.bookId, ref.chapter, verse)}
            />
          );
        })}
        <div ref={after} className="continuous-boundary">
          {continuous && range.end < chapters.length && (
            <button type="button" className="continuous-more" onClick={loadNext}>
              {t('bible.nextPassages', 'Afficher la suite')}
            </button>
          )}
        </div>
      </div>
      {!continuous && (
        <nav
          className="chapter-pagination"
          aria-label={t('bible.readingMode', 'Défilement des chapitres')}
        >
          <button type="button" disabled={initial === 0} onClick={() => navigateChapter(initial - 1)}>
            {t('bible.previousChapter', 'Chapitre précédent')}
          </button>
          <button
            type="button"
            disabled={initial === chapters.length - 1}
            onClick={() => navigateChapter(initial + 1)}
          >
            {t('bible.nextChapter', 'Chapitre suivant')}
          </button>
        </nav>
      )}
      {selection && (
        <VerseActionBar
          bookId={selection.bookId}
          chapter={selection.chapter}
          verses={selection.verses}
          // Texte du verset de tête seulement : la barre n'en affiche qu'un
          // extrait, et concaténer dix versets écraserait la référence.
          verseText={
            selectedData?.verses.find((item) => item.number === selection.verses[0])?.text ?? ''
          }
          translationId={translationId}
          onClearSelection={() => setSelection(null)}
        />
      )}
    </div>
  );
}
