import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppearanceStore } from '@/store/appearance-store';
import type { BibleBookData, BibleChapterData } from '@/domains/bible/repository-local';
import { bibleBookName } from '@/lib/bible-book-name';
import { useChapterSemanticTags } from '@/hooks/useSemanticTags';
import ManuscriptView from './ManuscriptView';
import VerseActionBar from './VerseActionBar';

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
  const [selected, setSelected] = useState<{ bookId: string; chapter: number; verse: number; text: string } | null>(null);
  const { tags } = useChapterSemanticTags(selected?.bookId ?? null, selected?.chapter ?? null);
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
    setSelected(null);
  }, [initial, chapters.length, translationId]);

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
        const isSelectedChapter = selected?.bookId === book.id && selected.chapter === chapter.number;
        const index = (continuous ? range.start : initial) + offset;
        const showBook = !continuous || index === range.start || chapters[index - 1]?.book.id !== book.id;
        return <ManuscriptView key={`${book.id}:${chapter.number}`} embedded bookId={book.id}
          bookName={bibleBookName(book.id, i18n.resolvedLanguage || i18n.language, book.name)} showBookTitle={showBook}
          translationId={showBook ? translationId : undefined} chapter={chapter.number} verses={chapter.verses}
          tags={isSelectedChapter ? tags : null} selectedVerse={isSelectedChapter ? selected.verse : null}
          onSelectVerse={(verse) => setSelected({ bookId: book.id, chapter: chapter.number, verse, text: chapter.verses.find((item) => item.number === verse)?.text ?? '' })} />;
      })}
      <div ref={after} className="continuous-boundary">
        {continuous && range.end < chapters.length && <button type="button" className="continuous-more" onClick={loadNext}>{t('bible.nextPassages', 'Afficher la suite')}</button>}
      </div>
    </div>
    {!continuous && <nav className="chapter-pagination" aria-label={t('bible.readingMode', 'Défilement des chapitres')}>
      <button type="button" disabled={initial === 0} onClick={() => navigateChapter(initial - 1)}>{t('bible.previousChapter', 'Chapitre précédent')}</button>
      <button type="button" disabled={initial === chapters.length - 1} onClick={() => navigateChapter(initial + 1)}>{t('bible.nextChapter', 'Chapitre suivant')}</button>
    </nav>}
    {selected && <VerseActionBar bookId={selected.bookId} chapter={selected.chapter} verse={selected.verse} verseText={selected.text} translationId={translationId} />}
  </div>;
}
