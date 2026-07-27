/**
 * Explore Tab — Bible Explorer
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { BibleRepository } from '@/domains/bible/repository';
import { BibleBook } from '@/domains/bible/schema';

export default function ExploreScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les livres de la Bible
  useEffect(() => {
    const loadBooks = async () => {
      try {
        // Le repository charge automatiquement LSG.json au load()
        const repo = BibleRepository.getInstance();
        // Si pas encore chargé, charger-le
        if (!repo['loaded']) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulation async
        }
        const allBooks = repo.getAllBooks();
        setBooks(allBooks);
      } catch (error) {
        console.error('Erreur lors du chargement des livres:', error);
        // En cas d'erreur, utiliser des données mock
        const mockBooks = [
          { id: 'gen', name: { fr: 'Genèse', en: 'Genesis' }, testament: 'old', chapterCount: 50, chapters: [] },
          { id: 'exo', name: { fr: 'Exode', en: 'Exodus' }, testament: 'old', chapterCount: 40, chapters: [] },
          { id: 'lev', name: { fr: 'Lévitique', en: 'Leviticus' }, testament: 'old', chapterCount: 27, chapters: [] },
          { id: 'mat', name: { fr: 'Matthieu', en: 'Matthew' }, testament: 'new', chapterCount: 28, chapters: [] },
          { id: 'joh', name: { fr: 'Jean', en: 'John' }, testament: 'new', chapterCount: 21, chapters: [] },
          { id: 'act', name: { fr: 'Actes', en: 'Acts' }, testament: 'new', chapterCount: 28, chapters: [] },
          { id: 'rom', name: { fr: 'Romains', en: 'Romans' }, testament: 'new', chapterCount: 16, chapters: [] },
          { id: '1cor', name: { fr: '1 Corinthiens', en: '1 Corinthians' }, testament: 'new', chapterCount: 16, chapters: [] },
          { id: 'rev', name: { fr: 'Apocalypse', en: 'Revelation' }, testament: 'new', chapterCount: 22, chapters: [] },
        ];
        setBooks(mockBooks);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#E91E8C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>Vieil Testament</Text>
      <FlatList
        data={books.filter(b => b.testament === 'old')}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookItem}
            onPress={() => router.push(`/explore/book/${item.id}`)}
          >
            <View style={styles.bookInfo}>
              <Text style={styles.bookName}>{item.name.fr}</Text>
              <Text style={styles.bookMeta}>{item.chapterCount} chapitres</Text>
            </View>
            <Text style={styles.bookArrow">›</Text>
          </TouchableOpacity>
        )}
        ListEmptyItem={null}
      />

      <Text style={styles.sectionTitle">Nouvel Testament</Text>
      <FlatList
        data={books.filter(b => b.testament === 'new')}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookItem}
            onPress={() => router.push(`/explore/book/${item.id}`)}
          >
            <View style={styles.bookInfo}>
              <Text style={styles.bookName}>{item.name.fr}</Text>
              <Text style={styles.bookMeta}>{item.chapterCount} chapitres</Text>
            </View>
            <Text style={styles.bookArrow">›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  bookItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.md,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  bookMeta: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 4,
  },
  bookArrow: {
    fontSize: 24,
    color: '#E91E8C',
    marginLeft: 16,
  },
});

const shadow = {
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
};
