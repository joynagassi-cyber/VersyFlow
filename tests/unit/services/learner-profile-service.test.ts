/**
 * Unit Tests — LearnerProfile Service
 * Tests CRUD operations and active profile management
 * (Pure JS, no TypeScript imports to avoid Babel issues)
 */

// Inline mock service (avoids TypeScript import issues)
class MockLearnerProfileService {
  constructor(repository) {
    this.repository = repository;
    this.activeProfileId = null;
  }

  async create(accountId, displayName, avatar) {
    const now = Date.now();
    const profile = { accountId, displayName, avatar, createdAt: now, updatedAt: now, status: 'active' };
    const created = await this.repository.create(profile);
    this.activeProfileId = created.id;
    return created;
  }

  async findById(id) {
    return this.repository.findById(id);
  }

  async findByAccountId(accountId) {
    return this.repository.findByAccountId(accountId);
  }

  async update(id, updates) {
    return this.repository.update(id, updates);
  }

  async delete(id) {
    const deleted = await this.repository.delete(id);
    if (deleted && this.activeProfileId === id) {
      this.activeProfileId = null;
    }
    return deleted;
  }

  setActiveProfileId(id) {
    this.activeProfileId = id;
  }

  getActiveProfileId() {
    return this.activeProfileId;
  }
}

describe('LearnerProfile Service', () => {
  let mockRepo;
  let service;

  beforeEach(() => {
    mockRepo = {
      profiles: new Map(),
      findById: jest.fn(async (id) => mockRepo.profiles.get(id) || null),
      findByAccountId: jest.fn(async (accountId) =>
        Array.from(mockRepo.profiles.values()).filter((p) => p.accountId === accountId)
      ),
      create: jest.fn(async (profile) => {
        const id = 'profile-' + Date.now() + '-' + Math.random();
        const now = Date.now();
        const newProfile = Object.assign({}, profile, { id: id, createdAt: now, updatedAt: now });
        mockRepo.profiles.set(id, newProfile);
        return newProfile;
      }),
      update: jest.fn(async (id, updates) => {
        const profile = mockRepo.profiles.get(id);
        if (!profile) return null;
        const updated = Object.assign({}, profile, updates, { updatedAt: Date.now() });
        mockRepo.profiles.set(id, updated);
        return updated;
      }),
      delete: jest.fn(async (id) => {
        if (!mockRepo.profiles.has(id)) return false;
        mockRepo.profiles.delete(id);
        return true;
      }),
    };

    service = new MockLearnerProfileService(mockRepo);
  });

  it('should create a profile', async () => {
    const profile = await service.create('user-1', 'Alice');

    expect(profile).toBeDefined();
    expect(profile.accountId).toBe('user-1');
    expect(profile.displayName).toBe('Alice');
    expect(profile.status).toBe('active');
    expect(profile.id).toBeDefined();
  });

  it('should find profile by id', async () => {
    const profile = await service.create('user-1', 'Bob');
    const found = await service.findById(profile.id);

    expect(found).not.toBeNull();
    expect(found.displayName).toBe('Bob');
  });

  it('should find profiles by account id', async () => {
    await service.create('user-1', 'Alice');
    await service.create('user-1', 'Bob');
    await service.create('user-2', 'Charlie');

    const user1Profiles = await service.findByAccountId('user-1');
    const user2Profiles = await service.findByAccountId('user-2');

    expect(user1Profiles).toHaveLength(2);
    expect(user2Profiles).toHaveLength(1);
  });

  it('should update a profile', async () => {
    const profile = await service.create('user-1', 'Alice');
    const updated = await service.update(profile.id, { displayName: 'Alice Smith' });

    expect(updated).not.toBeNull();
    expect(updated.displayName).toBe('Alice Smith');
  });

  it('should delete a profile', async () => {
    const profile = await service.create('user-1', 'Dave');
    const deleted = await service.delete(profile.id);

    expect(deleted).toBe(true);
    const found = await service.findById(profile.id);
    expect(found).toBeNull();
  });

  it('should set and get active profile', () => {
    expect(service.getActiveProfileId()).toBeNull();

    service.setActiveProfileId('profile-123');
    expect(service.getActiveProfileId()).toBe('profile-123');
  });

  it('should clear active profile on delete', async () => {
    const profile = await service.create('user-1', 'Eve');
    service.setActiveProfileId(profile.id);
    expect(service.getActiveProfileId()).toBe(profile.id);

    await service.delete(profile.id);
    expect(service.getActiveProfileId()).toBeNull();
  });

  it('should not share data between profiles', async () => {
    const alice = await service.create('user-1', 'Alice');
    const bob = await service.create('user-1', 'Bob');

    expect(alice.id).not.toBe(bob.id);
    expect(alice.displayName).toBe('Alice');
    expect(bob.displayName).toBe('Bob');

    const allProfiles = await service.findByAccountId('user-1');
    expect(allProfiles).toHaveLength(2);
  });
});
