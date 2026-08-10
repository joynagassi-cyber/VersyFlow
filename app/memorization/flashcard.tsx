/**
 * Flashcard Screen — Interactive flashcard memorization with swipe
 * Implements spaced repetition learning with visual cards
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = 400;

interface Flashcard {
  id: string;
  reference: string;
  front: string;
  back: string;
  mastered: boolean;
}

const SAMPLE_CARDS: Flashcard[] = [
  {
    id: '1',
    reference: 'Jean 3:16',
    front: 'Car Dieu a tant aimé le monde...',
    back: 'Car Dieu a tellement aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu\'il ait la vie éternelle.',
    mastered: false,
  },
  {
    id: '2',
    reference: 'Psaume 23:1',
    front: 'L\'Éternel est mon berger...',
    back: 'L\'Éternel est mon berger: je ne manquerai de rien.',
    mastered: true,
  },
  {
    id: '3',
    reference: 'Romains 8:28',
    front: 'Nous savons d\'ailleurs que...',
    back: 'Nous savons d\'ailleurs que toutes choses contribuent au bien de ceux qui aiment Dieu.',
    mastered: false,
  },
  {
    id: '4',
    reference: 'Philippiens 4:13',
    front: 'Je puis tout par celui...',
    back: 'Je puis tout par celui qui me fortifie.',
    mastered: true,
  },
];

export default function FlashcardScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>(SAMPLE_CARDS);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  const rotateAnim = new Animated.Value(0);

  const currentCard = cards[currentIndex];

  const panResponder = useCallback(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
        rotateAnim.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        slideAnim.setValue(gestureState.dx / 10);
        rotateAnim.setValue(gestureState.dx / 20);

        if (gestureState.dx > 50) {
          setSwipeDirection('right');
        } else if (gestureState.dx < -50) {
          setSwipeDirection('left');
        } else {
          setSwipeDirection(null);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 100) {
          handleSwipe('right');
        } else if (gestureState.dx < -100) {
          handleSwipe('left');
        } else {
          // Reset to center
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
          Animated.spring(rotateAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
          setSwipeDirection(null);
        }
      },
    }),
    [currentIndex, cards]
  );

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const translateX = direction === 'right' ? width + 100 : -(width + 100);

      Animated.timing(slideAnim, {
        toValue: translateX,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (direction === 'right') {
          // Mastered - move to next
          setCards((prev) =>
            prev.map((card, idx) =>
              idx === currentIndex ? { ...card, mastered: true } : card
            )
          );
        }
        // Move to next card
        setCurrentIndex((prev) => (prev + 1) % cards.length);
        setIsFlipped(false);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    },
    [currentIndex, cards.length]
  );

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
    Animated.timing(rotateAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const handleDismiss = useCallback(() => {
    router.back();
  }, []);

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Flashcards</Text>
          <Text style={styles.headerSubtitle}>
            {currentIndex + 1} / {cards.length}
          </Text>
        </View>

        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Card stack */}
      <View style={styles.cardContainer}>
        {/* Background cards */}
        {cards.slice(currentIndex + 1, currentIndex + 3).map((_, idx) => (
          <View
            key={`bg-${idx}`}
            style={[
              styles.backgroundCard,
              { zIndex: cards.length - idx - 2 },
            ]}
          >
            <View style={styles.backgroundCardContent} />
          </View>
        ))}

        {/* Main card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: slideAnim },
                { rotate: `${rotateAnim.value}deg` },
              ],
              opacity: fadeAnim,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.cardInner}
            onPress={handleFlip}
            activeOpacity={0.9}
          >
            {!isFlipped ? (
              // Front side
              <View style={styles.cardSide}>
                <View style={styles.cardBadge}>
                  <Ionicons
                    name={currentCard.mastered ? 'checkmark-circle' : 'help-circle'}
                    size={20}
                    color={currentCard.mastered ? 'colors.success' : colors.primary}
                  />
                  <Text style={styles.cardBadgeText}>
                    {currentCard.mastered ? 'Maîtrisé' : 'À mémoriser'}
                  </Text>
                </View>
                <Text style={styles.cardReference}>{currentCard.reference}</Text>
                <Text style={styles.cardPrompt}>Complète ce verset:</Text>
                <Text style={styles.cardText}>{currentCard.front}</Text>
                <View style={styles.flipHint}>
                  <Ionicons name="refresh" size={16} color={colors.textMuted} />
                  <Text style={styles.flipHintText}>Tape pour voir la suite</Text>
                </View>
              </View>
            ) : (
              // Back side
              <View style={styles.cardSide}>
                <View style={styles.cardBadge}>
                  <Ionicons name="book" size={20} color={colors.primary} />
                  <Text style={styles.cardBadgeText}>Verset complet</Text>
                </View>
                <Text style={styles.cardReference}>{currentCard.reference}</Text>
                <Text style={styles.cardFullText}>{currentCard.back}</Text>
                <View style={styles.flipHint}>
                  <Ionicons name="refresh" size={16} color={colors.textMuted} />
                  <Text style={styles.flipHintText}>Tape pour revenir</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Swipe instructions */}
      <View style={styles.instructions}>
        <View style={styles.instructionItem}>
          <Ionicons name="hand-left" size={24} color={colors.textMuted} />
          <Text style={styles.instructionText}>Glisser gauche: À revoir</Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="hand-right" size={24} color={colors.textMuted} />
          <Text style={styles.instructionText}>Glisser droite: Maîtrisé</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonLeft]}
          onPress={() => handleSwipe('left')}
        >
          <Ionicons name="refresh" size={28} color={colors.error} />
          <Text style={[styles.actionButtonText, styles.actionButtonLeftText]}>
            À revoir
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonRight]}
          onPress={() => handleSwipe('right')}
        >
          <Ionicons name="checkmark" size={28} color={colors.success} />
          <Text style={[styles.actionButtonText, styles.actionButtonRightText]}>
            Maîtrisé
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  // Card container
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backgroundCard: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    backgroundColor: colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backgroundCardContent: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: colors.surfaceTint,
    margin: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardInner: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardSide: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  cardReference: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
  },
  cardPrompt: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
  },
  cardText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 32,
    marginTop: 12,
  },
  cardFullText: {
    fontSize: 18,
    color: colors.textSecondary,
    lineHeight: 28,
    marginTop: 12,
    flex: 1,
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  flipHintText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Instructions
  instructions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionButtonLeft: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.error,
  },
  actionButtonLeftText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 16,
  },
  actionButtonRight: {
    backgroundColor: colors.success,
  },
  actionButtonRightText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  actionButtonText: {
    fontWeight: '700',
  },
});
