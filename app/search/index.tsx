import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, Clock, GraduationCap, Bookmark } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { loadTranslationBooks } from '@/services/bible-text-service';
import { useSettingsStore } from '@/store/settings-store';

const HISTORY_KEY = 'versyflow:search:history';

interface SearchResult {
  id: string;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  relevance: number;
}

function quickMatch(row: SearchResult, q: string): boolean {
  const m = q.match(/^(.*?)\s*(\d.*)?$/);
  const bookPart = (m?.[1] ?? q).trim().toLowerCase();
  const refPart = (m?.[2] ?? '').toLowerCase().replace(/^:+/, '');
  const bookHit =
    !bookPart ||
    row.book.toLowerCase().startsWith(bookPart) ||
    row.book.toLowerCase().includes(bookPart);
  const refHit = !refPart || String(row.chapter + ':' + row.verse).includes(refPart);
  return bookHit && refHit;
}

export default function SearchScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [index, setIndex] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let cancelled = false;
    const translationId = useSettingsStore.getState().bibleTranslation || 'lsg';
    void loadTranslationBooks(translationId).then((booksData) => {
      if (cancelled || !booksData) return;
      const rows: SearchResult[] = [];
      for (const book of booksData) {
        for (const ch of book.chapters ?? []) {
          for (const v of ch.verses ?? []) {
            rows.push({
              id: book.id + '-' + ch.number + '-' + v.number,
              reference: book.name.fr + ' ' + ch.number + ':' + v.number,
              book: book.name.fr,
              chapter: ch.number,
              verse: v.number,
              text: v.text,
              relevance: 0,
            });
          }
        }
      }
      setIndex(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const recordHistory = (term: string) => {
    setSearchHistory((prev) => {
      const next = [term, ...prev.filter((p) => p !== term)].slice(0, 6);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* in-memory only */
      }
      return next;
    });
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    setShowHistory(false);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    const q = text.trim().toLowerCase();
    const matches = index
      .filter(
        (r) =>
          r.reference.toLowerCase().includes(q) ||
          r.book.toLowerCase().includes(q) ||
          r.text.toLowerCase().includes(q),
      )
      .map((r) => ({ ...r, relevance: r.reference.toLowerCase().startsWith(q) ? 100 : 60 }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 25);
    setResults(matches);
    if (matches.length > 0) recordHistory(text.trim());
  };

  const handleQuickSearch = (reference: string) => {
    setQuery(reference);
    setShowHistory(false);
    const matches = index
      .filter((r) => quickMatch(r, reference.toLowerCase()))
      .map((r) => ({ ...r, relevance: 100 }))
      .slice(0, 25);
    setResults(matches);
    if (matches.length > 0) recordHistory(reference);
  };

  const openResult = (result: SearchResult) => {
    const qs = new URLSearchParams({ reference: result.reference, text: result.text }).toString();
    navigate('/memorization/session?' + qs);
  };

  const SUGGESTIONS = ['Jean 3:16', 'Psaume 23', 'Genèse 1', 'Romains 8:28', 'Philippiens 4:13'];

  return (
    <FullScreenPage title={t('nav.search', 'Recherche')} showBack>
      <div className="mx-auto max-w-md">
        {/* Input */}
        <div className="flex items-center gap-2 rounded-2xl bg-surface-tint px-4 py-3">
          <Search size={18} className="text-text-muted" />
          <input
            className="flex-1 bg-transparent text-base text-text-primary outline-none"
            placeholder={t('search.placeholder', 'Rechercher un verset...')}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoCorrect="off"
            autoCapitalize="sentences"
          />
          {query && (
            <button onClick={() => handleSearch('')} aria-label="clear">
              <X size={18} className="text-text-muted" />
            </button>
          )}
        </div>

        {/* Suggestions */}
        {!query && showHistory && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-text-muted">
              {t('search.popular', 'Recherches populaires')}
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleQuickSearch(s)}
                  className="rounded-full bg-surface-tint px-3.5 py-1.5 text-sm font-medium text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {showHistory && searchHistory.length > 0 && (
          <div className="mt-5">
            <p className="mb-1 text-sm font-semibold text-text-muted">
              {t('search.recent', 'Historique recent')}
            </p>
            {searchHistory.map((item, i) => (
              <button
                key={i}
                onClick={() => handleQuickSearch(item)}
                className="flex w-full items-center gap-3 border-b border-[color:var(--color-divider)] py-3 text-left"
              >
                <Clock size={16} className="text-text-muted" />
                <span className="flex-1 text-base text-text-primary">{item}</span>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {results.length > 0 ? (
          <div className="mt-5 space-y-3 pb-6">
            <p className="text-sm text-text-muted">{results.length} {t('search.results', 'resultat(s)')}</p>
            {results.map((result) => (
              <div key={result.id} className="rounded-2xl bg-surface p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-base font-bold text-text-primary">{result.reference}</p>
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-xs font-semibold ' +
                      (result.relevance >= 90
                        ? 'bg-success/15 text-success'
                        : result.relevance >= 70
                          ? 'bg-warning/15 text-warning'
                          : 'bg-surface-tint text-text-muted')
                    }
                  >
                    {result.relevance}%
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-text-secondary">{result.text}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openResult(result)}
                    className="flex items-center gap-1.5 rounded-full bg-surface-tint px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    <GraduationCap size={14} />
                    {t('search.memorize', 'Memoriser')}
                  </button>
                  <button className="flex items-center gap-1.5 rounded-full bg-surface-tint px-3 py-1.5 text-sm font-medium text-primary">
                    <Bookmark size={14} />
                    {t('search.save', 'Sauvegarder')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : query.length >= 2 ? (
          <div className="mt-10">
            <EmptyState
              title={t('search.noResults', 'Aucun resultat')}
              description={t('search.noResultsHint', 'Essayez une autre reference ou un mot-cle.')}
              showLogo={false}
            />
          </div>
        ) : null}
      </div>
    </FullScreenPage>
  );
}
