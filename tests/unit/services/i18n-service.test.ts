/**
 * Tests for I18nService — bridges to i18next instance
 * Tests singleton pattern, language methods, and RTL detection.
 *
 * After the i18n unification refactor, this service re-exports the canonical
 * language registry from `@/domains/i18n/config` (single source of truth),
 * so the assertions below mirror that domain shape: `SUPPORTED_LANGUAGES`
 * is an array of `Language` objects (code, name, displayName, rtl), and
 * `isRTL` follows the domain's RTL set (ar, he, ur, ps — Persian is LTR).
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

    it('returns true for Urdu', () => {
      (i18next as any).language = 'ur';
      const instance = I18nService.getInstance();
      expect(instance.isRTL()).toBe(true);
    });

    it('returns true for Pashto (ps) — RTL in the domain registry', () => {
      (i18next as any).language = 'ps';
      const instance = I18nService.getInstance();
      expect(instance.isRTL()).toBe(true);
    });

    it('returns false for Persian (fa) — LTR in the domain registry', () => {
      (i18next as any).language = 'fa';
      const instance = I18nService.getInstance();
      expect(instance.isRTL()).toBe(false);
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
  it('returns true for the domain RTL set: ar, he, ur, ps', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('he')).toBe(true);
    expect(isRTL('ur')).toBe(true);
    expect(isRTL('ps')).toBe(true);
  });

  it('returns false for LTR languages incl. Persian', () => {
    expect(isRTL('fr')).toBe(false);
    expect(isRTL('en')).toBe(false);
    expect(isRTL('fa')).toBe(false);
  });

  it('returns false for unknown languages', () => {
    expect(isRTL('xx')).toBe(false);
  });
});

describe('Constants', () => {
  it('SUPPORTED_LANGUAGES is the domain registry (array of Language objects)', () => {
    // Re-exported from @/domains/i18n/config — shape is { code, name, displayName, rtl }
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('fr');
    expect(codes).toContain('en');
    expect(codes).toContain('ar');
    expect(codes).toContain('de');
    expect(codes).toContain('zh');
    expect(codes).toContain('es');
    expect(codes).toContain('ja');
    // Full registry — not the stale 5-language list
    expect(codes.length).toBeGreaterThanOrEqual(45);
  });

  it('every entry carries code, name, displayName and rtl flags', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(typeof lang.code).toBe('string');
      expect(typeof lang.name).toBe('string');
      expect(typeof lang.displayName).toBe('string');
      expect(typeof lang.rtl).toBe('boolean');
    }
  });

  it('DEFAULT_LANGUAGE is fr', () => {
    expect(DEFAULT_LANGUAGE).toBe('fr');
  });

  it('FALLBACK_LANGUAGE is en', () => {
    expect(FALLBACK_LANGUAGE).toBe('en');
  });
});
