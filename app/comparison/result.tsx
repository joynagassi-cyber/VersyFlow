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
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useTranslation } from 'react-i18next';
import { useRouter } from '@/hooks/useIonicNavigation';
import { useComparisonCapability } from '@/capabilities/comparison/store';
import type { MemorizationRecord } from '@/domains/memorization/entities';

interface Props {
  record: MemorizationRecord;
  userAnswer: string;
}

export default function ComparisonResultScreen({ record, userAnswer }: Props) {
  const router = useRouter();
  const { colors, sp, rad } = useAppTheme();
  const { t } = useTranslation();
  const { lastVerification, verifyAnswer } = useComparisonCapability();
  const [verified, setVerified] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surfaceTint,
    },
    content: {
      padding: sp.md,
      paddingBottom: sp.xl,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scoreCard: {
      backgroundColor: colors.surface,
      borderRadius: rad.lg,
      padding: sp.lg,
      marginBottom: sp.lg,
      alignItems: 'center',
    },
    scoreLabel: {
      fontSize: 14,
      color: colors.textTertiary,
      marginBottom: sp.sm,
    },
    scoreValue: {
      fontSize: 48,
      fontWeight: '800',
      marginBottom: sp.md,
    },
    scoreBar: {
      width: '100%',
      height: 12,
      backgroundColor: colors.surfaceElevated,
      borderRadius: rad.sm,
      overflow: 'hidden',
    },
    scoreFill: {
      height: '100%',
      borderRadius: 6,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: rad.md,
      padding: sp.md,
      marginBottom: sp.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: sp.sm,
    },
    substitutionItem: {
      paddingVertical: sp.sm,
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
      gap: sp.sm,
    },
    missingWord: {
      fontSize: 14,
      color: colors.error,
      backgroundColor: colors.errorLight,
      paddingVertical: sp.xs,
      paddingHorizontal: sp.sm,
      borderRadius: rad.sm,
    },
    portionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: sp.sm,
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
      marginTop: sp.lg,
      gap: sp.md,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: rad.pill,
      paddingVertical: sp.md,
      alignItems: 'center',
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.surface,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderRadius: rad.pill,
      paddingVertical: sp.md,
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
          <Text>{t('comparison.analyzing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scoreColor =
    lastVerification.score >= 0.9
      ? colors.success
      : lastVerification.score >= 0.7
      ? colors.warning
      : colors.error;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Score Display */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>{t('comparison.accuracyScore')}</Text>
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
            <Text style={styles.sectionTitle}>{t('comparison.substitutions')}</Text>
            {lastVerification.substitutions.map((sub, idx) => (
              <View key={idx} style={styles.substitutionItem}>
                <Text style={styles.expectedText}>
                  {sub.expected}
                  <Text style={styles.arrow}> -> </Text>
                  <Text style={styles.gotText}>{sub.got}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Missing Words */}
        {lastVerification.missingWords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('comparison.missingWords')}</Text>
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
            <Text style={styles.sectionTitle}>{t('comparison.fragilePortions')}</Text>
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
            <Text style={styles.primaryButtonText}>{t('comparison.finish')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/review/queue')}
          >
            <Text style={styles.secondaryButtonText}>{t('comparison.reviewQueue')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
