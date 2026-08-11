/**
 * Search Screen — Bible verse search by reference or keyword
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface SearchResult {
  id: string;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  relevance: number;
}

const SAMPLE_RESULTS: SearchResult[] = [
  { id: '1', reference: 'Jean 3:16', book: 'Jean', chapter: 3, verse: 16, text: 'Car Dieu a tellement aimé le monde...', relevance: 100 },
  { id: '2', reference: 'Psaume 23:1', book: 'Psaumes', chapter: 23, verse: 1, text: 'L\'Éternel est mon berger...', relevance: 95 },
  { id: '3', reference: 'Romains 8:28', book: 'Romains', chapter: 8, verse: 28, text: 'Nous savons d\'ailleurs que...', relevance: 90 },
  { id: '4', reference: 'Jean 1:1', book: 'Jean', chapter: 1, verse: 1, text: 'Au commencement était la Parole...', relevance: 85 },
  { id: '5', reference: 'Genèse 1:1', book: 'Genèse', chapter: 1, verse: 1, text: 'Au commencement, Dieu créa...', relevance: 80 },
];

export default function SearchScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const searchHistory = [
    'Jean 3:16',
    'Psaume 23',
    'Genèse 1',
    'Romains 8',
  ];

  const handleSearch = (text: string) => {
    setQuery(text);
    setShowHistory(false);

    if (text.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    // Simulate search
    setTimeout(() => {
      const filtered = SAMPLE_RESULTS.filter(r =>
        r.reference.toLowerCase().includes(text.toLowerCase()) ||
        r.text.toLowerCase().includes(text.toLowerCase()) ||
        r.book.toLowerCase().includes(text.toLowerCase())
      );
      setResults(filtered);
      setIsSearching(false);
    }, 500);
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
    const result = SAMPLE_RESULTS.find(r => r.reference === reference);
    if (result) {
      setResults([result]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rechercher</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
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
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
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
                <Ionicons name="clock" size={18} color={colors.textMuted} />
                <Text style={styles.historyText}>{item}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Results */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="search" size={40} color={colors.primary} />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      ) : results.length > 0 ? (
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
                  <Ionicons name="learn" size={16} color={colors.primary} />
                  <Text style={styles.resultActionText}>Mémoriser</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resultAction}>
                  <Ionicons name="bookmark" size={16} color={colors.primary} />
                  <Text style={styles.resultActionText}>Sauvegarder</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : query.length >= 2 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-off" size={64} color={colors.outline} />
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptySubtitle}>Essayez avec une autre référence ou un mot-clé</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
