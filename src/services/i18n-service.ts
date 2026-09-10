/**
 * I18n Service — bridges custom useI18n() to i18next instance
 *
 * Delegates t/getLanguage/setLanguage/isRTL to the i18next instance
 * so the 6 useI18n()-based screens keep working unchanged.
 */

import i18next from 'i18next';

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
          return i18next.language ?? 'fr';
        },
        t: (key: string, params?: Record<string, unknown>) => {
          return i18next.t(key, params);
        },
        isRTL: () => {
          const lng = i18next.language ?? 'fr';
          return lng === 'ar' || lng === 'he' || lng === 'fa' || lng === 'ur';
        },
      };
    }
    return this.instance;
  }
}

export const SUPPORTED_LANGUAGES = ['fr', 'en', 'ar', 'de', 'zh'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'fr';
export const FALLBACK_LANGUAGE: Language = 'en';

export function isRTL(lng: string): boolean {
  return lng === 'ar' || lng === 'he' || lng === 'fa' || lng === 'ur';
}
