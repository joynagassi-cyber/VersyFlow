/**
 * I18n Service — Internationalization Service
 *
 * Gère la localisation et le changement de langue dans l'application.
 * Implémente le pattern singleton avec fallback chain:
 *   selectedLanguage → English → French → key itself
 *
 * Propriétaire : Translator (src/domains/i18n/i18n-service.ts)
 *
 * See: docs/12-internationalization.md, ADR-009
 */

import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, isRTL } from './config';
import { readFileSync, join, existsSync } from 'fs';
import { platform } from 'react-native';

// Chemin vers les fichiers de traductions
const LOCALES_DIR = join(__dirname, '..', '..', 'i18n', 'locales');

// Chargement des traductions au monadique (singleton)
class TranslationRegistry {
  private static instance: TranslationRegistry;
  private translations: Record<string, Record<string, any>> = {};
  private loaded = false;

  private constructor() {}

  public static getInstance(): TranslationRegistry {
    if (!TranslationRegistry.instance) {
      TranslationRegistry.instance = new TranslationRegistry();
    }
    return TranslationRegistry.instance;
  }

  // Charge toutes les traductions disponibles
  public load(): TranslationRegistry {
    for (const langCode of ['fr', 'en', 'ar', 'de', 'zh']) {
      const filePath = join(LOCALES_DIR, `${langCode}.json`);
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          this.translations[langCode] = data;
          console.log(`Traduction chargée: ${langCode}`);
        } catch (error) {
          console.error(`Échec de chargement de ${langCode}.json:`, error);
        }
      }
    }
    this.loaded = true;
    return this;
  }

  // Récupère une traduction pour une clé donnée dans une langue donnée
  public get(key: string, language: string): string {
    if (!this.loaded) {
      this.load();
    }

    // Try the requested language first
    if (this.translations[language] && this.translations[language][key]) {
      return this.translations[language][key];
    }

    // Fall back to English
    if (this.translations.en && this.translations.en[key]) {
      return this.translations.en[key];
    }

    // Fall back to French
    if (this.translations.fr && this.translations.fr[key]) {
      return this.translations.fr[key];
    }

    // Return the key itself as last resort
    return key;
  }

  // Vérifie si une langue est supportée
  public isSupported(language: string): boolean {
    return SUPPORTED_LANGUAGES.some(l => l.code === language);
  }

  // Obtenir toutes les langues supportées
  public getSupportedLanguages() {
    return [...SUPPORTED_LANGUAGES];
  }
}

/**
 * Service de localisation central.
 * Gère la langue courante, le changement de langue et les traductions.
 */
export class I18nService {
  private static instance: I18nService;
  private currentLanguage: string = DEFAULT_LANGUAGE;
  private readonly translationRegistry = TranslationRegistry.getInstance();

  private constructor() {
    // Charger les traductions au démarrage
    this.translationRegistry.load();
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  // Définit la langue courante
  public setLanguage(language: string): void {
    if (this.isSupported(language)) {
      this.currentLanguage = language;
      console.log(`Langue changée: ${language}`);
    } else {
      console.warn(`Langue non supportée: ${language}. Fallback à ${DEFAULT_LANGUAGE}`);
      this.currentLanguage = DEFAULT_LANGUAGE;
    }
  }

  // Obtenir la langue courante
  public getLanguage(): string {
    return this.currentLanguage;
  }

  // Traduire une clé dans la langue courante
  public t(key: string): string {
    return this.translationRegistry.get(key, this.currentLanguage);
  }

  // Traduire une clé dans une langue spécifique
  public tFor(key: string, language: string): string {
    return this.translationRegistry.get(key, language);
  }

  // Vérifier si la langue est RTL (Right-to-Left)
  public isRTL(): boolean {
    return isRTL(this.currentLanguage);
  }

  // Obtenir l'objet de langues supportées
  public getSupportedLanguages() {
    return this.translationRegistry.getSupportedLanguages();
  }

  // Obtenir le nom de la langue courante
  public getLanguageName(): string | undefined {
    const lang = this.translationRegistry.getSupportedLanguages().find(l => l.code === this.currentLanguage);
    return lang ? lang.name : undefined;
  }

  // Obtenir le display name de la langue courante
  public getLanguageDisplayName(): string | undefined {
    const lang = this.translationRegistry.getSupportedLanguages().find(l => l.code === this.currentLanguage);
    return lang ? lang.displayName : undefined;
  }
}
