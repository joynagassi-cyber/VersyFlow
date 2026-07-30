/**
 * Review Session Screen — Interactive review with FSRS rating
 * See docs/08-ui-screens.md §13
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
import { Rating as FsrsRating } from '@/domains/fsrs';
import { MemorizationService } from '@/domains/memorization/service';
import { IFsrsEngine, Sm2FallbackEngine } from '@/domains/fsrs';
import { MmkvStorage } from '@/infrastructure/storage';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';

// Singleton pour le service (à initialize au niveau de l'application)
let memorizationService: MemorizationService | null = null;
let fsrsEngine: IFsrsEngine | null = null;
let progressService: any | null = null;

const getMemorizationService = () => {
  if (!memorizationService) {
    if (!fsrsEngine) {
      fsrsEngine = getFsrsEngine(); // Use factory - tries WASM first, falls back to SM-2
    }
    memorizationService = new MemorizationService(new MmkvStorage(), fsrsEngine);
  }
  return memorizationService;
};

const getProgressService = () => {
  if (!progressService) {
    const ms = getMemorizationService();
    const fe = fsrsEngine || getFsrsEngine();
    progressService = new ProgressService(ms, fe);
  }
  return progressService;
};

export default function ReviewSessionScreen() {
  const router = useRouter();
  const { t } = useI18n();

  // Record ID passed from navigation query params
  const routeParams = ((router as any).route?.query || {});
  const recordId = (routeParams as any)?.recordId;

  // Get service instance
  const service = getMemorizationService();

  // État de la session de révision
  const [reviewState, setReviewState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedWords, setRevealedWords] = useState<number[]>([]);
  const [rating, setRating] = useState<FsrsRating | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Charger le record au montage
  useEffect(() => {
    if (!recordId) {
      router.replace('/review/queue');
      return;
    }

    const loadReview = async () => {
      try {
        // Charger le record depuis le service
        // Dans la version réelle, l'ID contient bookId, chapter, verse, translationId
        // Pour l'exemple, on extrait ces valeurs de l'ID format: bookId:chapter:verse:translationId
        const parts = recordId.split(':');
        if (parts.length !== 4) {
          throw new Error('Format d\'ID invalide');
        }

        const [bookId, chapterNumber, verseNumber, translationId] = parts;
        const chapter = parseInt(chapterNumber, 10);
        const verse = parseInt(verseNumber, 10);

        const record = await service.getMemorizedRecord(bookId, chapter, verse, translationId);

        if (!record) {
          throw new Error('Record non trouvé');
        }

        setReviewState({
          ...record,
          words: record.bibleVerseText.split(/\s+/).filter(w => w.length > 0),
          revealedWords: new Set<number>(),
        });
      } catch (error) {
        console.error('Erreur lors du chargement du record:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReview();
  }, [recordId, router, service]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E91E8C" />
          <Text style={styles.loadingText}>Chargement de la révision...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!reviewState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.error}>
          <Text style={styles.errorTitle}>Impossible de charger ce verset</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Révéler le mot suivant
  const revealNextWord = () => {
    const words = reviewState.words;
    const currentRevealed = new Set(revealedWords);

    // Trouver le premier mot non révélé
    let nextIndex = -1;
    for (let i = 0; i < words.length; i++) {
      if (!currentRevealed.has(i)) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex !== -1) {
      currentRevealed.add(nextIndex);
      setRevealedWords(Array.from(currentRevealed));
    }
  };

  // Révéler un mot spécifique
  const revealWordAt = (index: number) => {
    if (revealedWords.includes(index)) return;
    setRevealedWords([...revealedWords, index]);
  };

  // Passer en mode révélation
  const startRevealing = () => {
    setIsRevealing(true);
  };

  // Bouton de rating pour la révision
  const handleRating = (selected: FsrsRating) => {
    setRating(selected);
    setConfirming(true);
  };

  // Confirmer la soumission du rating via le service réel
  const submitRating = async () => {
    if (!reviewState || !rating || !service) return;

    try {
      // Capture l'état avant la mise à jour
      const stabilityBefore = reviewState.fsrsState.stability;
      const difficultyBefore = reviewState.fsrsState.difficulty;
      const actualInterval = reviewState.fsrsState.lastInterval || null;
      const predictedInterval = reviewState.fsrsState.nextInterval || 0;

      // Appel RÉEL au service de persistance avec toutes les données de logging
      const success = await service.updateRecordAfterReview(
        reviewState.id,
        rating,
        {
          stability: stabilityBefore,
          difficulty: difficultyBefore,
          recallProbability: 0.75,
          lastInterval: actualInterval,
          nextInterval: predictedInterval,
          elapsedDays: reviewState.fsrsState.elapsedDays || 0,
          repetitions: reviewState.fsrsState.repetitions + 1,
          requestedRetention: reviewState.fsrsState.requestedRetention || 0.9,
        },
        reviewState.nextReviewAt,
        [],
        stabilityBefore,
        difficultyBefore,
        predictedInterval,
        actualInterval,
      );

      if (success) {
        // Update progress metrics - check milestones and streak
        const ps = getProgressService();
        if (ps) {
          // Check for milestones (first verse, 10 verses, etc.)
          ps.checkAndEmitMilestones();
          // Increment streak if there's activity today
          ps.incrementStreak();
        }

        // Après un bref délai, retourner à la queue
        setTimeout(() => {
          router.replace('/review/queue');
        }, 1500);
      } else {
        throw new Error('Échec de la persistance par le service');
      }
    } catch (error) {
      console.error('Échec de la mise à jour:', error);
      alert('Erreur lors de la sauvegarde de la révision. Veuillez réessayer.');
      setConfirming(false);
    }
  };

  if (!isRevealing && reviewState) {
    // Phase d'affichage initial - utilisateur doit choisir de révèler les mots
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.phaseTitle}>Révision</Text>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseReference}>{reviewState.bibleVerseReference}</Text>
            <View style={styles.verseText}>
              <Text style={styles.verseContent}>{reviewState.bibleVerseText}</Text>
            </View>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              {t('review.readCarefully')}
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startRevealing}>
            <Text style={styles.startButtonText}>{t('review.startReviewAction')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isRevealing && reviewState) {
    // Phase de révélation des mots
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.phaseTitle}>Rappel</Text>
            <Text style={styles.progress}>
              {revealedWords.length}/{reviewState.words.length} mot{revealedWords.length > 1 ? 's' : ''} révélé(s)
            </Text>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseReference}>{reviewState.bibleVerseReference}</Text>
            <View style={styles.wordContainer}>
              {reviewState.words.map((word: string, index: number) => {
                const isRevealed = revealedWords.includes(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.wordWrapper}
                    onPress={() => revealWordAt(index)}
                    disabled={isRevealed}
                  >
                    <WordChip
                      word={word}
                      revealed={isRevealed}
                      onPress={() => revealWordAt(index)}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.actionButton} onPress={revealNextWord}>
              <Text style={styles.actionButtonText}>{t('review.nextWordBtn')}</Text>
            </TouchableOpacity>

            {/* Bouton de confirmation quand tous les mots sont révélés */}
            {revealedWords.length >= reviewState.words.length && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setConfirming(true)}
                disabled={confirming}
              >
                <Text style={styles.confirmButtonText}>
                  {confirming ? 'En cours...' : t('review.continueBtn')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Modal de sélection de rating */}
        {confirming && (
          <View style={styles.ratingModalOverlay}>
            <View style={styles.ratingModal}>
              <Text style={styles.ratingModalTitle}>Comment vous souveniez-vous ce verset ?</Text>
              <View style={styles.ratingButtons}>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingAgain]}
                  onPress={() => handleRating(FsrsRating.AGAIN)}
                >
                  <Text style={styles.ratingButtonText}>{t('review.again')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingHard]}
                  onPress={() => handleRating(FsrsRating.HARD)}
                >
                  <Text style={styles.ratingButtonText}>{t('review.hard')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingGood]}
                  onPress={() => handleRating(FsrsRating.GOOD)}
                >
                  <Text style={styles.ratingButtonText}>{t('review.good')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingEasy]}
                  onPress={() => handleRating(FsrsRating.EASY)}
                >
                  <Text style={styles.ratingButtonText}>{t('review.easy')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Phase confirmée — afficher le résultat
  if (reviewState?.phase === 'confirmed' || confirming && rating) {
    const ratingText = rating === FsrsRating.AGAIN ? 'again' : rating === FsrsRating.HARD ? 'hard' : rating === FsrsRating.GOOD ? 'good' : 'easy';
    const days = rating === FsrsRating.EASY ? 7 : rating === FsrsRating.GOOD ? 3 : rating === FsrsRating.HARD ? 1 : 1;
    const dayPlural = days > 1 ? 's' : '';

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultIcon}>✓</Text>
            <Text style={styles.resultTitle}>Révision terminée</Text>
            <Text style={styles.resultSubtitle}>
              Rating: {t(`review.rating.${ratingText}`)}
            </Text>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseReference}>{reviewState.bibleVerseReference}</Text>
            <Text style={styles.verseContent}>{reviewState.bibleVerseText}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Prochain rappel</Text>
            <Text style={styles.infoValue}>
              Dans {days} jour{dayPlural}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.finishButton} onPress={() => router.replace('/review/queue')}>
              <Text style={styles.finishButtonText}>Terminer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Cas par défaut
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E8C" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: '600',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  phaseTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  progress: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 8,
  },
  verseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    ...shadow.md,
  },
  verseReference: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 16,
    fontWeight: '600',
  },
  verseText: {
    marginBottom: 16,
  },
  verseContent: {
    fontSize: 16,
    color: '#2D2D2D',
    lineHeight: 24,
    textAlign: 'justify',
  },
  instructions: {
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  wordWrapper: {
    margin: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E91E8C',
    borderWidth: 2,
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#E91E8C',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E91E8C',
  },
  actions: {
    marginTop: 24,
  },
  finishButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  ratingModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
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
    marginBottom: 24,
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