/**
 * Explore Screen — Bible Explorer
 * Lists books of the Old/New Testament with search.
 * Tailwind + i18n + Lucide + Shadcn Input.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BIBLE_BOOKS } from '@/domains/bible/entities';
import type { BibleBook } from '@/domains/bible/entities';

export default function ExploreScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');

  const lang = i18n.language;

  const books = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BIBLE_BOOKS;
    return BIBLE_BOOKS.filter((b) => {
      const names = [b.name.fr, b.name.en, b.id];
      return names.some((n) => n?.toLowerCase().includes(q));
    });
  }, [query]);

  const oldTestament = books.filter((b) => b.testament === 'old');
  const newTestament = books.filter((b) => b.testament === 'new');

  const renderSection = (title: string, list: BibleBook[]) =>
    list.length > 0 ? (
      <section className="mb-6">
        <h2 className="mb-3 px-1 text-lg font-semibold text-text-primary">{title}</h2>
        <div className="flex flex-col gap-2">
          {list.map((book) => (
            <button
              key={book.id}
              onClick={() => navigate(`/bible/book/${book.id}`)}
              className="flex items-center justify-between rounded-xl bg-surface p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-icon-bg-rose">
                  <BookOpen size={18} className="text-primary" />
                </span>
                <div>
                  <p className="text-base font-semibold text-text-primary">
                    {book.name[lang] || book.name.fr}
                  </p>
                  <p className="text-sm text-text-muted">
                    {t('bible.chapterCount', { count: book.chapterCount })}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-primary" />
            </button>
          ))}
        </div>
      </section>
    ) : null;

  return (
    <div className="min-h-full overflow-y-auto bg-background p-4 pb-24">
      <h1 className="mb-4 text-2xl font-bold text-text-primary">
        {t('bible.explorer', 'Explorer la Bible')}
      </h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <Input
          placeholder={t('bible.search', 'Rechercher un livre...')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {oldTestament.length === 0 && newTestament.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-text-muted">
            {t('bible.verse', 'Aucun résultat pour')} « {query} »
          </p>
        </div>
      ) : (
        <>
          {renderSection(t('bible.oldTestament', 'Ancien Testament'), oldTestament)}
          {renderSection(t('bible.newTestament', 'Nouveau Testament'), newTestament)}
        </>
      )}
    </div>
  );
}
