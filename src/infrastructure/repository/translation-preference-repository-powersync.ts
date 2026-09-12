/**
 * TranslationPreferenceRepositoryPowerSync — PowerSync/SQLite repository for
 * the per-user Bible translation preference (`users.default_translation`).
 *
 * This is the P1B-2 single sync write path for the preferred translation.
 * It is a narrow read/write port (Interface/Adapter pattern): the domain and
 * UI never touch PowerSync or SQL directly — they consume
 * {@link ITranslationPreferenceRepository} and are wired to this adapter in
 * the composition root.
 *
 * Reads are offline-first: the current user's row is queried locally from the
 * synced `users` table. A write is a scoped `UPDATE` on `users` through a
 * `writeTransaction`, picked up by the PowerSync upload queue. When there is
 * no authenticated session the write fails fast (an unowned row would break
 * RLS), matching the sync invariant "local writes MUST set user_id ownership".
 *
 * The preference value is validated against the app catalogue before it is
 * written, so an unknown translation id is rejected rather than silently
 * persisted.
 */

import type { CommonPowerSyncDatabase } from '@powersync/common';
import { getPowerSyncDatabase } from '../sync/powersync-database';
import type { ISyncUserIdProvider } from '../sync/sync-user-id-provider';

/** Read/write surface for the user's preferred Bible translation. */
export interface ITranslationPreferenceRepository {
  /** The current user's stored preference, or `null` when absent/signed out. */
  get(): Promise<string | null>;
  /**
   * Persist a translation id as the current user's preference. `catalog` is
   * the allowed translation id list (defaults to the bundled catalogue when
   * omitted). Rejects an id that is not in the catalogue and throws when
   * there is no session.
   */
  set(translationId: string, catalog?: readonly string[]): Promise<void>;
}

interface UserRow {
  id: string;
  default_translation: string | null;
}

export class TranslationPreferenceRepositoryPowerSync implements ITranslationPreferenceRepository {
  constructor(
    private readonly userIdProvider: ISyncUserIdProvider,
    private readonly dbFactory: () => CommonPowerSyncDatabase = getPowerSyncDatabase,
  ) {}

  async get(): Promise<string | null> {
    const userId = await this.userIdProvider.resolveUserId();
    if (!userId) return null;
    const db = this.dbFactory();
    const rows = await db.getAll<UserRow>(
      'SELECT default_translation FROM users WHERE id = ?',
      [userId],
    );
    if (rows.length === 0) return null;
    return rows[0].default_translation ?? null;
  }

  async set(
    translationId: string,
    catalog: readonly string[] = ['lsg', 'ostervald'],
  ): Promise<void> {    if (!catalog.includes(translationId)) {
      throw new Error(
        `[TranslationPreference] unknown translation "${translationId}" (not in catalogue)`,
      );
    }
    const userId = await this.userIdProvider.resolveUserId();
    if (!userId) {
      throw new Error(
        '[TranslationPreference] set called without an authenticated user',
      );
    }
    const db = this.dbFactory();
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        'UPDATE users SET default_translation = ?, updated_at = ? WHERE id = ?',
        [translationId, new Date().toISOString(), userId],
      );
    });
  }
}
