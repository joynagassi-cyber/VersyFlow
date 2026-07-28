/**
 * Memorization Session Screen — Progressive word reveal interface with FSRS integration
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
import { useMemorizationSession } from '@/hooks/useMemorizationSession';
import { WordChip } from '@/components/bible/WordChip';

export default function MemorizationSessionScreen() {
  const router = useRouter();
  const { t } = useI18n();

  // Hook pour la session de méméorisation
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
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Charger l'initialisation du service et de la session
  useEffect(() => {
    if (isLoaded && !sessionState) {
      // Vérifier s'il y a un record existant pour ce verset
      const service = getService();
      if (service) {
        service.getMemorizedRecord(verseData.bookId, verseData.chapter, verseData.verse, 'lsg')
          .then(record => {
            if (record) {
              // Si le record existe, on résume la session (mode révision)
              setSessionState({
                ...record,
                phase: 'preview',
                revealedWords: new Set(),
                words: record.bibleVerseText.split(/\s+/).filter(w => w.length > 0),
              });
            } else {
              // Nouveau verset, démarrer la session
              startSession(verseData.bookId, verseData.chapter, verseData.verse, verseData.text, verseData.reference);
            }
          })
          .catch(console.error);
        return;
      }
      // Si aucun service (encore non initialisé), simplement démarrer
      startSession(verseData.bookId, verseData.chapter, verseData.verse, verseData.text, verseData.reference);
    }
  }, [isLoaded, sessionState, startSession, getService]);

  // Si la session n'est pas chargée, afficher un écran de chargement
  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#E91E8C" />
          <Text style={styles.loadingText}>Initialisation du service de méméorisation...</Text>
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
          <TouchableOpacity style={styles.startButton} onPress={() => startSession(verseData.bookId, verseData.chapter, verseData.verse, verseData.text, verseData.reference)}>
            <Text style={styles.startButtonText}>Commencer la session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Phase de preview (le verset complet est affiché masqué)
  if (sessionState.phase === 'preview') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.phaseTitle}>{t('session.previewMode')}</Text>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseReference}>{sessionState.reference}</Text>
            <View style={styles.verseText}>
              <Text style={styles.verseContent}>{sessionState.verseText}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.startButton} onPress={startRevealing}>
              <Text style={styles.startButtonText}>{t('session.startReveal')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.abortButton} onPress={abandonSession}>
              <Text style={styles.abortText}>{t('session.abandon')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Phase de révélation (les mots se dévoilent un par un)
  if (sessionState.phase === 'revealing') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.phaseTitle}>{t('session.revealMode')}</Text>
            <Text style={styles.progress}>
              {sessionState.wordsRevealed}/{sessionState.words.length} mots révélés
            </Text>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseReference}>{sessionState.reference}</Text>
            <View style={styles.wordContainer}>
              {sessionState.words.map((word, index) => {
                const isRevealed = sessionState.revealedWords.has(index);
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
                      style={styles.wordChip}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.actionButton} onPress={revealNextWord}>
              <Text style={styles.actionButtonText}>{t('session.nextWord')}</Text>
            </TouchableOpacity>

            {/* Bouton de confirmation quand tous les mots sont révélés */}
            {sessionState.wordsRevealed >= sessionState.words.length && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setIsConfirming(true)}
                disabled={isConfirming}
              >
                <Text style={styles.confirmButtonText}>
                  {isConfirming ? 'Enregistrer...' : t('session.confirm')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Modal de confirmation du rating si appuyé sur "Confirm" */}
        {isConfirming && sessionState && (
          <View style={styles.ratingModalOverlay}>
            <View style={styles.ratingModal}>
              <Text style={styles.ratingModalTitle}>Comment vous souveniez-vous ce verset ?</Text>
              <View style={styles.ratingButtons}>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingAgain]}
                  onPress={() => handleRatingSubmit('again')}
                >
                  <Text style={styles.ratingButtonText}>{t('session.again')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingHard]}
                  onPress={() => handleRatingSubmit('hard')}
                >
                  <Text style={styles.ratingButtonText}>{t('session.hard')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingGood]}
                  onPress={() => handleRatingSubmit('good')}
                >
                  <Text style={styles.ratingButtonText}>{t('session.good')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingButton, styles.ratingEasy]}
                  onPress={() => handleRatingSubmit('easy')}
                >
                  <Text style={styles.ratingButtonText}>{t('session.easy')}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.cancelRatingButton}
                onPress={() => setIsConfirming(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Phase confirmée (l'utilisateur a donné un rating)
  if (sessionState.phase === 'confirmed') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultIcon}>🎉</Text>
            <Text style={styles.resultTitle}>Session terminée avec succès !</Text>
            <Text style={styles.resultSubtitle}>
              Votre rating : {t(`session.rating.${sessionState.rating}`)}
            </Text>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseReference}>{sessionState.reference}</Text>
            <Text style={styles.verseContent}>{sessionState.verseText}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Prochain rappel</Text>
            <Text style={styles.infoValue}>
              Dans {Math.max(0, Math.ceil((sessionState.nextReviewAt - Date.now()) / 86400000))} jour(s)
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.buttonPrimary} onPress={() => router.back()}>
              <Text style={styles.buttonText}>Terminer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // État d'abandon
  if (sessionState.phase === 'abandoned') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Session abandonnée</Text>
          <Text style={styles.subtitle}>Le verset sera réintégré dans la file d'attente de révision</Text>
          <TouchableOpacity style={styles.startButton} onPress={router.back}>
            <Text style={styles.startButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // État par défaut (should not happen)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E8C" />
      </View>
    </SafeAreaView>
  );
}

// Handler pour soumettre le rating
const handleRatingSubmit = async (rating: Rating) => {
  if (!sessionState || !getService()) return;

  const service = getService();
  try {
    // Appeler le service pour sauvegarder le record et mettre à jour FSRS
    // Note: Dans une implémentation réelle, on utiliserait le service complet
    // Ici on simule la persistance pour le MVP

    // Simuler l'appel au service avec les données de la session
    const result = {
      success: true,
      rating,
      nextReviewAt: Date.now() + (rating === 'easy' ? 86400000 : rating === 'good' ? 43200000 : 0),
    };

    // Mises à jour de l'état après persistance
    setSessionState(prev => ({
      ...prev,
      rating,
      nextReviewAt: result.nextReviewAt,
      phase: 'confirmed',
    }));

    // Fermer le modal de confirmation
    setIsConfirming(false);
  } catch (error) {
    console.error('Échec de la persistance:', error);
    alert('Erreur lors de l\'enregistrement de la session. Veuillez réessayer.');
    setIsConfirming(false);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
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
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6E6E6E',
    textAlign: 'center',
    marginBottom: 32,
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
  abortButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A0A0A0',
    borderWidth: 2,
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  abortText: {
    fontSize: 16,
    color: '#A0A0A0',
    fontWeight: '600',
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
  buttonPrimary: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
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
  cancelRatingButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
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
