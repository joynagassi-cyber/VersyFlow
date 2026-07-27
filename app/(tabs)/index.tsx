/**
 * Home Tab — Main screen after onboarding
 * Features: Quick reference search, Today's verse, Review reminders
 * See docs/08-ui-screens.md §4
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BibleRepository } from '@/domains/bible/repository';
import { BibleBook } from '@/domains/bible/schema';
import { ReferenceSearchInput } from '@/components/bible/ReferenceSearchInput';

export default function HomeScreen() {
  const router = useRouter();
  const [todayVerse, setTodayVerse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Charger un verset aléatoire pour aujourd'hui
  useEffect(() => {
    const loadTodayVerse = async () => {
      try {
        const repo = BibleRepository.getInstance();
        // Simuler le chargement
        await new Promise(resolve => setTimeout(resolve, 500));

        // Prendre un livre au hasard (Psaume pour l'exemple)
        const randomBook = { id: 'psa', name: { fr: 'Psaumes' }, testament: 'old', chapterCount: 150 };
        const randomChapter = Math.floor(Math.random() * randomBook.chapterCount) + 1;
        const maxVerses = Math.min(20, Math.floor(Math.random() * 30) + 10);
        const randomVerse = Math.floor(Math.random() * maxVerses) + 1;

        setTodayVerse({
          bookId: randomBook.id,
          bookName: randomBook.name.fr,
          chapter: randomChapter,
          verse: randomVerse,
          text: 'Psaume 23:1 - L\'Éternel est mon berger, je ne manquerai de rien.',
        });
      } catch (error) {
        console.error('Erreur lors du chargement du verset:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTodayVerse();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#E91E8C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Bonjour !</Text>
          <Text style={styles.greetingSubtitle}>Aujourd'hui dans la Parole</Text>
        </View>
        <TouchableOpacity
          style={styles.profileIcon}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.profileIconText}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Recherche rapide */}
      <View style={styles.searchSection}>
        <ReferenceSearchInput
          placeholder="Rechercher une référence (ex: Jean 3:16)"
          onSearch={(ref) => console.log('Recherche:', ref)}
        />
      </View>

      {/* Verset du jour */}
      <View style={styles.verseCard}>
        <View style={styles.verseHeader}>
          <Text style={styles.verseBook}>Aujourd'hui</Text>
          <TouchableOpacity
            style={styles.verseAction}
            onPress={() => router.push('/memorization/session')}
          >
            <Text style={styles.verseActionText}>Mémoriser</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.verseReference}>
          {todayVerse.bookName} {todayVerse.chapter}:{todayVerse.verse}
        </Text>
        <Text style={styles.verseText} numberOfLines={4} ellipsizeMode="tail">
          {todayVerse.text}
        </Text>
      </View>

      {/* Actions rapides */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/explore')}
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionIconText}>📖</Text>
          </View>
          <Text style={styles.quickActionLabel}>Explorer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/review/queue')}
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionIconText}>🔄</Text>
          </View>
          <Text style={styles.quickActionLabel}>Révisions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/memorization/session')}
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionIconText}>✚</Text>
          </View>
          <Text style={styles.quickActionLabel}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Votre progression</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Versets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Révisés</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 4,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E91E8C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  searchSection: {
    padding: 16,
  },
  verseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    ...shadow.md,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseBook: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E91E8C',
  },
  verseAction: {
    backgroundColor: '#FFF0F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verseActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E91E8C',
  },
  verseReference: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFE4EE',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF0F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionIconText: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#6E6E6E',
  },
  statsSection: {
    padding: 16,
    paddingBottom: 24,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...shadow.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E91E8C',
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 4,
  },
});

const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
};
