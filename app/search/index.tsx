/**
 * Search Screen — Bible verse search by reference or keyword
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from '@/hooks/useIonicNavigation';
import { IonIcon } from '@/components/ui/Primitives'
import { arrowBack, bookmark, chevronForward, close, closeCircle, school, search, time } from 'ionicons/icons';
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

/** "Psaume 23" / "Jean 3:16" style quick lookup against a result row. */
function quickMatch(row: SearchResult, q: string): boolean {
  const m = q.match(/^(.*?)\s*(\d.*)?$/);
  const bookPart = (m?.[1] ?? q).trim().toLowerCase();
  const refPart = (m?.[2] ?? '').toLowerCase().replace(/^:+/, '');
  const bookHit =
    !bookPart ||
    row.book.toLowerCase().startsWith(bookPart) ||
    row.book.toLowerCase().includes(bookPart);
  const refHit = !refPart || `${row.chapter}:${row.verse}`.includes(refPart);
  return bookHit && refHit;
}

export default function SearchScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceTint,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    height: '100%',
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 12,
  },
  suggestionsScroll: {
    flexDirection: 'row',
  },
  suggestionPill: {
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  historyContainer: {
    marginTop: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceTint,
    gap: 12,
  },
  historyText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  resultsTitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultReference: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  relevanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  relevanceText: {
    fontSize: 12,
    color: colors.surface,
    fontWeight: '600',
  },
  resultText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resultAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surfaceTint,
    borderRadius: 16,
  },
  resultActionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  }), [colors]);
  const router = useRouter();
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

  // Real verse index for the user's active translation (built once).
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
              id: `${book.id}-${ch.number}-${v.number}`,
              reference: `${book.name.fr} ${ch.number}:${v.number}`,
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
        // In-memory history only
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

  const handleResultPress = (result: SearchResult) => {
    router.push({
      pathname: '/memorization/session',
      params: {
        reference: result.reference,
        text: result.text,
      },
    });
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IonIcon icon={arrowBack} size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rechercher</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <IonIcon icon={search} size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un verset..."
            placeholderTextColor="colors.textMuted"
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
            autoCapitalize="sentences"
          />
          {query ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <IonIcon icon={closeCircle} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Quick Suggestions */}
        {!query && showHistory && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Recherches populaires</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
              {['Jean 3:16', 'Psaume 23', 'Genèse 1', 'Romains 8:28', 'Philippiens 4:13'].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionPill}
                  onPress={() => handleQuickSearch(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search History */}
        {showHistory && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Historique récent</Text>
            {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => handleQuickSearch(item)}
              >
                <IonIcon icon={time} size={18} color={colors.textMuted} />
                <Text style={styles.historyText}>{item}</Text>
                <IonIcon icon={chevronForward} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Results */}
      {results.length > 0 ? (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>{results.length} résultat(s)</Text>
          {results.map((result) => (
            <TouchableOpacity
              key={result.id}
              style={styles.resultCard}
              onPress={() => handleResultPress(result)}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultReference}>{result.reference}</Text>
                <View style={[styles.relevanceBadge, { backgroundColor: result.relevance >= 90 ? 'colors.success' : result.relevance >= 70 ? 'colors.warning' : colors.textMuted }]}>
                  <Text style={styles.relevanceText}>{result.relevance}%</Text>
                </View>
              </View>
              <Text style={styles.resultText} numberOfLines={2}>{result.text}</Text>
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.resultAction}>
                  <IonIcon icon={school} size={16} color={colors.primary} />
                  <Text style={styles.resultActionText}>Mémoriser</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resultAction}>
                  <IonIcon icon={bookmark} size={16} color={colors.primary} />
                  <Text style={styles.resultActionText}>Sauvegarder</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : query.length >= 2 ? (
        <View style={styles.emptyContainer}>
          <IonIcon icon={close} size={64} color={colors.outline} />
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptySubtitle}>Essayez avec une autre référence ou un mot-clé</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
