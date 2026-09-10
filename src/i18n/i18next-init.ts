/**
 * i18next Initialization Module
 *
 * Dynamically imports all 5 locale files and initializes i18next
 * so react-i18next useTranslation() works app-wide.
 *
 * Strategy: Flatten namespace-key pairs into flat keys under a
 * single 'translation' namespace (e.g. 'session.activeSessionTitle'),
 * then set defaultNS='translation' and keySeparator=false so that
 * t('session.activeSessionTitle') resolves correctly.
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Resource } from 'i18next';

const LOCALES = ['fr', 'en', 'ar', 'de', 'zh'] as const;
const NAMESPACES = [
  'common',
  'onboarding',
  'home',
  'bible',
  'session',
  'review',
  'progress',
  'settings',
  'errors',
  'comparison',
  'family',
] as const;

/**
 * Build i18next resources: flatten nested locale objects into
 * flat dot-notation keys under the 'translation' namespace.
 * e.g. { fr: { translation: { 'common.back': 'Retour', ... } } }
 */
async function buildResources(): Promise<Resource> {
  const resources: Resource = {};

  for (const lng of LOCALES) {
    const mod = await import(`./locales/${lng}.ts`);
    const localeData = (mod as Record<string, unknown>)[lng];

    if (!localeData || typeof localeData !== 'object') {
      console.warn(`[i18next-init] No locale data found for ${lng}`);
      continue;
    }

    const flatDict: Record<string, string> = {};

    for (const ns of NAMESPACES) {
      const nsData = (localeData as Record<string, unknown>)[ns];
      if (!nsData || typeof nsData !== 'object') continue;
      const dict = nsData as Record<string, string>;
      for (const [key, value] of Object.entries(dict)) {
        if (typeof value === 'string') {
          flatDict[`${ns}.${key}`] = value;
        }
      }
    }

    resources[lng] = {
      translation: flatDict,
    } as any;
  }

  return resources;
}

/**
 * Initialize i18next with all locales and namespaces.
 * Must be called before any component uses useTranslation().
 */
export async function initI18next(): Promise<void> {
  const resources = await buildResources();

  await i18next
    .use(initReactI18next)
    .init({
      resources,
      lng: 'fr',
      fallbackLng: 'en',
      defaultNS: 'translation',
      ns: ['translation'],
      keySeparator: false,
      interpolation: { escapeValue: false },
      load: 'currentOnly',
      preload: Array.from(LOCALES),
    });
}

export default i18next;
