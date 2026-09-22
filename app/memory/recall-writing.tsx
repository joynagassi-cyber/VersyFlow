/**
 * Memory Recall Writing Screen (P0.1 WRITING RECALL)
 *
 * The user writes the verse from memory, then the written text is compared
 * against the expected passage with a deterministic LCS word diff
 * (`compareWrittenRecall`). The result renders as word chips:
 *   - correct  → success
 *   - wrong    → error (the expected word, flagged red)
 *   - missing  → warning (highlighted, the word the user omitted)
 *   - extra    → muted (listed after the verse, not part of it)
 *
 * No second cognitive score is derived (master prompt §11 P0.1): the
 * matchScore shown is the similarity of the written text only.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from '@/hooks/useIonicNavigation';
import { useMemoryCapability } from '@/capabilities/memory/store';
import { compareWrittenRecall } from '@/services/recall-comparison-service';
import type { WrittenRecallResult } from '@/services/recall-comparison-service';

type WordDiff = WrittenRecallResult['wordDiffs'][number];

function diffColorFor(
  type: WordDiff['type'],
  colors: ReturnType<typeof useAppTheme>['colors'],
): string {
  switch (type) {
    case 'correct':
      return colors.success;
    case 'wrong':
      return colors.error;
    case 'missing':
      return colors.warning;
    case 'extra':
      return colors.textMuted;
  }
}

export default function RecallWritingScreen() {
  const { colors, rad, sp } = useAppTheme();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { sessionState, startSession } = useMemoryCapability();
  const [text, setText] = useState('');
  const [result, setResult] = useState<WrittenRecallResult | null>(null);

  const expectedVerse =
    params.verse ?? sessionState?.verseText ?? '';

  useEffect(() => {
    const verse = params.verse ?? expectedVerse;
    if (!sessionState && verse) {
      const words = verse.split(' ').filter(Boolean);
      startSession({
        phase: 'preview',
        verseText: verse,
        words,
        revealedWordIndices: new Set<number>(),
        startedAt: Date.now(),
        durationSeconds: 0,
        wordsRevealed: 0,
        totalWords: words.length,
      });
    }
  }, []);

  const handleCompare = () => {
    if (!text.trim() || !expectedVerse) return;
    setResult(compareWrittenRecall(text, expectedVerse));
  };

  const handleReset = () => {
    setText('');
    setResult(null);
  };

  const chipStyles = (type: WordDiff['type']) =>
    [
      styles.chip,
      {
        color: diffColorFor(type, colors),
        backgroundColor:
          type === 'missing' ? colors.warningLight : colors.surfaceElevated,
        borderRadius: rad.sm,
      },
    ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('recallWriting.title', 'Écriture de mémoire')}
        </Text>

        {/* Expected verse (what should be recalled) */}
        {expectedVerse ? (
          <View
            style={[
              styles.verseCard,
              {
                backgroundColor: colors.surface,
                borderRadius: rad.lg,
                padding: sp.md,
                marginBottom: sp.md,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textTertiary, marginBottom: sp.xs },
              ]}
            >
              {t('semantic.expected', 'Texte attendu')}
            </Text>
            <Text style={[styles.verseText, { color: colors.textPrimary }]}>
              {expectedVerse}
            </Text>
          </View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderRadius: rad.md,
              padding: sp.md,
              color: colors.textPrimary,
            },
          ]}
          value={text}
          onChangeText={setText}
          placeholder={t('recallWriting.placeholder', 'Écrivez le verset de mémoire...')}
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <View style={[styles.actions, { gap: sp.sm, marginTop: sp.md }]}>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                borderRadius: rad.pill,
                paddingVertical: sp.md,
              },
            ]}
            onPress={handleCompare}
            disabled={!text.trim() || !expectedVerse}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: colors.surface,
                  opacity: text.trim() && expectedVerse ? 1 : 0.5,
                },
              ]}
            >
              {t('recallWriting.compare', 'Comparer')}
            </Text>
          </TouchableOpacity>
          {result ? (
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.surface,
                  borderRadius: rad.pill,
                  paddingVertical: sp.md,
                },
              ]}
              onPress={handleReset}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: colors.primary, borderWidth: 1, borderColor: colors.primary },
                ]}
              >
                {t('recallWriting.reset', 'Recommencer')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Comparison result */}
        {result ? (
          <View
            style={[
              styles.resultCard,
              {
                backgroundColor: colors.surface,
                borderRadius: rad.lg,
                padding: sp.md,
                marginTop: sp.lg,
              },
            ]}
          >
            <View style={[styles.scoreRow, { marginBottom: sp.md }]}>
              <Text
                style={[
                  styles.scoreLabel,
                  { color: colors.textTertiary },
                ]}
              >
                {t('recallWriting.matchScore', 'Similarité')}
              </Text>
              <Text
                style={[
                  styles.scoreValue,
                  {
                    color:
                      result.matchScore >= 0.9
                        ? colors.success
                        : result.matchScore >= 0.7
                          ? colors.warning
                          : colors.error,
                  },
                ]}
              >
                {Math.round(result.matchScore * 100)}%
              </Text>
            </View>

            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textTertiary, marginBottom: sp.xs },
              ]}
            >
              {t('semantic.verses', 'Verset')}
            </Text>
            <View style={styles.chipRow}>
              {result.wordDiffs
                .filter((d) => d.type !== 'extra')
                .map((d, i) => (
                  <Text key={i} style={chipStyles(d.type)}>
                    {d.word}
                  </Text>
                ))}
            </View>

            {result.wordDiffs.some((d) => d.type === 'extra') ? (
              <View style={[styles.extraBlock, { marginTop: sp.md }]}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textTertiary, marginBottom: sp.xs },
                  ]}
                >
                  {t('recallWriting.extraWords', 'Mots en trop')}
                </Text>
                <View style={styles.chipRow}>
                  {result.wordDiffs
                    .filter((d) => d.type === 'extra')
                    .map((d, i) => (
                      <Text key={i} style={chipStyles(d.type)}>
                        {d.word}
                      </Text>
                    ))}
                </View>
              </View>
            ) : null}

            <View style={[styles.legend, { marginTop: sp.md, gap: sp.xs }]}>
              {(['correct', 'wrong', 'missing'] as const).map((type) => (
                <View key={type} style={styles.legendRow}>
                  <Text style={[styles.chip, chipStyles(type), { opacity: 0.65 }]}>
                    •
                  </Text>
                  <Text style={[styles.legendLabel, { color: colors.textTertiary }]}>
                    {type === 'correct'
                      ? t('recallWriting.correct', 'Correct')
                      : type === 'wrong'
                        ? t('recallWriting.wrong', 'Incorrect')
                        : t('recallWriting.missing', 'Manquant')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  verseCard: {},
  verseText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {},
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  extraBlock: {},
  legend: {},
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendLabel: {
    fontSize: 13,
  },
});
