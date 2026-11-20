/**
 * Bible Explorer — livres → chapitres → versets
 *
 * Trois vues, trois routes (/bible/explorer, /:bookId, /:bookId/:chapter) :
 * chaque vue est adressable, donc partageable et testable.
 *
 * C'EST LE SEUL ÉCRAN BIBLE. `app/bible/book.tsx` (grille de chapitres) et
 * `app/bible/chapter.tsx` (lecture d'un chapitre) en étaient des copies
 * appauvries : deux implémentations du même parcours, deux endroits à corriger.
 * Les anciennes URL (`/bible/book/:id`, `/bible/chapter/:id/:n`) restent
 * valides : elles redirigent ici (voir `BibleLegacyRedirect` dans `main.tsx`).
 *
 * Les données viennent de l'index de la traduction (structure seule) : la
 * liste des livres et la grille des chapitres ne parsent aucun verset. Le
 * texte n'est lu qu'en entrant dans la vue « versets », chapitre par chapitre.
 */

import { useState, useMemo } from 'react';
import { BibleReaderSkeleton } from '@/components/ui/ScreenSkeletons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  Search01Icon as Search,
  ChevronRightIcon as ChevronRight,
  BookOpen01Icon as BookOpen,
  CrossIcon as Cross,
  Cancel01Icon as X,
  AlertCircleIcon as AlertCircle,
} from '@/components/ui/solar-icons';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { formatChapterCount } from '@/lib/chapter-count';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useBibleBooks, type BookMeta } from '@/hooks/useBibleBooks';
import { useBibleData } from '@/hooks/useBibleData';
import { bibleTranslationDisplayName } from '@/services/bible-translation-names';
import ContinuousBibleReader from '@/components/bible/ContinuousBibleReader';
import { useAppearanceStore } from '@/store/appearance-store';

type ViewMode = 'books' | 'chapters' | 'verses';

/**
 * URL-driven views (each view IS a route, so tooling can detect them):
 *   /bible/explorer                    → books
 *   /bible/explorer/:bookId            → chapters
 *   /bible/explorer/:bookId/:chapter   → verses
 */
