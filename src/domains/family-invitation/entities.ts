/**
 * FamilyInvitation Domain — Entities
 * Pure domain types for the FamilyInvitation entity.
 * See: docs/29-architecture-rulebook.md, docs/30-domain-rulebook.md
 */

/**
 * Invitation status lifecycle.
 * - 'active': invitation is valid and can be used
 * - 'used': invitation has been accepted
 * - 'expired': invitation has passed its expiresAt timestamp
 * - 'revoked': invitation was cancelled by the family owner/admin
 */
export type InvitationStatus = 'active' | 'used' | 'expired' | 'revoked';

/**
 * FamilyInvitation entity.
 *
 * Represents a one-time join code (token) for inviting accounts to a family.
 * Token is a cryptographically random string — NEVER the familyId.
 */
export interface FamilyInvitation {
  /** Unique invitation identifier */
  id: string;
  /** Family this invitation is for */
  familyId: string;
  /** InsForge account ID of the user who created this invitation */
  createdBy: string;
  /** Random token used to join the family (not the familyId) */
  token: string;
  /** Current invitation status */
  status: InvitationStatus;
  /** Expiration timestamp (Unix ms) */
  expiresAt: number;
  /** Creation timestamp (Unix ms) */
  createdAt: number;
}
