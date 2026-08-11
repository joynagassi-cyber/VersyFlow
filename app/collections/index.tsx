/**
 * Collections Screen — User's saved verse collections
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Collection {
  id: string;
  name: string;
  description: string;
  verseCount: number;
  lastUpdated: string;
  color: string;
  icon: string;
  verses: string[];
}

const SAMPLE_COLLECTIONS: Collection[] = [
  {
    id: '1',
    name: 'Mes favoris',
    description: 'Versets sauvegardés pour référence rapide',
    verseCount: 12,
    lastUpdated: 'Aujourd\'hui',
    color: colors.primary,
    icon: 'heart',
    verses: ['Jean 3:16', 'Psaume 23:1', 'Romains 8:28'],
  },
  {
    id: '2',
    name: 'Psaumes',
    description: 'Collection de psaumes pour la méditation',
    verseCount: 8,
    lastUpdated: 'Hier',
    color: colors.info,
    icon: 'musical-notes',
    verses: ['Psaume 23', 'Psaume 91', 'Psaume 119'],
  },
  {
    id: '3',
    name: 'Évangiles',
    description: 'Paroles de Jésus',
    verseCount: 15,
    lastUpdated: 'Il y a 3 jours',
    color: colors.success,
    icon: 'book',
    verses: ['Matthieu 5:3-12', 'Jean 14:6', 'Luc 15'],
  },
  {
    id: '4',
    name: 'Mémorisés',
    description: 'Verset en cours de mémorisation',
    verseCount: 5,
    lastUpdated: 'Aujourd\'hui',
    color: colors.warning,
    icon: 'brain',
    verses: ['Jean 3:16', 'Philippiens 4:13'],
  },
];

export default function CollectionsScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const [collections] = useState<Collection[]>(SAMPLE_COLLECTIONS);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'memorized' | 'favorites'>('all');

  const filteredCollections = selectedCategory === 'all'
    ? collections
    : selectedCategory === 'memorized'
    ? collections.filter(c => c.icon === 'brain')
    : collections.filter(c => c.icon === 'heart');

  const handleCreateCollection = () => {
    router.push('/collections/create');
  };

  const handleCollectionPress = (collection: Collection) => {
    router.push({
      pathname: '/collections/[id]',
      params: { id: collection.id, name: collection.name },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Collections</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateCollection}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        {[
          { id: 'all', label: 'Toutes', count: collections.length },
          { id: 'memorized', label: 'En mémorisation', count: collections.filter(c => c.icon === 'brain').length },
          { id: 'favorites', label: 'Favoris', count: collections.filter(c => c.icon === 'heart').length },
        ].map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.filterButton, selectedCategory === category.id && styles.filterButtonActive]}
            onPress={() => setSelectedCategory(category.id as any)}
          >
            <Text style={[styles.filterText, selectedCategory === category.id && styles.filterTextActive]}>
              {category.label}
              <Text style={styles.filterCount}> ({category.count})</Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Collections List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredCollections.map((collection) => (
          <TouchableOpacity
            key={collection.id}
            style={styles.collectionCard}
            onPress={() => handleCollectionPress(collection)}
          >
            <View style={[styles.collectionIcon, { backgroundColor: collection.color + '20' }]}>
              <Ionicons name={collection.icon as any} size={28} color={collection.color} />
            </View>
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <Text style={styles.collectionDesc} numberOfLines={1}>{collection.description}</Text>
              <View style={styles.collectionMeta}>
                <View style={styles.collectionStat}>
                  <Ionicons name="book" size={14} color={colors.textMuted} />
                  <Text style={styles.collectionStatText}>{collection.verseCount} versets</Text>
                </View>
                <View style={styles.collectionStat}>
                  <Ionicons name="time" size={14} color={colors.textMuted} />
                  <Text style={styles.collectionStatText}>{collection.lastUpdated}</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Create New Collection */}
        <TouchableOpacity
          style={styles.createCard}
          onPress={handleCreateCollection}
        >
          <View style={[styles.createIcon, { backgroundColor: colors.surfaceTint }]}>
            <Ionicons name="add-circle" size={32} color={colors.primary} />
          </View>
          <View style={styles.createInfo}>
            <Text style={styles.createTitle}>Créer une collection</Text>
            <Text style={styles.createSubtitle}>Organisez vos versets préférés</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceTint,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.surface,
  },
  filterCount: {
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  collectionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  collectionDesc: {
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  collectionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  collectionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collectionStatText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  createIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createInfo: {
    flex: 1,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  createSubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  bottomSpacer: {
    height: 24,
  },
});
