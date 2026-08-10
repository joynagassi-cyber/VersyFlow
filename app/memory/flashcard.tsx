/**
 * Memory Flashcard Screen
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFlashcard } from '@/capabilities/memory/strategies/flashcard';
import { useMemoryCapability } from '@/capabilities/memory/store';

export default function FlashcardScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { sessionState, startSession } = useMemoryCapability();
  const flashcard = useFlashcard();

  // Initialize session if needed
  useState(() => {
    if (!sessionState && params.text) {
      startSession({
        phase: 'preview',
        verseText: params.text as string,
        words: (params.text as string).split(/\s+/),
        revealedWordIndices: new Set(),
        startedAt: Date.now(),
        durationSeconds: 0,
        wordsRevealed: 0,
        totalWords: (params.text as string).split(/\s+/).length,
      });
    }
  });

  if (!sessionState) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {flashcard.currentWordIndex + 1} / {flashcard.totalWords}
        </Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {!flashcard.isRevealed ? (
          <TouchableOpacity style={styles.cardContent} onPress={flashcard.revealWord}>
            <Text style={styles.cardHint}>Appuyez pour révéler</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.cardWord}>{flashcard.currentWord}</Text>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={flashcard.prevWord}>
          <Text style={styles.controlText}>←</Text>
        </TouchableOpacity>

        <View style={styles.knowButtons}>
          <TouchableOpacity
            style={[styles.knowButton, styles.unknownButton]}
            onPress={flashcard.markUnknown}
          >
            <Text style={styles.knowButtonText}>Difficile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.knowButton, styles.knownButton]}
            onPress={flashcard.markKnown}
          >
            <Text style={styles.knowButtonText}> Compris</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.controlButton} onPress={flashcard.nextWord}>
          <Text style={styles.controlText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Restart */}
      <TouchableOpacity style={styles.restartButton} onPress={flashcard.restart}>
        <Text style={styles.restartText}>Recommencer</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  progressText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginBottom: 32,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHint: {
    fontSize: 18,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  cardWord: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  controlText: {
    fontSize: 24,
    color: colors.primary,
  },
  knowButtons: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    marginHorizontal: 16,
  },
  knowButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  knownButton: {
    backgroundColor: '#4CD964',
  },
  unknownButton: {
    backgroundColor: colors.warning,
  },
  knowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
  restartButton: {
    padding: 16,
    alignItems: 'center',
  },
  restartText: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
