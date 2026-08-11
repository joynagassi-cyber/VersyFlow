/**
 * Book Selection Screen — Choose a chapter from a book
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BibleRepository } from '@/domains/bible/repository';
import { BibleBook } from '@/domains/bible/schema';

export default function BookScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<BibleBook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  const loadBook = async () => {
    try {
      const repo = BibleRepository.getInstance();
      const allBooks = repo.getAllBooks();
      const found = allBooks.find(b => b.id === bookId);
      if (found) {
        // Fetch chapter data
        const chapters = await repo.getChapters(bookId);
        setBook({ ...found, chapters });
      }
    } catch (error) {
      console.error('Error loading book:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.error}>
          <Text style={styles.errorText}>Livre non trouvé</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const chapters = book.chapters || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{book.name.fr}</Text>
        <Text style={styles.subtitle}>{chapters.length} chapitres</Text>
      </View>

      <FlatList
        data={chapters}
        keyExtractor={(item) => item.number.toString()}
        numColumns={4}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chapterItem}
            onPress={() => router.push(`/bible/chapter/${bookId}/${item.number}`)}
          >
            <Text style={styles.chapterNumber}>{item.number}</Text>
          </TouchableOpacity>
        )}
      />
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
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 4,
  },
  grid: {
    padding: 16,
    gap: 8,
  },
  chapterItem: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 'calc(1.25%)',
  },
  chapterNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
