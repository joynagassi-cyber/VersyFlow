/**
 * Unit Tests — Family Service Scoping
 *
 * Critical security test: member B must NOT be able to read learner profile
 * cognitive data of member C in the same family. Owner can.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FamilyRepositoryLocal } from '@/infrastructure/repository/family-repository-local';
import { FamilyInvitationRepositoryLocal } from '@/infrastructure/repository/family-invitation-repository-local';
import { LearnerProfileRepositoryLocal } from '@/infrastructure/repository/learner-profile-repository-local';
import { FamilyService } from '@/services/family-service';

function createFresh() {
  const familyRepo = new FamilyRepositoryLocal();
  const invitationRepo = new FamilyInvitationRepositoryLocal();
  const profileRepo = new LearnerProfileRepositoryLocal();
  const service = new FamilyService(familyRepo, invitationRepo, profileRepo);
  return { service, familyRepo, profileRepo };
}

describe('Family Service Scoping', () => {
  let service: FamilyService;
  let familyRepo: FamilyRepositoryLocal;
  let profileRepo: LearnerProfileRepositoryLocal;

  beforeEach(() => {
    const fresh = createFresh();
    service = fresh.service;
    familyRepo = fresh.familyRepo;
    profileRepo = fresh.profileRepo;
  });

  async function setupFamily(ownerId: string, memberIds: string[]) {
    const family = await familyRepo.create({ ownerId, name: 'Test Family', color: '#E91E8C', icon: '👨‍👩‍👧‍👦' });
    const now = Date.now();
    for (const accountId of memberIds) {
      await familyRepo.addMember(family.id, {
        accountId,
        role: 'member',
        status: 'active',
      });
    }
    // Add owner
    await familyRepo.addMember(family.id, {
      accountId: ownerId,
      role: 'owner',
      status: 'active',
    });
    // Add profiles for all accounts
    for (const accountId of [ownerId, ...memberIds]) {
      await profileRepo.create({ accountId, displayName: accountId, status: 'active' });
    }
    return family;
  }

  it('should return empty list when user is not a member of the family', async () => {
    const family = await familyRepo.create({ ownerId: 'owner-1', name: 'Family', color: '#E91E8C', icon: '👨‍👩‍👧‍👦' });
    const members = await service.getMembersScoped(family.id, 'unknown-user');
    expect(members).toEqual([]);
  });

  it('should NOT expose cognitiveData to regular members (member B cannot read member C cognitive data)', async () => {
    const owner = 'owner-1';
    const memberB = 'member-b';
    const memberC = 'member-c';
    const family = await setupFamily(owner, [memberB, memberC]);

    // memberB queries members
    const membersFromB = await service.getMembersScoped(family.id, memberB);
    const memberCEntry = membersFromB.find(m => m.accountId === memberC);

    // memberB should see memberC's profile info but NO cognitiveData
    expect(memberCEntry).toBeDefined();
    expect(memberCEntry!.profile).toBeDefined();
    expect(memberCEntry!.cognitiveData).toBeUndefined();
  });

  it('should expose cognitiveData to owner', async () => {
    const owner = 'owner-1';
    const memberC = 'member-c';
    const family = await setupFamily(owner, [memberC]);

    const membersFromOwner = await service.getMembersScoped(family.id, owner);
    const memberCEntry = membersFromOwner.find(m => m.accountId === memberC);

    // Owner should see cognitiveData for memberC
    expect(memberCEntry).toBeDefined();
    expect(memberCEntry!.cognitiveData).toBeDefined();
    expect(memberCEntry!.cognitiveData!.reviewCount).toBe(0);
    expect(memberCEntry!.cognitiveData!.streak).toBe(0);
  });

  it('should allow admin to see cognitiveData of other members', async () => {
    const owner = 'owner-1';
    const admin = 'admin-1';
    const memberC = 'member-c';

    const family = await familyRepo.create({ ownerId: owner, name: 'Admin Family', color: '#E91E8C', icon: '👨‍👩‍👧‍👦' });
    const now = Date.now();
    await familyRepo.addMember(family.id, { accountId: owner, role: 'owner', status: 'active' });
    await familyRepo.addMember(family.id, { accountId: admin, role: 'admin', status: 'active' });
    await familyRepo.addMember(family.id, { accountId: memberC, role: 'member', status: 'active' });

    for (const accId of [owner, admin, memberC]) {
      await profileRepo.create({ accountId: accId, displayName: accId, status: 'active' });
    }

    const membersFromAdmin = await service.getMembersScoped(family.id, admin);
    const memberCEntry = membersFromAdmin.find(m => m.accountId === memberC);

    // Admin should see cognitiveData
    expect(memberCEntry!.cognitiveData).toBeDefined();
  });

  it('should not expose cognitiveData to member querying another member', async () => {
    const owner = 'owner-1';
    const memberA = 'member-a';
    const memberB = 'member-b';
    const family = await setupFamily(owner, [memberA, memberB]);

    const membersFromA = await service.getMembersScoped(family.id, memberA);
    const memberBEntry = membersFromA.find(m => m.accountId === memberB);

    expect(memberBEntry!.cognitiveData).toBeUndefined();
    // But profile info should still be visible
    expect(memberBEntry!.profile).toBeDefined();
    expect(memberBEntry!.profile!.displayName).toBe(memberB);
  });

  it('should exclude suspended members from scoped results', async () => {
    const owner = 'owner-1';
    const suspended = 'suspended-1';
    const family = await familyRepo.create({ ownerId: owner, name: 'Suspended Family', color: '#E91E8C', icon: '👨‍👩‍👧‍👦' });

    const now = Date.now();
    await familyRepo.addMember(family.id, { accountId: owner, role: 'owner', status: 'active' });
    await familyRepo.addMember(family.id, { accountId: suspended, role: 'member', status: 'suspended' });

    await profileRepo.create({ accountId: suspended, displayName: suspended, status: 'active' });
    await profileRepo.create({ accountId: owner, displayName: owner, status: 'active' });

    const members = await service.getMembersScoped(family.id, owner);
    expect(members.some(m => m.accountId === suspended)).toBe(false);
  });

  it('leaveFamily should prevent owner from leaving', async () => {
    const owner = 'owner-1';
    const family = await familyRepo.create({ ownerId: owner, name: 'Owner Family', color: '#E91E8C', icon: '👨‍👩‍👧‍👦' });

    const now = Date.now();
    await familyRepo.addMember(family.id, { accountId: owner, role: 'owner', status: 'active' });

    await expect(service.leaveFamily(family.id, owner)).rejects.toThrow('Owner cannot leave family');
  });

  it('removeMember should reject non-owner/non-admin requesters', async () => {
    const owner = 'owner-1';
    const memberA = 'member-a';
    const memberB = 'member-b';
    const family = await setupFamily(owner, [memberA, memberB]);

    // memberA should NOT be able to remove memberB
    await expect(service.removeMember(family.id, memberB, memberA)).rejects.toThrow(/permission/i);
  });

  it('removeMember should allow owner to remove members', async () => {
    const owner = 'owner-1';
    const memberB = 'member-b';
    const family = await setupFamily(owner, [memberB]);

    const removed = await service.removeMember(family.id, memberB, owner);
    expect(removed).toBe(true);

    const members = await familyRepo.getMembers(family.id);
    expect(members.some(m => m.accountId === memberB)).toBe(false);
  });
});
