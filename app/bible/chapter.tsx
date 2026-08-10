/**
 * Chapter Screen — Display verses from a chapter
 * Phase 8.4: Ajout de la sélection de plage de versets pour mémorisation de passages
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BibleRepository } from '@/domains/bible/repository';
import { BibleVerse } from '@/domains/bible/schema';
import { ContentReference, MemorizationTarget } from '@/domains/memorization/entities';

export default function ChapterScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const { bookId, chapterNumber } = useLocalSearchParams<{ bookId: string, chapterNumber: string }>();
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookName, setBookName] = useState('');

  // Passage selection state
  const [selectedStartVerse, setSelectedStartVerse] = useState<number | null>(null);
  const [selectedEndVerse, setSelectedEndVerse] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    loadChapter();
  }, [bookId, chapterNumber]);

  const loadChapter = async () => {
    try {
      const repo = BibleRepository.getInstance();
      const book = repo.getBookById(bookId);
      if (book) {
        setBookName(book.name.fr);
      }

      const chapterData = await repo.getChapter(bookId, parseInt(chapterNumber));
      if (chapterData) {
        setVerses(chapterData.verses || []);
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle verse tap for selection
   * Single tap = select verse for memorization
   * Long press = start passage selection
   */
  const handleVersePress = useCallback((verseNumber: number) => {
    if (!isSelecting) {
      // Normal mode: navigate to memorization session for single verse
      const verse = verses.find(v => v.verseNumber === verseNumber);
      if (!verse) return;

      const referenceDisplay = `${bookName} ${chapterNumber}:${verseNumber}`;
      router.push(`/memorization/session?bookId=${bookId}&chapter=${chapterNumber}&verse=${verseNumber}&text=${encodeURIComponent(verse.text)}&reference=${encodeURIComponent(referenceDisplay)}`);
      return;
    }

    // Selection mode
    if (selectedStartVerse === null) {
      // First tap — set start
      setSelectedStartVerse(verseNumber);
      setSelectedEndVerse(verseNumber);
    } else if (selectedEndVerse === null) {
      // Second tap — set end
      setSelectedEndVerse(verseNumber);
      setIsSelecting(false);
    } else {
      // Reset selection and start new
      setSelectedStartVerse(verseNumber);
      setSelectedEndVerse(verseNumber);
    }
  }, [isSelecting, selectedStartVerse, selectedEndVerse, verses, bookId, chapterNumber, bookName, router]);

  /**
   * Start passage selection mode
   */
  const startPassageSelection = useCallback(() => {
    setIsSelecting(true);
    setSelectedStartVerse(null);
    setSelectedEndVerse(null);
  }, []);

  /**
   * Cancel passage selection
   */
  const cancelPassageSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectedStartVerse(null);
    setSelectedEndVerse(null);
  }, []);

  /**
   * Memorize selected passage
   */
  const memorizePassage = useCallback(() => {
    if (selectedStartVerse === null || selectedEndVerse === null) return;

    const start = Math.min(selectedStartVerse, selectedEndVerse);
    const end = Math.max(selectedStartVerse, selectedEndVerse);

    const passageVerses = verses.filter(v => v.verseNumber >= start && v.verseNumber <= end);
    if (passageVerses.length === 0) return;

    const verseTexts = passageVerses.map(v => v.text);

    const reference: ContentReference = {
      bookId,
      chapter: parseInt(chapterNumber),
      startVerse: start,
      endVerse: end,
      translationId: 'lsg',
    };

    const displayReference = `${bookName} ${chapterNumber}:${start}${end > start ? '-' + end : ''}`;
    const target: MemorizationTarget = {
      id: `target-${bookId}-${chapterNumber}-${start}-${end}`,
      type: 'passage',
      reference,
      displayReference,
      createdAt: Date.now(),
    };

    // Navigate to session with passage data
    router.push(
      `/memorization/session?targetId=${encodeURIComponent(target.id)}&targetType=passage&bookId=${bookId}&chapter=${chapterNumber}&startVerse=${start}&endVerse=${end}&verseTexts=${encodeURIComponent(JSON.stringify(verseTexts))}&reference=${encodeURIComponent(displayReference)}`
    );
  }, [selectedStartVerse, selectedEndVerse, verses, bookId, chapterNumber, bookName, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {bookName} {chapterNumber}
        </Text>
        {isSelecting ? (
          <TouchableOpacity onPress={cancelPassageSelection} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startPassageSelection} style={styles.selectButton}>
            <Text style={styles.selectText}>Sélectionner</Text>
          </TouchableOpacity>
        )}
      </View>

      {isSelecting && (
        <View style={styles.selectionBanner}>
          <Text style={styles.selectionBannerText}>
            {selectedStartVerse !== null && selectedEndVerse !== null
              ? `${selectedStartVerse} - ${selectedEndVerse} — ${Math.abs(selectedEndVerse - selectedStartVerse) + 1} verset${Math.abs(selectedEndVerse - selectedStartVerse) > 0 ? 's' : ''} — Tapez un verset pour terminer`
              : selectedStartVerse !== null
              ? `Verset ${selectedStartVerse} sélectionné — Tapez un deuxième verset pour définir la plage`
              : 'Tapez un verset pour commencer la sélection'}
          </Text>
          {selectedStartVerse !== null && selectedEndVerse !== null && (
            <TouchableOpacity style={styles.memorizeButton} onPress={memorizePassage}>
              <Text style={styles.memorizeButtonText}>Mémoriser le passage</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {verses.map((verse) => {
          const minSel = selectedStartVerse !== null ? Math.min(selectedStartVerse, selectedEndVerse ?? selectedStartVerse) : null;
          const maxSel = selectedEndVerse !== null ? Math.max(selectedStartVerse ?? 0, selectedEndVerse) : null;
          const isSelected = minSel !== null && maxSel !== null &&
            verse.verseNumber >= minSel && verse.verseNumber <= maxSel;
          const isStartVerse = verse.verseNumber === selectedStartVerse;
          const isEndVerse = verse.verseNumber === selectedEndVerse;

          return (
            <View
              key={verse.verseNumber}
              style={[
                styles.verseContainer,
                isSelected && styles.verseContainerSelected,
                isStartVerse && styles.verseContainerStart,
                isEndVerse && styles.verseContainerEnd,
              ]}
              onLongPress={isSelecting ? () => handleVersePress(verse.verseNumber) : undefined}
            >
              <Text style={[styles.verseNumber, isStartVerse && styles.verseNumberSelected]}>
                {verse.verseNumber}
              </Text>
              <Text style={styles.verseText}>{verse.text}</Text>
              {!isSelecting && (
                <View style={styles.verseActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleVersePress(verse.verseNumber)}
                  >
                    <Text style={styles.actionText}>Mémoriser</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  selectButton: {
    padding: 8,
    marginRight: -8,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  cancelButton: {
    padding: 8,
    marginRight: -8,
  },
  cancelText: {
    fontSize: 14,
    color: colors.error,
  },
  selectionBanner: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    gap: 8,
  },
  selectionBannerText: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  memorizeButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  memorizeButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  verseContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  verseContainerSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  verseContainerStart: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  verseContainerEnd: {
    borderRightWidth: 4,
    borderRightColor: colors.primary,
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  verseNumberSelected: {
    color: colors.surface,
  },
  verseText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 26,
    marginBottom: 12,
  },
  verseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
});
