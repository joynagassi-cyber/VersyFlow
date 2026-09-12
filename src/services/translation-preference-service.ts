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

let _instance: ITranslationPreferenceRepository | null = null;

export function getTranslationPreferenceRepository(): ITranslationPreferenceRepository {
  if (!_instance) {
    _instance = new TranslationPreferenceRepositoryPowerSync(getSyncUserIdProvider());
  }
  return _instance;
}
