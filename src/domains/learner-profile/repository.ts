/**
 * LearnerProfile Domain — Repository Interface (Port)
 *
 * Defines the persistence contract for LearnerProfile.
 * Implemented by infrastructure layer; never imported from infrastructure.
 * See: docs/30-domain-rulebook.md (Règle D-ENT-2)
 */

import { LearnerProfile } from './entities';

export interface ILearnerProfileRepository {
  /** Retrieve a profile by its unique ID */
  findById(id: string): Promise<LearnerProfile | null>;

  /** Retrieve all profiles belonging to an account */
  findByAccountId(accountId: string): Promise<LearnerProfile[]>;

  /**
   * Create a new profile.
   * The repository is responsible for assigning id, createdAt, updatedAt.
   */
  create(profile: Omit<LearnerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearnerProfile>;

  /**
   * Update an existing profile.
   * Returns the updated profile or null if not found.
   */
  update(id: string, updates: Partial<LearnerProfile>): Promise<LearnerProfile | null>;

  /** Soft-delete or permanently remove a profile. Returns true if deleted. */
  delete(id: string): Promise<boolean>;
}
