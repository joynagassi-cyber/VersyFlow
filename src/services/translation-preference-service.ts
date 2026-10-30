/**
 * translation-preference-service — composition root for the persisted
 * translation preference (P1B-2).
 *
 * Wires the {@link ITranslationPreferenceRepository} port to the PowerSync
 * adapter, bound to the shared {@link getSyncUserIdProvider} so reads/writes
 * are scoped to the authenticated user. The UI consumes this factory (never
 * the repository or PowerSync directly) through `useTranslationPreference`.
 *
 * The adapter is a lazy singleton, matching the single-sync invariant
 * (one PowerSync DB, one set of repositories).
 */

import type { ITranslationPreferenceRepository } from '@/infrastructure/repository/translation-preference-repository-powersync';
import { getTranslationPreferenceRepository as resolveRepository } from '@/infrastructure/repository/powersync-repositories';
import { DEFAULT_BIBLE_TRANSLATIONS } from '@/domains/bible/registry';

/**
 * The active adapter for the user's translation preference. Resolution (and
 * singleton caching) lives in the repository composition root, which picks
 * the PowerSync adapter in live mode and the in-browser adapter in mock mode.
 */
export function getTranslationPreferenceRepository(): ITranslationPreferenceRepository {
  return resolveRepository();
}

/**
 * Catalog of valid translation ids — the single source consumed by the
 * UI layer. The hook `useTranslationPreference` no longer imports the
 * domain registry directly (docs/29 §1: hooks must route domain access
 * through services).
 */
export function getKnownTranslationIds(): readonly string[] {
  return DEFAULT_BIBLE_TRANSLATIONS.map((t) => t.id);
}

/** Default translation registry exposed to UI screens via the service
 *  layer (docs/29 §1 Exception 4): UI must not import
 *  `@/domains/bible/registry` values directly. */
export const BIBLE_TRANSLATION_REGISTRY = DEFAULT_BIBLE_TRANSLATIONS;
