/**
 * Component — ReferenceSearchInput
 *
 * Champ de recherche pour les références bibliques.
 * Supporte les formats :
 *   - "Jean 3:16"
 *   - "Jn 3:16"
 *   - "Genèse 1:1-10"
 *   - "Psaume 23"
 *
 * Propriétaire : Herald (UI Layer)
 * Utilise resolveBookId du domaine Bible pour résoudre les alias.
 */

import { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { resolveBookId } from '@/domains/bible';

export interface ReferenceSearchInputProps {
  /** Gérer la recherche quand l'utilisateur soumet la référence */
  onSearch: (reference: string) => void;
  /** La valeur actuelle du champ de recherche */
  value?: string;
  /** Mettre à jour la valeur quand l'utilisateur tape */
  onChange?: (value: string) => void;
  /** Placeholders texte */
  placeholder?: string;
  /** Si le champ est désactivé */
  disabled?: boolean;
}

/**
 * Composant d'input pour la recherche de références bibliques.
 */
export function ReferenceSearchInput({
  onSearch,
  value = '',
  onChange,
  placeholder = 'Rechercher une référence (ex: Jean 3:16)',
  disabled = false,
}: ReferenceSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState(value);

  const handleInputChange = useCallback((text: string) => {
    setSearchQuery(text);
    onChange?.(text);
  }, [onChange]);

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={searchQuery}
        onChangeText={handleInputChange}
        disabled={disabled}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />
      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleSearch}
        disabled={disabled}
      >
        <Text style={styles.searchIcon}>🔍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 8,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#2D2D2D',
  },
  searchButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});
