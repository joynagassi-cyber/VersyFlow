/**
 * i18next Initialization Module
 *
 * Dynamically imports all locale files and initializes i18next
 * so react-i18next useTranslation() works app-wide.
 *
 * Strategy: Flatten namespace-key pairs into flat keys under a
 * single 'translation' namespace (e.g. 'session.activeSessionTitle'),
 * then set defaultNS='translation' and keySeparator=false so that
 * t('session.activeSessionTitle') resolves correctly.
 *
 * Locales are imported by file name. For locales whose code contains
 * characters that are not valid JS identifiers (e.g. `zh-Hant`), the
 * exported const uses a camelCase alias (`zhHant`) — the mapping
 * below handles that so `import('./locales/zh-Hant.ts')` still works.
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Resource } from 'i18next';

/**
 * All supported locales, ordered by language family / population so the
 * most common ones are registered first (helps i18next pick a good default
 * detector result when `lng` is not explicitly set).
 */
const LOCALES = [
  // Core (bundled, complete)
  'fr', 'en',
  // Existing batch (completed)
  'ar', 'de', 'zh',
  // Batch A
  'es', 'pt', 'id', 'ms', 'vi',
  // Batch B
  'hi', 'sw', 'ta', 'te', 'th',
  // Batch C
  'tr', 'ru', 'ja', 'ko', 'he',
  // Batch D
  'nl', 'pl', 'it', 'fa', 'bn',
  // Batch E
  'ur', 'am', 'ne', 'ha', 'yo',
  // Batch F
  'ku', 'ps', 'sd', 'ml', 'si',
  // Batch G
  'km', 'lo', 'my', 'zh-Hant', 'fil',
  // Batch H
  'ig', 'tw', 'so', 'dz', 'st',
] as const;

/**
 * For locale codes whose file export name differs from the code itself
 * (JS identifier rules: no hyphens), map the locale code to the actual
 * exported constant name in `locales/<code>.ts`.
 */
const EXPORT_ALIASES: Record<string, string> = {
  'zh-Hant': 'zhHant',
};

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
  'semantic',
  'recallWriting',
] as const;

/**
 * Build i18next resources: flatten nested locale objects into
 * flat dot-notation keys under the 'translation' namespace.
 * e.g. { fr: { translation: { 'common.back': 'Retour', ... } } }
 */
async function buildResources(): Promise<Resource> {
  const resources: Resource = {};

  for (const lng of LOCALES) {
    const mod = (await import(`./locales/${lng}.ts`)) as Record<string, unknown>;
    const exportName = EXPORT_ALIASES[lng] ?? lng;
    const localeData = mod[exportName];

    if (!localeData || typeof localeData !== 'object') {
      console.warn(`[i18next-init] No locale data found for ${lng} (export: ${exportName})`);
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
