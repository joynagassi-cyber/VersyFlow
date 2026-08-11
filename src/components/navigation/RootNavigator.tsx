/**
 * Root Navigator — Main navigation with auth gate
 * Handles routing between splash, boot, auth, and main app
 */

import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';
import SplashScreen from '@/app/splash';
import BootScreen from '@/app/boot';

export default function RootNavigator() {
  const [appStage, setAppStage] = useState<'splash' | 'boot' | 'main'>('splash');
  const [nextScreen, setNextScreen] = useState<string>('(tabs)');
  const { isAuthenticated, checkSession } = useAuthStore();
  const { onboardingCompleted } = useSettingsStore();

  useEffect(() => {
    // After splash, move to boot
    const timer = setTimeout(() => {
      setAppStage('boot');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleBootComplete = async (screen: string) => {
    setNextScreen(screen);
    setAppStage('main');

    // Check auth session
    await checkSession();
  };

  const handleSkipAuth = () => {
    // Skip to main app (guest mode)
    setNextScreen('(tabs)');
  };

  if (appStage === 'splash') {
    return <SplashScreen onFinish={() => setAppStage('boot')} />;
  }

  if (appStage === 'boot') {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Auth Screens */}
      <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
      <Stack.Screen name="auth/signup" options={{ presentation: 'modal' }} />
      <Stack.Screen name="auth/verify" options={{ presentation: 'modal' }} />
      <Stack.Screen name="authgate" options={{ presentation: 'modal' }} />

      {/* Main Tab Navigation */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

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

      {/* Profile */}
      <Stack.Screen name="profile" options={{ presentation: 'modal' }} />

      {/* Settings */}
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings/appearance" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings/languages" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings/backup" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings/privacy" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings/about" options={{ presentation: 'modal' }} />

      {/* 404 Fallback */}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
