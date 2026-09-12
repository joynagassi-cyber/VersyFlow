/**
 * useTranslationPreference — UI glue for the persisted Bible translation
 * preference (P1B-2).
 *
 * This is the single place where the app reads/writes the user's preferred
 * translation. It bridges the session-level `useSettingsStore` value with the
 * PowerSync-backed {@link ITranslationPreferenceRepository} (the `SYNCED`
 * write path via `users.default_translation`).
 *
 * Architecture (port/adapter, offline-first):
 *   - The UI NEVER touches PowerSync or SQL. It calls `setPreference(id)` and
 *     reads `translationId` here.
 *   - `setPreference` writes the session value to the settings store
 *     (immediately, so the app reflects it while offline / signed out) and
 *     best-effort persists it through the repository. When there is no
 *     authenticated user the persistence is skipped (the settings store is
 *     the local source of truth; nothing is lost).
 *   - On mount, when a session exists and the settings store holds the default,
 *     the stored PowerSync preference wins so the reload rehydrates the last
 *     choice (the P1B-2 persistence invariant).
 */

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import { getTranslationPreferenceRepository } from '@/services/translation-preference-service';
import { DEFAULT_BIBLE_TRANSLATIONS } from '@/domains/bible/registry';

const CATALOG: readonly string[] = DEFAULT_BIBLE_TRANSLATIONS.map((t) => t.id);

/**
 * Expose the current translation preference and a setter.
 *
 * `translationId` is the authoritative session value from the settings store.
 * `setPreference` updates the session value and persists it (when signed in).
 */
export function useTranslationPreference() {
  const translationId = useSettingsStore((s) => s.bibleTranslation);
  const setBibleTranslation = useSettingsStore((s) => s.setBibleTranslation);

  // On mount, if the session value is still the default but the user has a
  // persisted (synced) preference, rehydrate from PowerSync.
  useEffect(() => {
    const settings = useSettingsStore.getState();
    if (settings.bibleTranslation === 'lsg') {
      void getTranslationPreferenceRepository()
        .get()
        .then((stored) => {
          if (stored && CATALOG.includes(stored)) {
            useSettingsStore.getState().setBibleTranslation(stored);
          }
        })
        .catch(() => {
          /* offline / no DB — keep the local default */
        });
    }
  }, []);

  const setPreference = (id: string) => {
    if (!CATALOG.includes(id)) return; // never persist an unknown id
    setBibleTranslation(id); // local, immediate (works offline)
    void getTranslationPreferenceRepository()
      .set(id, CATALOG)
      .catch(() => {
        /* No session / offline — the local value already applied. */
      });
  };

  return { translationId, setPreference };
}
