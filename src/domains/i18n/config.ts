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
  // Core
  { code: 'fr', name: 'Français', displayName: 'French', rtl: false },
  { code: 'en', name: 'English', displayName: 'Anglais', rtl: false },
  // Existing batch
  { code: 'ar', name: 'العربية', displayName: 'Arabe', rtl: true },
  { code: 'de', name: 'Deutsch', displayName: 'Allemand', rtl: false },
  { code: 'zh', name: '中文', displayName: 'Chinois', rtl: false },
  // Batch A
  { code: 'es', name: 'Español', displayName: 'Espagnol', rtl: false },
  { code: 'pt', name: 'Português', displayName: 'Portugais', rtl: false },
  { code: 'id', name: 'Bahasa Indonesia', displayName: 'Indonésien', rtl: false },
  { code: 'ms', name: 'Bahasa Melayu', displayName: 'Malais', rtl: false },
  { code: 'vi', name: 'Tiếng Việt', displayName: 'Vietnamien', rtl: false },
  // Batch B
  { code: 'hi', name: 'हिनदी', displayName: 'Hindi', rtl: false },
  { code: 'sw', name: 'Kiswahili', displayName: 'Swahili', rtl: false },
  { code: 'ta', name: 'தமிழ்', displayName: 'Tamoul', rtl: false },
  { code: 'te', name: 'తెలుగు', displayName: 'Télougou', rtl: false },
  { code: 'th', name: 'ไทย', displayName: 'Thaï', rtl: false },
  // Batch C
  { code: 'tr', name: 'Türkçe', displayName: 'Turc', rtl: false },
  { code: 'ru', name: 'Русский', displayName: 'Russe', rtl: false },
  { code: 'ja', name: '日本語', displayName: 'Japonais', rtl: false },
  { code: 'ko', name: '한국어', displayName: 'Coréen', rtl: false },
  { code: 'he', name: 'עברית', displayName: 'Hébreu', rtl: true },
  // Batch D
  { code: 'nl', name: 'Nederlands', displayName: 'Néerlandais', rtl: false },
  { code: 'pl', name: 'Polski', displayName: 'Polonais', rtl: false },
  { code: 'it', name: 'Italiano', displayName: 'Italien', rtl: false },
  { code: 'fa', name: 'فارسی', displayName: 'Persan', rtl: false },
  { code: 'bn', name: 'বাংলা', displayName: 'Bengali', rtl: false },
  // Batch E
  { code: 'ur', name: 'اردو', displayName: 'Ourdou', rtl: true },
  { code: 'am', name: 'አማርኛ', displayName: 'Amharique', rtl: false },
  { code: 'ne', name: 'नेपाली', displayName: 'Népalais', rtl: false },
  { code: 'ha', name: 'Hausa', displayName: 'Haoussa', rtl: false },
  { code: 'yo', name: 'Yorùbá', displayName: 'Yoruba', rtl: false },
  // Batch F
  { code: 'ku', name: 'Kurdî', displayName: 'Kurde', rtl: false },
  { code: 'ps', name: 'پښتو', displayName: 'Pachtoua', rtl: true },
  { code: 'sd', name: 'سنڌي', displayName: 'Sindhi', rtl: false },
  { code: 'ml', name: 'മലയാളം', displayName: 'Malayalam', rtl: false },
  { code: 'si', name: 'සිංහල', displayName: 'Sinhala', rtl: false },
  // Batch G
  { code: 'km', name: 'ខ្មែរ', displayName: 'Khmer', rtl: false },
  { code: 'lo', name: 'ລາວ', displayName: 'Lao', rtl: false },
  { code: 'my', name: 'မြန်မာ', displayName: 'Birman', rtl: false },
  { code: 'zh-Hant', name: '繁體中文', displayName: 'Chinois traditionnel', rtl: false },
  { code: 'fil', name: 'Filipino', displayName: 'Filipino', rtl: false },
  // Batch H
  { code: 'ig', name: 'Igbo', displayName: 'Igbo', rtl: false },
  { code: 'tw', name: 'Twi', displayName: 'Akan (Twi)', rtl: false },
  { code: 'so', name: 'Soomaali', displayName: 'Somali', rtl: false },
  { code: 'dz', name: 'རྫོང་ཁ', displayName: 'Dzongkha', rtl: false },
  { code: 'st', name: 'Sesotho', displayName: 'Sotho', rtl: false },
] as const;

export const DEFAULT_LANGUAGE = 'fr';
export const FALLBACK_LANGUAGE = 'en';

export const RTL_LANGUAGES = ['ar', 'he', 'ur', 'ps'];

export function isRTL(code: string): boolean {
  return RTL_LANGUAGES.includes(code);
}
