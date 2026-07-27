/**
 * Hook de localisation — useI18n
 *
 * Permet aux composants d'accéder aux fonctionnalités de traduction et de gestion de langue.
 * Utilise le singleton I18nService pour gérer la langue courante.
 *
 * Propriétaire : Herald (src/hooks/useI18n.ts)
 *
 * See: docs/12-internationalization.md
 */

import { useState, useCallback } from 'react';
import { I18nService } from '@/domains/i18n/i18n-service';
import { SUPPORTED_LANGUAGES } from '@/domains/i18n/config';

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
  t: (key: string) => string;
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

/**
 * Hook React pour accéder à la service de localisation.
 * Fournit la traduction et la gestion de langue dans tous les composants.
 *
 * @returns L'objet I18nHook avec les méthodes de localisation
 */
export function useI18n(): I18nHook {
  const i18n = I18nService.getInstance();

  // État local pour le component - en pratique, le service est un singleton
  const [localLanguage, setLocalLanguage] = useState<string>(i18n.getLanguage());

  // Mettre à jour la langue dans le service et l'état local
  const setLanguage = useCallback((language: string) => {
    i18n.setLanguage(language);
    setLocalLanguage(language);
  }, []);

  // Traduire une clé
  const t = useCallback((key: string) => {
    return i18n.t(key);
  }, []);

  // Traduire dans une langue spécifique
  const tFor = useCallback((key: string, language: string) => {
    return i18n.tFor(key, language);
  }, []);

  // Obtenir l'info sur la langue courante
  const getLanguageInfo = useCallback(() => {
    const langCode = i18n.getLanguage();
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    return lang ? { ...lang } : undefined;
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
