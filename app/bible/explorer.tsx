/**
 * Bible Explorer Screen — Browse books, chapters, and verses
 * See docs/08-ui-screens.md §5
 * Figma: https://www.figma.com/design/BL5Cbn6s2aMXAtNDmAVJ8F/VersyFlow
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Complete Bible books data
const BIBLE_BOOKS = [
  // Old Testament
  { id: 'gen', name: { fr: 'Genèse', en: 'Genesis' }, testament: 'old', chapterCount: 50 },
  { id: 'exo', name: { fr: 'Exode', en: 'Exodus' }, testament: 'old', chapterCount: 40 },
  { id: 'lev', name: { fr: 'Lévitique', en: 'Leviticus' }, testament: 'old', chapterCount: 27 },
  { id: 'num', name: { fr: 'Nombres', en: 'Numbers' }, testament: 'old', chapterCount: 36 },
  { id: 'deu', name: { fr: 'Deutéronome', en: 'Deuteronomy' }, testament: 'old', chapterCount: 34 },
  { id: 'jos', name: { fr: 'Josué', en: 'Joshua' }, testament: 'old', chapterCount: 24 },
  { id: 'jdg', name: { fr: 'Juges', en: 'Judges' }, testament: 'old', chapterCount: 21 },
  { id: 'rut', name: { fr: 'Ruth', en: 'Ruth' }, testament: 'old', chapterCount: 4 },
  { id: '1sa', name: { fr: '1 Samuel', en: '1 Samuel' }, testament: 'old', chapterCount: 31 },
  { id: '2sa', name: { fr: '2 Samuel', en: '2 Samuel' }, testament: 'old', chapterCount: 24 },
  { id: '1ki', name: { fr: '1 Rois', en: '1 Kings' }, testament: 'old', chapterCount: 22 },
  { id: '2ki', name: { fr: '2 Rois', en: '2 Kings' }, testament: 'old', chapterCount: 25 },
  { id: '1ch', name: { fr: '1 Chroniques', en: '1 Chronicles' }, testament: 'old', chapterCount: 29 },
  { id: '2ch', name: { fr: '2 Chroniques', en: '2 Chronicles' }, testament: 'old', chapterCount: 36 },
  { id: 'ezr', name: { fr: 'Esdras', en: 'Ezra' }, testament: 'old', chapterCount: 10 },
  { id: 'neh', name: { fr: 'Néhémie', en: 'Nehemiah' }, testament: 'old', chapterCount: 13 },
  { id: 'est', name: { fr: 'Esther', en: 'Esther' }, testament: 'old', chapterCount: 10 },
  { id: 'job', name: { fr: 'Job', en: 'Job' }, testament: 'old', chapterCount: 42 },
  { id: 'psa', name: { fr: 'Psaumes', en: 'Psalms' }, testament: 'old', chapterCount: 150 },
  { id: 'pro', name: { fr: 'Proverbes', en: 'Proverbs' }, testament: 'old', chapterCount: 31 },
  { id: 'ecc', name: { fr: 'Ecclésiaste', en: 'Ecclesiastes' }, testament: 'old', chapterCount: 12 },
  { id: 'sng', name: { fr: 'Cantique', en: 'Song of Solomon' }, testament: 'old', chapterCount: 8 },
  { id: 'isa', name: { fr: 'Ésaïe', en: 'Isaiah' }, testament: 'old', chapterCount: 66 },
  { id: 'jer', name: { fr: 'Jérémie', en: 'Jeremiah' }, testament: 'old', chapterCount: 52 },
  { id: 'lam', name: { fr: 'Lamentations', en: 'Lamentations' }, testament: 'old', chapterCount: 5 },
  { id: 'ezk', name: { fr: 'Ézéchiel', en: 'Ezekiel' }, testament: 'old', chapterCount: 48 },
  { id: 'dan', name: { fr: 'Daniel', en: 'Daniel' }, testament: 'old', chapterCount: 12 },
  { id: 'hos', name: { fr: 'Osée', en: 'Hosea' }, testament: 'old', chapterCount: 14 },
  { id: 'jol', name: { fr: 'Joël', en: 'Joel' }, testament: 'old', chapterCount: 3 },
  { id: 'amo', name: { fr: 'Amos', en: 'Amos' }, testament: 'old', chapterCount: 9 },
  { id: 'oba', name: { fr: 'Abdias', en: 'Obadiah' }, testament: 'old', chapterCount: 1 },
  { id: 'jon', name: { fr: 'Jonas', en: 'Jonah' }, testament: 'old', chapterCount: 4 },
  { id: 'mic', name: { fr: 'Michée', en: 'Micah' }, testament: 'old', chapterCount: 7 },
  { id: 'nah', name: { fr: 'Nahum', en: 'Nahum' }, testament: 'old', chapterCount: 3 },
  { id: 'hab', name: { fr: 'Habacuc', en: 'Habakkuk' }, testament: 'old', chapterCount: 3 },
  { id: 'zep', name: { fr: 'Sophonie', en: 'Zephaniah' }, testament: 'old', chapterCount: 3 },
  { id: 'hag', name: { fr: 'Aggée', en: 'Haggai' }, testament: 'old', chapterCount: 2 },
  { id: 'zec', name: { fr: 'Zacharie', en: 'Zechariah' }, testament: 'old', chapterCount: 14 },
  { id: 'mal', name: { fr: 'Malachie', en: 'Malachi' }, testament: 'old', chapterCount: 4 },
  // New Testament
  { id: 'mat', name: { fr: 'Matthieu', en: 'Matthew' }, testament: 'new', chapterCount: 28 },
  { id: 'mrk', name: { fr: 'Marc', en: 'Mark' }, testament: 'new', chapterCount: 16 },
  { id: 'luk', name: { fr: 'Luc', en: 'Luke' }, testament: 'new', chapterCount: 24 },
  { id: 'joh', name: { fr: 'Jean', en: 'John' }, testament: 'new', chapterCount: 21 },
  { id: 'act', name: { fr: 'Actes', en: 'Acts' }, testament: 'new', chapterCount: 28 },
  { id: 'rom', name: { fr: 'Romains', en: 'Romans' }, testament: 'new', chapterCount: 16 },
  { id: '1co', name: { fr: '1 Corinthiens', en: '1 Corinthians' }, testament: 'new', chapterCount: 16 },
  { id: '2co', name: { fr: '2 Corinthiens', en: '2 Corinthians' }, testament: 'new', chapterCount: 13 },
  { id: 'gal', name: { fr: 'Galates', en: 'Galatians' }, testament: 'new', chapterCount: 6 },
  { id: 'eph', name: { fr: 'Éphésiens', en: 'Ephesians' }, testament: 'new', chapterCount: 6 },
  { id: 'php', name: { fr: 'Philippiens', en: 'Philippians' }, testament: 'new', chapterCount: 4 },
  { id: 'col', name: { fr: 'Colossiens', en: 'Colossians' }, testament: 'new', chapterCount: 4 },
  { id: '1th', name: { fr: '1 Thessaloniciens', en: '1 Thessalonians' }, testament: 'new', chapterCount: 5 },
  { id: '2th', name: { fr: '2 Thessaloniciens', en: '2 Thessalonians' }, testament: 'new', chapterCount: 3 },
  { id: '1ti', name: { fr: '1 Timothée', en: '1 Timothy' }, testament: 'new', chapterCount: 6 },
  { id: '2ti', name: { fr: '2 Timothée', en: '2 Timothy' }, testament: 'new', chapterCount: 4 },
  { id: 'tit', name: { fr: 'Tite', en: 'Titus' }, testament: 'new', chapterCount: 3 },
  { id: 'phm', name: { fr: 'Philémon', en: 'Philemon' }, testament: 'new', chapterCount: 1 },
  { id: 'heb', name: { fr: 'Hébreux', en: 'Hebrews' }, testament: 'new', chapterCount: 13 },
  { id: 'jam', name: { fr: 'Jacques', en: 'James' }, testament: 'new', chapterCount: 5 },
  { id: '1pe', name: { fr: '1 Pierre', en: '1 Peter' }, testament: 'new', chapterCount: 5 },
  { id: '2pe', name: { fr: '2 Pierre', en: '2 Peter' }, testament: 'new', chapterCount: 3 },
  { id: '1jn', name: { fr: '1 Jean', en: '1 John' }, testament: 'new', chapterCount: 5 },
  { id: '2jn', name: { fr: '2 Jean', en: '2 John' }, testament: 'new', chapterCount: 1 },
  { id: '3jn', name: { fr: '3 Jean', en: '3 John' }, testament: 'new', chapterCount: 1 },
  { id: 'jud', name: { fr: 'Jude', en: 'Jude' }, testament: 'new', chapterCount: 1 },
  { id: 'rev', name: { fr: 'Apocalypse', en: 'Revelation' }, testament: 'new', chapterCount: 22 },
];

type ViewMode = 'books' | 'chapters' | 'verses';

interface SelectedBook {
  id: string;
  name: string;
  chapterCount: number;
}

export default function BibleExplorerScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('books');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('list');

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return BIBLE_BOOKS;
    return BIBLE_BOOKS.filter(book =>
      book.name.fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.name.en.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const oldTestament = filteredBooks.filter(b => b.testament === 'old');
  const newTestament = filteredBooks.filter(b => b.testament === 'new');

  const handleBookPress = (book: typeof BIBLE_BOOKS[0]) => {
    setSelectedBook({ id: book.id, name: book.name.fr, chapterCount: book.chapterCount });
    setViewMode('chapters');
  };

  const handleChapterPress = (chapter: number) => {
    setSelectedChapter(chapter);
    setViewMode('verses');
  };

  const handleBack = () => {
    if (viewMode === 'verses') {
      setViewMode('chapters');
      setSelectedChapter(null);
    } else if (viewMode === 'chapters') {
      setViewMode('books');
      setSelectedBook(null);
    }
  };

  const handleMemorize = (verseRef: string) => {
    router.push({
      pathname: '/memorization/session',
      params: {
        reference: verseRef,
        text: 'Car Dieu a tellement aimé le monde...',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {viewMode !== 'books' && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {viewMode === 'books' && 'Explorer la Bible'}
            {viewMode === 'chapters' && selectedBook?.name}
            {viewMode === 'verses' && `${selectedBook?.name} ${selectedChapter}`}
          </Text>
          {viewMode === 'chapters' && (
            <Text style={styles.headerSubtitle}>{selectedBook?.chapterCount} chapitres</Text>
          )}
          {viewMode === 'verses' && selectedBook && (
            <Text style={styles.headerSubtitle}>Chapitre {selectedChapter}</Text>
          )}
        </View>
        {viewMode === 'books' && (
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setView(view === 'list' ? 'grid' : 'list')}
          >
            <Ionicons name={view === 'list' ? 'apps' : 'list'} size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      {viewMode === 'books' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un livre..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="colors.textMuted"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Books View */}
        {viewMode === 'books' && (
          <>
            {/* Quick Categories */}
            <View style={styles.quickSearch}>
              <Text style={styles.quickSearchTitle}>Catégories rapides</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickSearchScroll}>
                {[
                  { label: 'Évangiles', books: ['mat', 'mrk', 'luk', 'joh'] },
                  { label: 'Psaumes', books: ['psa'] },
                  { label: 'Proverbes', books: ['pro'] },
                  { label: 'Apocalypse', books: ['rev'] },
                ].map((category) => (
                  <TouchableOpacity key={category.label} style={styles.quickSearchPill}>
                    <Text style={styles.quickSearchPillText}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Old Testament */}
            <View style={styles.testamentSection}>
              <View style={styles.testamentHeader}>
                <View style={styles.testamentIconContainer}>
                  <Ionicons name="book" size={20} color={colors.primary} />
                </View>
                <Text style={styles.testamentTitle}>Ancien Testament</Text>
                <Text style={styles.testamentCount}>{oldTestament.length} livres</Text>
              </View>
              {view === 'list' ? (
                <View style={styles.bookList}>
                  {oldTestament.map((book) => (
                    <TouchableOpacity
                      key={book.id}
                      style={styles.bookItem}
                      onPress={() => handleBookPress(book)}
                    >
                      <View style={styles.bookInfo}>
                        <Text style={styles.bookName}>{book.name.fr}</Text>
                        <Text style={styles.bookMeta}>{book.chapterCount} chapitres</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.bookGrid}>
                  {oldTestament.map((book) => (
                    <TouchableOpacity
                      key={book.id}
                      style={styles.bookGridItem}
                      onPress={() => handleBookPress(book)}
                    >
                      <Text style={styles.bookGridName}>{book.name.fr}</Text>
                      <Text style={styles.bookGridMeta}>{book.chapterCount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* New Testament */}
            <View style={styles.testamentSection}>
              <View style={styles.testamentHeader}>
                <View style={[styles.testamentIconContainer, { backgroundColor: colors.success }]}>
                  <Ionicons name="cross" size={20} color={colors.surface} />
                </View>
                <Text style={styles.testamentTitle}>Nouveau Testament</Text>
                <Text style={styles.testamentCount}>{newTestament.length} livres</Text>
              </View>
              {view === 'list' ? (
                <View style={styles.bookList}>
                  {newTestament.map((book) => (
                    <TouchableOpacity
                      key={book.id}
                      style={styles.bookItem}
                      onPress={() => handleBookPress(book)}
                    >
                      <View style={styles.bookInfo}>
                        <Text style={styles.bookName}>{book.name.fr}</Text>
                        <Text style={styles.bookMeta}>{book.chapterCount} chapitres</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.bookGrid}>
                  {newTestament.map((book) => (
                    <TouchableOpacity
                      key={book.id}
                      style={styles.bookGridItem}
                      onPress={() => handleBookPress(book)}
                    >
                      <Text style={styles.bookGridName}>{book.name.fr}</Text>
                      <Text style={styles.bookGridMeta}>{book.chapterCount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Chapters View */}
        {viewMode === 'chapters' && selectedBook && (
          <View style={styles.chaptersContainer}>
            <View style={styles.chaptersGrid}>
              {Array.from({ length: selectedBook.chapterCount }, (_, i) => i + 1).map((chapter) => (
                <TouchableOpacity
                  key={chapter}
                  style={styles.chapterTile}
                  onPress={() => handleChapterPress(chapter)}
                >
                  <Text style={styles.chapterNumber}>{chapter}</Text>
                  <Text style={styles.chapterVerses}>
                    {Math.floor(Math.random() * 30) + 10}v
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Verses View */}
        {viewMode === 'verses' && selectedBook && selectedChapter && (
          <View style={styles.versesContainer}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((verse) => (
              <TouchableOpacity
                key={verse}
                style={styles.verseCard}
                onPress={() => handleMemorize(`${selectedBook.name} ${selectedChapter}:${verse}`)}
              >
                <View style={styles.verseHeader}>
                  <View style={styles.verseNumberBadge}>
                    <Text style={styles.verseNumber}>{verse}</Text>
                  </View>
                  <View style={styles.verseActions}>
                    <TouchableOpacity style={styles.verseAction}>
                      <Ionicons name="bookmark-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.verseAction}>
                      <Ionicons name="share-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.verseText}>
                  {verse === 1 && 'Au commencement, Dieu créa les cieux et la terre.'}
                  {verse === 2 && 'Et la terre était informe et vide; et des ténèbres étaient à la surface de l\'abîme.'}
                  {verse === 3 && 'Dieu dit: Que la lumière soit! Et la lumière fut.'}
                  {verse > 3 && 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
                </Text>
                <View style={styles.verseFooter}>
                  <TouchableOpacity
                    style={styles.memorizeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleMemorize(`${selectedBook.name} ${selectedChapter}:${verse}`);
                    }}
                  >
                    <Ionicons name="learn" size={16} color={colors.surface} />
                    <Text style={styles.memorizeButtonText}>Mémoriser</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceTint,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    height: '100%',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Quick Search
  quickSearch: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickSearchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 8,
  },
  quickSearchScroll: {
    flexDirection: 'row',
  },
  quickSearchPill: {
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickSearchPillText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },

  // Testament Section
  testamentSection: {
    paddingTop: 16,
  },
  testamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  testamentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testamentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  testamentCount: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // Book List
  bookList: {
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    marginHorizontal: 12,
    borderRadius: 16,
    overflow: 'hidden',
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
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceTint,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bookMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Book Grid
  bookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  bookGridItem: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  bookGridName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  bookGridMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Chapters
  chaptersContainer: {
    padding: 20,
  },
  chaptersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  chapterTile: {
    width: '13.33%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
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
  chapterNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chapterVerses: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Verses
  versesContainer: {
    padding: 20,
    gap: 16,
  },
  verseCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
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
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  verseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  verseAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 26,
    flex: 1,
  },
  verseFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceTint,
  },
  memorizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  memorizeButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
});
