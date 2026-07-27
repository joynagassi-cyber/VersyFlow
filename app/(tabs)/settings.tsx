/**
 * Settings Tab — Application settings
 * Grouped settings: language, translation, reset progress
 * See docs/08-ui-screens.md §11
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { I18nService } from '@/domains/i18n/i18n-service';
import { SUPPORTED_LANGUAGES } from '@/domains/i18n/config';
import { BibleRepository } from '@/domains/bible/repository';

export default function SettingsScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<string>('fr');
  const [currentBook, setCurrentBook] = useState<string>('gen');
  const [darkMode, setDarkMode] = useState(false);

  // Initialiser les paramètres au montage
  useEffect(() => {
    const i18n = I18nService.getInstance();
    setLanguage(i18n.getLanguage());

    // Charger la Bible si pas déjà fait
    const repo = BibleRepository.getInstance();
    if (!repo['loaded']) {
      repo.load();
    }
  }, []);

  // Changer la langue
  const handleLanguageChange = (lng: string) => {
    if (lng !== language) {
      const i18n = I18nService.getInstance();
      i18n.setLanguage(lng);
      setLanguage(lng);
    }
  };

  // Changer la traduction par défaut
  const handleBookChange = (bookId: string) => {
    setCurrentBook(bookId);
  };

  // Basculer le mode sombre
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Réinitialiser la progression
  const handleResetProgress = () => {
    Alert.alert(
      'Réinitialiser',
      'Êtes-vous sûr de vouloir réinitialiser votre progression ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: () => {
            // Réinitialiser la logique de progression ici
            Alert.alert('Progression', 'Réinitialisée avec succès');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Paramètres</Text>

      {/* Section Langue */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Langue</Text>
        <View style={styles.list}>
          {SUPPORTED_LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.listItem,
                language === lang.code && styles.listItemActive,
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={[
                styles.listItemText,
                language === lang.code && styles.listItemTextActive,
              ]}>
                {lang.name}
              </Text>
              {language === lang.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Section Traduction */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Traduction par défaut</Text>
        <TouchableOpacity
          style={[styles.listItem, currentBook === 'gen' && styles.listItemActive]}
          onPress={() => handleBookChange('gen')}
        >
          <Text style={[styles.listItemText, currentBook === 'gen' && styles.listItemTextActive]}>
            Genèse (Vieil Testament)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.listItem, currentBook === 'mat' && styles.listItemActive]}
          onPress={() => handleBookChange('mat')}
        >
          <Text style={[styles.listItemText, currentBook === 'mat' && styles.listItemTextActive]}>
            Matthieu (Nouvel Testament)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section Affichage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Affichage</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Mode sombre</Text>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767570', true: '#E91E8C' }}
            thumbColor={darkMode ? '#E91E8C' : '#f4f3f2'}
          />
        </View>
      </View>

      {/* Section Avancé */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avancé</Text>
        <TouchableOpacity
          style={styles.listItem}
          onPress={handleResetProgress}
        >
          <Text style={styles.listItemText}>Réinitialiser progression</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => router.back()}
        >
          <Text style={styles.listItemText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE4EE',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  listItemActive: {
    backgroundColor: '#FFF0F6',
  },
  listItemText: {
    fontSize: 16,
    color: '#2D2D2D',
  },
  listItemTextActive: {
    fontWeight: '600',
    color: '#E91E8C',
  },
  checkmark: {
    fontSize: 24,
    color: '#E91E8C',
    marginLeft: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#2D2D2D',
  },
});