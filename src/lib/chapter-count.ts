import { normalizeLocaleCode } from '@/domains/i18n/config';

/** Legacy translations use single-brace placeholders. Do not invent suffixes
 * for languages whose morphology has not yet been migrated to i18next plurals. */
export function formatChapterCount(template: string, count: number, language: string): string {
  const locale = normalizeLocaleCode(language);
  const one = new Intl.PluralRules(locale).select(count) === 'one';
  const suffix = ['fr', 'en', 'es', 'pt'].includes(locale) && !one ? 's' : '';
  return template.replace(/{count}/g, String(count)).replace(/{plural}/g, suffix);
}
