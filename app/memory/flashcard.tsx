/**
 * Memory Flashcard Screen
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter, useLocalSearchParams } from '@/hooks/useIonicNavigation';
import { useFlashcard } from '@/capabilities/memory/strategies/flashcard';
import { useMemoryCapability } from '@/capabilities/memory/store';

export default function FlashcardScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { sessionState, startSession } = useMemoryCapability();
  const flashcard = useFlashcard();

  useState(() => {
    if (!sessionState && params.text) {
      startSession({
        phase: 'preview',
        verseText: params.text,
      });
    }
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Flashcard
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary, borderRadius: rad.pill, paddingVertical: 14 }]}
        onPress={() => router.back()}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Retour</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
