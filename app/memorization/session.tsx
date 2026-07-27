/**
 * Memorization Session Screen — Progressive word reveal interface
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
  } = useMemorizationSession();

  // Le verset à mémoriser (données mockées - dans une app réelle, cela viendrait de la navigation)
  const verseData = {
    bookId: 'joh',
    chapter: 3,
    verse: 16,
    reference: 'Jean 3:16',
    text: 'Car Dieu a tellement aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu\'il ait la vie éternelle.',
  };

  // Démarrer la session automatiquement au montage
  useEffect(() => {
    if (isLoaded && !sessionState) {
      startSession(verseData.bookId, verseData.chapter, verseData.verse, verseData.text);
    }
  }, [isLoaded, sessionState, startSession]);

  // Si la session n'est pas chargée, afficher un écran de chargement
  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#E91E8C" />
          <Text style={styles.loadingText}>Chargement de la session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Si aucune session active, proposer de démarrer
  if (!sessionState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Mémorisation de verset</Text>
          <Text style={styles.subtitle}>Appuyez sur "Commencer" pour débuter la session</Text>
          <TouchableOpacity style={styles.startButton} onPress={() => startSession(verseData.bookId, verseData.chapter, verseData.verse, verseData.text)}>
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
            <Text style={styles.verseReference}>{sessionState.reference || verseData.reference}</Text>
            <View style={styles.verseText}>
              {/* Le texte complet est affiché, mais chaque mot sera masqué si on active la révélation */}
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
            <Text style={styles.verseReference}>{sessionState.reference || verseData.reference}</Text>
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
                onPress={() => completeSession(sessionState.rating || 'good')}
              >
                <Text style={styles.confirmButtonText}>{t('session.confirm')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Phase confirmée (l'utilisateur a vu le résultat)
  if (sessionState.phase === 'confirmed') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultIcon}>{sessionState.rating === 'easy' ? '🎉' : sessionState.rating === 'good' ? '👍' : '📚'}</Text>
            <Text style={styles.resultTitle}>Session terminée</Text>
            <Text style={styles.resultSubtitle}>
              Rating: {t(`session.rating.${sessionState.rating}`)}
            </Text>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseReference}>{sessionState.reference || verseData.reference}</Text>
            <Text style={styles.verseContent}>{sessionState.verseText}</Text>
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
    marginBottom: 8,
  },
  progress: {
    fontSize: 14,
    color: '#A0A0A0',
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
  actions: {
    marginTop: 24,
  },
  buttonPrimary: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
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
