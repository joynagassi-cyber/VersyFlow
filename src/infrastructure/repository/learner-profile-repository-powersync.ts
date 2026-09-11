/**
 * LearnerProfileRepositoryPowerSync — PowerSync/SQLite repository for
 * `learner_profiles`.
 *
 * Implements {@link ILearnerProfileRepository}. The column
 * `user_id` is the owner key (sync invariant: local writes MUST set
 * `user_id` ownership). The domain's `accountId` is translated to the
 * `user_id` column.
 */

import type { CommonPowerSyncDatabase } from '@powersync/common';
import { getPowerSyncDatabase } from '../sync/powersync-database';
import { randomUUID } from '../sync/uuid';
import type { ISyncUserIdProvider } from '../sync/sync-user-id-provider';
import type { LearnerProfile } from '@/domains/learner-profile';
import type { ILearnerProfileRepository } from '@/domains/learner-profile/repository';

interface LearnerProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToEntity(row: LearnerProfileRow): LearnerProfile {
  const ms = (iso: string | null) => {
    if (!iso) return 0;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  return {
    id: row.id,
    accountId: row.user_id,
    displayName: row.display_name,
    avatar: row.avatar_url ?? undefined,
    status: (row.status === 'inactive' ? 'inactive' : 'active') as LearnerProfile['status'],
    createdAt: ms(row.created_at),
    updatedAt: ms(row.updated_at),
  };
}

export class LearnerProfileRepositoryPowerSync implements ILearnerProfileRepository {
  constructor(
    private readonly userIdProvider: ISyncUserIdProvider,
    private readonly dbFactory: () => CommonPowerSyncDatabase = getPowerSyncDatabase,
  ) {}

  async findById(id: string): Promise<LearnerProfile | null> {
    const db = this.dbFactory();
    const rows = await db.getAll<LearnerProfileRow>(
      'SELECT * FROM learner_profiles WHERE id = ?',
      [id],
    );
    if (rows.length === 0) return null;
    return rowToEntity(rows[0]);
  }

  async findByAccountId(accountId: string): Promise<LearnerProfile[]> {
    const db = this.dbFactory();
    const rows = await db.getAll<LearnerProfileRow>(
      'SELECT * FROM learner_profiles WHERE user_id = ? ORDER BY created_at DESC',
      [accountId],
    );
    return rows.map(rowToEntity);
  }

  async create(
    profile: Omit<LearnerProfile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LearnerProfile> {
    const id = randomUUID();
    const nowIso = new Date().toISOString();

    const db = this.dbFactory();
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        `INSERT INTO learner_profiles (
          id, user_id, display_name, avatar_url, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          profile.accountId,
          profile.displayName,
          profile.avatar ?? null,
          profile.status,
          nowIso,
          nowIso,
        ],
      );
    });

    const now = Date.now();
    return { ...profile, id, createdAt: now, updatedAt: now };
  }

  async update(
    id: string,
    updates: Partial<LearnerProfile>,
  ): Promise<LearnerProfile | null> {
    const db = this.dbFactory();
    const existing = await db.getAll<LearnerProfileRow>(
      'SELECT * FROM learner_profiles WHERE id = ?',
      [id],
    );
    if (existing.length === 0) return null;

    const current = rowToEntity(existing[0]);
    const merged: LearnerProfile = {
      ...current,
      ...updates,
      id, // immutable
      accountId: current.accountId, // owner is immutable
      createdAt: current.createdAt, // immutable
      updatedAt: Date.now(),
    };

    await db.writeTransaction(async (tx) => {
      await tx.execute(
        `UPDATE learner_profiles SET
          display_name = ?, avatar_url = ?, status = ?, updated_at = ?
         WHERE id = ?`,
        [
          merged.displayName,
          merged.avatar ?? null,
          merged.status,
          new Date(merged.updatedAt).toISOString(),
          id,
        ],
      );
    });

    return merged;
  }

  async delete(id: string): Promise<boolean> {
    const db = this.dbFactory();
    const existing = await db.getAll<LearnerProfileRow>(
      'SELECT * FROM learner_profiles WHERE id = ?',
      [id],
    );
    if (existing.length === 0) return false;

    await db.writeTransaction(async (tx) => {
      await tx.execute('DELETE FROM learner_profiles WHERE id = ?', [id]);
    });
    return true;
  }

  async requireUserId(): Promise<string> {
    const id = await this.userIdProvider.resolveUserId();
    if (!id) {
      throw new Error(
        '[LearnerProfileRepositoryPowerSync] write called without an authenticated user',
      );
    }
    return id;
  }
}
