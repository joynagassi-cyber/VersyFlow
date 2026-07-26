/**
 * World Chip — Interactive word chip for memorization session
 * See docs/06-design-system.md (WordChip) + docs/08-ui-screens.md §6
 */

import { StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { colors, radius, spacing } from '@/tokens';

interface WordChipProps {
  word: string;
  revealed: boolean;
  onPress?: () => void;
}

export function WordChip({ word, revealed, onPress }: WordChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, revealed ? styles.revealed : styles.hidden]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {revealed ? (
        <Text style={styles.revealedText}>{word}</Text>
      ) : (
        <Text style={styles.placeholderText}>&nbsp;</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    marginHorizontal: 3,
    marginVertical: 4,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hidden: {
    backgroundColor: '#E8E8E8',
  },
  revealed: {
    backgroundColor: colors.primary[400],
  },
  revealedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    opacity: 0,
  },
});
