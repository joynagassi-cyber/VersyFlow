/**
 * Book Screen — chapter list for a book, with memorization shortcuts
 * Tailwind + i18n + Lucide + FullScreenPage.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, BookOpen } from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { BIBLE_BOOKS } from '@/domains/bible/entities';

export default function BookScreen() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const book = BIBLE_BOOKS.find((b) => b.id === bookId);
  if (!book) {
    return (
      <FullScreenPage title={t('bible.explorer', 'Bible')} backPath="/tabs/explore">
        <p className="text-sm text-text-muted">
          {t('errors.verseNotFound', 'Livre introuvable')}
        </p>
      </FullScreenPage>
    );
  }

  const lang = i18n.language ?? 'fr';

  return (
    <FullScreenPage
      title={book.name[lang] || book.name.fr}
      subtitle={t('bible.chapterCount', { count: book.chapterCount })}
      backPath="/tabs/explore"
    >
      <div className="flex flex-col gap-2">
        <button
          onClick={() => navigate('/bible/explorer')}
          className="mb-2 flex w-full items-center gap-3 rounded-xl bg-surface p-4 text-left shadow-sm"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-icon-bg-rose">
            <BookOpen size={18} className="text-primary" />
          </span>
          <span className="flex-1 text-sm font-semibold text-primary">
            {t('bible.explorer', 'Revenir à l\'explorateur')}
          </span>
        </button>
        {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map((chapter) => (
          <button
            key={chapter}
            onClick={() => navigate(`/bible/chapter?book=${book.id}&chapter=${chapter}`)}
            className="flex items-center justify-between rounded-xl bg-surface p-4 text-left shadow-sm"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-tint text-sm font-bold text-primary">
                {chapter}
              </span>
              <span className="text-base font-semibold text-text-primary">
                {t('bible.chapter', 'Chapitre')} {chapter}
              </span>
            </span>
            <ChevronRight size={18} className="text-text-muted" />
          </button>
        ))}
      </div>
    </FullScreenPage>
  );
}
