/**
 * Root Layout — VersyFlow App Entry Point
 * Sets up: Theme Provider, I18n, Safe Area, RTL direction
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import i18n service to initialize language
import { I18nService } from '@/i18n';

export default function RootLayout() {
  // Initialize i18n on app start with default language
  useEffect(() => {
    const i18n = I18nService.getInstance();
    i18n.setLanguage('fr');
  }, []);

  return (
    <SafeAreaProvider style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Tab Navigation Shell */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Onboarding Flows */}
        <Stack.Screen name="onboarding/welcome" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding/language-select" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding/translation-select" options={{ presentation: 'modal' }} />

        {/* Memorization Flows */}
        <Stack.Screen name="memorization/session" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="memorization/confirm" options={{ presentation: 'fullScreenModal' }} />

        {/* Review Flows */}
        <Stack.Screen name="review/queue" options={{ presentation: 'modal' }} />
        <Stack.Screen name="review/session" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="review/summary" options={{ presentation: 'modal' }} />

        {/* 404 Fallback */}
        <Stack.Screen name="+not-found" />
      </Stack>

      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6', // primary-50 background
  },
});

