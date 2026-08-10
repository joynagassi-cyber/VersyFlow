/**
 * Family Domain — Entities
 * Pure domain types for Family and FamilyMembership.
 * See: docs/29-architecture-rulebook.md, docs/30-domain-rulebook.md
 */

/**
 * Role of a member within a Family.
 * - 'owner': full control, cannot be removed
 * - 'admin': can manage invitations and members
 * - 'member': standard access
 */
export type FamilyRole = 'owner' | 'admin' | 'member';

/**
 * Membership status in a Family.
 * - 'active': fully participating
 * - 'suspended': temporarily removed (can be reactivated)
 * - 'pending': invitation accepted but not yet confirmed
 */
export type MembershipStatus = 'active' | 'suspended' | 'pending';

/**
 * Family entity.
 *
 * A group of LearnerProfiles that share aggregated progress visibility.
 * Family is optional — a profile exists independently of any family.
 */
export interface Family {
  /** Unique family identifier */
  id: string;
  /** InsForge account ID of the family creator/owner */
  ownerId: string;
  /** Display name of the family */
  name: string;
  /** Design token color for family theming */
  color: string;
  /** Emoji or icon name for family representation */
  icon: string;
  /** Creation timestamp (Unix ms) */
  createdAt: number;
}

/**
 * FamilyMembership entity.
 *
 * Links a LearnerProfile (via accountId) to a Family with a specific role.
 * One-to-many relationship: one account can belong to multiple families.
 */
export interface FamilyMembership {
  /** Unique membership identifier */
  id: string;
  /** Family this membership belongs to */
  familyId: string;
  /** InsForge account ID of the member */
  accountId: string;
  /** Role within the family */
  role: FamilyRole;
  /** Current membership status */
  status: MembershipStatus;
  /** Membership creation timestamp (Unix ms) */
  createdAt: number;
  /** Timestamp when the account actually joined (Unix ms) */
  joinedAt: number;
}
