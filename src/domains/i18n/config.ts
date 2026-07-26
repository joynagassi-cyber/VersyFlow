/**
 * I18n Configuration
 * Supported languages and defaults
 * See docs/12-internationalization.md
 */

export interface Language {
  code: string;
  name: string;
  displayName: string;
  rtl: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'fr', name: 'Français', displayName: 'French', rtl: false },
  { code: 'en', name: 'English', displayName: 'Anglais', rtl: false },
  { code: 'ar', name: 'العربية', displayName: 'Arabe', rtl: true },
  { code: 'de', name: 'Deutsch', displayName: 'Allemand', rtl: false },
  { code: 'zh', name: '中文', displayName: 'Chinois', rtl: false },
] as const;

export const DEFAULT_LANGUAGE = 'fr';
export const FALLBACK_LANGUAGE = 'en';

export const RTL_LANGUAGES = ['ar', 'he', 'ur'];

export function isRTL(code: string): boolean {
  return RTL_LANGUAGES.includes(code);
}
