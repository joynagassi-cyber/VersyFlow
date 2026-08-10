/**
 * Family Domain — Repository Interface (Port)
 *
 * Defines the persistence contract for Family and FamilyMembership.
 * Implemented by infrastructure layer; never imported from infrastructure.
 */

import { Family, FamilyMembership } from './entities';

export interface IFamilyRepository {
  /** Retrieve a family by its unique ID */
  findById(id: string): Promise<Family | null>;

  /** Retrieve all families owned by an account */
  findByOwnerId(ownerId: string): Promise<Family[]>;

  /**
   * Create a new family.
   * The repository assigns id and createdAt.
   */
  create(family: Omit<Family, 'id' | 'createdAt'>): Promise<Family>;

  /** Update an existing family. Returns the updated family or null. */
  update(id: string, updates: Partial<Family>): Promise<Family | null>;

  /**
   * Delete a family. Only the owner can delete.
   * Returns true if deleted, false otherwise.
   */
  delete(id: string, ownerId: string): Promise<boolean>;

  /** Retrieve all members of a family */
  getMembers(familyId: string): Promise<FamilyMembership[]>;

  /**
   * Add a member to a family.
   * The repository assigns id, createdAt, and joinedAt.
   */
  addMember(
    familyId: string,
    membership: Omit<FamilyMembership, 'id' | 'createdAt' | 'joinedAt'>,
  ): Promise<FamilyMembership>;

  /** Remove a member from a family. Returns true if removed. */
  removeMember(familyId: string, accountId: string): Promise<boolean>;
}
