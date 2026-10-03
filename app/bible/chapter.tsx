/**
 * Chapter Screen — multi-verse passage view.
 *
 * Verse text comes from the active translation (settings store); when the
 * dataset is not resolvable locally, a download-on-demand banner is shown.
 * Selecting a verse reveals the contextual action bar
 * (Mémoriser · Tag · Note · Comparer).
 */

import { useState, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { BIBLE_BOOKS } from '@/domains/bible/entities';
import { useChapterSemanticTags } from '@/hooks/useSemanticTags';
import { useBibleData } from '@/hooks/useBibleData';
import ManuscriptView from '@/components/bible/ManuscriptView';
import VerseActionBar from '@/components/bible/VerseActionBar';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function ChapterScreen() {
  const [params] = useSearchParams();
  const urlParams = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language ?? 'fr';

  // URL params (canon route /bible/chapter/:bookId/:chapterNumber) win,
  // query params kept as a migration fallback.
  const bookId = urlParams.bookId ?? params.get('book') ?? 'gen';
  const chapter = Number(urlParams.chapterNumber ?? params.get('chapter') ?? '1');
  const book = BIBLE_BOOKS.find((b) => b.id === bookId) || BIBLE_BOOKS[0];

  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);

  const { books, status, error, remoteEntry, translationId, downloadPercent, download } =
    useBibleData();

  const { tags } = useChapterSemanticTags(book.id, chapter);

  const chapterData = books?.find((x) => x.id === bookId)?.chapters.find(
    (c) => c.number === chapter,
  );
  const verseTexts = useMemo(() => {
    const map: Record<number, string> = {};
    chapterData?.verses.forEach((v) => {
      map[v.number] = v.text;
    });
    return map;
  }, [chapterData]);

  const showDownloadBanner =
    remoteEntry != null && status !== 'loading' && status !== 'ready';

  // Manual retry (auto-download already runs inside the hook on a cache miss).
  const handleDownload = () => {
    void download();
  };

  return (
    <FullScreenPage
      title={`${book.name[lang] || book.name.fr} ${chapter}`}
      subtitle={t('bible.chapter', 'Chapitre')}
      backPath={`/bible/book/${book.id}`}
    >
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
                  {translationId.toUpperCase()} · {formatBytes(remoteEntry.sizeBytes)}
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
            bookId={book.id}
            chapter={chapter}
            verses={chapterData?.verses ?? []}
            tags={tags}
            selectedVerse={selectedVerse}
            onSelectVerse={setSelectedVerse}
          />
        )}

        {/* Contextual action bar for the selected verse */}
        {selectedVerse != null && (
          <VerseActionBar
            bookId={book.id}
            chapter={chapter}
            verse={selectedVerse}
            verseText={verseTexts[selectedVerse]}
          />
        )}
      </div>
    </FullScreenPage>
  );
}
