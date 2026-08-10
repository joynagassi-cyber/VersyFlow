/**
 * Family Service
 * Business logic for family CRUD and member management
 */

import { Family, FamilyMembership, FamilyRole, MembershipStatus } from './entities';
import { IFamilyRepository } from './repository';

// Simple event emitter to avoid circular dependencies
const eventBus = {
  emit: (_event: any) => {},
};

export class FamilyService {
  constructor(private repository: IFamilyRepository) {}

  async create(ownerId: string, name: string, color = '#E91E8C', icon = '👨‍👩‍👧‍👦'): Promise<Family> {
    const now = Date.now();
    const family = await this.repository.create({ ownerId, name, color, icon, createdAt: now });

    // Auto-add owner as member
    await this.repository.addMember(family.id, {
      accountId: ownerId,
      role: 'owner' as FamilyRole,
      status: 'active' as MembershipStatus,
      createdAt: now,
      joinedAt: now,
    });

    eventBus.emit({
      id: crypto.randomUUID(),
      type: 'family.created',
      timestamp: now,
      payload: { familyId: family.id, ownerId },
    });

    return family;
  }

  async findById(id: string): Promise<Family | null> {
    return this.repository.findById(id);
  }

  async getMembers(familyId: string): Promise<FamilyMembership[]> {
    return this.repository.getMembers(familyId);
  }

  async addMember(
    familyId: string,
    accountId: string,
    role: FamilyRole = 'member',
  ): Promise<FamilyMembership> {
    const now = Date.now();
    const membership = await this.repository.addMember(familyId, {
      accountId,
      role,
      status: 'pending' as MembershipStatus,
      createdAt: now,
      joinedAt: now,
    });

    eventBus.emit({
      id: crypto.randomUUID(),
      type: 'family.member_added',
      timestamp: now,
      payload: { familyId, accountId, role },
    });

    return membership;
  }

  async removeMember(familyId: string, accountId: string): Promise<boolean> {
    const members = await this.repository.getMembers(familyId);
    const member = members.find((m) => m.accountId === accountId);

    if (!member) return false;
    if (member.role === 'owner') return false; // Owner cannot be removed

    const removed = await this.repository.removeMember(familyId, accountId);

    if (removed) {
      eventBus.emit({
        id: crypto.randomUUID(),
        type: 'family.member_removed',
        timestamp: Date.now(),
        payload: { familyId, accountId },
      });
    }

    return removed;
  }

  async deleteFamily(familyId: string, requesterId: string): Promise<boolean> {
    const family = await this.findById(familyId);
    if (!family) return false;
    if (family.ownerId !== requesterId) return false; // Only owner can delete

    const deleted = await this.repository.delete(familyId, requesterId);

    if (deleted) {
      eventBus.emit({
        id: crypto.randomUUID(),
        type: 'family.deleted',
        timestamp: Date.now(),
        payload: { familyId },
      });
    }

    return deleted;
  }

  async updateFamily(familyId: string, updates: Partial<Family>): Promise<Family | null> {
    return this.repository.update(familyId, updates);
  }
}