export default function BibleExplorerScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { t, i18n } = useTranslation();
  const continuous = useAppearanceStore((s) => s.bibleContinuous);
  const verseLayout = useAppearanceStore((s) => s.bibleVerseLayout);
  const [query, setQuery] = useState('');

  const { byId, translationId } = useBibleBooks();
  const { index, status, error, getChapter, reload } = useBibleData();

  const rawBookId = params.bookId ?? null;
  const selectedBookId = rawBookId != null && byId.has(rawBookId) ? rawBookId : null;
  const chapterParam = Number(params.chapter);
  const selectedChapter =
    selectedBookId && Number.isInteger(chapterParam) && chapterParam > 0 ? chapterParam : null;

  const viewMode: ViewMode =
    selectedBookId && selectedChapter != null ? 'verses' : selectedBookId ? 'chapters' : 'books';

  const selectedBook: BookMeta | null =
    selectedBookId != null ? byId.get(selectedBookId) ?? null : null;

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = [...byId.values()];
    if (!q) return all;
    return all.filter((b) => [b.displayName, b.id].some((n) => n?.toLowerCase().includes(q)));
  }, [query, byId]);

  const oldTestamentFiltered = filteredBooks.filter((b) => b.testament === 'old');
  const newTestamentFiltered = filteredBooks.filter((b) => b.testament === 'new');

  const openBook = (id: string) => {
    navigate(`/bible/explorer/${id}`);
  };

  const openChapter = (chapter: number) => {
    if (selectedBookId) navigate(`/bible/explorer/${selectedBookId}/${chapter}`);
  };

  const translationLabel = bibleTranslationDisplayName(translationId);
  const showUnavailable = status === 'unavailable' || status === 'error';

  const title =
    viewMode === 'books'
      ? t('bible.explorer', 'Explorer la Bible')
      : viewMode === 'chapters' && selectedBook
        ? selectedBook.displayName
        : t('bible.explorer', 'Bible');

  return (
    <FullScreenPage
      title={title}
      column="narrow"
      className={viewMode === 'verses' ? 'reading-screen' : undefined}
      headerClassName={viewMode === 'verses' ? 'reading-header' : undefined}
      subtitle={
        viewMode === 'chapters' && selectedBook
          ? formatChapterCount(
              t('bible.chapterCount', { count: selectedBook.chapterCount }),
              selectedBook.chapterCount,
              i18n.resolvedLanguage || i18n.language,
            )
          : viewMode === 'verses' && selectedChapter
            ? continuous
              ? t('bible.continuousReading', 'Lecture continue')
              : t('bible.chapterMode', 'Chapitre par chapitre')
            : undefined
      }
      showBack
      backPath={
        viewMode === 'verses' && selectedBookId
          ? `/bible/explorer/${selectedBookId}`
          : viewMode === 'chapters'
            ? '/bible/explorer'
            : '/tabs/explore'
      }
    >
      {/* Search */}
      {viewMode === 'books' && (
        <div className="relative mb-4">
          <DuoIcon icon={Search} size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder={t('bible.search', 'Rechercher un livre...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('bible.clearSearch', 'Effacer la recherche')}
              className="touch-target absolute right-1 top-1/2 -translate-y-1/2 rounded-full text-text-muted active:bg-surface-tint"
            >
              <DuoIcon icon={X} size={16} />
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
              icon: <DuoIcon icon={BookOpen} size={16} className="text-primary" />,
              iconBg: 'bg-surface-tint',
            },
            {
              key: 'new',
              label: t('bible.newTestament', 'Nouveau Testament'),
              list: newTestamentFiltered,
              icon: <DuoIcon icon={Cross} size={16} className="text-on-status" />,
              iconBg: 'bg-success',
            },
          ].map((section) =>
            section.list.length === 0 ? null : (
              <section key={section.key} className="mb-6">
                <div className="mb-3 flex items-center gap-3 px-1">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', section.iconBg)}>
                    {section.icon}
                  </span>
                  <h2 className="card-title flex-1">{section.label}</h2>
                  <span className="text-sm text-text-muted">
                    {formatChapterCount(
                      t('bible.bookCount', { count: section.list.length }),
                      section.list.length,
                      i18n.resolvedLanguage || i18n.language,
                    )}
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
                        <p className="text-base font-semibold text-text-primary">{book.displayName}</p>
                        <p className="text-sm text-text-muted">
                          {formatChapterCount(
                            t('bible.chapterCount', { count: book.chapterCount }),
                            book.chapterCount,
                            i18n.resolvedLanguage || i18n.language,
                          )}
                        </p>
                      </div>
                      <DuoIcon icon={ChevronRight} size={20} className="text-text-muted" />
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
          {Array.from({ length: selectedBook.chapterCount }, (_, i) => i + 1).map((chapter) => (
            <button
              key={chapter}
              onClick={() => openChapter(chapter)}
              className="flex flex-col items-center rounded-xl bg-surface py-3 shadow-sm"
            >
              <span className="text-base font-semibold text-text-primary">{chapter}</span>
            </button>
          ))}
        </div>
      )}

      {/* Verses — manuscript flow */}
      {viewMode === 'verses' && selectedBook && selectedChapter && (
        <div className="flex flex-col gap-3">
          {showUnavailable && (
            <div className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-tint text-primary">
                <DuoIcon icon={AlertCircle} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {t('bible.downloadFailed', 'Texte indisponible')}
                </p>
                <p className="text-xs text-text-muted">
                  {translationLabel} ·{' '}
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
              key={`${translationId}:${selectedBook.id}:${selectedChapter}`}
              index={index}
              initialBookId={selectedBook.id}
              initialChapter={selectedChapter}
              translationId={translationId}
              getChapter={getChapter}
            />
          ) : null}
        </div>
      )}
    </FullScreenPage>
  );
}
