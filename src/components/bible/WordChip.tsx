/**
 * WordChip — Interactive word display component for memorization sessions
 * Shows individual words with reveal/hide states
 */

import { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export interface WordChipProps {
  word: string;
  revealed: boolean;
  onPress?: () => void;
  style?: object;
}

export function WordChip({ word, revealed, onPress, style }: WordChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, revealed && styles.chipRevealed, style]}
      onPress={onPress}
      disabled={!onPress && !revealed}
    >
      <Text style={[styles.wordText, revealed && styles.wordTextRevealed]}>
        {revealed ? word : ' '.repeat(word.length)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    marginHorizontal: 2,
    minWidth: 40,
    alignItems: 'center',
  },
  chipRevealed: {
    backgroundColor: '#E91E8C',
  },
  wordText: {
    fontSize: 16,
    color: '#2D2D2D',
    fontFamily: 'monospace',
  },
  wordTextRevealed: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
