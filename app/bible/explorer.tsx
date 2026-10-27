/**
 * Bible Explorer Screen — browse books → chapters → verses
 * Tailwind + i18n + Lucide + FullScreenPage.
 *
 * Verse text comes from the active translation (settings store). When the
 * dataset is not resolvable locally, a download-on-demand banner pulls it
 * from the Supabase Storage bucket `bible-datasets`.
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useBibleBooks, type BookMeta } from '@/hooks/useBibleBooks';
import { bibleTranslationDisplayName } from '@/services/bible-translation-names';
import { useChapterSemanticTags } from '@/hooks/useSemanticTags';
import { useBibleData } from '@/hooks/useBibleData';
import ManuscriptView from '@/components/bible/ManuscriptView';
import VerseActionBar from '@/components/bible/VerseActionBar';

type ViewMode = 'books' | 'chapters' | 'verses';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * URL-driven views (each view IS a route, so tooling can detect them):
 *   /bible/explorer                    → books
 *   /bible/explorer/:bookId            → chapters
 *   /bible/explorer/:bookId/:chapter   → verses
 */
export default function BibleExplorerScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);

  const { byId, oldTestament, newTestament, translationId } = useBibleBooks();

  const rawBookId = params.bookId ?? null;
  const selectedBookId = rawBookId != null && byId.has(rawBookId) ? rawBookId : null;
  const chapterParam = Number(params.chapter);
  const selectedChapter =
    selectedBookId && Number.isInteger(chapterParam) && chapterParam > 0 ? chapterParam : null;

  const viewMode: ViewMode =
    selectedBookId && selectedChapter != null ? 'verses' : selectedBookId ? 'chapters' : 'books';

  const selectedBook: BookMeta | null =
    selectedBookId != null ? byId.get(selectedBookId) ?? null : null;

  const { books, status, error, remoteEntry, downloadPercent, download } = useBibleData();

  // Reset the verse selection whenever the route (book/chapter) changes.
  useEffect(() => {
    setSelectedVerse(null);
  }, [selectedBookId, selectedChapter]);

  const { tags } = useChapterSemanticTags(selectedBookId, selectedChapter);

  const activeBookData =
    selectedBookId != null ? books?.find((b) => b.id === selectedBookId) : undefined;
  const activeChapterData =
    selectedChapter != null
      ? activeBookData?.chapters.find((c) => c.number === selectedChapter)
      : undefined;

  const verseTexts = useMemo(() => {
    const map: Record<number, string> = {};
    activeChapterData?.verses.forEach((v) => {
      map[v.number] = v.text;
    });
    return map;
  }, [activeChapterData]);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = [...byId.values()];
    if (!q) return all;
    return all.filter((b) =>
      [b.displayName, b.id].some((n) => n?.toLowerCase().includes(q)),
    );
  }, [query, byId]);

  const oldTestamentFiltered = filteredBooks.filter((b) => b.testament === 'old');
  const newTestamentFiltered = filteredBooks.filter((b) => b.testament === 'new');

  const openBook = (id: string) => {
    navigate(`/bible/explorer/${id}`);
  };

  const openChapter = (chapter: number) => {
    if (selectedBookId) navigate(`/bible/explorer/${selectedBookId}/${chapter}`);
  };

  const goBack = () => {
    if (viewMode === 'verses' && selectedBookId) {
      navigate(`/bible/explorer/${selectedBookId}`);
    } else {
      navigate('/bible/explorer');
    }
  };

  // Manual retry (auto-download already runs inside the hook on a cache miss).
  const handleDownload = () => {
    void download();
  };

  const translationLabel = bibleTranslationDisplayName(translationId);

  const showDownloadBanner =
    remoteEntry != null && status !== 'loading' && status !== 'ready';

  const title =
    viewMode === 'books'
      ? t('bible.explorer', 'Explorer la Bible')
      : viewMode === 'chapters' && selectedBook
        ? selectedBook.displayName
        : viewMode === 'verses' && selectedBook && selectedChapter
          ? `${selectedBook.displayName} ${selectedChapter}`
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
      backPath={
        viewMode === 'verses' && selectedBookId
          ? `/bible/explorer/${selectedBookId}`
          : viewMode === 'chapters'
            ? '/bible/explorer'
            : '/tabs/explore'
      }
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
              list: oldTestamentFiltered,
              icon: <BookOpen size={16} className="text-primary" />,
              iconBg: 'bg-surface-tint',
            },
            {
              key: 'new',
              label: t('bible.newTestament', 'Nouveau Testament'),
              list: newTestamentFiltered,
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
                          {book.displayName}
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

      {/* Verses — manuscript flow */}
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

          {/* Manuscript flow: the chapter as one continuous serif text,
              with tappable inline verse numbers. */}
          {status === 'loading' ? (
            <div className="space-y-3 rounded-3xl bg-surface p-5 shadow-sm">
              <div className="h-4 w-3/4 animate-pulse rounded bg-surface-tint" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface-tint" />
              <div className="h-4 w-full animate-pulse rounded bg-surface-tint" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-surface-tint" />
            </div>
          ) : (
            <ManuscriptView
              bookId={selectedBook.id}
              chapter={selectedChapter}
              verses={activeChapterData?.verses ?? []}
              tags={tags}
              selectedVerse={selectedVerse}
              onSelectVerse={setSelectedVerse}
            />
          )}

          {/* Contextual action bar for the selected verse */}
          {selectedVerse != null && (
            <VerseActionBar
              bookId={selectedBook.id}
              chapter={selectedChapter}
              verse={selectedVerse}
              verseText={verseTexts[selectedVerse]}
              translationId={translationId}
            />
          )}
        </div>
      )}
    </FullScreenPage>
  );
}
