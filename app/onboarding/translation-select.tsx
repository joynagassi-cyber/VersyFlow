/**
 * Translation Picker Screen — Onboarding Step 2
 * Default: LSG (Louis Segond 1910)
 * See docs/08-ui-screens.md §3
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/store/settings-store';

const TRANSLATIONS = [
  { id: 'lsg', name: 'Louis Segond (1910)', year: '1910', style: 'Classique', default: true },
  // Future translations added here: KJV, NIV, NASB, ESV...
];

export default function TranslationPickerScreen() {
  const router = useRouter();
  const { setBibleTranslation, bibleTranslation } = useSettingsStore();

  const selectedTranslation = bibleTranslation || 'lsg';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Traduction biblique</Text>

      {TRANSLATIONS.map((trans) => (
        <TouchableOpacity
          key={trans.id}
          style={[
            styles.card,
            selectedTranslation === trans.id && styles.cardSelected,
          ]}
          onPress={() => {
            setBibleTranslation(trans.id);
            // Mark onboarding as completed and go home
            useSettingsStore.getState().completeOnboarding();
            router.replace('/(tabs)/index');
          }}
        >
          <View style={styles.transInfo}>
            <Text style={styles.transName}>{trans.name}</Text>
            <Text style={styles.transMeta}>
              {trans.year} • {trans.style}
            </Text>
            {trans.default && (
              <Text style={styles.defaultBadge}>Traduction par défaut</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => router.back()}
      >
        <Text style={styles.continueText}>Retour</Text>
      </TouchableOpacity>
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
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    ...shadow.md,
  },
  cardSelected: {
    backgroundColor: '#FFF0F6',
    borderColor: '#E91E8C',
    borderWidth: 2,
  },
  transInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  transMeta: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 4,
  },
  defaultBadge: {
    fontSize: 12,
    color: '#E91E8C',
    marginTop: 8,
    backgroundColor: '#FFE4EE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  continueButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

const shadow = {
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
};

