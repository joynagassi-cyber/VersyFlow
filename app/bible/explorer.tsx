/**
 * Bible Explorer Screen — browse books → chapters → verses
 * Tailwind + i18n + Lucide + FullScreenPage.
 *
 * Verse text comes from the active translation (settings store). When the
 * dataset is not resolvable locally, a download-on-demand banner pulls it
 * from the Supabase Storage bucket `bible-datasets`.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ChevronRight,
  BookOpen,
  Cross,
  X,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BIBLE_BOOKS } from '@/domains/bible/entities';
import { useSettingsStore } from '@/store/settings-store';
import { useChapterSemanticTags } from '@/hooks/useSemanticTags';
import { useBibleData } from '@/hooks/useBibleData';
import VerseSemanticTags from '@/components/semantic/VerseSemanticTags';
import VerseActionBar from '@/components/bible/VerseActionBar';

type ViewMode = 'books' | 'chapters' | 'verses';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function BibleExplorerScreen() {
  const { t, i18n } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('books');
  const [query, setQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);

  const lang = i18n.language ?? 'fr';
  const selectedBook = BIBLE_BOOKS.find((b) => b.id === selectedBookId) || null;

  const { books, status, error, remoteEntry, translationId, download } = useBibleData();
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);

  const { tags } = useChapterSemanticTags(selectedBookId, selectedChapter);
  const tagsByVerse = new Map((tags?.entries ?? []).map((e) => [e.verse, e.concepts]));

  const activeBookData =
    selectedBookId != null ? books?.find((b) => b.id === selectedBookId) : undefined;
  const activeChapterData =
    selectedChapter != null
      ? activeBookData?.chapters.find((c) => c.number === selectedChapter)
      : undefined;

  // Verse numbers: real data when available, otherwise a fallback range.
  const verseNumbers = useMemo(() => {
    if (activeChapterData?.verses.length) {
      return activeChapterData.verses.map((v) => v.number);
    }
    return selectedChapter ? Array.from({ length: 30 }, (_, i) => i + 1) : [];
  }, [activeChapterData, selectedChapter]);

  const verseTexts = useMemo(() => {
    const map: Record<number, string> = {};
    activeChapterData?.verses.forEach((v) => {
      map[v.number] = v.text;
    });
    return map;
  }, [activeChapterData]);

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
    setSelectedVerse(null);
    setViewMode('verses');
  };

  const goBack = () => {
    if (viewMode === 'verses') {
      setSelectedChapter(null);
      setSelectedVerse(null);
      setViewMode('chapters');
    } else {
      setSelectedBookId(null);
      setViewMode('books');
    }
  };

  const handleDownload = () => {
    setDownloadPercent(null);
    void download((p) => setDownloadPercent(p));
  };

  // The active translation is not available locally → start the download
  // from the Supabase bucket automatically (progress shown in the banner).
  const autoDownloadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (status === 'unavailable' && remoteEntry && autoDownloadedFor.current !== translationId) {
      autoDownloadedFor.current = translationId;
      handleDownload();
    }
  }, [status, remoteEntry, translationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const translationLabel =
    useSettingsStore.getState().bibleTranslation || 'LSG';

  const showDownloadBanner =
    remoteEntry != null && status !== 'loading' && status !== 'ready';

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
          {/* Download-on-demand banner */}
          {showDownloadBanner && (
            <div className="rounded-2xl bg-surface p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-tint text-primary">
                  {status === 'downloading' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">
                    {status === 'error'
                      ? t('bible.downloadFailed', 'Échec du téléchargement')
                      : t('bible.downloadNeeded', 'Traduction non disponible hors ligne')}
                  </p>
                  <p className="text-xs text-text-muted">
                    {translationLabel} · {formatBytes(remoteEntry.sizeBytes)}
                  </p>
                  {status === 'downloading' && downloadPercent != null && (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-tint">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${downloadPercent}%` }}
                      />
                    </div>
                  )}
                  {status === 'error' && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-error">
                      <AlertCircle size={12} /> {error}
                    </p>
                  )}
                </div>
                {status !== 'downloading' && (
                  <button
                    onClick={handleDownload}
                    className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  >
                    {status === 'error'
                      ? t('common.retry', 'Réessayer')
                      : t('common.download', 'Télécharger')}
                  </button>
                )}
              </div>
            </div>
          )}

          {verseNumbers.map((n) => {
            const text = verseTexts[n];
            const isSelected = selectedVerse === n;
            return (
              <div
                key={n}
                onClick={() => setSelectedVerse(n)}
                className={cn(
                  'cursor-pointer rounded-2xl bg-surface p-4 shadow-sm transition',
                  isSelected && 'ring-2 ring-primary',
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-tint text-xs font-bold text-primary">
                    {n}
                  </span>
                  {isSelected && (
                    <span className="text-xs font-semibold text-primary">
                      {t('bible.selected', 'Sélectionné')}
                    </span>
                  )}
                </div>
                {text ? (
                  <p className="bible-text text-base leading-6 text-text-secondary">{text}</p>
                ) : status === 'loading' ? (
                  <div className="h-4 w-3/4 animate-pulse rounded bg-surface-tint" />
                ) : text !== undefined ? (
                  <p className="text-sm italic text-text-muted">
                    {t('bible.emptyVerse', 'Verset vide dans cette traduction')}
                  </p>
                ) : (
                  <p className="text-sm italic text-text-muted">
                    {t('errors.verseNotFound', 'Verset non disponible dans cette traduction')}
                  </p>
                )}
                <VerseSemanticTags concepts={tagsByVerse.get(n) ?? []} />
              </div>
            );
          })}

          {/* Contextual action bar for the selected verse */}
          {selectedVerse != null && (
            <VerseActionBar
              bookId={selectedBook.id}
              chapter={selectedChapter}
              verse={selectedVerse}
              verseText={verseTexts[selectedVerse]}
            />
          )}
        </div>
      )}
    </FullScreenPage>
  );
}
