// Fixed: UX — search-index load failure now shows a visible error hint + retry
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, Clock, GraduationCap, Bookmark, AlertCircle } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { loadTranslationBooks } from '@/services/bible-text-service';
import { useSettingsStore } from '@/store/settings-store';

const HISTORY_KEY = 'versyflow:search:history';
const DEBOUNCE_MS = 250;

interface SearchResult {
  id: string;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  relevance: number;
}

/**
 * Pre-lowercased row shape: everything `handleSearch`/`quickMatch` need is
 * already in lowercase, so the per-keystroke filter runs a plain
 * `String.prototype.includes` over flat strings with zero per-row
 * case-conversion (the old code called `toLowerCase()` 4× per candidate
 * verse on every keystroke over the whole corpus).
 */
interface SearchRow {
  id: string;
  reference: string;
  refLower: string;
  book: string;
  bookLower: string;
  chapter: number;
  verse: number;
  text: string;
  textLower: string;
  relevance: number;
}

function quickMatch(row: SearchRow, q: string): boolean {
  // `q` is expected to arrive lowercased (callers pass it through .toLowerCase()).
  const m = q.match(/^(.*?)\s*(\d.*)?$/);
  const bookPart = (m?.[1] ?? q).trim();
  const refPart = (m?.[2] ?? '').replace(/^:+/, '');
  const bookHit = !bookPart || row.bookLower.startsWith(bookPart) || row.bookLower.includes(bookPart);
  const refHit = !refPart || `${row.chapter}:${row.verse}`.includes(refPart);
  return bookHit && refHit;
}

export default function SearchScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [index, setIndex] = useState<SearchRow[]>([]);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
    } catch {
      return [];
    }
  });

  const buildIndex = (booksData: Awaited<ReturnType<typeof loadTranslationBooks>>) => {
    if (!booksData) return;
    const rows: SearchRow[] = [];
    for (const book of booksData) {
      const bookName = book.name.fr;
      const bookLower = bookName.toLowerCase();
      for (const ch of book.chapters ?? []) {
        for (const v of ch.verses ?? []) {
          const reference = `${bookName} ${ch.number}:${v.number}`;
          rows.push({
            id: book.id + '-' + ch.number + '-' + v.number,
            reference,
            refLower: reference.toLowerCase(),
            book: bookName,
            bookLower,
            chapter: ch.number,
            verse: v.number,
            text: v.text,
            textLower: v.text.toLowerCase(),
            relevance: 0,
          });
        }
      }
    }
    setIndex(rows);
  };

  useEffect(() => {
    let cancelled = false;
    setIndexError(null);
    const translationId = useSettingsStore.getState().bibleTranslation || 'lsg';
    void loadTranslationBooks(translationId).then((booksData) => {
      if (cancelled) return;
      if (!booksData) {
        setIndexError(t('errors.unknownError', 'Impossible de charger la recherche'));
        return;
      }
      buildIndex(booksData);
    }).catch(() => {
      if (!cancelled) {
        setIndexError(t('errors.unknownError', 'Impossible de charger la recherche'));
      }
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

  /**
   * Filter the pre-lowercased index for a query, bucket reference-prefix
   * matches first (the only meaningful relevance split — full-text hits are
   * all equally "good"), and cap the result set. Returns `null` when the
   * query is too short to bother searching (same threshold as before: 2+
   * chars) so callers can treat `null` as "no search performed yet".
   */
  const filterIndex = (raw: string): SearchResult[] | null => {
    const q = raw.trim().toLowerCase();
    if (q.length < 2) return null;
    const matches = index
      .filter((r) => r.refLower.includes(q) || r.bookLower.includes(q) || r.textLower.includes(q))
      .sort((a, b) =>
        (b.refLower.startsWith(q) ? 1 : 0) - (a.refLower.startsWith(q) ? 1 : 0),
      )
      .slice(0, 25)
      .map((r) => ({ ...r, relevance: r.refLower.startsWith(q) ? 100 : 60 }))
      .map(({ id, reference, book, chapter, verse, text, relevance }) => ({
        id, reference, book, chapter, verse, text, relevance,
      }));
    return matches;
  };

  /**
   * Debounced "run a search" trigger. `query` is what the input box shows
   * (instant); `debouncedQuery` is what actually drives the index filter,
   * so a fast typer only triggers a full-corpus scan on the last pause,
   * not on every intermediate keystroke.
   */
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debouncedQueryRef = useRef('');
  useEffect(() => {
    debouncedQueryRef.current = query;
    const handle = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const handleSearch = (text: string) => {
    setQuery(text);
    setShowHistory(false);
    // No synchronous filter here anymore — the debounced value below is
    // what triggers the actual full-corpus scan, and it runs only after
    // the user pauses typing.
  };

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    const matches = filterIndex(debouncedQuery);
    setResults(matches ?? []);
    if (matches && matches.length > 0) recordHistory(debouncedQuery.trim());
    // `filterIndex` is intentionally re-created each render (depends on the
    // live `index`); re-running on `index` changes is correct — a freshly
    // loaded corpus should re-filter the in-flight query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, index]);

  const handleQuickSearch = (reference: string) => {
    setQuery(reference);
    setShowHistory(false);
    // Quick-search is a deliberate, full-corpus lookup (user clicked a
    // concrete reference, not typing free text) — run it immediately,
    // bypassing the debounce.
    const q = reference.toLowerCase();
    const matches = index
      .filter((r) => quickMatch(r, q))
      .slice(0, 25)
      .map((r) => ({ ...r, relevance: 100 }))
      .map(({ id, reference: ref, book, chapter, verse, text, relevance }) => ({
        id, reference: ref, book, chapter, verse, text, relevance,
      }));
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
            <button onClick={() => handleSearch('')} aria-label={t('common.clear', 'Effacer')}>
              <X size={18} className="text-text-muted" />
            </button>
          )}
        </div>

        {/* Index load failure hint */}
        {indexError && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
            <AlertCircle size={20} className="shrink-0 text-error" />
            <p className="flex-1 text-sm text-error">{indexError}</p>
            <button
              onClick={() => {
                setIndexError(null);
                setIndex([]);
                window.location.reload();
              }}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white active:opacity-90"
            >
              {t('common.retry', 'Réessayer')}
            </button>
          </div>
        )}

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
