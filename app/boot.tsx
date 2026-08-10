/**
 * BootScreen — App Initialization Screen
 * Checks user session, onboarding status, and routes accordingly
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/theme/useTheme';
import { useSettingsStore } from '@/store/settings-store';
import { useProfileStore } from '@/store/profile-store';
import { I18nService } from '@/i18n';
import { BibleRepository } from '@/domains/bible/repository';

interface Props {
  onComplete: (screen: string) => void;
}

export default function BootScreen({ onComplete }: Props) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const { onboardingCompleted, uiLanguage } = useSettingsStore();
  const { profiles, autoSelectIfSingle } = useProfileStore();

  useEffect(() => {
    initializeApp().then((screen) => {
      onComplete(screen);
    });
  }, []);

  const initializeApp = async (): Promise<string> => {
    try {
      // Initialize i18n
      const i18n = I18nService.getInstance();
      i18n.setLanguage(uiLanguage || 'fr');

      // Initialize Bible repository
      const bibleRepo = BibleRepository.getInstance();
      await bibleRepo.load();

      // Auto-select single profile
      autoSelectIfSingle();

      // Determine next screen based on profile state
      if (!onboardingCompleted) {
        return 'onboarding/welcome';
      }

      // Check if profile selection is needed
      if (profiles.length === 0) {
        return 'profile/select';
      }

      if (profiles.length > 1) {
        return 'profile/select';
      }

      return '(tabs)';
    } catch (error) {
      console.error('Boot initialization failed:', error);
      return '(tabs)'; // Fallback to main app
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
