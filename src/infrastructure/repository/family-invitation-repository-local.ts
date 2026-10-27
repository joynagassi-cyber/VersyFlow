/**
 * Family Invitation Repository — Local (In-Memory) Adapter
 *
 * In-memory implementation of IFamilyInvitationRepository using Map + UUID v4.
 * Used for offline development and testing before PowerSync binding is ready.
 */

import type { FamilyInvitation } from '@/domains/family-invitation';
import type { IFamilyInvitationRepository } from '@/domains/family-invitation/repository';

function generateId(): string {
  return crypto.randomUUID();
}

export class FamilyInvitationRepositoryLocal implements IFamilyInvitationRepository {
  private invitations = new Map<string, FamilyInvitation>();

  async findById(id: string): Promise<FamilyInvitation | null> {
    return this.invitations.get(id) ?? null;
  }

  async findByToken(token: string): Promise<FamilyInvitation | null> {
    for (const inv of this.invitations.values()) {
      if (inv.token === token) return inv;
    }
    return null;
  }

  async create(
    invitation: Omit<FamilyInvitation, 'id' | 'createdAt' | 'expiresAt'> & { expiresInDays?: number },
  ): Promise<FamilyInvitation> {
    const id = generateId();
    const now = Date.now();
    const expiresInMs = (invitation.expiresInDays ?? 7) * 24 * 60 * 60 * 1000;
    const record: FamilyInvitation = {
      familyId: invitation.familyId,
      createdBy: invitation.createdBy,
      token: invitation.token,
      status: invitation.status,
      id,
      createdAt: now,
      expiresAt: now + expiresInMs,
    };
    this.invitations.set(id, record);
    return record;
  }

  async markUsed(id: string): Promise<boolean> {
    const inv = this.invitations.get(id);
    if (!inv) return false;
    const updated: FamilyInvitation = { ...inv, status: 'used' };
    this.invitations.set(id, updated);
    return true;
  }

  async revoke(id: string): Promise<boolean> {
    const inv = this.invitations.get(id);
    if (!inv) return false;
    const updated: FamilyInvitation = { ...inv, status: 'revoked' };
    this.invitations.set(id, updated);
    return true;
  }

  async expirePastDue(): Promise<number> {
    const now = Date.now();
    let count = 0;
    for (const [id, inv] of this.invitations.entries()) {
      if (inv.status === 'active' && inv.expiresAt < now) {
        this.invitations.set(id, { ...inv, status: 'expired' });
        count++;
      }
    }
    return count;
  }

  /** Clear all data — useful for tests */
  clear(): void {
    this.invitations.clear();
  }
}
