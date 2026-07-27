/**
 * I18n Service - Internationalization Service
 */

import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, isRTL } from './config';

import { fr } from '../../../i18n/locales/fr';
import { en } from '../../../i18n/locales/en';
import { ar } from '../../../i18n/locales/ar';
import { de } from '../../../i18n/locales/de';
import { zh } from '../../../i18n/locales/zh';

class TranslationRegistry {
  private static instance;
  private translations = { fr, en, ar, de, zh };
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

  get(key, language) {
    if (!this.loaded) this.load();
    if (this.translations[language]?.[key]) return this.translations[language][key];
    if (this.translations.en?.[key]) return this.translations.en[key];
    if (this.translations.fr?.[key]) return this.translations.fr[key];
    return key;
  }

  isSupported(language) {
    return SUPPORTED_LANGUAGES.some(l => l.code === language);
  }

  getSupportedLanguages() {
    return [...SUPPORTED_LANGUAGES];
  }
}

export class I18nService {
  private static instance;
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

  setLanguage(language) {
    if (this.isSupported(language)) {
      this.currentLanguage = language;
    } else {
      this.currentLanguage = DEFAULT_LANGUAGE;
    }
  }

  getLanguage() {
    return this.currentLanguage;
  }

  t(key) {
    return this.translationRegistry.get(key, this.currentLanguage);
  }

  isRTL() {
    return isRTL(this.currentLanguage);
  }

  getSupportedLanguages() {
    return this.translationRegistry.getSupportedLanguages();
  }

  getLanguageName() {
    const lang = this.translationRegistry.getSupportedLanguages().find(l => l.code === this.currentLanguage);
    return lang ? lang.name : undefined;
  }

  getLanguageDisplayName() {
    const lang = this.translationRegistry.getSupportedLanguages().find(l => l.code === this.currentLanguage);
    return lang ? lang.displayName : undefined;
  }
}
