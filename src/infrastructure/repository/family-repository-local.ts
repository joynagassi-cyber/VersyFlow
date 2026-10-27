/**
 * Family Repository — Local (In-Memory) Adapter
 *
 * In-memory implementation of IFamilyRepository using Map + UUID v4.
 * Used for offline development and testing before PowerSync binding is ready.
 * See: docs/29-architecture-rulebook.md (Interface/Adapter pattern)
 */

import type { Family, FamilyMembership } from '@/domains/family';
import type { IFamilyRepository } from '@/domains/family/repository';

function generateId(): string {
  return crypto.randomUUID();
}

export class FamilyRepositoryLocal implements IFamilyRepository {
  private families = new Map<string, Family>();
  private memberships = new Map<string, FamilyMembership>();

  async findById(id: string): Promise<Family | null> {
    return this.families.get(id) ?? null;
  }

  async findByOwnerId(ownerId: string): Promise<Family[]> {
    return Array.from(this.families.values()).filter(f => f.ownerId === ownerId);
  }

  async create(family: Omit<Family, 'id' | 'createdAt'>): Promise<Family> {
    const id = generateId();
    const now = Date.now();
    const record: Family = { ...family, id, createdAt: now };
    this.families.set(id, record);
    return record;
  }

  async update(id: string, updates: Partial<Family>): Promise<Family | null> {
    const existing = this.families.get(id);
    if (!existing) return null;
    const updated: Family = { ...existing, ...updates };
    this.families.set(id, updated);
    return updated;
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const family = this.families.get(id);
    if (!family || family.ownerId !== ownerId) return false;
    this.families.delete(id);
    // Also remove all memberships
    for (const [memId, mem] of this.memberships.entries()) {
      if (mem.familyId === id) {
        this.memberships.delete(memId);
      }
    }
    return true;
  }

  async getMembers(familyId: string): Promise<FamilyMembership[]> {
    return Array.from(this.memberships.values()).filter(m => m.familyId === familyId);
  }

  async addMember(
    familyId: string,
    membership: Omit<FamilyMembership, 'id' | 'createdAt' | 'joinedAt' | 'familyId'>,
  ): Promise<FamilyMembership> {
    const id = generateId();
    const now = Date.now();
    const record: FamilyMembership = { ...membership, id, familyId, createdAt: now, joinedAt: now };
    this.memberships.set(id, record);
    return record;
  }

  async removeMember(familyId: string, accountId: string): Promise<boolean> {
    let removed = false;
    for (const [id, mem] of this.memberships.entries()) {
      if (mem.familyId === familyId && mem.accountId === accountId) {
        this.memberships.delete(id);
        removed = true;
      }
    }
    return removed;
  }

  /** Clear all data — useful for tests */
  clear(): void {
    this.families.clear();
    this.memberships.clear();
  }
}
