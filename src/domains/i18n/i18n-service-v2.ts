/**
 * I18n Service - Internationalization Service
 */

import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, isRTL } from './config';

import { fr } from '@/i18n/locales/fr';
import { en } from '@/i18n/locales/en';
import { ar } from '@/i18n/locales/ar';
import { de } from '@/i18n/locales/de';
import { zh } from '@/i18n/locales/zh';

/** Shape of a locale file (top-level sections only — leaf strings resolved per call). */
type Locale = Record<string, unknown>;

interface LanguageInfo {
  code: string;
  name: string;
  displayName: string;
}

class TranslationRegistry {
  private static instance: TranslationRegistry;
  private translations: Record<string, Locale> = { fr, en, ar, de, zh };
  private loaded = true;

  private constructor() {}

  static getInstance() {
    if (!TranslationRegistry.instance) {
      TranslationRegistry.instance = new TranslationRegistry();
    }
    return TranslationRegistry.instance;
  }

  load() {
    this.loaded = true;
  }

  get(key: string, language: string): string {
    if (!this.loaded) this.load();
    const value = this.translations[language]?.[key];
    if (value !== undefined) return String(value);
    const enValue = this.translations.en?.[key];
    if (enValue !== undefined) return String(enValue);
    const frValue = this.translations.fr?.[key];
    if (frValue !== undefined) return String(frValue);
    return key;
  }

  isSupported(language: string): boolean {
    return SUPPORTED_LANGUAGES.some(l => l.code === language);
  }

  getSupportedLanguages(): LanguageInfo[] {
    return [...SUPPORTED_LANGUAGES];
  }
}

export class I18nService {
  private static instance: I18nService;
  private currentLanguage = DEFAULT_LANGUAGE;
  private translationRegistry = TranslationRegistry.getInstance();

  constructor() {
    this.translationRegistry.load();
  }

  static getInstance() {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  setLanguage(language: string): void {
    if (this.isSupported(language)) {
      this.currentLanguage = language;
    } else {
      this.currentLanguage = DEFAULT_LANGUAGE;
    }
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  t(key: string): string {
    return this.translationRegistry.get(key, this.currentLanguage);
  }

  isRTL(): boolean {
    return isRTL(this.currentLanguage);
  }

  getSupportedLanguages(): LanguageInfo[] {
    return this.translationRegistry.getSupportedLanguages();
  }

  getLanguageName(): string | undefined {
    const lang = this.translationRegistry.getSupportedLanguages().find(l => l.code === this.currentLanguage);
    return lang ? lang.name : undefined;
  }

  getLanguageDisplayName(): string | undefined {
    const lang = this.translationRegistry.getSupportedLanguages().find(l => l.code === this.currentLanguage);
    return lang ? lang.displayName : undefined;
  }

  isSupported(language: string): boolean {
    return this.translationRegistry.isSupported(language);
  }

  get(language: string, key: string): string {
    return this.translationRegistry.get(key, language);
  }
}
