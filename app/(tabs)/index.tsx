/**
 * Home Tab — Main screen after onboarding
 * Placeholder for HomeScreen (see docs/08-ui-screens.md §4)
 */

import { StyleSheet, View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VersyFlow</Text>
      <Text style={styles.subtitle}>Mémorisation biblique intuitive</Text>
      <Text style={styles.placeholder}>
        L'écran d'accueil complet sera implémenté avec:
        {'\n'}- Review reminder card
        {'\n'}- Streak badge
        {'\n'}- Quick actions grid
        {'\n'}- Recent verses list
        {'\n'}- Upcoming reviews section
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
    fontSize: 32,
    fontWeight: '700',
    color: '#E91E8C',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6E6E6E',
    marginTop: 4,
  },
  placeholder: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 24,
    lineHeight: 24,
  },
});
