/**
 * Memory Recall Writing Screen
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecallWriting } from '@/capabilities/memory/strategies/recall-writing';
import { useMemoryCapability } from '@/capabilities/memory/store';

export default function RecallWritingScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { sessionState, startSession } = useMemoryCapability();
  const writing = useRecallWriting();

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
      <ScrollView contentContainerStyle={styles.content}>
        {/* Verse Hint (hidden until submitted) */}
        {!writing.isSubmitted && (
          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>Mémorisez ce verset :</Text>
            <Text style={styles.verseText}>{sessionState.verseText}</Text>
            <TouchableOpacity
              style={styles.hideButton}
              onPress={() => {
                // Hide the verse after reading
              }}
            >
              <Text style={styles.hideButtonText}>Masquer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Writing Area */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {writing.isSubmitted ? 'Vérification' : 'Écrivez le verset'}
          </Text>
          <TextInput
            style={styles.textArea}
            value={writing.userInput}
            onChangeText={writing.handleInputChange}
            placeholder="Écrivez le verset ici..."
            multiline
            textAlignVertical="top"
            editable={!writing.isSubmitted}
          />
        </View>

        {/* Verification Result */}
        {writing.isSubmitted && writing.getVerificationResult() && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Résultat</Text>
            <Text style={styles.resultScore}>
              {Math.round(
                writing.getVerificationResult()!.score * 100
              )}%
              {' '}précis
            </Text>
            {writing.getVerificationResult()!.missingWords.length > 0 && (
              <View style={styles.missingWords}>
                <Text style={styles.missingLabel}>Mots manquants :</Text>
                <View style={styles.wordsRow}>
                  {writing.getVerificationResult()!.missingWords.map(
                    (word, idx) => (
                      <Text key={idx} style={styles.missingWord}>
                        {word}
                      </Text>
                    )
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        {!writing.isSubmitted ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={writing.submitAnswer}
            disabled={!writing.userInput.trim()}
          >
            <Text style={styles.submitText}>Vérifier</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={writing.resetWriting}
            >
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.finishButton}
              onPress={() => router.back()}
            >
              <Text style={styles.finishText}>Terminer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  verseText: {
    fontSize: 18,
    color: colors.primary,
    lineHeight: 28,
    marginBottom: 16,
  },
  hideButton: {
    alignItems: 'center',
    padding: 8,
  },
  hideButtonText: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 16,
  },
  missingWords: {
    marginTop: 12,
  },
  missingLabel: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  missingWord: {
    fontSize: 14,
    color: colors.error,
    backgroundColor: '#FFE4E4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 26,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  finishButton: {
    flex: 1,
    backgroundColor: '#4CD964',
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
});
