/**
 * Comparison Result Screen — Shows verification results
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { useComparisonCapability } from '@/capabilities/comparison/store';
import { MemorizationRecord } from '@/domains/memorization/entities';

interface Props {
  record: MemorizationRecord;
  userAnswer: string;
}

export default function ComparisonResultScreen({ record, userAnswer }: Props) {
  const router = useRouter();
  const { lastVerification, verifyAnswer } = useComparisonCapability();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!verified) {
      const result = verifyAnswer(record.bibleVerseText, userAnswer);
      setVerified(true);
    }
  }, []);

  if (!lastVerification) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>En cours d'analyse...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scoreColor =
    lastVerification.score >= 0.9
      ? '#4CD964'
      : lastVerification.score >= 0.7
      ? 'colors.warning'
      : colors.error;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Score Display */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Score de précision</Text>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>
            {Math.round(lastVerification.score * 100)}%
          </Text>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreFill,
                { width: `${lastVerification.score * 100}%`, backgroundColor: scoreColor },
              ]}
            />
          </View>
        </View>

        {/* Word Analysis */}
        {lastVerification.substitutions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Substitutions</Text>
            {lastVerification.substitutions.map((sub, idx) => (
              <View key={idx} style={styles.substitutionItem}>
                <Text style={styles.expectedText}>
                  {sub.expected}
                  <Text style={styles.arrow}> → </Text>
                  <Text style={styles.gotText}>{sub.got}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Missing Words */}
        {lastVerification.missingWords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mots manquants</Text>
            <View style={styles.wordsRow}>
              {lastVerification.missingWords.map((word, idx) => (
                <Text key={idx} style={styles.missingWord}>{word}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Fragile Portions */}
        {lastVerification.fragilePortions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portions fragiles</Text>
            {lastVerification.fragilePortions.map((portion, idx) => (
              <View key={idx} style={styles.portionItem}>
                <Text style={styles.portionText}>
                  Positions {portion.start + 1}–{portion.end}
                </Text>
                <Text style={[styles.portionAccuracy, { color: scoreColor }]}>
                  {Math.round(portion.accuracy * 100)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Terminer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/review/queue')}
          >
            <Text style={styles.secondaryButtonText}>File de révision</Text>
          </TouchableOpacity>
        </View>
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
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 16,
  },
  scoreBar: {
    width: '100%',
    height: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 6,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  substitutionItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  expectedText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  arrow: {
    color: colors.textMuted,
  },
  gotText: {
    color: colors.error,
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
  portionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  portionText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  portionAccuracy: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
