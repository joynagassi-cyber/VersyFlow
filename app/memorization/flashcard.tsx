/**
 * Flashcard Screen — Interactive flashcard memorization with swipe
 * Implements spaced repetition learning with visual cards
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { shadowCss } from '@/theme/tokens';
import { useRouter } from '@/hooks/useIonicNavigation';
import { IonIcon } from '@/components/ui/Primitives';
import {
  book,
  checkmark,
  checkmarkCircle,
  close,
  handLeft,
  handRight,
  helpCircle,
  refresh,
  settings,
} from 'ionicons/icons';

const { width } = Dimensions.getWindowDimensions();
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
    back: "Car Dieu a tellement aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu'il ait la vie éternelle.",
    mastered: false,
  },
  {
    id: '2',
    reference: 'Psaume 23:1',
    front: "L'Éternel est mon berger...",
    back: "L'Éternel est mon berger: je ne manquerai de rien.",
    mastered: true,
  },
  {
    id: '3',
    reference: 'Romains 8:28',
    front: "Nous savons d'ailleurs que...",
    back: "Nous savons d'ailleurs que toutes choses contribuent au bien de ceux qui aiment Dieu.",
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
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          ...shadowCss('md'),
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
          ...shadowCss('md'),
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
          overflow: 'hidden',
        },
        backgroundCard: {
          position: 'absolute',
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 24,
          backgroundColor: colors.surface,
          ...shadowCss('md'),
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
          ...shadowCss('lg'),
          position: 'relative',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
        },
        cardInner: {
          flex: 1,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          width: '100%',
          height: '100%',
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
          ...shadowCss('md'),
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
      }),
    [colors],
  );

  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>(SAMPLE_CARDS);
  const [cardTransform, setCardTransform] = useState('none');
  const [cardOpacity, setCardOpacity] = useState(1);
  const swipeStartX = useRef<number | null>(null);

  const currentCard = cards[currentIndex];

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const slideOut = direction === 'right' ? width + 100 : -(width + 100);
      setCardTransform(`translateX(${slideOut}px) rotate(${slideOut / 40}deg)`);
      setCardOpacity(0);

      setTimeout(() => {
        if (direction === 'right') {
          setCards((prev) =>
            prev.map((card, idx) =>
              idx === currentIndex ? { ...card, mastered: true } : card
            )
          );
        }
        setCurrentIndex((prev) => (prev + 1) % cards.length);
        setIsFlipped(false);
        setCardTransform('none');
        setCardOpacity(1);
      }, 300);
    },
    [currentIndex, cards.length]
  );

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleDismiss = useCallback(() => {
    router.back();
  }, []);

  // Pointer event handlers for swipe simulation
  const handlePointerDown = (e: React.PointerEvent) => {
    swipeStartX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    setCardTransform(`translateX(${dx}px) rotate(${dx / 40}deg)`);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    swipeStartX.current = null;

    if (dx > 100) {
      handleSwipe('right');
    } else if (dx < -100) {
      handleSwipe('left');
    } else {
      setCardTransform('none');
    }
  };

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <IonIcon icon={close} size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Flashcards</Text>
          <Text style={styles.headerSubtitle}>
            {currentIndex + 1} / {cards.length}
          </Text>
        </View>

        <TouchableOpacity style={styles.settingsButton}>
          <IonIcon icon={settings} size={24} color={colors.textSecondary} />
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
              { zIndex: 10 - idx },
            ]}
          >
            <View style={styles.backgroundCardContent} />
          </View>
        ))}

        {/* Main card */}
        <View
          style={[
            styles.card,
            {
              transform: cardTransform,
              opacity: cardOpacity,
            },
          ]}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
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
                  <IonIcon
                    icon={currentCard.mastered ? checkmarkCircle : helpCircle}
                    size={20}
                    color={currentCard.mastered ? colors.success : colors.primary}
                  />
                  <Text style={styles.cardBadgeText}>
                    {currentCard.mastered ? 'Maîtrisé' : 'À mémoriser'}
                  </Text>
                </View>
                <Text style={styles.cardReference}>{currentCard.reference}</Text>
                <Text style={styles.cardPrompt}>Complète ce verset:</Text>
                <Text style={styles.cardText}>{currentCard.front}</Text>
                <View style={styles.flipHint}>
                  <IonIcon icon={refresh} size={16} color={colors.textMuted} />
                  <Text style={styles.flipHintText}>Tape pour voir la suite</Text>
                </View>
              </View>
            ) : (
              // Back side
              <View style={styles.cardSide}>
                <View style={styles.cardBadge}>
                  <IonIcon icon={book} size={20} color={colors.primary} />
                  <Text style={styles.cardBadgeText}>Verset complet</Text>
                </View>
                <Text style={styles.cardReference}>{currentCard.reference}</Text>
                <Text style={styles.cardFullText}>{currentCard.back}</Text>
                <View style={styles.flipHint}>
                  <IonIcon icon={refresh} size={16} color={colors.textMuted} />
                  <Text style={styles.flipHintText}>Tape pour revenir</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Swipe instructions */}
      <View style={styles.instructions}>
        <View style={styles.instructionItem}>
          <IonIcon icon={handLeft} size={24} color={colors.textMuted} />
          <Text style={styles.instructionText}>Glisser gauche: À revoir</Text>
        </View>
        <View style={styles.instructionItem}>
          <IonIcon icon={handRight} size={24} color={colors.textMuted} />
          <Text style={styles.instructionText}>Glisser droite: Maîtrisé</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonLeft]}
          onPress={() => handleSwipe('left')}
        >
          <IonIcon icon={refresh} size={28} color={colors.error} />
          <Text style={[styles.actionButtonText, styles.actionButtonLeftText]}>
            À revoir
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonRight]}
          onPress={() => handleSwipe('right')}
        >
          <IonIcon icon={checkmark} size={28} color={colors.surface} />
          <Text style={[styles.actionButtonText, styles.actionButtonRightText]}>
            Maîtrisé
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
