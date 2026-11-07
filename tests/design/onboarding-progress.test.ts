import { describe, expect, it, beforeEach } from 'vitest';
import { clearOnboardingProgress, isOnboardingReady, markOnboardingReady, readOnboardingProgress, saveOnboardingProgress } from '@/onboarding/progress';

describe('reprise de l’onboarding', () => {
  beforeEach(() => localStorage.clear());
  it('isole les étapes par compte et ignore les routes inconnues', () => {
    saveOnboardingProgress('one', '/onboarding/journey/review');
    saveOnboardingProgress('two', '/onboarding/translation-select');
    saveOnboardingProgress('one', '/tabs/home');
    expect(readOnboardingProgress('one')).toBe('/onboarding/journey/review');
    expect(readOnboardingProgress('two')).toBe('/onboarding/translation-select');
    expect(readOnboardingProgress('third')).toBe('/onboarding/language-select');
    clearOnboardingProgress('one');
    expect(readOnboardingProgress('one')).toBe('/onboarding/language-select');
    expect(readOnboardingProgress('two')).toBe('/onboarding/translation-select');
  });
  it('limite la révélation au compte et au profil enregistrés', () => {
    markOnboardingReady('one', 'profile-a');
    expect(isOnboardingReady('one', 'profile-a')).toBe(true);
    expect(isOnboardingReady('one', 'profile-b')).toBe(false);
    expect(isOnboardingReady('two', 'profile-a')).toBe(false);
  });
});
