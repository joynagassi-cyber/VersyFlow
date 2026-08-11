/**
 * LearnerProfile Domain — Entities
 * Pure domain types for the LearnerProfile entity.
 * See: docs/29-architecture-rulebook.md, docs/30-domain-rulebook.md
 */

/**
 * Status of a LearnerProfile.
 * - 'active': profile is usable
 * - 'inactive': profile is disabled (soft delete / archive)
 */
export type ProfileStatus = 'active' | 'inactive';

/**
 * LearnerProfile entity.
 *
 * Represents a single learner persona linked to an InsForge account.
 * All learning data (memorization records, review logs, FSRS state, streaks)
 * is scoped to a LearnerProfile ID.
 *
 * Rules (D-ENT-1, D-ENT-2):
 * - Pure interface, no methods
 * - Immutable after creation — updates produce a new object via spread
 */
export interface LearnerProfile {
  /** Unique profile identifier (UUID v4 compatible string) */
  id: string;
  /** InsForge account ID this profile belongs to */
  accountId: string;
  /** Display name shown to the learner and family members */
  displayName: string;
  /** Optional avatar URL or emoji */
  avatar?: string;
  /** Creation timestamp (Unix ms) */
  createdAt: number;
  /** Last update timestamp (Unix ms) */
  updatedAt: number;
  /** Current profile status */
  status: ProfileStatus;
}
