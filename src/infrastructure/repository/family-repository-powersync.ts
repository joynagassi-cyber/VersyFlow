/**
 * FamilyRepositoryPowerSync — PowerSync/SQLite repository for `families`
 * and `family_memberships`.
 *
 * Implements {@link IFamilyRepository} on top of the shared PowerSync
 * database. Writes use {@link familyToRow} / {@link familyMembershipToRow}
 * so that the upsert path is stable across saves, and the deterministic
 * `membershipUuid` satisfies the backend
 * `UNIQUE (family_id, user_id)` constraint.
 *
 * Reads are offline-first: they always hit the local SQLite database.
 */

import type { CommonPowerSyncDatabase } from '@powersync/common';
import { getPowerSyncDatabase } from '../sync/powersync-database';
import {
  familyToRow,
  familyRowToEntity,
  familyMembershipToRow,
  familyMembershipRowToEntity,
  membershipUuid,
  type FamilyRow,
  type FamilyMembershipRow,
} from '../sync/family-mapper';
import { randomUUID } from '../sync/uuid';
import type { ISyncUserIdProvider } from '../sync/sync-user-id-provider';
import type {
  Family,
  FamilyMembership,
} from '@/domains/family';
import type { IFamilyRepository } from '@/domains/family/repository';


export class FamilyRepositoryPowerSync implements IFamilyRepository {
  constructor(
    private readonly userIdProvider: ISyncUserIdProvider,
    private readonly dbFactory: () => CommonPowerSyncDatabase = getPowerSyncDatabase,
  ) {}

  // ------------------------------------------------------------------
  // Reads
  // ------------------------------------------------------------------

  async findById(id: string): Promise<Family | null> {
    const db = this.dbFactory();
    const rows = await db.getAll<FamilyRow>(
      'SELECT * FROM families WHERE id = ?',
      [id],
    );
    if (rows.length === 0) return null;
    return familyRowToEntity(rows[0]);
  }

  async findByOwnerId(ownerId: string): Promise<Family[]> {
    const db = this.dbFactory();
    const rows = await db.getAll<FamilyRow>(
      'SELECT * FROM families WHERE owner_id = ? ORDER BY created_at DESC',
      [ownerId],
    );
    return rows.map(familyRowToEntity);
  }

  // ------------------------------------------------------------------
  // Writes
  // ------------------------------------------------------------------

  async create(family: Omit<Family, 'id' | 'createdAt'>): Promise<Family> {
    const id = randomUUID();
    const nowIso = new Date().toISOString();
    const fullFamily: Family = { ...family, id, createdAt: 0 };
    const row = familyToRow(fullFamily);
    row.created_at = nowIso;
    row.updated_at = nowIso;

    const db = this.dbFactory();
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        `INSERT INTO families (
          id, owner_id, name, color, icon, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.owner_id,
          row.name,
          row.color,
          row.icon,
          row.created_at,
          row.updated_at,
        ],
      );
    });

    return { ...fullFamily, id, createdAt: Date.now() };
  }

  async update(id: string, updates: Partial<Family>): Promise<Family | null> {
    const db = this.dbFactory();
    const existing = await db.getAll<FamilyRow>(
      'SELECT * FROM families WHERE id = ?',
      [id],
    );
    if (existing.length === 0) return null;

    const current = familyRowToEntity(existing[0]);
    const merged: Family = {
      ...current,
      ...updates,
      id, // id is immutable
      createdAt: current.createdAt, // immutable
    };
    const row = familyToRow(merged);
    row.updated_at = new Date().toISOString();

    await db.writeTransaction(async (tx) => {
      await tx.execute(
        `UPDATE families SET
          owner_id = ?, name = ?, color = ?, icon = ?, updated_at = ?
         WHERE id = ?`,
        [row.owner_id, row.name, row.color, row.icon, row.updated_at, id],
      );
    });

    return merged;
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const db = this.dbFactory();
    const rows = await db.getAll<FamilyRow>(
      'SELECT * FROM families WHERE id = ? AND owner_id = ?',
      [id, ownerId],
    );
    if (rows.length === 0) return false;

    await db.writeTransaction(async (tx) => {
      await tx.execute(
        'DELETE FROM family_memberships WHERE family_id = ?',
        [id],
      );
      await tx.execute('DELETE FROM families WHERE id = ?', [id]);
    });
    return true;
  }

  // ------------------------------------------------------------------
  // Memberships
  // ------------------------------------------------------------------

  async getMembers(familyId: string): Promise<FamilyMembership[]> {
    const db = this.dbFactory();
    const rows = await db.getAll<FamilyMembershipRow>(
      'SELECT * FROM family_memberships WHERE family_id = ? ORDER BY joined_at DESC',
      [familyId],
    );
    return rows.map(familyMembershipRowToEntity);
  }

  async addMember(
    familyId: string,
    membership: Omit<FamilyMembership, 'id' | 'createdAt' | 'joinedAt' | 'familyId'>,
  ): Promise<FamilyMembership> {
    const nowIso = new Date().toISOString();
    const full: FamilyMembership = {
      ...membership,
      id: membershipUuid(membership.accountId, familyId),
      familyId,
      createdAt: 0,
      joinedAt: 0,
    };
    const row = familyMembershipToRow(full);
    row.invited_at = null;
    row.joined_at = nowIso;

    const db = this.dbFactory();
    // PowerSync v2.x: `family_memberships` is a read-only view over
    // `ps_data__family_memberships`. A plain `INSERT` with the deterministic
    // composite `id` is intercepted by the SDK and enqueued in `ps_crud`.
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        `INSERT INTO family_memberships (
          id, family_id, user_id, role, status, invited_at, joined_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.family_id,
          row.user_id,
          row.role,
          row.status,
          row.invited_at,
          row.joined_at,
        ],
      );
    });

    return { ...full, createdAt: Date.now(), joinedAt: Date.now() };
  }

  async removeMember(familyId: string, accountId: string): Promise<boolean> {
    const db = this.dbFactory();
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        'DELETE FROM family_memberships WHERE family_id = ? AND user_id = ?',
        [familyId, accountId],
      );
    });
    // Best-effort check on the read side (not strictly required for the
    // domain contract; the write is idempotent).
    const rows = await db.getAll<FamilyMembershipRow>(
      'SELECT * FROM family_memberships WHERE family_id = ? AND user_id = ?',
      [familyId, accountId],
    );
    return rows.length === 0;
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  async requireUserId(): Promise<string> {
    const id = await this.userIdProvider.resolveUserId();
    if (!id) {
      throw new Error(
        '[FamilyRepositoryPowerSync] write called without an authenticated user',
      );
    }
    return id;
  }
}
