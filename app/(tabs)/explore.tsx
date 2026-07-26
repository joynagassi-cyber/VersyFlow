/**
 * Explore Tab — Bible Explorer placeholder
 * Full implementation: BookListScreen → ChapterListScreen → VerseListScreen
 * See docs/08-ui-screens.md §5
 */

import { StyleSheet, View, Text } from 'react-native';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explorer la Bible</Text>
      <Text style={styles.placeholder}>
        Navigation Bible complète:
        {'\n'}- 66 livres groupés par testament
        {'\n'}- Chapitres avec nombre de versets
        {'\n'}- Versets avec texte complet LSG
        {'\n'}- Recherche par référence
        {'\n'}- Indicateurs de statut mémorisation
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
