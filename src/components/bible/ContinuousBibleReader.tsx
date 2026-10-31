import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppearanceStore } from '@/store/appearance-store';
import type { BibleBookData, BibleChapterData } from '@/domains/bible/repository-local';
import { bibleBookName } from '@/lib/bible-book-name';
import { useChapterSemanticTags } from '@/hooks/useSemanticTags';
import ManuscriptView from './ManuscriptView';
import VerseActionBar from './VerseActionBar';
import { toggleVerseInSelection, type VerseSelection } from '@/lib/verse-selection';

export interface ReaderChapter { book: BibleBookData; chapter: BibleChapterData }

/** The dataset is already canonically ordered by the repository. */
export function flattenBibleChapters(books: BibleBookData[]): ReaderChapter[] {
  return books.flatMap((book) => book.chapters.map((chapter) => ({ book, chapter })));
}

interface Props { books: BibleBookData[]; initialBookId: string; initialChapter: number; translationId: string }

/** A progressively extended manuscript, not a route change at chapter boundaries. */
export default function ContinuousBibleReader({ books, initialBookId, initialChapter, translationId }: Props) {
  const { t, i18n } = useTranslation();
  const continuous = useAppearanceStore((s) => s.bibleContinuous);
  const navigate = useNavigate();
  const location = useLocation();
  const chapters = useMemo(() => flattenBibleChapters(books), [books]);
  const initial = chapters.findIndex(({ book, chapter }) => book.id === initialBookId && chapter.number === initialChapter);
  const [range, setRange] = useState(() => ({ start: initial, end: Math.min(chapters.length, initial + 2) }));
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
    if (scroller && !pendingScroll.current) pendingScroll.current = { element: scroller, height: scroller.scrollHeight, top: scroller.scrollTop };
    setRange((current) => ({ ...current, start: Math.max(0, current.start - 1) }));
  }, [range.start]);
  const loadNext = useCallback(() => {
    setRange((current) => ({ ...current, end: Math.min(chapters.length, current.end + 1) }));
  }, [chapters.length]);

  useLayoutEffect(() => {
    setRange({ start: initial, end: Math.min(chapters.length, initial + 2) });
    setSelection(null);
  }, [initial, chapters.length, translationId]);

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
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        if (entry.target === before.current) loadPrevious();
        if (entry.target === after.current) loadNext();
      }
    }, { root: scrollRoot, rootMargin: '300px 0px' });
    if (before.current && range.start > 0) observer.observe(before.current);
    if (after.current && range.end < chapters.length) observer.observe(after.current);
    return () => observer.disconnect();
  }, [continuous, range.start, range.end, chapters.length, loadPrevious, loadNext]);

  const navigateChapter = (index: number) => {
    const target = chapters[index];
    if (!target) return;
    const path = location.pathname.startsWith('/bible/explorer/') ? 'explorer' : 'chapter';
    navigate(`/bible/${path}/${target.book.id}/${target.chapter.number}`);
    root.current?.closest<HTMLElement>('.app-canvas')?.scrollTo({ top: 0 });
  };

  if (initial < 0) return <p>{t('errors.verseNotFound', 'Verset non disponible dans cette traduction')}</p>;
  return <div className="continuous-reader" ref={root}>
    <div className="bible-card reading-card continuous-manuscript">
      <div ref={before} className="continuous-boundary">
        {continuous && range.start > 0 && <button type="button" className="continuous-more" onClick={loadPrevious}>{t('bible.previousPassages', 'Afficher les passages précédents')}</button>}
      </div>
      {chapters.slice(continuous ? range.start : initial, continuous ? range.end : initial + 1).map(({ book, chapter }, offset) => {
        const isSelectedChapter = selection?.bookId === book.id && selection.chapter === chapter.number;
        const index = (continuous ? range.start : initial) + offset;
        const showBook = !continuous || index === range.start || chapters[index - 1]?.book.id !== book.id;
        return <ManuscriptView key={`${book.id}:${chapter.number}`} embedded bookId={book.id}
          bookName={bibleBookName(book.id, i18n.resolvedLanguage || i18n.language, book.name)} showBookTitle={showBook}
          translationId={showBook ? translationId : undefined} chapter={chapter.number} verses={chapter.verses}
          tags={isSelectedChapter ? tags : null}
          selectedVerses={isSelectedChapter ? selection?.verses ?? [] : []}
          onToggleVerse={(verse) => toggleVerse(book.id, chapter.number, verse)} />;
      })}
      <div ref={after} className="continuous-boundary">
        {continuous && range.end < chapters.length && <button type="button" className="continuous-more" onClick={loadNext}>{t('bible.nextPassages', 'Afficher la suite')}</button>}
      </div>
    </div>
    {!continuous && <nav className="chapter-pagination" aria-label={t('bible.readingMode', 'Défilement des chapitres')}>
      <button type="button" disabled={initial === 0} onClick={() => navigateChapter(initial - 1)}>{t('bible.previousChapter', 'Chapitre précédent')}</button>
      <button type="button" disabled={initial === chapters.length - 1} onClick={() => navigateChapter(initial + 1)}>{t('bible.nextChapter', 'Chapitre suivant')}</button>
    </nav>}
    {selection && (
      <VerseActionBar
        bookId={selection.bookId}
        chapter={selection.chapter}
        verses={selection.verses}
        // Texte du verset de tête seulement : la barre n'en affiche qu'un
        // extrait, et concaténer dix versets écraserait la référence.
        verseText={chapters
          .find(({ book, chapter }) => book.id === selection.bookId && chapter.number === selection.chapter)
          ?.chapter.verses.find((item) => item.number === selection.verses[0])?.text ?? ''}
        translationId={translationId}
        onClearSelection={() => setSelection(null)}
      />
    )}
  </div>;
}
