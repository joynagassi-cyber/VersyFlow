/**
 * Unit Tests — LearnerProfile Service
 * Tests CRUD operations and active profile management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LearnerProfileService } from '@/services/learner-profile-service';
import { LearnerProfileRepositoryLocal } from '@/infrastructure/repository/learner-profile-repository-local';

describe('LearnerProfile Service', () => {
  let repo: LearnerProfileRepositoryLocal;
  let service: LearnerProfileService;

  beforeEach(() => {
    repo = new LearnerProfileRepositoryLocal();
    service = new LearnerProfileService(repo);
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
    expect(found!.displayName).toBe('Bob');
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
    expect(updated!.displayName).toBe('Alice Smith');
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

describe('LearnerProfile Service Scoping', () => {
  let repo: LearnerProfileRepositoryLocal;
  let service: LearnerProfileService;

  beforeEach(() => {
    repo = new LearnerProfileRepositoryLocal();
    service = new LearnerProfileService(repo);
  });

  it('should enforce accountId scoping on findById when second arg provided', async () => {
    const profile1 = await service.create('user-a', 'Alice');
    const profile2 = await service.create('user-b', 'Bob');

    // user-a should NOT be able to see user-b's profile
    const result = await service.findById(profile2.id, 'user-a');
    expect(result).toBeNull();

    // user-b should be able to see their own profile
    const ownResult = await service.findById(profile2.id, 'user-b');
    expect(ownResult).not.toBeNull();
    expect(ownResult!.accountId).toBe('user-b');
  });

  it('should enforce accountId scoping on delete when second arg provided', async () => {
    const profile1 = await service.create('user-a', 'Alice');
    const profile2 = await service.create('user-b', 'Bob');

    // user-a should NOT be able to delete user-b's profile
    const deleted = await service.delete(profile2.id, 'user-a');
    expect(deleted).toBe(false);

    // user-b should be able to delete their own profile
    const ownDeleted = await service.delete(profile2.id, 'user-b');
    expect(ownDeleted).toBe(true);
  });

  it('should enforce accountId scoping on update when second arg provided', async () => {
    const profile1 = await service.create('user-a', 'Alice');
    const profile2 = await service.create('user-b', 'Bob');

    // user-a should NOT be able to update user-b's profile
    const updated = await service.update(profile2.id, { displayName: 'Hacked' }, 'user-a');
    expect(updated).toBeNull();

    // user-b should be able to update their own profile
    const ownUpdated = await service.update(profile2.id, { displayName: 'Bob Updated' }, 'user-b');
    expect(ownUpdated).not.toBeNull();
    expect(ownUpdated!.displayName).toBe('Bob Updated');
  });
});
