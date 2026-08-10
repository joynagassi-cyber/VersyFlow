/**
 * Memorization Session Screen — Unified session supporting all strategies
 * Strategies: progressive-mask, smart-mask, random-mask, flashcard, recall-writing
 * Phase 8.5: Support passage mode with verse-by-verse navigation
 * See Figma: https://www.figma.com/design/BL5Cbn6s2aMXAtNDmAVJ8F/VersyFlow
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemoryCapability } from '@/capabilities/memory/store';
import { useProgressiveMask } from '@/capabilities/memory/strategies/progressive-mask';
import { useSmartMask } from '@/capabilities/memory/strategies/smart-mask';
import { useFlashcard } from '@/capabilities/memory/strategies/flashcard';
import { useRecallWriting } from '@/capabilities/memory/strategies/recall-writing';
import { useMemorizationSession } from '@/hooks/useMemorizationSession';

type Strategy = 'progressive-masking' | 'smart-masking' | 'flashcard' | 'recall-writing';

interface StrategyConfig {
  id: Strategy;
  name: string;
  icon: string;
  description: string;
  color: string;
}

const STRATEGY_CONFIGS: StrategyConfig[] = [
  {
    id: 'progressive-masking',
    name: 'Progressif',
    icon: 'eye',
    description: 'Mots qui apparaissent un par un',
    color: '#E91E63',
  },
  {
    id: 'smart-masking',
    name: 'Intelligent',
    icon: 'target',
    description: 'Les mots difficiles en priorité',
    color: '#FF9800',
  },
  {
    id: 'flashcard',
    name: 'Flashcards',
    icon: 'card',
    description: 'Un mot à la fois',
    color: '#2196F3',
  },
  {
    id: 'recall-writing',
    name: 'Écriture',
    icon: 'create',
    description: 'Écrivez de mémoire',
    color: '#4CAF50',
  },
];

export default function MemorizationSessionScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { sessionState, startSession, updateSession } = useMemoryCapability();
  const {
    startSessionForTarget,
    revealNextVerse,
    revealPrevVerse,
  } = useMemorizationSession();

  const [currentStrategy, setCurrentStrategy] = useState<Strategy>(
    (params.strategy as Strategy) || 'progressive-masking'
  );
  const [isRevealed, setIsRevealed] = useState(false);
  const [showStrategyPicker, setShowStrategyPicker] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const progressiveMask = useProgressiveMask();
  const smartMask = useSmartMask();
  const flashcard = useFlashcard();
  const writing = useRecallWriting();

  // Detect passage mode from URL params
  const isPassageMode = params.targetType === 'passage';
  const passageTexts = isPassageMode && params.verseTexts
    ? JSON.parse(decodeURIComponent(params.verseTexts as string)) as string[]
    : null;

  // Initialize session on mount
  useEffect(() => {
    if (!sessionState) {
      if (isPassageMode && passageTexts && params.targetId) {
        // Passage mode: build target and start session
        const reference = params.reference as string;
        const target = {
          id: params.targetId as string,
          type: 'passage' as const,
          reference: {
            bookId: params.bookId as string,
            chapter: parseInt(params.chapter as string),
            startVerse: parseInt(params.startVerse as string),
            endVerse: parseInt(params.endVerse as string),
            translationId: 'lsg',
          },
          displayReference: reference,
          createdAt: Date.now(),
        };
        startSessionForTarget(target, passageTexts);
      } else if (params.text) {
        // Single verse mode (legacy)
        const words = (params.text as string).split(/\s+/).filter(w => w.length > 0);
        startSession({
          phase: 'preview',
          verseText: params.text as string,
          words,
          revealedWordIndices: new Set(),
          startedAt: Date.now(),
          durationSeconds: 0,
          wordsRevealed: 0,
          totalWords: words.length,
          reference: params.reference as string,
        });
      }
    }
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = () => {
    setIsTimerRunning(true);
    if (currentStrategy === 'recall-writing') {
      setIsRevealed(true);
    }
  };

  const handleRevealWord = useCallback(() => {
    if (currentStrategy === 'progressive-masking') {
      progressiveMask.revealNextWord();
    } else if (currentStrategy === 'smart-masking') {
      const words = sessionState?.words || [];
      const unrevealed = words
        .map((w, i) => ({ word: w, index: i }))
        .filter(({ index }) => !sessionState?.revealedWordIndices.has(index));

      if (unrevealed.length > 0) {
        unrevealed.sort((a, b) => b.word.length - a.word.length);
        const nextIndex = unrevealed[0].index;
        const newSet = new Set(sessionState?.revealedWordIndices || new Set());
        newSet.add(nextIndex);
        updateSession({ revealedWordIndices: newSet });
      }
    } else if (currentStrategy === 'flashcard') {
      flashcard.revealWord();
    }
  }, [currentStrategy, sessionState, progressiveMask, smartMask, flashcard, updateSession]);

  const handleWordTap = useCallback((index: number) => {
    if (currentStrategy === 'flashcard') {
      flashcard.revealWord();
    } else if (currentStrategy === 'progressive-masking' || currentStrategy === 'smart-masking') {
      const words = sessionState?.words || [];
      const unrevealed = words
        .map((w, i) => i)
        .filter(i => !sessionState?.revealedWordIndices.has(i));

      if (unrevealed.includes(index)) {
        const newSet = new Set(sessionState?.revealedWordIndices || new Set());
        newSet.add(index);
        updateSession({ revealedWordIndices: newSet });
      }
    }
  }, [currentStrategy, sessionState, flashcard, updateSession]);

  const handleRating = (rating: string) => {
    router.replace(`/memorization/confirm?rating=${rating}&reference=${encodeURIComponent(params.reference as string)}`);
  };

  const handleFinish = () => {
    setIsTimerRunning(false);
    router.back();
  };

  const handleNextVerse = () => {
    const moved = revealNextVerse();
    if (!moved && passageTexts) {
      // At last verse — just reveal next word in current verse
      handleRevealWord();
    }
  };

  const handlePrevVerse = () => {
    revealPrevVerse();
  };

  if (!sessionState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Préparation de la session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = sessionState.words.length > 0
    ? (sessionState.revealedWordIndices.size / sessionState.words.length) * 100
    : 0;

  // Passage navigation info
  const currentVerseIdx = (sessionState as any).currentVerseIndex ?? 0;
  const totalVerses = (sessionState as any).totalVerses ?? 1;
  const passageProgress = totalVerses > 1
    ? `${currentVerseIdx + 1}/${totalVerses} verset${totalVerses > 1 ? 's' : ''}`
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleFinish}
        >
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.reference}>{sessionState.reference || 'Jean 3:16'}</Text>
          {isTimerRunning && (
            <Text style={styles.timer}>{formatTime(timer)}</Text>
          )}
          {passageProgress && (
            <Text style={styles.passageProgress}>{passageProgress}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.strategyButton}
          onPress={() => setShowStrategyPicker(true)}
        >
          <Ionicons name={STRATEGY_CONFIGS.find(s => s.id === currentStrategy)?.icon || 'menu'} size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Passage Navigation */}
      {isPassageMode && totalVerses > 1 && (
        <View style={styles.passageNav}>
          <TouchableOpacity
            style={[styles.verseNavBtn, currentVerseIdx === 0 && styles.verseNavBtnDisabled]}
            onPress={handlePrevVerse}
            disabled={currentVerseIdx === 0}
          >
            <Ionicons name="chevron-back" size={20} color={currentVerseIdx === 0 ? colors.textMuted : colors.primary} />
          </TouchableOpacity>

          <View style={styles.verseIndicator}>
            {passageTexts?.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.verseDot,
                  idx === currentVerseIdx && styles.verseDotActive,
                  idx < currentVerseIdx && styles.verseDotCompleted,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verseNavBtn, currentVerseIdx >= (totalVerses - 1) && styles.verseNavBtnDisabled]}
            onPress={handleNextVerse}
            disabled={currentVerseIdx >= (totalVerses - 1)}
          >
            <Ionicons name="chevron-forward" size={20} color={currentVerseIdx >= (totalVerses - 1) ? colors.textMuted : colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Bar */}
      {currentStrategy !== 'recall-writing' && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Strategy: Progressive Masking */}
        {currentStrategy === 'progressive-masking' && (
          <View style={styles.wordArea}>
            {sessionState.words.map((word, index) => {
              const isRevealed = sessionState.revealedWordIndices.has(index);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.wordChip, isRevealed && styles.wordChipRevealed]}
                  onPress={() => handleWordTap(index)}
                  disabled={isRevealed}
                >
                  <Text style={[styles.wordText, isRevealed && styles.wordTextRevealed]}>
                    {isRevealed ? word : '•••'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Strategy: Smart Masking */}
        {currentStrategy === 'smart-masking' && (
          <View style={styles.wordArea}>
            <View style={styles.smartMaskControls}>
              <Text style={styles.smartMaskLabel}>
                Masquage intelligent ({smartMask.maskPercentage}% caché)
              </Text>
              <TouchableOpacity
                style={styles.maskSlider}
                onPress={() => smartMask.setMaskLevel(smartMask.maskPercentage === 70 ? 50 : 70)}
              >
                <View style={[styles.maskSliderTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.maskSliderFill,
                      { width: `${smartMask.maskPercentage}%`, backgroundColor: colors.warning }
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {sessionState.words.map((word, index) => {
              const isRevealed = sessionState.revealedWordIndices.has(index);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.wordChip, isRevealed && styles.wordChipRevealed, isRevealed && styles.wordChipSmart]}
                  onPress={() => smartMask.toggleMask(index)}
                >
                  <Text style={[styles.wordText, isRevealed && styles.wordTextRevealed]}>
                    {isRevealed ? word : '•••'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Strategy: Flashcard */}
        {currentStrategy === 'flashcard' && (
          <View style={styles.flashcardContainer}>
            <Text style={styles.flashcardProgress}>
              {flashcard.currentWordIndex + 1} / {flashcard.totalWords}
            </Text>

            <TouchableOpacity
              style={[styles.flashcard, flashcard.isRevealed && styles.flashcardRevealed]}
              onPress={flashcard.revealWord}
              activeOpacity={0.9}
            >
              {!flashcard.isRevealed ? (
                <View style={styles.flashcardHint}>
                  <Ionicons name="card" size={48} color={colors.primary} />
                  <Text style={styles.flashcardHintText}>Tapez pour révéler</Text>
                  <Text style={styles.flashcardWord}>
                    {flashcard.currentWord || '...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.flashcardRevealedText}>{flashcard.currentWord}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.flashcardControls}>
              <TouchableOpacity
                style={[styles.flashcardControlButton, styles.flashcardUnknown]}
                onPress={flashcard.markUnknown}
              >
                <Ionicons name="remove" size={20} color={colors.surface} />
                <Text style={styles.flashcardControlText}>Difficile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.flashcardControlButton, styles.flashcardKnown]}
                onPress={flashcard.markKnown}
              >
                <Ionicons name="checkmark" size={20} color={colors.surface} />
                <Text style={styles.flashcardControlText}>Compris</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Strategy: Recall Writing */}
        {currentStrategy === 'recall-writing' && (
          <View style={styles.writingContainer}>
            <View style={styles.writingHint}>
              <Text style={styles.writingHintTitle}>Mémorisez ce verset:</Text>
              <Text style={styles.writingVerseText}>{sessionState.verseText}</Text>
              <TouchableOpacity
                style={styles.hideButton}
                onPress={() => setIsRevealed(!isRevealed)}
              >
                <Ionicons name={isRevealed ? 'eye-off' : 'eye'} size={16} color={colors.primary} />
                <Text style={styles.hideButtonText}>{isRevealed ? 'Masquer' : 'Afficher'}</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.writingInput,
                writing.isSubmitted && styles.writingInputSubmitted,
              ]}
              value={writing.userInput}
              onChangeText={writing.handleInputChange}
              placeholder="Écrivez le verset ici..."
              multiline
              textAlignVertical="top"
              editable={!writing.isSubmitted}
              numberOfLines={6}
            />

            {!writing.isSubmitted ? (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={writing.submitAnswer}
                disabled={!writing.userInput.trim()}
              >
                <Text style={styles.submitButtonText}>Vérifier</Text>
              </TouchableOpacity>
            ) : writing.getVerificationResult() ? (
              <View style={styles.writingResult}>
                <View style={styles.resultHeader}>
                  <Ionicons
                    name={writing.getVerificationResult()!.score >= 0.8 ? 'checkmark-circle' : 'alert-circle'}
                    size={40}
                    color={writing.getVerificationResult()!.score >= 0.8 ? colors.success : colors.error}
                  />
                  <Text style={styles.resultScore}>
                    {Math.round(writing.getVerificationResult()!.score * 100)}%
                  </Text>
                  <Text style={styles.resultLabel}>précis</Text>
                </View>

                {writing.getVerificationResult()!.missingWords.length > 0 && (
                  <View style={styles.missingWords}>
                    <Text style={styles.missingLabel}>Mots manquants:</Text>
                    <View style={styles.wordsRow}>
                      {writing.getVerificationResult()!.missingWords.map((word, idx) => (
                        <View key={idx} style={styles.missingWord}>
                          <Text style={styles.missingWordText}>{word}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={writing.resetWriting}
                >
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {currentStrategy !== 'flashcard' && currentStrategy !== 'recall-writing' && (
            <TouchableOpacity
              style={styles.revealButton}
              onPress={handleRevealWord}
              disabled={progress >= 100}
            >
              <Ionicons name="arrow-forward" size={18} color={colors.surface} />
              <Text style={styles.revealButtonText}>
                {progress >= 100 ? 'Terminé!' : 'Mot suivant'}
              </Text>
            </TouchableOpacity>
          )}

          {progress >= 100 && currentStrategy !== 'recall-writing' && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleRating('good')}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.surface} />
              <Text style={styles.completeButtonText}>Terminer la session</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FSRS Info */}
        <View style={styles.fsrsInfo}>
          <Ionicons name="information-circle" size={16} color={colors.textMuted} />
          <Text style={styles.fsrsText}>
            FSRS calculera votre prochain rappel optimal
          </Text>
        </View>
      </ScrollView>

      {/* Strategy Picker Modal */}
      {showStrategyPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir une méthode</Text>
              <TouchableOpacity onPress={() => setShowStrategyPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {STRATEGY_CONFIGS.map((config) => (
                <TouchableOpacity
                  key={config.id}
                  style={[
                    styles.strategyOption,
                    currentStrategy === config.id && styles.strategyOptionSelected,
                  ]}
                  onPress={() => {
                    setCurrentStrategy(config.id);
                    setShowStrategyPicker(false);
                    if (sessionState) {
                      updateSession({ revealedWordIndices: new Set() });
                    }
                  }}
                >
                  <View style={[styles.strategyIconContainer, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon as any} size={24} color={config.color} />
                  </View>
                  <View style={styles.strategyInfo}>
                    <Text style={[styles.strategyName, currentStrategy === config.id && styles.strategyNameSelected]}>
                      {config.name}
                    </Text>
                    <Text style={styles.strategyDesc}>{config.description}</Text>
                  </View>
                  {currentStrategy === config.id && (
                    <Ionicons name="checkmark-circle" size={24} color={config.color} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartSession}
            >
              <Text style={styles.startButtonText}>Commencer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  reference: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  passageProgress: {
    fontSize: 12,
    color: '#E91E63',
    fontWeight: '600',
    marginTop: 2,
  },
  timer: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
    marginTop: 4,
  },
  strategyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Passage Navigation
  passageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  verseNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseNavBtnDisabled: {
    opacity: 0.4,
  },
  verseIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  verseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  verseDotActive: {
    backgroundColor: '#E91E63',
    width: 20,
    borderRadius: 4,
  },
  verseDotCompleted: {
    backgroundColor: '#E91E63',
    opacity: 0.5,
  },

  // Progress Bar
  progressBar: {
    height: 4,
    backgroundColor: '#eee',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E91E63',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Word Area
  wordArea: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    minHeight: 200,
  },
  wordChip: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  wordChipRevealed: {
    backgroundColor: '#E91E63',
  },
  wordChipSmart: {
    backgroundColor: '#FF9800',
  },
  wordText: {
    fontSize: 18,
    color: '#212121',
    fontWeight: '500',
  },
  wordTextRevealed: {
    color: '#fff',
    fontWeight: '600',
  },

  // Smart Mask Controls
  smartMaskControls: {
    marginBottom: 16,
    alignItems: 'center',
  },
  smartMaskLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  maskSlider: {
    width: 200,
  },
  maskSliderTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  maskSliderFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Flashcard
  flashcardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  flashcardProgress: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  flashcard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    minHeight: 250,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  flashcardRevealed: {
    backgroundColor: '#E91E63',
  },
  flashcardHint: {
    alignItems: 'center',
  },
  flashcardHintText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  flashcardWord: {
    fontSize: 24,
    color: '#E91E63',
    fontWeight: '700',
    marginTop: 12,
  },
  flashcardRevealedText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  flashcardControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 32,
  },
  flashcardControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 26,
  },
  flashcardUnknown: {
    backgroundColor: '#F44336',
  },
  flashcardKnown: {
    backgroundColor: '#4CAF50',
  },
  flashcardControlText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Writing
  writingContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  writingHint: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  writingHintTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  writingVerseText: {
    fontSize: 18,
    color: '#212121',
    lineHeight: 28,
    fontWeight: '500',
  },
  hideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  hideButtonText: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
  },
  writingInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    color: '#212121',
    textAlignVertical: 'top',
    minHeight: 150,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  writingInputSubmitted: {
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#E91E63',
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  writingResult: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#212121',
    marginTop: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  missingWords: {
    marginTop: 16,
    width: '100%',
  },
  missingLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  missingWord: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  missingWordText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
  },

  // Controls
  controls: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E91E63',
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  revealButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 26,
    paddingVertical: 18,
    paddingHorizontal: 32,
    marginHorizontal: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // FSRS Info
  fsrsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fsrsText: {
    fontSize: 13,
    color: '#999',
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  modalScroll: {
    padding: 16,
  },
  strategyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  strategyOptionSelected: {
    backgroundColor: '#eee',
    borderWidth: 2,
    borderColor: '#E91E63',
  },
  strategyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  strategyNameSelected: {
    color: '#E91E63',
  },
  strategyDesc: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  startButton: {
    margin: 20,
    backgroundColor: '#E91E63',
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
