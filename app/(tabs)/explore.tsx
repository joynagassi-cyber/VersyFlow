/**
 * Explore Screen — Bible Explorer
 * Lists books of the Old/New Testament with search.
 * Tailwind + i18n + Lucide + Shadcn Input.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Search01Icon as Search,
  BookOpen01Icon as BookOpen,
  ChevronRightIcon as ChevronRight,
  NetworkIcon as Network,
} from '@/components/ui/solar-icons';
import { Input } from '@/components/ui/input';
import { formatChapterCount } from '@/lib/chapter-count';
import { useBibleBooks, type BookMeta } from '@/hooks/useBibleBooks';

export default function ExploreScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');

  const { byId } = useBibleBooks();

  const books = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = [...byId.values()];
    if (!q) return all;
    return all.filter((b) =>
      [b.displayName, b.id].some((n) => n?.toLowerCase().includes(q)),
    );
  }, [query, byId]);

  const oldTestamentFiltered = books.filter((b) => b.testament === 'old');
  const newTestamentFiltered = books.filter((b) => b.testament === 'new');

  const renderSection = (title: string, list: BookMeta[]) =>
    list.length > 0 ? (
      <section className="g2 explore-section" aria-label={title}>
        <h2>{title}</h2>
        <div className="explore-book-list">
          {list.map((book) => (
            <button key={book.id} type="button" onClick={() => navigate(`/bible/book/${book.id}`)} className="explore-book">
              <span className="icon-chip explore-icon"><DuoIcon icon={BookOpen} size={20} /></span>
              <span className="explore-book-details">
                <span className="explore-book-title">{book.displayName}</span>
                <span className="explore-book-subtitle">{formatChapterCount(t('bible.chapterCount', { count: book.chapterCount }), book.chapterCount, i18n.resolvedLanguage || i18n.language)}</span>
              </span>
              <DuoIcon icon={ChevronRight} size={20} />
            </button>
          ))}
        </div>
      </section>
    ) : null;

  return (
    <div className="screen-column explore-premium h-full overflow-y-auto">
      <div className="explore-content">
        <header className="g1 tab-heading explore-heading">
          <p className="section-label">{t('nav.bible', 'Bible')}</p>
          <h1 className="page-title mt-2 mb-5">{t('bible.explorer', 'Explorer la Bible')}</h1>
          <div className="explore-search">
            <DuoIcon icon={Search} size={20} className="explore-search-icon" />
            <Input type="search" aria-label={t('bible.search', 'Rechercher un livre')} placeholder={t('bible.search', 'Rechercher un livre')} value={query} onChange={(e) => setQuery(e.target.value)} className="explore-search-input" />
          </div>
        </header>
        <button type="button" onClick={() => navigate('/semantic')} className="g2 explore-semantic">
          <span className="icon-chip explore-icon"><DuoIcon icon={Network} size={24} /></span>
          <span className="explore-book-details"><span className="explore-book-title">{t('semantic.title', 'Mémoire sémantique')}</span><span className="explore-book-subtitle">{t('semantic.subtitle', 'Concepts, versets et communautés')}</span></span>
          <DuoIcon icon={ChevronRight} size={20} />
        </button>
        {oldTestamentFiltered.length === 0 && newTestamentFiltered.length === 0 ? (
          <EmptyState
            tone="inline"
            icon={Search}
            title={t('bible.noResultsTitle', 'Aucun livre trouvé')}
            description={t('bible.noResults', 'Aucun résultat pour') + ' « ' + query + ' »'}
            actionLabel={t('common.clear', 'Effacer')}
            onAction={() => setQuery('')}
          />
        ) : (
          <div className="explore-testaments">
            {renderSection(t('bible.oldTestament', 'Ancien Testament'), oldTestamentFiltered)}
            {renderSection(t('bible.newTestament', 'Nouveau Testament'), newTestamentFiltered)}
          </div>
        )}
      </div>
    </div>
  );
}
