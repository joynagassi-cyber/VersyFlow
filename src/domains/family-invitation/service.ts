/**
 * FamilyInvitation Service
 * Manages invitation token generation, validation, and lifecycle
 */

import { FamilyInvitation, InvitationStatus } from './entities';
import { IFamilyInvitationRepository } from './repository';
import { IFamilyRepository } from '@/domains/family/repository';
import { eventBus, DomainEventTypes } from '@/domains';

export class FamilyInvitationService {
  private static readonly DEFAULT_EXPIRY_DAYS = 7;
  private static readonly TOKEN_LENGTH = 16;

  constructor(
    private repository: IFamilyInvitationRepository,
    private familyRepository: IFamilyRepository,
  ) {}

  /**
   * Generate a new invitation token for a family
   */
  async create(
    familyId: string,
    createdBy: string,
    expiresInDays = FamilyInvitationService.DEFAULT_EXPIRY_DAYS,
  ): Promise<FamilyInvitation> {
    const now = Date.now();
    const token = this.generateToken();

    const invitation = await this.repository.create({
      familyId,
      createdBy,
      token,
      status: 'active' as InvitationStatus,
      expiresAt: now + expiresInDays * 24 * 60 * 60 * 1000,
      createdAt: now,
    });

    eventBus.emit({
      id: crypto.randomUUID(),
      type: DomainEventTypes.FAMILY_INVITATION_CREATED,
      timestamp: now,
      payload: { familyId, token: invitation.token, expiresAt: invitation.expiresAt },
    });

    return invitation;
  }

  /**
   * Validate an invitation token and return the family if valid
   */
  async validate(token: string): Promise<{ familyId: string; invitation: FamilyInvitation } | null> {
    const invitation = await this.repository.findByToken(token);
    if (!invitation) return null;

    // Check status
    if (invitation.status !== 'active') return null;

    // Check expiration
    if (invitation.expiresAt < Date.now()) {
      await this.repository.markUsed(invitation.id); // Mark as expired
      return null;
    }

    return { familyId: invitation.familyId, invitation };
  }

  /**
   * Mark an invitation as used (when someone joins)
   */
  async markUsed(invitationId: string): Promise<boolean> {
    const used = await this.repository.markUsed(invitationId);

    if (used) {
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.FAMILY_INVITATION_USED,
        timestamp: Date.now(),
        payload: { invitationId },
      });
    }

    return used;
  }

  /**
   * Revoke an active invitation
   */
  async revoke(invitationId: string): Promise<boolean> {
    const revoked = await this.repository.revoke(invitationId);

    if (revoked) {
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.FAMILY_INVITATION_REVOKED,
        timestamp: Date.now(),
        payload: { invitationId },
      });
    }

    return revoked;
  }

  /**
   * Expire all past-due invitations
   */
  async expirePastDue(): Promise<number> {
    return this.repository.expirePastDue();
  }

  /**
   * Generate a cryptographically secure random token
   */
  private generateToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars
    let token = 'FAM-';
    for (let i = 0; i < FamilyInvitationService.TOKEN_LENGTH; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
