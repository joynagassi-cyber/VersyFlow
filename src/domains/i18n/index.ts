/**
 * I18n Domain — Barrel
 *
 * Public surface of the i18n domain: the supported-language registry and
 * the locale helpers used by `i18n-service` (the UI-facing composition
 * root). Import from this barrel, not from the individual files.
 */

export type { Language } from './config';
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  RTL_LANGUAGES,
  isRTL,
  normalizeLocaleCode,
} from './config';
