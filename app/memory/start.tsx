/**
 * Memory Start Screen — Choose memorization strategy
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from '@/hooks/useIonicNavigation';
import type { ExerciseStrategy } from '@/domains/memorization/entities';

interface Props {
  verseData: {
    reference: string;
    text: string;
    bookId: string;
    chapter: number;
    verse: number;
  };
}

const STRATEGIES = [
  {
    id: 'progressive-masking' as ExerciseStrategy,
    name: 'Masquage progressif',
    description: 'Les mots apparaissent un par un de gauche à droite',
    icon: '👁️',
  },
  {
    id: 'incremental-reveal' as ExerciseStrategy,
    name: 'Révélation incrémentale',
    description: 'Révélez les mots au fur et à mesure',
    icon: '✨',
  },
  {
    id: 'active-recall' as ExerciseStrategy,
    name: 'Rappel actif',
    description: 'Essayez de vous souvenir avant de voir',
    icon: '🧠',
  },
  {
    id: 'flashcard' as ExerciseStrategy,
    name: 'Flashcards',
    description: 'Un mot à la fois, mode cartes',
    icon: '🃏',
  },
  {
    id: 'recall-writing' as ExerciseStrategy,
    name: 'Écriture',
    description: 'Écrivez le verset de mémoire',
    icon: '✍️',
  },
  {
    id: 'smart-masking' as ExerciseStrategy,
    name: 'Masquage intelligent',
    description: 'Les mots difficiles masqués en priorité',
    icon: '🎯',
  },
];

export default function MemorizationStartScreen({ verseData }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surfaceTint,
    },
    content: {
      padding: 20,
    },
    verseCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    verseReference: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 8,
    },
    verseText: {
      fontSize: 16,
      color: colors.textPrimary,
      lineHeight: 24,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    strategyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: colors.border,
    },
    strategyCardSelected: {
      borderColor: colors.primary,
    },
    strategyIcon: {
      fontSize: 32,
      marginRight: 16,
    },
    strategyInfo: {
      flex: 1,
    },
    strategyName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    strategyDesc: {
      fontSize: 13,
      color: colors.textTertiary,
    },
    checkmark: {
      fontSize: 20,
      color: colors.primary,
      fontWeight: '700',
    },
    startButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    startButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    backButton: {
      marginTop: 12,
      alignItems: 'center',
      padding: 8,
    },
    backText: {
      color: colors.textMuted,
      fontSize: 14,
    },
  }), [colors]);
  const router = useRouter();
  const [selectedStrategy, setSelectedStrategy] = useState<ExerciseStrategy>(
    'progressive-masking'
  );

  const handleStart = () => {
    router.push({
      pathname: '/memorization/session',
      params: {
        strategy: selectedStrategy,
        bookId: verseData.bookId,
        chapter: verseData.chapter.toString(),
        verse: verseData.verse.toString(),
        reference: verseData.reference,
        text: verseData.text,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Verse Preview */}
        <View style={styles.verseCard}>
          <Text style={styles.verseReference}>{verseData.reference}</Text>
          <Text style={styles.verseText}>{verseData.text}</Text>
        </View>

        {/* Strategy Selection */}
        <Text style={styles.title}>Choisissez votre méthode</Text>

        {STRATEGIES.map((strategy) => (
          <TouchableOpacity
            key={strategy.id}
            style={[
              styles.strategyCard,
              selectedStrategy === strategy.id && styles.strategyCardSelected,
            ]}
            onPress={() => setSelectedStrategy(strategy.id)}
          >
            <Text style={styles.strategyIcon}>{strategy.icon}</Text>
            <View style={styles.strategyInfo}>
              <Text style={styles.strategyName}>{strategy.name}</Text>
              <Text style={styles.strategyDesc}>{strategy.description}</Text>
            </View>
            {selectedStrategy === strategy.id && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Commencer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

