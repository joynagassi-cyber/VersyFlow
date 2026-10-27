/**
 * P1B-2 — Persisted translation preference (SYNCED via `users.default_translation`).
 *
 * Invariant: the chosen Bible translation survives a reload, is scoped to the
 * authenticated user, and is written through PowerSync (single sync write
 * path, no ad-hoc network call, no SQL in UI). The preference is owned by the
 * `users` row and the settings store is the single source of truth for the
 * *session* value (fallback to the local default when signed out / offline).
 *
 * This is a test-first lot: the adapter must read the current user's
 * `default_translation` off PowerSync and write a change back through a
 * `writeTransaction`, both keyed by the resolved user id.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { CommonPowerSyncDatabase } from '@powersync/common';
import {
  TranslationPreferenceRepositoryPowerSync,
  type ITranslationPreferenceRepository,
} from '@/infrastructure/repository/translation-preference-repository-powersync';
import type { ISyncUserIdProvider } from '@/infrastructure/sync/sync-user-id-provider';

/** Build the userIdProvider object from a plain resolver closure. */
function providerFor(id: string | null): ISyncUserIdProvider {
  return { resolveUserId: () => Promise.resolve(id) };
}

/** A throwaway in-memory fake of the PowerSync DB surface we use. */
function makeFakeDb(rows: { users: Record<string, unknown>[] }) {
  const calls: { sql: string; params?: unknown[] }[] = [];
  const db = {
    calls,
    rows,
    getAll<T>(_sql: string, params?: unknown[]): Promise<T[]> {
      calls.push({ sql: _sql, params });
      return Promise.resolve(rows.users as unknown as T[]);
    },
    writeTransaction(fn: (tx: { execute: (sql: string, params?: unknown[]) => Promise<void> }) => Promise<void>) {
      const executed: { sql: string; params?: unknown[] }[] = [];
      const tx = {
        execute(sql: string, params?: unknown[]): Promise<void> {
          const entry = { sql, params };
          executed.push(entry);
          calls.push(entry);
          if (sql.trim().toUpperCase().startsWith('UPDATE')) {
            // UPDATE users SET default_translation = ?, updated_at = ? WHERE id = ?
            const p = params as [string, string, string];
            rows.users = rows.users.map((r) =>
              (r.id as string) === p[2] ? { ...r, default_translation: p[0] } : r,
            );
          }
          return Promise.resolve();
        },
      };
      return fn(tx).then(() => {
        executed.forEach((e) => calls.push(e));
      });
    },
  };
  // Expose both the DB surface the repository uses and the test-only hooks.
  return db as unknown as CommonPowerSyncDatabase & { calls: typeof calls };
}

describe('P1B-2 translation preference repository (PowerSync)', () => {
  let db: ReturnType<typeof makeFakeDb>;
  let repo: ITranslationPreferenceRepository;

  beforeEach(() => {
    db = makeFakeDb({
      users: [
        { id: 'user-1', default_translation: 'lsg' },
        { id: 'user-2', default_translation: 'kjv' },
      ],
    });
    repo = new TranslationPreferenceRepositoryPowerSync(
      providerFor('user-1'),
      () => db,
    );
  });

  it('reads the current user preferred translation from PowerSync', async () => {
    const pref = await repo.get();
    expect(pref).toBe('lsg'); // user-1's value
  });

  it('returns null when the user has no stored preference', async () => {
    const emptyDb = makeFakeDb({ users: [{ id: 'user-1', default_translation: null }] });
    const r = new TranslationPreferenceRepositoryPowerSync(providerFor('user-1'), () => emptyDb);
    expect(await r.get()).toBeNull();
  });

  it('writes a new preference scoped to the resolved user', async () => {
    await repo.set('ostervald');
    const last = db.calls.find((c) => /UPDATE users/i.test(c.sql))!;
    expect(last.sql).toMatch(/UPDATE users/i);
    // (translationId, updated_at, userId) — userId is the last param.
    expect(last.params).toHaveLength(3);
    expect(last.params![0]).toBe('ostervald');
    expect(last.params![2]).toBe('user-1');
    // The fake applied it; a fresh read observes the new value.
    expect(await repo.get()).toBe('ostervald');
  });

  it('does not write when there is no authenticated user', async () => {
    const noUser = new TranslationPreferenceRepositoryPowerSync(
      providerFor(null),
      () => db,
    );
    await expect(noUser.set('ostervald')).rejects.toThrow(/authenticated user/i);
  });
});
