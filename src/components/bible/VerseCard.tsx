/**
 * Verse Card — Display a verse in a list
 * See docs/06-design-system.md (CardVerse)
 */

import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

type VerseStatus = 'new' | 'in-progress' | 'mastered';

interface VerseCardProps {
  reference: string;
  text: string;
  status: VerseStatus;
  onPress?: () => void;
}

const STATUS_COLORS: Record<VerseStatus, string> = {
  new: '#A0A0A0',
  'in-progress': '#E91E8C',
  mastered: '#34C759',
};

export function VerseCard({ reference, text, status, onPress }: VerseCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statusIndicator, { backgroundColor: STATUS_COLORS[status] }]} />
      <View style={styles.content}>
        <Text style={styles.reference}>{reference}</Text>
        <Text numberOfLines={3} style={styles.verseText}>{text}</Text>
        <Text style={styles.statusLabel}>
          {status === 'new' ? 'Nouveau' : status === 'in-progress' ? 'En cours' : 'Maîtrisé'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    height: 80,
    ...shadow.sm,
  },
  statusIndicator: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  reference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  verseText: {
    fontSize: 13,
    color: '#6E6E6E',
    lineHeight: 18,
    marginTop: 4,
  },
  statusLabel: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 4,
  },
});

const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
};
