/**
 * App Entry Point — Navigation Controller
 * Orchestrates splash, boot, auth gate, and main app navigation
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';
import SplashScreen from '@/app/splash';
import BootScreen from '@/app/boot';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const router = useRouter();
  const [stage, setStage] = useState<'splash' | 'boot' | 'gate' | 'main'>('splash');
  const [bootResult, setBootResult] = useState<string | null>(null);
  const { isAuthenticated, checkSession } = useAuthStore();
  const { onboardingCompleted } = useSettingsStore();

  // Handle splash completion
  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('boot');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Handle boot completion
  const handleBootComplete = async (screen: string) => {
    setBootResult(screen);
    setStage('gate');

    // Check auth session
    await checkSession();
  };

  // Handle auth gate
  useEffect(() => {
    if (stage !== 'gate') return;

    // If not authenticated, go to auth
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    // If authenticated, route based on onboarding
    if (!onboardingCompleted) {
      router.replace('/onboarding/welcome');
    } else {
      router.replace('/(tabs)');
    }
  }, [stage, isAuthenticated, onboardingCompleted]);

  if (stage === 'splash') {
    return <SplashScreen onFinish={() => setStage('boot')} />;
  }

  if (stage === 'boot') {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  // Main app renders here after boot
  return null;
}
