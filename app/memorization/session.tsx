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
import { useSettingsStore } from '@/store/settings-store';
import { useI18n } from '@/hooks/useI18n';

export default function MemorizationSessionScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const { setLanguage } = useSettingsStore();

  // Données du verset (pour le MVP - données mockées)
  const verseData = {
    bookId: 'joh',
    chapter: 3,
    verse: 16,
    reference: 'Jean 3:16',
    text: 'Car Dieu a tellement aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu\'il ait la vie éternelle.',
  };

  // État de la session
  const [phase, setPhase] = useState<'idle' | 'preview' | 'revealing' | 'confirmed'>('idle');
  const [revealedWords, setRevealedWords] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(10); // secondes pour le preview
  const [words, setWords] = useState<string[]>([]);

  // Initialiser les mots du verset au montage
  useEffect(() => {
    const wordList = verseData.text.split(/\s+/).filter(w => w.length > 0);
    setWords(wordList);
  }, []);

  // Compte à rebours pour le preview
  useEffect(() => {
    if (phase === 'preview' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'preview' && timeLeft === 0) {
      // Passage à la révélation automatique
      setPhase('revealing');
    }
  }, [phase, timeLeft]);

  // Démarrer la session
  const startSession = () => {
    setPhase('preview');
    setTimeLeft(10);
    setRevealedWords([]);
  };

  // Révéler le mot suivant
  const revealNextWord = () => {
    if (phase !== 'revealing') return;

    const nextIndex = revealedWords.length;
    if (nextIndex < words.length) {
      setRevealedWords([...revealedWords, nextIndex]);
    }
  };

  // Révéler un mot spécifique
  const revealWordAt = (index: number) => {
    if (phase !== 'revealing' || revealedWords.includes(index)) return;
    setRevealedWords([...revealedWords, index]);
  };

    // Confirmer la session (toutes les paroles sont révelées)
  const confirmSession = () => {
    if (revealedWords.length < words.length) return;
    setPhase('confirmed');
  };

  // Abandonner la session
  const abandonSession = () => {
    alert('Session abandonnée.');
    router.back();
  };

  // Mot à afficher (masqué ou visible)
  const getWordDisplay = (index: number) => {
    if (phase === 'idle') return '?';
    if (revealedWords.includes(index)) {
      return words[index];
    }
    // Pendant le preview, tous les mots sont masqués
    return '*'.repeat(words[index].length);
  };

  if (phase === 'idle') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>{t('session.memoTitle')}</Text>
          <Text style={styles.subtitle}>{t('session.previewMessage', { verseText: verseData.text })}</Text>
          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <Text style={styles.startButtonText}>{t('session.beginSession')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header de la phase */}
        <View style={styles.phaseHeader}>
          <Text style={styles.phaseTitle}>
            {phase === 'preview' ? t('session.previewMode') : t('session.revealMode')}
          </Text>
          {phase === 'preview' && (
            <View style={styles.timer}>
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>
          )}
        </View>

        {/* Texte du verset avec masquage progressif */}
        <View style={styles.verseCard}>
          <Text style={styles.verseReference}>{verseData.reference}</Text>
          <View style={styles.wordContainer}>
            {words.map((word, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.wordChip,
                  phase === 'preview' && styles.wordChipMasked,
                  revealedWords.includes(index) && styles.wordChipRevealed,
                ]}
                onPress={() => revealWordAt(index)}
                disabled={phase !== 'revealing'}
              >
                <Text style={[
                  styles.wordText,
                  phase === 'preview' && styles.wordTextMasked,
                  revealedWords.includes(index) && styles.wordTextRevealed,
                ]}>
                  {getWordDisplay(index)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contrôles */}
        <View style={styles.controls}>
          {phase === 'preview' && (
            <TouchableOpacity style={styles.cancelButton} onPress={abandonSession}>
              <Text style={styles.cancelText}>{t('session.abandon')}</Text>
            </TouchableOpacity>
          )}

          {phase === 'revealing' && (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={revealNextWord}>
                <Text style={styles.actionButtonText}>{t('session.nextWord')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmSession}
                disabled={revealedWords.length < words.length}
              >
                <Text style={styles.confirmButtonText}>
                  {revealedWords.length >= words.length ? t('session.complete') : t('session.continue')}
                </Text>
              </TouchableOpacity>
            </>}
          )}
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
  startButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  timer: {
    backgroundColor: '#E91E8C',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
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
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  wordChipMasked: {
    backgroundColor: '#E0E0E0',
  },
  wordChipRevealed: {
    backgroundColor: '#E91E8C',
  },
  wordText: {
    fontSize: 16,
    color: '#2D2D2D',
  },
  wordTextMasked: {
    color: '#BDBDBD',
  },
  wordTextRevealed: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A0A0A0',
    borderWidth: 2,
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
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
