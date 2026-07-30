/**
 * Memorization Session Screen — Interactive word reveal with strategy selection
 * See docs/08-ui-screens.md §8
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/hooks/useI18n';
import { WordChip } from '@/components/bible/WordChip';
import { DEFAULT_MVP_STRATEGY, ExerciseStrategy } from '@/domains/memorization/entities';
import { MemorizationService } from '@/domains/memorization/service';
import { IFsrsEngine, Sm2FallbackEngine } from '@/domains/fsrs';
import { MmkvStorage } from '@/infrastructure/storage';
import { useMemorizationSession } from '@/hooks/useMemorizationSession';

// Singleton pour le service (à initialize au niveau de l'application)
let memorizationService: MemorizationService | null = null;
let fsrsEngine: Sm2FallbackEngine | null = null;

const getMemorizationService = () => {
  if (!memorizationService) {
    if (!fsrsEngine) {
      fsrsEngine = new Sm2FallbackEngine();
    }
    memorizationService = new MemorizationService(new MmkvStorage(), fsrsEngine);
  }
  return memorizationService;
};

export default function MemorizationSessionScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const {
    sessionState,
    isLoaded,
    startSession,
    startRevealing,
    revealNextWord,
    revealWordAt,
    verifyAnswer,
    completeSession,
    resetSession,
    abandonSession,
    getService,
    setStrategy, // NEW: access to setStrategy
  } = useMemorizationSession();

  // Le verset à mémoriser (pour le MVP — dans une app réelle, cela viendrait des params de navigation)
  const verseData = {
    bookId: 'joh',
    chapter: 3,
    verse: 16,
    reference: 'Jean 3:16',
    text: 'Car Dieu a tellement aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu\'il ait la vie éternelle.',
  };

  // État pour le rating lors de la confirmation
  const [userRating, setUserRating] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<ExerciseStrategy>(DEFAULT_MVP_STRATEGY);

  // Charger l'initialisation du service et de la session
  useEffect(() => {
    if (isLoaded && !sessionState) {
      const service = getService();
      if (service) {
        service.getMemorizedRecord(verseData.bookId, verseData.chapter, verseData.verse, 'lsg')
          .then(record => {
            if (record) {
              setSessionState({
                ...record,
                phase: 'preview',
                revealedWords: new Set(),
                words: record.bibleVerseText.split(/\s+/).filter(w => w.length > 0),
              });
            } else {
              startSession(verseData.bookId, verseData.chapter, verseData.verse, verseData.text, verseData.reference);
            }
          })
          .catch(console.error);
        return;
      }
      startSession(verseData.bookId, verseData.chapter, verseData.verse, verseData.text, verseData.reference);
    }
  }, [isLoaded, sessionState, startSession, getService, setStrategy]);

  // Si la session n'est pas chargée, afficher un écran de chargement
  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#E91E8C" />
          <Text style={styles.loadingText}>Initialisation du service de mémorisation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Si aucune session active (erreur de chargement)
  if (!sessionState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Mémorisation de verset</Text>
          <Text style={styles.subtitle}>Aucune session en cours. Appuyez sur "Commencer" pour débuter.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Change strategy button press handler
  const handleStrategyChange = (strategy: ExerciseStrategy) => {
    setCurrentStrategy(strategy);
    // Apply strategy to the underlying session engine
    setStrategy(strategy);
    // Reset revealed state when changing strategy
    resetSession();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with strategy selection */}
        <View style={styles.header}>
          <Text style={styles.title}>{sessionState.reference}</Text>
          <View style={styles.strategyButtons}>
            <TouchableOpacity
              style={[styles.strategyButton, currentStrategy === 'progressive-masking' && styles.strategyButtonActive]}
              onPress={() => handleStrategyChange('progressive-masking')}
            >
              <Text style={styles.strategyButtonText}>{t('strategy.progressive')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.strategyButton, currentStrategy === 'incremental-reveal' && styles.strategyButtonActive]}
              onPress={() => handleStrategyChange('incremental-reveal')}
            >
              <Text style={styles.strategyButtonText}>{t('strategy.reveal')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.strategyButton, currentStrategy === 'active-recall' && styles.strategyButtonActive]}
              onPress={() => handleStrategyChange('active-recall')}
            >
              <Text style={styles.strategyButtonText}>{t('strategy.active')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instruction text based on strategy */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>
            {t(`strategy.instructions.${currentStrategy}`)}
          </Text>
          <Text style={styles.instructionText}>
            {t(`strategy.hint.${currentStrategy}`)}
          </Text>
        </View>

        {/* Verse display */}
        <View style={styles.verseCard}>
          <Text style={styles.verseText}>{sessionState.verseText}</Text>
        </View>

        {/* Word reveal area */}
        <View style={styles.wordContainer}>
          {sessionState.words.map((word: string, index: number) => {
            const isRevealed = sessionState.revealedWords.has(index);
            return (
              <TouchableOpacity
                key={index}
                style={styles.wordWrapper}
                onPress={() => revealWordAt(index)}
                disabled={isRevealed}
              >
                <WordChip
                  word={isRevealed ? word : '•••'}
                  revealed={isRevealed}
                  onPress={() => revealWordAt(index)}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.revealButton}
            onPress={() => revealNextWord()}
          >
            <Text style={styles.revealButtonText}>{t('actions.nextWord')}</Text>
          </TouchableOpacity>

          {/* Complete button when all words revealed */}
          {sessionState.revealedWords.size === sessionState.words.length && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => setIsConfirming(true)}
            >
              <Text style={styles.completeButtonText}>{t('actions.complete')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Rating confirmation modal */}
        {isConfirming && (
          <View style={styles.ratingModalOverlay}>
            <View style={styles.ratingModal}>
              <Text style={styles.ratingModalTitle}>{t('rating.title')}</Text>
              <View style={styles.ratingButtons}>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingAgain]}
                  onPress={() => setUserRating('again')}
                >
                  <Text style={styles.ratingButtonText}>{t('rating.again')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingHard]}
                  onPress={() => setUserRating('hard')}
                >
                  <Text style={styles.ratingButtonText}>{t('rating.hard')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingGood]}
                  onPress={() => setUserRating('good')}
                >
                  <Text style={styles.ratingButtonText}>{t('rating.good')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingEasy]}
                  onPress={() => setUserRating('easy')}
                >
                  <Text style={styles.ratingButtonText}>{t('rating.easy')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Action buttons at bottom */}
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetSession}>
            <Text style={styles.secondaryButtonText}>{t('actions.reset')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={abandonSession}>
            <Text style={styles.secondaryButtonText}>{t('actions.abandon')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  strategyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  strategyButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E91E8C',
    alignItems: 'center',
  },
  strategyButtonActive: {
    backgroundColor: '#E91E8C',
  },
  strategyButtonText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  strategyButtonTextActive: {
    color: '#FFFFFF',
  },
  instructionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadow: {
      color: '#000',
      offsetX: 0,
      offsetY: 2,
      opacity: 0.1,
      radius: 4,
    },
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E8C',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
  },
  verseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadow: {
      color: '#000',
      offsetX: 0,
      offsetY: 2,
      opacity: 0.1,
      radius: 4,
    },
  },
  verseText: {
    fontSize: 16,
    color: '#2D2D2D',
    lineHeight: 24,
    textAlign: 'justify',
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  wordWrapper: {
    margin: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  revealButton: {
    flex: 1,
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  revealButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#4CD964',
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginLeft: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  ratingModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadow: {
      color: '#000',
      offsetX: 0,
      offsetY: 4,
      opacity: 0.2,
      radius: 8,
    },
  },
  ratingModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  ratingAgain: {
    backgroundColor: '#FF6B6B',
  },
  ratingHard: {
    backgroundColor: '#FF9500',
  },
  ratingGood: {
    backgroundColor: '#4CD964',
  },
  ratingEasy: {
    backgroundColor: '#007AFF',
  },
  ratingButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E91E8C',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#E91E8C',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
