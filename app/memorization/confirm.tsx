/**
 * Memorization Confirm Screen — Rating selection after session completion
 * See docs/08-ui-screens.md §9
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/hooks/useI18n';

export default function MemorizationConfirmScreen() {
  const router = useRouter();
  const { t } = useI18n();

  // État pour le rating sélectionné
  const [rating, setRating] = useState<'again' | 'hard' | 'good' | 'easy'>('good');

  // Handler de sélection du rating
  const handleRate = (selected: 'again' | 'hard' | 'good' | 'easy') => {
    setRating(selected);
    // Ici, on enverrait l'événement FSRS et on sauvegarderait l'état
    // Pour le MVP, on reste sur l'écran jusqu'à confirmation
  };

  // Confirmer le rating et retourner à l'écran précédent
  const confirmRating = () => {
    // Action de confirmation (pourrait appeler le service FSRS)
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header avec le message de résultat */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultIcon}>🎉</Text>
          <Text style={styles.resultTitle}>{t('session.verseMemorized')}</Text>
          <Text style={styles.resultSubtitle}>
            {t('session.thankYouForPracticing')}
          </Text>
        </View>

        {/* Section de sélection du rating */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>{t('session.howWellDoYouRecall')}</Text>
          <Text style={styles.ratingSubTitle}>
            {t('session.selectOptionThatMatchesYourRecall')}
          </Text>

          {/* Grille des buttons de rating */}
          <View style={styles.ratingGrid}>
            <TouchableOpacity
              style={[
                styles.ratingButton,
                rating === 'again' && styles.ratingButtonActive,
              ]}
              onPress={() => handleRate('again')}
            >
              <Text style={styles.ratingButtonText}>
                {t('session.again')}
              </Text>
              <Text style={styles.ratingButtonSmall}>
                {t('session.againDesc')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.ratingButton,
                rating === 'hard' && styles.ratingButtonActive,
              ]}
              onPress={() => handleRate('hard')}
            >
              <Text style={styles.ratingButtonText}>
                {t('session.hard')}
              </Text>
              <Text style={styles.ratingButtonSmall}>
                {t('session.hardDesc')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.ratingButton,
                rating === 'good' && styles.ratingButtonActive,
              ]}
              onPress={() => handleRate('good')}
            >
              <Text style={styles.ratingButtonText}>
                {t('session.good')}
              </Text>
              <Text style={styles.ratingButtonSmall}>
                {t('session.goodDesc')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.ratingButton,
                rating === 'easy' && styles.ratingButtonActive,
              ]}
              onPress={() => handleRate('easy')}
            >
              <Text style={styles.ratingButtonText}>
                {t('session.easy')}
              </Text>
              <Text style={styles.ratingButtonSmall}>
                {t('session.easyDesc')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bouton de confirmation */}
        <TouchableOpacity style={styles.confirmButton} onPress={confirmRating}>
          <Text style={styles.confirmButtonText}>{t('session.saveProgress')}</Text>
        </TouchableOpacity>

        {/* Note sur le rappel suivant */}
        <View style={styles.nextReviewInfo}>
          <Text style={styles.nextReviewTitle}>
            {t('session.nextReviewIn')}
          </Text>
          <Text style={styles.nextReviewTime}>
            {t('session.scheduledFor', { time: 'demain' })}
          </Text>
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
    paddingBottom: 32,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 32,
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
    textAlign: 'center',
  },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    ...shadow.md,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  ratingSubTitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 24,
  },
  ratingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  ratingButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  ratingButtonActive: {
    backgroundColor: '#E91E8C',
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  ratingButtonTextActive: {
    color: '#FFFFFF',
  },
  ratingButtonSmall: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  ratingButtonSmallActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  confirmButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextReviewInfo: {
    backgroundColor: '#FFF0F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  nextReviewTitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  nextReviewTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E91E8C',
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
