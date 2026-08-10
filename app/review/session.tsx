/**
 * Review Session Screen — Immersive review with FSRS rating
 * See docs/08-ui-screens.md §9
 * Figma: https://www.figma.com/design/BL5Cbn6s2aMXAtNDmAVJ8F/VersyFlow
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Rating as FsrsRating } from '@/domains/fsrs';
import { MemorizationService } from '@/domains/memorization/service';
import { IFsrsEngine, Sm2FallbackEngine } from '@/domains/fsrs';
import { MmkvStorage } from '@/infrastructure/storage';
import { getFsrsEngine } from '@/services/fsrs-factory';

// Sample data for demo
const SAMPLE_REVIEWS = [
  {
    id: '1',
    reference: 'Jean 3:16',
    text: 'Car Dieu a tellement aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu\'il ait la vie éternelle.',
    words: ['Car', 'Dieu', 'a', 'tellement', 'aimé', 'le', 'monde', 'qu\'il', 'a', 'donné', 'son', 'Fils', 'unique'],
    stability: 3.5,
    difficulty: 5.0,
    elapsedDays: 2,
    nextInterval: 4,
  },
  {
    id: '2',
    reference: 'Psaume 23:1',
    text: 'L\'Éternel est mon berger: je ne manquerai de rien.',
    words: ['L\'Éternel', 'est', 'mon', 'berger', ':', 'je', 'ne', 'manquerai', 'de', 'rien'],
    stability: 5.2,
    difficulty: 3.0,
    elapsedDays: 5,
    nextInterval: 7,
  },
  {
    id: '3',
    reference: 'Romains 8:28',
    text: 'Nous savons d\'ailleurs que toutes choses contribuent au bien de ceux qui aiment Dieu.',
    words: ['Nous', 'savons', 'd\'ailleurs', 'que', 'toutes', 'choses', 'contribuent', 'au', 'bien', 'de', 'ceux', 'qui', 'aiment', 'Dieu'],
    stability: 1.8,
    difficulty: 6.5,
    elapsedDays: 1,
    nextInterval: 2,
  },
];

export default function ReviewSessionScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedWords, setRevealedWords] = useState<Set<number>>(new Set());
  const [isRevealed, setIsRevealed] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState<FsrsRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState(SAMPLE_REVIEWS);

  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex]);

  const currentReview = reviews[currentIndex];
  const progress = ((currentIndex + 1) / reviews.length) * 100;

  const handleReveal = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }),
        ]).start();
      }, 200);
    }
  };

  const handleRating = (rating: FsrsRating) => {
    setSelectedRating(rating);
    setShowRating(true);
  };

  const handleSubmitRating = async () => {
    // Simulate saving rating
    await new Promise(resolve => setTimeout(resolve, 500));

    if (currentIndex < reviews.length - 1) {
      // Next review
      setCurrentIndex(prev => prev + 1);
      setRevealedWords(new Set());
      setIsRevealed(false);
      setShowRating(false);
      setSelectedRating(null);
    } else {
      // Session complete
      router.replace('/review/queue');
    }
  };

  const handleSkip = () => {
    if (currentIndex < reviews.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setRevealedWords(new Set());
      setIsRevealed(false);
      setShowRating(false);
      setSelectedRating(null);
    } else {
      router.replace('/review/queue');
    }
  };

  const getRatingConfig = (rating: FsrsRating) => {
    switch (rating) {
      case FsrsRating.AGAIN:
        return { color: colors.error, label: 'À revoir', days: 1 };
      case FsrsRating.HARD:
        return { color: colors.warning, label: 'Difficile', days: 2 };
      case FsrsRating.GOOD:
        return { color: '#4CD964', label: 'Bon', days: 4 };
      case FsrsRating.EASY:
        return { color: colors.info, label: 'Facile', days: 7 };
      default:
        return { color: colors.primary, label: 'Bon', days: 3 };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Chargement de la session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {reviews.length}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Review Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Reference Label */}
          <View style={styles.referenceBadge}>
            <Ionicons name="bookmark" size={16} color={colors.primary} />
            <Text style={styles.referenceText}>{currentReview.reference}</Text>
          </View>

          {/* Verse Display */}
          <TouchableOpacity
            style={styles.verseCard}
            onPress={handleReveal}
            activeOpacity={0.95}
          >
            {!isRevealed ? (
              // Hidden state
              <View style={styles.hiddenState}>
                <View style={styles.wordChips}>
                  {currentReview.words.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.wordChip,
                        revealedWords.has(idx) && styles.wordChipRevealed,
                      ]}
                    >
                      {revealedWords.has(idx) ? (
                        <Text style={styles.wordChipText}>{currentReview.words[idx]}</Text>
                      ) : (
                        <Text style={styles.wordChipPlaceholder}>•••</Text>
                      )}
                    </View>
                  ))}
                </View>
                <View style={styles.tapHint}>
                  <Ionicons name="hand" size={20} color={colors.primary} />
                  <Text style={styles.tapHintText}>Tape pour révéler le verset</Text>
                </View>
              </View>
            ) : (
              // Revealed state
              <View style={styles.revealedState}>
                <Text style={styles.verseText}>{currentReview.text}</Text>
                <View style={styles.revealHint}>
                  <Ionicons name="refresh" size={16} color={colors.textMuted} />
                  <Text style={styles.revealHintText}>Tape pour noter ta réponse</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Rating Section */}
        {isRevealed && !showRating && (
          <View style={styles.ratingSection}>
            <Text style={styles.ratingQuestion}>
              Comment te souvenais-tu de ce verset ?
            </Text>
            <View style={styles.ratingButtons}>
              {[
                { id: FsrsRating.AGAIN, label: 'À revoir', color: colors.error, icon: 'refresh' },
                { id: FsrsRating.HARD, label: 'Difficile', color: colors.warning, icon: 'remove' },
                { id: FsrsRating.GOOD, label: 'Bon', color: '#4CD964', icon: 'checkmark' },
                { id: FsrsRating.EASY, label: 'Facile', color: colors.info, icon: 'star' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.ratingButton, { backgroundColor: option.color }]}
                  onPress={() => handleRating(option.id as FsrsRating)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={option.icon as any} size={24} color={colors.surface} />
                  <Text style={styles.ratingButtonText}>{option.label}</Text>
                  <Text style={styles.ratingButtonDays}>
                    {getRatingConfig(option.id as FsrsRating).days}j
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* FSRS Feedback */}
        {showRating && selectedRating && (
          <Animated.View
            style={[
              styles.feedbackCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })}],
              },
            ]}
          >
            <View style={styles.feedbackHeader}>
              <Ionicons
                name="checkmark-circle"
                size={32}
                color={getRatingConfig(selectedRating).color}
              />
              <Text style={styles.feedbackTitle}>
                {getRatingConfig(selectedRating).label}
              </Text>
            </View>
            <View style={styles.feedbackDetails}>
              <View style={styles.feedbackRow}>
                <Text style={styles.feedbackLabel}>Prochain rappel:</Text>
                <Text style={styles.feedbackValue}>
                  dans {getRatingConfig(selectedRating).days} jour
                  {getRatingConfig(selectedRating).days > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.feedbackRow}>
                <Text style={styles.feedbackLabel}>Stabilité:</Text>
                <Text style={styles.feedbackValue}>{currentReview.stability.toFixed(1)}j</Text>
              </View>
              <View style={styles.feedbackRow}>
                <Text style={styles.feedbackLabel}>Difficulté:</Text>
                <Text style={styles.feedbackValue}>{currentReview.difficulty.toFixed(1)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleSubmitRating}
              activeOpacity={0.85}
            >
              <Text style={styles.continueButtonText}>
                {currentIndex < reviews.length - 1 ? 'Continuer' : 'Terminer'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textMuted,
  },

  // Progress Bar
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  progressTextContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerRight: {
    width: 56,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },

  // Card Container
  cardContainer: {
    marginBottom: 24,
  },
  referenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  referenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  verseCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    minHeight: 200,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  hiddenState: {
    alignItems: 'center',
  },
  wordChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  wordChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceTint,
    minWidth: 40,
    alignItems: 'center',
  },
  wordChipRevealed: {
    backgroundColor: colors.primary,
  },
  wordChipText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  wordChipPlaceholder: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tapHintText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  revealedState: {
    alignItems: 'center',
  },
  verseText: {
    fontSize: 18,
    color: colors.textPrimary,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '500',
  },
  revealHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  revealHintText: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // Rating Section
  ratingSection: {
    marginBottom: 24,
  },
  ratingQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  ratingButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  ratingButtonDays: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Feedback Card
  feedbackCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  feedbackDetails: {
    marginBottom: 20,
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceTint,
  },
  feedbackLabel: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  feedbackValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  continueButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
