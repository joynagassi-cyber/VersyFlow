/**
 * Tests for I18nService — bridges to i18next instance
 * Tests singleton pattern, language methods, and RTL detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { I18nService, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, isRTL } from '@/services/i18n-service';

// Mock i18next
vi.mock('i18next', () => ({
  default: {
    isInitialized: true,
    language: 'fr',
    changeLanguage: vi.fn(),
    t: vi.fn((key: string) => key),
  },
}));

import i18next from 'i18next';

describe('I18nService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the singleton by setting language back to default
    (i18next as any).language = 'fr';
  });

  afterEach(() => {
    // Clean up singleton after each test
    (I18nService as any).instance = null;
  });

  describe('getInstance()', () => {
    it('returns an object with setLanguage, getLanguage, t, isRTL', () => {
      const instance = I18nService.getInstance();
      expect(instance).toBeDefined();
      expect(typeof instance.setLanguage).toBe('function');
      expect(typeof instance.getLanguage).toBe('function');
      expect(typeof instance.t).toBe('function');
      expect(typeof instance.isRTL).toBe('function');
    });

    it('returns the same instance on subsequent calls (singleton)', () => {
      const instance1 = I18nService.getInstance();
      const instance2 = I18nService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('setLanguage()', () => {
    it('calls i18next.changeLanguage with the provided language', () => {
      const instance = I18nService.getInstance();
      instance.setLanguage('en');
      expect(i18next.changeLanguage).toHaveBeenCalledWith('en');
    });

    it('handles RTL languages', () => {
      const instance = I18nService.getInstance();
      instance.setLanguage('ar');
      expect(i18next.changeLanguage).toHaveBeenCalledWith('ar');
    });
  });

  describe('getLanguage()', () => {
    it('returns the current language', () => {
      const instance = I18nService.getInstance();
      expect(instance.getLanguage()).toBe('fr');
    });

    it('falls back to fr when language is undefined', () => {
      (i18next as any).language = undefined;
      const instance = I18nService.getInstance();
      expect(instance.getLanguage()).toBe('fr');
    });
  });

  describe('t()', () => {
    it('delegates to i18next.t', () => {
      const instance = I18nService.getInstance();
      const result = instance.t('common.back');
      expect(i18next.t).toHaveBeenCalledWith('common.back', undefined);
      expect(result).toBe('common.back');
    });

    it('passes interpolation params', () => {
      const instance = I18nService.getInstance();
      instance.t('greeting', { name: 'Jean' });
      expect(i18next.t).toHaveBeenCalledWith('greeting', { name: 'Jean' });
    });
  });

  describe('isRTL()', () => {
    it('returns true for Arabic', () => {
      (i18next as any).language = 'ar';
      const instance = I18nService.getInstance();
      expect(instance.isRTL()).toBe(true);
    });

    it('returns true for Hebrew', () => {
      (i18next as any).language = 'he';
      const instance = I18nService.getInstance();
      expect(instance.isRTL()).toBe(true);
    });

    it('returns true for Persian', () => {
      (i18next as any).language = 'fa';
      const instance = I18nService.getInstance();
      expect(instance.isRTL()).toBe(true);
    });

    it('returns true for Urdu', () => {
      (i18next as any).language = 'ur';
      const instance = I18nService.getInstance();
      expect(instance.isRTL()).toBe(true);
    });

    it('returns false for French', () => {
      (i18next as any).language = 'fr';
      const instance = I18nService.getInstance();
      expect(instance.isRTL()).toBe(false);
    });

    it('returns false for English', () => {
      (i18next as any).language = 'en';
      const instance = I18nService.getInstance();
      expect(instance.isRTL()).toBe(false);
    });

    it('defaults to false when language is undefined', () => {
      (i18next as any).language = undefined;
      const instance = I18nService.getInstance();
      expect(instance.isRTL()).toBe(false);
    });
  });
});

describe('isRTL() standalone function', () => {
  it('returns true for Arabic', () => {
    expect(isRTL('ar')).toBe(true);
  });

  it('returns true for Hebrew', () => {
    expect(isRTL('he')).toBe(true);
  });

  it('returns true for Persian', () => {
    expect(isRTL('fa')).toBe(true);
  });

  it('returns true for Urdu', () => {
    expect(isRTL('ur')).toBe(true);
  });

  it('returns false for French', () => {
    expect(isRTL('fr')).toBe(false);
  });

  it('returns false for unknown languages', () => {
    expect(isRTL('xx')).toBe(false);
  });
});

describe('Constants', () => {
  it('SUPPORTED_LANGUAGES contains expected values', () => {
    expect(SUPPORTED_LANGUAGES).toContain('fr');
    expect(SUPPORTED_LANGUAGES).toContain('en');
    expect(SUPPORTED_LANGUAGES).toContain('ar');
    expect(SUPPORTED_LANGUAGES).toContain('de');
    expect(SUPPORTED_LANGUAGES).toContain('zh');
  });

  it('DEFAULT_LANGUAGE is fr', () => {
    expect(DEFAULT_LANGUAGE).toBe('fr');
  });

  it('FALLBACK_LANGUAGE is en', () => {
    expect(FALLBACK_LANGUAGE).toBe('en');
  });
});
