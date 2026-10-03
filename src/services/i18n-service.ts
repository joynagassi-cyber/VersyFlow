/**
 * I18n Service — bridges custom useI18n() to i18next instance
 *
 * Delegates t/getLanguage/setLanguage/isRTL to the i18next instance
 * so the 6 useI18n()-based screens keep working unchanged.
 */

import i18next from 'i18next';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, isRTL, normalizeLocaleCode } from '@/domains/i18n/config';
import type { Language } from '@/domains/i18n/config';

export class I18nService {
  private static instance: {
    setLanguage: (lng: string) => void;
    getLanguage: () => string;
    t: (key: string, params?: Record<string, unknown>) => string;
    isRTL: () => boolean;
  } | null = null;

  static getInstance() {
    if (!this.instance) {
      this.instance = {
        setLanguage: (lng: string) => {
          i18next.changeLanguage(lng);
        },
        getLanguage: () => {
          return normalizeLocaleCode(i18next.language ?? DEFAULT_LANGUAGE);
        },
        t: (key: string, params?: Record<string, unknown>) => {
          return i18next.t(key, params);
        },
        isRTL: () => {
          const lng = normalizeLocaleCode(i18next.language ?? DEFAULT_LANGUAGE);
          return isRTL(lng);
        },
      };
    }
    return this.instance;
  }
}

// Re-export the canonical definitions from the domain layer — single source of truth.
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, isRTL, normalizeLocaleCode };
export type { Language };
