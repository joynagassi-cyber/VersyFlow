/**
 * I18n Service — l'accès programmatique à la langue active.
 *
 * Délègue `t` / `getLanguage` / `setLanguage` / `isRTL` à l'instance i18next,
 * pour le code qui n'est pas un composant (stores, services, garde-fous). Les
 * écrans, eux, utilisent `useTranslation()` de react-i18next : le hook maison
 * `useI18n` a été supprimé (aucun importeur, doublon du hook de la
 * bibliothèque).
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
