/**
 * Hook de localisation — useI18n
 *
 * Permet aux composants d'accéder aux fonctionnalités de traduction et de
 * gestion de langue. Délégué à i18next via I18nService (services/i18n-service).
 *
 * Propriétaire : Herald (src/hooks/useI18n.ts)
 *
 * See: docs/12-internationalization.md
 */

import { useState, useCallback } from 'react';
import { I18nService, SUPPORTED_LANGUAGES } from '@/services/i18n-service';

/**
 * Informations sur la langue courante.
 */
export interface LanguageInfo {
  code: string;
  name: string;
  displayName: string;
  rtl: boolean;
}

/**
 * Type de résultat du hook useI18n.
 */
export type I18nHook = {
  /** La langue courante */
  language: string;
  /** Traduire une clé */
  t: (key: string, params?: Record<string, unknown>) => string;
  /** Traduire une clé dans une langue spécifique */
  tFor: (key: string, language: string) => string;
  /** Changer la langue courante */
  setLanguage: (language: string) => void;
  /** Obtenir la langue courante comme objet */
  getLanguageInfo: () => LanguageInfo | undefined;
  /** Vérifier si la langue est RTL */
  isRTL: () => boolean;
  /** Obtenir toutes les langues supportées */
  getSupportedLanguages: () => typeof SUPPORTED_LANGUAGES;
};

const LANG_NAMES: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
  de: 'Deutsch',
  zh: '中文',
};

/**
 * Hook React pour accéder à la service de localisation (i18next via
 * I18nService). Fournit la traduction et la gestion de langue dans tous
 * les composants.
 *
 * @returns L'objet I18nHook avec les méthodes de localisation
 */
export function useI18n(): I18nHook {
  const i18n = I18nService.getInstance();

  // État local pour le component — en pratique, le service est un singleton
  const [localLanguage, setLocalLanguage] = useState<string>(i18n.getLanguage());

  // Mettre à jour la langue dans le service et l'état local
  const setLanguage = useCallback((language: string) => {
    i18n.setLanguage(language);
    setLocalLanguage(language);
  }, []);

  // Traduire une clé
  const t = useCallback((key: string, params?: Record<string, unknown>) => {
    return i18n.t(key, params);
  }, []);

  // Traduire dans une langue spécifique
  const tFor = useCallback((key: string, language: string) => {
    const prev = i18n.getLanguage();
    i18n.setLanguage(language);
    const result = i18n.t(key);
    i18n.setLanguage(prev);
    return result;
  }, []);

  // Obtenir l'info sur la langue courante
  const getLanguageInfo = useCallback((): LanguageInfo | undefined => {
    const langCode = i18n.getLanguage();
    return {
      code: langCode,
      name: LANG_NAMES[langCode] ?? langCode,
      displayName: LANG_NAMES[langCode] ?? langCode,
      rtl: i18n.isRTL(),
    };
  }, []);

  // Vérifier RTL
  const isRTL = useCallback(() => {
    return i18n.isRTL();
  }, []);

  // Obtenir toutes les langues supportées
  const getSupportedLanguages = useCallback(() => {
    return SUPPORTED_LANGUAGES;
  }, []);

  return {
    language: localLanguage,
    t,
    tFor,
    setLanguage,
    getLanguageInfo,
    isRTL,
    getSupportedLanguages,
  };
}
