/**
 * Progress Tab — Dashboard placeholder
 * Full implementation: StatsGrid, WeeklyChart, StreakBadge
 * See docs/08-ui-screens.md §10
 */

import { StyleSheet, View, Text } from 'react-native';

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Votre Progression</Text>
      <Text style={styles.placeholder}>
        Dashboard de progression:
        {'\n'}- Versets mémorisés / en cours / maîtrisés
        {'\n'}- Streak quotidienne avec animation
        {'\n'}- Graphique hebdomadaire des révisions
        {'\n'}- Taux de rétention
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
