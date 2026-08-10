/**
 * FamilyInvitation Domain — Repository Interface (Port)
 *
 * Defines the persistence contract for FamilyInvitation.
 * Implemented by infrastructure layer; never imported from infrastructure.
 */

import { FamilyInvitation } from './entities';

export interface IFamilyInvitationRepository {
  /** Retrieve an invitation by its unique ID */
  findById(id: string): Promise<FamilyInvitation | null>;

  /** Retrieve an invitation by its join token */
  findByToken(token: string): Promise<FamilyInvitation | null>;

  /**
   * Create a new invitation.
   * The repository assigns id, createdAt, and expiresAt.
   */
  create(invitation: Omit<FamilyInvitation, 'id' | 'createdAt' | 'expiresAt'>): Promise<FamilyInvitation>;

  /** Mark an invitation as used (acceptance). Returns true if updated. */
  markUsed(id: string): Promise<boolean>;

  /** Revoke an active invitation. Returns true if revoked. */
  revoke(id: string): Promise<boolean>;

  /**
   * Expire all past-due active invitations.
   * Returns the number of invitations expired.
   */
  expirePastDue(): Promise<number>;
}
