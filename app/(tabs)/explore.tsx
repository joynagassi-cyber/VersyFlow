/**
 * Explore Screen — Bible Explorer
 * Displays book list for Bible browsing.
 * See docs/08-ui-screens.md §5
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { BibleRepository } from '@/domains/bible/repository';
import { BibleBook } from '@/domains/bible/schema';

export default function ExploreScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Charger les livres de la Bible
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const repo = BibleRepository.getInstance();
        if (!repo['loaded']) {
          await repo.load();
        }
        const allBooks = repo.getAllBooks();
        setBooks(allBooks);
      } catch (error) {
        console.error('Erreur lors du chargement des livres:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  const filteredBooks = books.filter(book =>
    book.name.fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.name.en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const oldTestament = filteredBooks.filter(b => b.testament === 'old');
  const newTestament = filteredBooks.filter(b => b.testament === 'new');

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un livre..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="words"
        />
      </View>

      {/* Old Testament */}
      {oldTestament.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ancien Testament</Text>
          <FlatList
            data={oldTestament}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bookItem}
                onPress={() => router.push(`/bible/book/${item.id}`)}
              >
                <View style={styles.bookInfo}>
                  <Text style={styles.bookName}>{item.name.fr}</Text>
                  <Text style={styles.bookMeta}>{item.chapterCount} chapitres</Text>
                </View>
                <Text style={styles.bookArrow}>›</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* New Testament */}
      {newTestament.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nouveau Testament</Text>
          <FlatList
            data={newTestament}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bookItem}
                onPress={() => router.push(`/bible/book/${item.id}`)}
              >
                <View style={styles.bookInfo}>
                  <Text style={styles.bookName}>{item.name.fr}</Text>
                  <Text style={styles.bookMeta}>{item.chapterCount} chapitres</Text>
                </View>
                <Text style={styles.bookArrow}>›</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  bookItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bookMeta: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  bookArrow: {
    fontSize: 24,
    color: colors.primary,
    marginLeft: 16,
  },
});
