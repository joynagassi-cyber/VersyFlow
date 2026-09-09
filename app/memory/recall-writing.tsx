/**
 * Memory Recall Writing Screen
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter, useLocalSearchParams } from '@/hooks/useIonicNavigation';
import { useRecallWriting } from '@/capabilities/memory/strategies/recall-writing';
import { useMemoryCapability } from '@/capabilities/memory/store';

export default function RecallWritingScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { sessionState, startSession } = useMemoryCapability();
  const writing = useRecallWriting();

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
      <ScrollView style={styles.scroll}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Recall Writing
        </Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: colors.surface,
            borderRadius: rad.md,
            padding: 16,
            color: colors.textPrimary,
          }]}
          placeholder="Écrivez le verset de mémoire..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={6}
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, borderRadius: rad.pill, paddingVertical: 14, marginTop: 16 }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
