/**
 * Root Layout — VersyFlow App Entry Point
 * Sets up: Theme Provider, I18n, Safe Area, RTL direction
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import theme provider for automatic light/dark mode
import { ThemeProvider } from '@/theme/ThemeProvider';

// Import i18n service to initialize language
import { I18nService } from '@/i18n';

export default function RootLayout() {
  // Initialize i18n on app start with default language
  useEffect(() => {
    const i18n = I18nService.getInstance();
    i18n.setLanguage('fr');
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider style={styles.container}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {/* Tab Navigation Shell */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Auth Screens */}
          <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/signup" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/verify" options={{ presentation: 'modal' }} />
          <Stack.Screen name="splash" options={{ presentation: 'transparentModal' }} />
          <Stack.Screen name="boot" options={{ presentation: 'transparentModal' }} />

          {/* Onboarding Flows */}
          <Stack.Screen name="onboarding/welcome" options={{ presentation: 'modal' }} />
          <Stack.Screen name="onboarding/language-select" options={{ presentation: 'modal' }} />
          <Stack.Screen name="onboarding/translation-select" options={{ presentation: 'modal' }} />

          {/* Bible Explorer */}
          <Stack.Screen name="bible/explorer" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bible/book/[bookId]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bible/chapter/[bookId]/[chapterNumber]" options={{ presentation: 'modal' }} />

          {/* Memorization Flows */}
          <Stack.Screen name="memorization/session" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="memorization/confirm" options={{ presentation: 'fullScreenModal' }} />

          {/* Review Flows */}
          <Stack.Screen name="review/queue" options={{ presentation: 'modal' }} />
          <Stack.Screen name="review/session" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="review/summary" options={{ presentation: 'modal' }} />
          <Stack.Screen name="review/history" options={{ presentation: 'modal' }} />
          <Stack.Screen name="review/calendar" options={{ presentation: 'modal' }} />

          {/* Notifications */}
          <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />

          {/* Profile */}
          <Stack.Screen name="profile/select" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile" options={{ presentation: 'modal' }} />

          {/* Family */}
          <Stack.Screen name="family/home" options={{ presentation: 'modal' }} />
          <Stack.Screen name="family/members" options={{ presentation: 'modal' }} />
          <Stack.Screen name="family/invite" options={{ presentation: 'modal' }} />
          <Stack.Screen name="family/join" options={{ presentation: 'modal' }} />
          <Stack.Screen name="family/create" options={{ presentation: 'modal' }} />

          {/* Settings */}
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings/appearance" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings/languages" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings/backup" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings/privacy" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings/about" options={{ presentation: 'modal' }} />

          {/* Memory Capabilities */}
          <Stack.Screen name="memory/start" options={{ presentation: 'modal' }} />
          <Stack.Screen name="memory/flashcard" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="memory/recall-writing" options={{ presentation: 'fullScreenModal' }} />

          {/* Comparison Capabilities */}
          <Stack.Screen name="comparison/result" options={{ presentation: 'modal' }} />

          {/* Analytics Capabilities */}
          <Stack.Screen name="analytics/dashboard" options={{ presentation: 'modal' }} />

          {/* AI Coach Capabilities */}
          <Stack.Screen name="ai-coach" options={{ presentation: 'modal' }} />

          {/* 404 Fallback */}
          <Stack.Screen name="+not-found" />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
