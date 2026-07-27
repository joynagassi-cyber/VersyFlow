/**
 * Review Session Screen — Interactive review interface with FSRS rating
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
import { useRoute, useRouter } from 'expo-router';
import { useI18n } from '@/hooks/useI18n';
import { MemorizationService } from '@/domains/memorization/service';
import { Rating } from '@/domains/fsrs';

// Singleton pour le service (à initialize au niveau de l'application)
let memorizationService: MemorizationService | null = null;

const getService = () => {
  if (!memorizationService) {
    // Le service réel serait initialisé avec le stockage et le moteur FSRS
    // Pour l'instant, un stub pour le MVP
    memorizationService = {
      async updateRecordAfterReview() {
        return true;
      },
    };
  }
  return memorizationService;
};

export default function ReviewSessionScreen() {
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();

  const recordId = route.params?.recordId as string;

  // État de la session de review
  const [reviewState, setReviewState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'preview' | 'reveal' | 'rating' | 'confirm'>('preview');

  // Charger le record au montage
  useEffect(() => {
    const loadRecord = async () => {
      try {
        // Dans une application réelle, ceci appellerait memorizationService.getRecord(recordId)
        // Ici, on utilise des données mockées
        const mockRecord = {
          id: recordId,
          bookId: 'joh',
          chapterNumber: 3,
          verseNumber: 16,
          translationId: 'lsg',
          bibleVerseReference: 'Jean 3:16',
          bibleVerseText: 'Car Dieu a tellement aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu\'il ait la vie éternelle.',
          status: 'in-progress',
          fsrsState: { stability: 2.5, repetitions: 1, recallProbability: 0.75 },
          nextReviewAt: Date.now(),
          createdAt: Date.now() - 86400000,
          lastReviewedAt: null,
          reviewCount: 1,
          totalReviewMinutes: 5,
          wordPerformance: [],
        };

        setReviewState(mockRecord);
      } catch (error) {
        console.error('Erreur lors du chargement du record:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [recordId]);

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
          <Text style={styles.errorTitle}>Impossible de charger le verset</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Étape 1: Preview - l'utilisateur voit le verset entier
  if (currentStep === 'preview') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.reference}>{reviewState.bibleVerseReference}</Text>
            </View>
            <View style={styles.verseText}>
              <Text style={styles.verseContent}>{reviewState.bibleVerseText}</Text>
            </View>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setCurrentStep('reveal')}
            >
              <Text style={styles.startButtonText}>{t('review.startReview')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Étape 2: Révélation - le verset est masqué (simulé pour le MVP)
  if (currentStep === 'reveal') {
    // Dans la version réelle, on masquerait progressivement les mots
    // Ici, on passe directement à l'étape de rating pour simplifier
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.reference}>{reviewState.bibleVerseReference}</Text>
            </View>
            <View style={styles.verseText}>
              <Text style={styles.verseContentMasked}>
                {' '.repeat(reviewState.bibleVerseText.length)}
              </Text>
            </View>
            <Text style={styles.revealHint}>
              {t('review.revealHint')}
            </Text>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => setCurrentStep('rating')}
            >
              <Text style={styles.nextButtonText}>{t('review.continue')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Étape 3: Rating - l'utilisateur donne son auto-évaluation
  if (currentStep === 'rating') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.reference}>{reviewState.bibleVerseReference}</Text>
            </View>
            <Text style={styles.ratingQuestion}>
              {t('review.howEasyWasIt')}
            </Text>
            <View style={styles.ratingButtons}>
              <TouchableOpacity
                style={[styles.ratingButton, styles.ratingAgain]}
                onPress={() => handleRating('again')}
              >
                <Text style={styles.ratingButtonText}>{t('review.again')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ratingButton, styles.ratingHard]}
                onPress={() => handleRating('hard')}
              >
                <Text style={styles.ratingButtonText}>{t('review.hard')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ratingButton, styles.ratingGood]}
                onPress={() => handleRating('good')}
              >
                <Text style={styles.ratingButtonText}>{t('review.good')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ratingButton, styles.ratingEasy]}
                onPress={() => handleRating('easy')}
              >
                <Text style={styles.ratingButtonText}>{t('review.easy')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Étape 4: Confirm - résumé de la session
  if (currentStep === 'confirm') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>📚</Text>
              <Text style={styles.resultTitle}>Révision terminée</Text>
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultLabel}>Verset</Text>
              <Text style={styles.resultValue}>{reviewState.bibleVerseReference}</Text>
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultLabel}>Rating</Text>
              <Text style={styles.resultValue}>{t(`review.rating.${userSelectedRating}`)}</Text>
            </View>
            <TouchableOpacity
              style={styles.finishButton}
              onPress={() => router.replace('/review/queue')}
            >
              <Text style={styles.finishButtonText}>{t('review.finish')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

let userSelectedRating: Rating | null = null;

const handleRating = (rating: Rating) => {
  userSelectedRating = rating;
  setCurrentStep('confirm');
  // Dans la version réelle, on appellerait memorizationService.updateRecordAfterReview()
};

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
  content: {
    padding: 16,
    paddingBottom: 24,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    ...shadow.md,
  },
  header: {
    marginBottom: 16,
  },
  reference: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E8C',
  },
  verseText: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  verseContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2D2D2D',
  },
  verseContentMasked: {
    fontSize: 16,
    lineHeight: 24,
    color: '#BDBDBD',
    fontFamily: 'monospace',
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
  nextButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  revealHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  ratingQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 24,
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
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  resultInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  finishButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
