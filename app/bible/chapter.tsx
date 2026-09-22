/**
 * Chapter Screen — multi-verse passage view.
 *
 * Verse text comes from the active translation (settings store); when the
 * dataset is not resolvable locally, a download-on-demand banner is shown.
 * Selecting a verse reveals the contextual action bar
 * (Mémoriser · Tag · Note · Comparer).
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { cn } from '@/lib/utils';
import { BIBLE_BOOKS } from '@/domains/bible/entities';
import { useChapterSemanticTags } from '@/hooks/useSemanticTags';
import { useBibleData } from '@/hooks/useBibleData';
import VerseSemanticTags from '@/components/semantic/VerseSemanticTags';
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
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);

  const { books, status, error, remoteEntry, translationId, download } = useBibleData();

  const { tags } = useChapterSemanticTags(book.id, chapter);
  const tagsByVerse = new Map((tags?.entries ?? []).map((e) => [e.verse, e.concepts]));

  const chapterData = books?.find((x) => x.id === bookId)?.chapters.find(
    (c) => c.number === chapter,
  );
  const verseNumbers = useMemo(() => {
    if (chapterData?.verses.length) {
      return chapterData.verses.map((v) => v.number);
    }
    return Array.from({ length: 30 }, (_, i) => i + 1);
  }, [chapterData]);
  const verseTexts = useMemo(() => {
    const map: Record<number, string> = {};
    chapterData?.verses.forEach((v) => {
      map[v.number] = v.text;
    });
    return map;
  }, [chapterData]);

  const showDownloadBanner =
    remoteEntry != null && status !== 'loading' && status !== 'ready';

  const handleDownload = () => {
    setDownloadPercent(null);
    void download((p) => setDownloadPercent(p));
  };

  const autoDownloadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (status === 'unavailable' && remoteEntry && autoDownloadedFor.current !== translationId) {
      autoDownloadedFor.current = translationId;
      handleDownload();
    }
  }, [status, remoteEntry, translationId]); // eslint-disable-line react-hooks/exhaustive-deps

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
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-tint text-xs font-bold text-primary">
                  {n}
                </span>
                {text ? (
                  <p className="bible-text flex-1 text-base leading-6 text-text-secondary">
                    {text}
                  </p>
                ) : status === 'loading' ? (
                  <div className="h-4 flex-1 animate-pulse rounded bg-surface-tint" />
                ) : text !== undefined ? (
                  <p className="flex-1 text-sm italic text-text-muted">
                    {t('bible.emptyVerse', 'Verset vide dans cette traduction')}
                  </p>
                ) : (
                  <p className="flex-1 text-sm italic text-text-muted">
                    {t('errors.verseNotFound', 'Verset non disponible dans cette traduction')}
                  </p>
                )}
              </div>
              <VerseSemanticTags concepts={tagsByVerse.get(n) ?? []} />
            </div>
          );
        })}

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
