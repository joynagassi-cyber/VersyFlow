/**
 * Onboarding Layout — Full-screen modal style for onboarding flow
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      presentation: 'modal',
      animation: 'slide_from_bottom',
    }} />
  );
}
