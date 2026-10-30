import { normalizeLocaleCode } from '@/domains/i18n/config';

/** Format legacy progress labels without exposing their placeholder. */
export function formatProgressLabel(template: string, count: number, language: string): string {
  const locale = normalizeLocaleCode(language);
  const plural = new Intl.PluralRules(locale).select(count) !== 'one';
  const suffix = ['fr', 'es', 'pt'].includes(locale) && plural ? 's' : '';
  const label = template.replace(/{plural}/g, suffix).replace(/{count}/g, String(count));
  // French “jours” is a fixed plural in the legacy catalogue.
  if (!plural && locale === 'fr' && label === 'jours') return 'jour';
  if (!plural && locale === 'en' && label === 'days') return 'day';
  return label;
}
