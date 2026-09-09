/**
 * Memorization Session Screen — Unified session supporting all strategies
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Animated,
  Platform,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter, useLocalSearchParams } from '@/hooks/useIonicNavigation';
import { IonIcon } from '@ionic/react'
import * as Ionicons from 'ionicons/icons';
import { useMemoryCapability } from '@/capabilities/memory/store';
import { useProgressiveMask } from '@/capabilities/memory/strategies/progressive-mask';
import { useSmartMask } from '@/capabilities/memory/strategies/smart-mask';
import { useFlashcard } from '@/capabilities/memory/strategies/flashcard';
import { useRecallWriting } from '@/capabilities/memory/strategies/recall-writing';
import { useMemorizationSession } from '@/hooks/useMemorizationSession';

export default function MemorizationSession() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { startSession, sessionState } = useMemoryCapability();
  const session = useMemorizationSession();

  useEffect(() => {
    if (params.reference && params.text && !sessionState) {
      startSession({
        reference: params.reference,
        verseText: params.text,
        strategy: params.strategy as 'flashcard' | 'progressive-mask' | 'random-mask' | 'recall-writing' | 'smart-mask' || 'flashcard',
      });
    }
  }, [params]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Session de mémorisation
        </Text>
        <View style={[styles.content, { backgroundColor: colors.surface, borderRadius: rad['2xl'] }]}>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            {params.text || 'En attente...'}
          </Text>
        </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  content: {
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
  },
});
