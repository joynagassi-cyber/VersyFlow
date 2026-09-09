/**
 * Memorization Confirm Screen — Results and rating after session completion
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Animated,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter, useLocalSearchParams } from '@/hooks/useIonicNavigation';
import { IonIcon } from '@ionic/react'
import * as Ionicons from 'ionicons/icons';

interface FSRSResult {
  interval: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  repetitions: number;
}

export default function MemorizationConfirm() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [result, setResult] = useState<FSRSResult | null>(null);

  useEffect(() => {
    // Simulate FSRS calculation
    const mockResult: FSRSResult = {
      interval: 3,
      stability: 2.5,
      difficulty: 4.2,
      elapsedDays: 0,
      repetitions: 1,
    };
    setResult(mockResult);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Session terminée !
        </Text>

        {result && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: rad['2xl'], padding: 24 }]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Prochain rappel</Text>
            <Text style={[styles.value, { color: colors.primary }]}>{result.interval} jours</Text>
          </View>
        )}

        <View style={[styles.actions, { paddingHorizontal: sp.lg }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, borderRadius: rad.pill, paddingVertical: 14 }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Retour</Text>
          </TouchableOpacity>
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
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  actions: {
    marginBottom: 32,
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
