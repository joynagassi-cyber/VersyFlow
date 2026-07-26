/**
 * Settings Tab — Placeholder
 * Full implementation: grouped settings list with language, translation, reset
 * See docs/08-ui-screens.md §11
 */

import { StyleSheet, View, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paramètres</Text>
      <Text style={styles.placeholder}>
        Paramètres complets:
        {'\n'}- Langue de l'interface
        {'\n'}- Traduction biblique
        {'\n'}- Stockage utilisé
        {'\n'}- Réinitialiser progression
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D2D2D',
    marginTop: 8,
  },
  placeholder: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 24,
    lineHeight: 24,
  },
});
