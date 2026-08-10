/**
 * Unit Tests — Family Service
 * Tests family CRUD and member management
 */

describe('Family Service', () => {
  let mockRepo;
  let service;

  beforeEach(() => {
    let idCounter = 0;
    mockRepo = {
      families: new Map(),
      memberships: new Map(),
      findById: jest.fn(async (id) => mockRepo.families.get(id) || null),
      findByOwnerId: jest.fn(async (ownerId) =>
        Array.from(mockRepo.families.values()).filter((f) => f.ownerId === ownerId)
      ),
      create: jest.fn(async (family) => {
        idCounter++;
        const id = `family-${idCounter}`;
        const newFamily = { ...family, id, createdAt: Date.now() };
        mockRepo.families.set(id, newFamily);
        // Note: service.create() will call addMember separately for owner
        return newFamily;
      }),
      update: jest.fn(async (id, updates) => {
        const family = mockRepo.families.get(id);
        if (!family) return null;
        const updated = { ...family, ...updates };
        mockRepo.families.set(id, updated);
        return updated;
      }),
      delete: jest.fn(async (id, ownerId) => {
        const family = mockRepo.families.get(id);
        if (!family || family.ownerId !== ownerId) return false;
        mockRepo.families.delete(id);
        return true;
      }),
      getMembers: jest.fn(async (familyId) =>
        Array.from(mockRepo.memberships.values()).filter((m) => m.familyId === familyId)
      ),
      addMember: jest.fn(async (familyId, membership) => {
        idCounter++;
        const id = `mem-${idCounter}`;
        const newMembership = { ...membership, id, familyId, createdAt: Date.now(), joinedAt: Date.now() };
        mockRepo.memberships.set(id, newMembership);
        return newMembership;
      }),
      removeMember: jest.fn(async (familyId, accountId) => {
        let removed = false;
        for (const [id, mem] of mockRepo.memberships.entries()) {
          if (mem.familyId === familyId && mem.accountId === accountId) {
            mockRepo.memberships.delete(id);
            removed = true;
          }
        }
        return removed;
      }),
    };

    const { FamilyService } = require('@/domains/family/service');
    service = new FamilyService(mockRepo);
  });

  it('should create a family with owner', async () => {
    const family = await service.create('user-1', 'The Smiths');

    expect(family).toBeDefined();
    expect(family.name).toBe('The Smiths');
    expect(family.ownerId).toBe('user-1');
    expect(family.color).toBe('#E91E8C');
  });

  it('should find family by id', async () => {
    const family = await service.create('user-1', 'Test Family');
    const found = await service.findById(family.id);

    expect(found).not.toBeNull();
    expect(found.name).toBe('Test Family');
  });

  it('should add a member to family', async () => {
    const family = await service.create('user-1', 'Test Family');
    const member = await service.addMember(family.id, 'user-2', 'member');

    expect(member).toBeDefined();
    expect(member.familyId).toBe(family.id);
    expect(member.accountId).toBe('user-2');
    expect(member.role).toBe('member');
  });

  it('should get family members', async () => {
    const family = await service.create('user-1', 'Test Family');
    await service.addMember(family.id, 'user-2', 'member');
    await service.addMember(family.id, 'user-3', 'admin');

    const members = await service.getMembers(family.id);
    expect(members).toHaveLength(3); // owner + 2 members
  });

  it('should not allow non-owner to delete family', async () => {
    const family = await service.create('user-1', 'Test Family');
    const deleted = await service.deleteFamily(family.id, 'user-2');

    expect(deleted).toBe(false);
  });

  it('should allow owner to delete family', async () => {
    const family = await service.create('user-1', 'Test Family');
    const deleted = await service.deleteFamily(family.id, 'user-1');

    expect(deleted).toBe(true);
    const found = await service.findById(family.id);
    expect(found).toBeNull();
  });

  it('should not allow removing owner', async () => {
    const family = await service.create('user-1', 'Test Family');
    const removed = await service.removeMember(family.id, 'user-1');

    expect(removed).toBe(false);
  });

  it('should allow removing non-owner member', async () => {
    const family = await service.create('user-1', 'Test Family');
    await service.addMember(family.id, 'user-2', 'member');
    const removed = await service.removeMember(family.id, 'user-2');

    expect(removed).toBe(true);
  });
});
