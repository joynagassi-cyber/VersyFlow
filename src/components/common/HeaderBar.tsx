/**
 * Header Bar — Standard screen header
 */

import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

interface HeaderBarProps {
  title: string;
  onBack?: () => void;
}

export function HeaderBar({ title, onBack }: HeaderBarProps) {
  return (
    <View style={styles.header}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      {onBack ? <View style={styles.backButtonSpacer} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E91E8C',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#E91E8C',
  },
  backButtonSpacer: {
    width: 40,
  },
});
