/**
 * Bible Explorer Screen — browse books → chapters → verses
 * Tailwind + i18n + Lucide + FullScreenPage.
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ChevronRight,
  BookOpen,
  Cross,
  BrainCircuit,
  X,
} from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BIBLE_BOOKS } from '@/domains/bible/entities';
import { loadTranslationBooks } from '@/services/bible-text-service';

type ViewMode = 'books' | 'chapters' | 'verses';

export default function BibleExplorerScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('books');
  const [query, setQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const lang = (i18n.language ?? 'fr') as string;
  const selectedBook = BIBLE_BOOKS.find((b) => b.id === selectedBookId) || null;

  const verses = useMemo(
    () =>
      selectedBook && selectedChapter
        ? Array.from(
            { length: 30 },
            (_, i) => i + 1,
          )
        : [],
    [selectedBook, selectedChapter],
  );

  // Attempt to load real verse text (graceful degradation)
  const [verseTexts, setVerseTexts] = useState<Record<number, string>>({});
  useEffect(() => {
    let cancelled = false;
    if (!selectedBook || !selectedChapter) {
      setVerseTexts({});
      return;
    }
    loadTranslationBooks().then((booksData) => {
      if (cancelled || !booksData) return;
      const book = booksData.find((b) => b.id === selectedBookId);
      const chapter = book?.chapters.find((c) => c.number === selectedChapter);
      const map: Record<number, string> = {};
      chapter?.verses.forEach((v) => {
        map[v.number] = v.text;
      });
      if (!cancelled) setVerseTexts(map);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedBook, selectedChapter]);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BIBLE_BOOKS;
    return BIBLE_BOOKS.filter((b) => {
      const names = [b.name.fr, b.name.en, b.id];
      return names.some((n) => n?.toLowerCase().includes(q));
    });
  }, [query]);

  const oldTestament = filteredBooks.filter((b) => b.testament === 'old');
  const newTestament = filteredBooks.filter((b) => b.testament === 'new');

  const openBook = (id: string) => {
    setSelectedBookId(id);
    setViewMode('chapters');
  };

  const openChapter = (chapter: number) => {
    setSelectedChapter(chapter);
    setViewMode('verses');
  };

  const goBack = () => {
    if (viewMode === 'verses') {
      setSelectedChapter(null);
      setViewMode('chapters');
    } else {
      setSelectedBookId(null);
      setViewMode('books');
    }
  };

  const memorize = (reference: string, text?: string) => {
    const params = new URLSearchParams();
    params.set('reference', reference);
    if (text) params.set('text', text);
    navigate(`/memorization/session?${params.toString()}`);
  };

  const title =
    viewMode === 'books'
      ? t('bible.explorer', 'Explorer la Bible')
      : viewMode === 'chapters' && selectedBook
        ? selectedBook.name[lang] || selectedBook.name.fr
        : viewMode === 'verses' && selectedBook && selectedChapter
          ? `${selectedBook.name[lang] || selectedBook.name.fr} ${selectedChapter}`
          : t('bible.explorer', 'Bible');

  return (
    <FullScreenPage
      title={title}
      subtitle={
        viewMode === 'chapters' && selectedBook
          ? t('bible.chapterCount', { count: selectedBook.chapterCount })
          : viewMode === 'verses' && selectedChapter
            ? t('bible.chapter', 'Chapitre') + ` ${selectedChapter}`
            : undefined
      }
      showBack={viewMode !== 'books'}
      backPath="/tabs/explore"
      right={
        viewMode !== 'books' ? (
          <button onClick={goBack} className="text-sm font-semibold text-primary">
            {t('common.back', 'Retour')}
          </button>
        ) : undefined
      }
    >
      {/* Search */}
      {viewMode === 'books' && (
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder={t('bible.search', 'Rechercher un livre...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-9"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Books */}
      {viewMode === 'books' && (
        <>
          {[
            {
              key: 'old',
              label: t('bible.oldTestament', 'Ancien Testament'),
              list: oldTestament,
              icon: <BookOpen size={16} className="text-primary" />,
              iconBg: 'bg-surface-tint',
            },
            {
              key: 'new',
              label: t('bible.newTestament', 'Nouveau Testament'),
              list: newTestament,
              icon: <Cross size={16} className="text-white" />,
              iconBg: 'bg-success',
            },
          ].map((section) =>
            section.list.length === 0 ? null : (
              <section key={section.key} className="mb-6">
                <div className="mb-3 flex items-center gap-3 px-1">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      section.iconBg,
                    )}
                  >
                    {section.icon}
                  </span>
                  <h2 className="flex-1 text-base font-bold text-text-primary">
                    {section.label}
                  </h2>
                  <span className="text-sm text-text-muted">
                    {section.list.length} {t('bible.book', 'livres')}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {section.list.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => openBook(book.id)}
                      className="flex items-center justify-between rounded-xl bg-surface p-4 text-left shadow-sm"
                    >
                      <div>
                        <p className="text-base font-semibold text-text-primary">
                          {book.name[lang] || book.name.fr}
                        </p>
                        <p className="text-sm text-text-muted">
                          {t('bible.chapterCount', { count: book.chapterCount })}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-text-muted" />
                    </button>
                  ))}
                </div>
              </section>
            ),
          )}
        </>
      )}

      {/* Chapters */}
      {viewMode === 'chapters' && selectedBook && (
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: selectedBook.chapterCount }, (_, i) => i + 1).map(
            (chapter) => (
              <button
                key={chapter}
                onClick={() => openChapter(chapter)}
                className="flex flex-col items-center rounded-xl bg-surface py-3 shadow-sm"
              >
                <span className="text-base font-bold text-text-primary">{chapter}</span>
              </button>
            ),
          )}
        </div>
      )}

      {/* Verses */}
      {viewMode === 'verses' && selectedBook && selectedChapter && (
        <div className="flex flex-col gap-3">
          {verses.map((n) => {
            const text = verseTexts[n];
            return (
              <div key={n} className="rounded-2xl bg-surface p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-tint text-xs font-bold text-primary">
                    {n}
                  </span>
                </div>
                {text ? (
                  <p className="bible-text text-base leading-6 text-text-secondary">{text}</p>
                ) : (
                  <p className="text-sm italic text-text-muted">
                    {t('errors.verseNotFound', 'Verset non disponible dans cette traduction')}
                  </p>
                )}
                <button
                  onClick={() =>
                    memorize(
                      `${selectedBook.name.fr} ${selectedChapter}:${n}`,
                      text,
                    )
                  }
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-rose"
                >
                  <BrainCircuit size={15} />
                  {t('bible.memorize', 'Mémoriser')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </FullScreenPage>
  );
}
