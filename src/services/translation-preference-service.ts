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

import {
  TranslationPreferenceRepositoryPowerSync,
  type ITranslationPreferenceRepository,
} from '@/infrastructure/repository/translation-preference-repository-powersync';
import { getSyncUserIdProvider } from '@/infrastructure/repository/powersync-repositories';
import { DEFAULT_BIBLE_TRANSLATIONS } from '@/domains/bible/registry';

let _instance: ITranslationPreferenceRepository | null = null;

export function getTranslationPreferenceRepository(): ITranslationPreferenceRepository {
  if (!_instance) {
    _instance = new TranslationPreferenceRepositoryPowerSync(getSyncUserIdProvider());
  }
  return _instance;
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
