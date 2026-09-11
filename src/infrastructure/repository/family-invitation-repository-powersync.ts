/**
 * FamilyInvitationRepositoryPowerSync — PowerSync/SQLite repository for
 * `family_invitations`.
 *
 * Implements {@link IFamilyInvitationRepository}. Writes go through
 * `writeTransaction` and are picked up by the upload queue; reads are
 * offline-first (local SQLite).
 *
 * Status vocabulary bridge: see {@link family-mapper.ts} — the domain
 * `active`/`used`/`expired`/`revoked` is mapped to the backend
 * `accepted`/`used`/`expired`/`revoked`.
 */

import type { CommonPowerSyncDatabase } from '@powersync/common';
import { getPowerSyncDatabase } from '../sync/powersync-database';
import {
  familyInvitationToRow,
  familyInvitationRowToEntity,
  type FamilyInvitationRow,
} from '../sync/family-mapper';
import type { ISyncUserIdProvider } from '../sync/sync-user-id-provider';
import type { FamilyInvitation, InvitationStatus } from '@/domains/family-invitation';
import type { IFamilyInvitationRepository } from '@/domains/family-invitation/repository';

export class FamilyInvitationRepositoryPowerSync implements IFamilyInvitationRepository {
  constructor(
    private readonly userIdProvider: ISyncUserIdProvider,
    private readonly dbFactory: () => CommonPowerSyncDatabase = getPowerSyncDatabase,
  ) {}

  // ------------------------------------------------------------------
  // Reads
  // ------------------------------------------------------------------

  async findById(id: string): Promise<FamilyInvitation | null> {
    const db = this.dbFactory();
    const rows = await db.getAll<FamilyInvitationRow>(
      'SELECT * FROM family_invitations WHERE id = ?',
      [id],
    );
    if (rows.length === 0) return null;
    return familyInvitationRowToEntity(rows[0]);
  }

  async findByToken(token: string): Promise<FamilyInvitation | null> {
    const db = this.dbFactory();
    const rows = await db.getAll<FamilyInvitationRow>(
      'SELECT * FROM family_invitations WHERE token = ?',
      [token],
    );
    if (rows.length === 0) return null;
    return familyInvitationRowToEntity(rows[0]);
  }

  // ------------------------------------------------------------------
  // Writes
  // ------------------------------------------------------------------

  async create(
    invitation: Omit<FamilyInvitation, 'id' | 'createdAt' | 'expiresAt'> & {
      expiresInDays?: number;
    },
  ): Promise<FamilyInvitation> {
    const id = crypto.randomUUID();
    const now = Date.now();
    const expiresInDays = invitation.expiresInDays ?? 7;
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;

    const full: FamilyInvitation = {
      ...invitation,
      id,
      createdAt: now,
      expiresAt,
    };
    const row = familyInvitationToRow(full);

    const db = this.dbFactory();
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        `INSERT INTO family_invitations (
          id, family_id, token, invited_by, invited_at, expires_at,
          status, accepted_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.family_id,
          row.token,
          row.invited_by,
          row.invited_at,
          row.expires_at,
          row.status,
          row.accepted_by,
        ],
      );
    });

    return full;
  }

  async markUsed(id: string, acceptedBy?: string): Promise<boolean> {
    const db = this.dbFactory();
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        `UPDATE family_invitations
         SET status = 'used', accepted_by = ?
         WHERE id = ? AND status <> 'used'`,
        [acceptedBy ?? null, id],
      );
    });
    const rows = await db.getAll<FamilyInvitationRow>(
      'SELECT * FROM family_invitations WHERE id = ? AND status = ?',
      [id, 'used'],
    );
    return rows.length > 0;
  }

  async revoke(id: string): Promise<boolean> {
    const db = this.dbFactory();
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        `UPDATE family_invitations
         SET status = 'revoked'
         WHERE id = ? AND status <> 'used' AND status <> 'revoked'`,
        [id],
      );
    });
    const rows = await db.getAll<FamilyInvitationRow>(
      'SELECT * FROM family_invitations WHERE id = ? AND status = ?',
      [id, 'revoked'],
    );
    return rows.length > 0;
  }

  async expirePastDue(): Promise<number> {
    const db = this.dbFactory();
    const nowIso = new Date().toISOString();
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        `UPDATE family_invitations
         SET status = 'expired'
         WHERE status = 'accepted' AND expires_at IS NOT NULL AND expires_at <= ?`,
        [nowIso],
      );
    });
    const rows = await db.getAll<{ c: number }>(
      `SELECT COUNT(*) AS c FROM family_invitations
       WHERE status = 'expired'`,
    );
    return Number(rows[0]?.c ?? 0);
  }

  /**
   * Domain helper: transition to an explicit status, used by the
   * service layer when it wants to move an invitation from
   * `active` to `used` / `revoked` in a single statement.
   */
  async setStatus(id: string, status: InvitationStatus): Promise<void> {
    const backendStatus: Record<InvitationStatus, string> = {
      active: 'accepted',
      used: 'used',
      expired: 'expired',
      revoked: 'revoked',
    };
    const db = this.dbFactory();
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        'UPDATE family_invitations SET status = ? WHERE id = ?',
        [backendStatus[status], id],
      );
    });
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  async requireUserId(): Promise<string> {
    const id = await this.userIdProvider.resolveUserId();
    if (!id) {
      throw new Error(
        '[FamilyInvitationRepositoryPowerSync] write called without an authenticated user',
      );
    }
    return id;
  }
}
