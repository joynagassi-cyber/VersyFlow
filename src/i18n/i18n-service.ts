/**
 * i18n Service — Translation engine with fallback chain
 * See docs/12-internationalization.md
 */

import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } from '@/domains/i18n/config';

// Lazy imports of locale files
import type { typeof fr } from './locales/fr.json';
import type { typeof en } from './locales/en.json';

// Locale registry — will be populated at startup
const LOCALES: Record<string, Record<string, unknown>> = {
  fr: {} as typeof fr,
  en: {} as typeof en,
};

export class I18nService {
  private language = DEFAULT_LANGUAGE;
  private translations: Record<string, string> = {};

  static instance: I18nService | null = null;

  static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  setLanguage(lang: string): void {
    this.language = lang;
    const locale = LOCALES[lang] || LOCALES[FALLBACK_LANGUAGE];
    this.translations = locale as Record<string, string>;
  }

  isRTL(): boolean {
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === this.language);
    return langConfig?.rtl ?? false;
  }

  getLanguage(): string {
    return this.language;
  }

  translate(key: string, params?: Record<string, string | number>): string {
    let value = this.getNestedValue(this.translations, key) as string;

    // Fallback chain: current language → EN → FR → key itself
    if (!value) {
      value = this.fallbackChain(key);
    }

    // Apply parameters: "{count} versets" → "3 versets"
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value!.replace(`{${k}}`, String(v));
      });
    }

    return value;
  }

  private fallbackChain(key: string): string {
    // Try fallback language first
    const fallbackLocale = LOCALES[FALLBACK_LANGUAGE];
    if (fallbackLocale) {
      const val = this.getNestedValue(fallbackLocale, key);
      if (val) return val as string;
    }
    // Then try default (French)
    const defaultLocale = LOCALES[DEFAULT_LANGUAGE];
    if (defaultLocale) {
      const val = this.getNestedValue(defaultLocale, key);
      if (val) return val as string;
    }
    // Final fallback: return the key itself
    return key;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
    return path.split('.').reduce((acc: any, part) => acc?.[part], obj);
  }
}
