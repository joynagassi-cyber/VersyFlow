/**
 * Chapter Screen — lecture d'un chapitre.
 *
 * Le lecteur ne charge que ce qu'il affiche : la structure de la traduction
 * (index) puis les chapitres visibles, un par un. Sélectionner un verset
 * ouvre la barre d'actions contextuelle (Mémoriser · Tag · Note · Comparer).
 */

import { useSearchParams, useParams } from 'react-router-dom';
import { BibleReaderSkeleton } from '@/components/ui/ScreenSkeletons';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { AlertCircleIcon as AlertCircle } from '@/components/ui/solar-icons';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { useBibleBooks } from '@/hooks/useBibleBooks';
import { useBibleData } from '@/hooks/useBibleData';
import ContinuousBibleReader from '@/components/bible/ContinuousBibleReader';
import { useAppearanceStore } from '@/store/appearance-store';

export default function ChapterScreen() {
  const [params] = useSearchParams();
  const urlParams = useParams();
  const { t } = useTranslation();
  const continuous = useAppearanceStore((s) => s.bibleContinuous);
  const verseLayout = useAppearanceStore((s) => s.bibleVerseLayout);
  const { byId } = useBibleBooks();
  const { index, status, error, translationId, getChapter, reload } = useBibleData();

  // URL params (canon route /bible/chapter/:bookId/:chapterNumber) win,
  // query params kept as a migration fallback. `gen` is the static-structure
  // default when the param is absent — a known book id, never a hardcode of
  // display names or chapter counts.
  const bookId = urlParams.bookId ?? params.get('book') ?? 'gen';
  const chapter = Number(urlParams.chapterNumber ?? params.get('chapter') ?? '1');
  const book = byId.get(bookId) ?? byId.get('gen');

  return (
    <FullScreenPage
      title={t('bible.explorer', 'Bible')}
      subtitle={
        continuous
          ? t('bible.continuousReading', 'Lecture continue')
          : t('bible.chapterMode', 'Chapitre par chapitre')
      }
      backPath={`/bible/book/${bookId}`}
      column="narrow"
      className="reading-screen"
      headerClassName="reading-header"
    >
      <div className="flex flex-col gap-3">
        {/* Une traduction absente n'est pas un incident réseau : elle n'est pas
            livrée. Le message le dit et propose de réessayer, sans promesse de
            téléchargement qui n'existe pas. */}
        {(status === 'unavailable' || status === 'error') && (
          <div className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-tint text-primary">
              <DuoIcon icon={AlertCircle} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">
                {t('bible.downloadFailed', 'Texte indisponible')}
              </p>
              <p className="text-xs text-text-muted">
                {translationId.toUpperCase()} ·{' '}
                {error ??
                  t(
                    'bible.translationNotShipped',
                    'Cette traduction n’est pas livrée avec l’application.',
                  )}
              </p>
            </div>
            <button
              onClick={reload}
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm"
            >
              {t('common.retry', 'Réessayer')}
            </button>
          </div>
        )}

        {/* Manuscript flow: the chapter as one continuous serif text,
            with tappable inline verse numbers. */}
        {status === 'loading' ? (
          <BibleReaderSkeleton
            label={t('common.loading', 'Chargement du chapitre…')}
            layout={verseLayout}
          />
        ) : index ? (
          <ContinuousBibleReader
            key={`${translationId}:${bookId}:${chapter}`}
            index={index}
            initialBookId={bookId}
            initialChapter={chapter}
            translationId={translationId}
            getChapter={getChapter}
          />
        ) : null}

        {!book && status !== 'loading' && (
          <p className="text-sm text-text-muted">
            {t('errors.verseNotFound', 'Livre introuvable')}
          </p>
        )}
      </div>
    </FullScreenPage>
  );
}
